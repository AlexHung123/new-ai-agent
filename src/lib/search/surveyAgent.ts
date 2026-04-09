import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import { BaseMessage } from '@langchain/core/messages';
import { EventEmitter } from 'events';
import {
  getLimeSurveySummaryBySid,
  getLimeSurveySummaryIdsByUserId,
} from '@/lib/postgres/limeSurvery';
import { executeSql } from '@/lib/postgres/itmsdb';

import { z } from 'zod';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { MetaSearchAgentType } from './metaSearchAgent';

type SurveyItem = { id: string; text: string };
type Cluster = { label: string; item_ids: string[] };

type FreeTextAnswer = { id: number | string; value: string };
type FreeTextMap = Record<string, FreeTextAnswer[]>;
const UNCATEGORIZED_LABEL = '未分類/其他';

type ProgressPayload = {
  status: 'started' | 'processing' | 'reassigning' | 'completed' | 'finished';
  total: number;
  current: number;
  message: string;
  question?: string;
};

// optional: typed events
type SurveyAgentEvents = {
  data: (chunk: string) => void;
  end: () => void;
};

class TypedEmitter extends EventEmitter {
  override emit<E extends keyof SurveyAgentEvents>(
    event: E,
    ...args: Parameters<SurveyAgentEvents[E]>
  ): boolean {
    return super.emit(event as string, ...args);
  }

  override on<E extends keyof SurveyAgentEvents>(
    event: E,
    listener: SurveyAgentEvents[E],
  ): this {
    return super.on(event as string, listener as (...a: any[]) => void);
  }
}

const ClusterSchema = z.object({
  label: z.string().describe('cluster 的簡短標籤'),
  item_ids: z.array(z.string()).describe('id'),
});

const ClusteringOutputSchema = z.object({
  question: z.string(),
  clusters: z.array(ClusterSchema),
});

type ClusteringOutput = z.infer<typeof ClusteringOutputSchema>;

const ReassignSchema = z.object({
  assignments: z
    .record(z.string(), z.array(z.string()))
    .describe('key=existing label, value=item_ids'),
  uncategorized: z.array(z.string()).describe('still not fit any label'),
});
type ReassignOutput = z.infer<typeof ReassignSchema>;

function validateCoverage(inputItems: SurveyItem[], clusters: Cluster[]) {
  const inputIds = new Set(inputItems.map((i) => i.id));
  const assigned: string[] = [];
  for (const c of clusters) assigned.push(...c.item_ids);

  const seen = new Set<string>();
  const duplicateIds: string[] = [];
  for (const id of assigned) {
    if (seen.has(id)) duplicateIds.push(id);
    seen.add(id);
  }

  const assignedSet = new Set(assigned);
  const missingIds = [...inputIds].filter((id) => !assignedSet.has(id));
  const extraIds = [...assignedSet].filter((id) => !inputIds.has(id));

  return {
    input_count: inputItems.length,
    assigned_count: seen.size,
    missingIds,
    extraIds,
    duplicateIds,
    valid:
      missingIds.length === 0 &&
      extraIds.length === 0 &&
      duplicateIds.length === 0,
  };
}

function renderMarkdown(
  question: string,
  clusters: Cluster[],
  itemsById: Map<string, string>,
) {
  const stripNewlines = (s: string) => s.replace(/(\r\n|\n|\r)/g, ' '); // remove all line breaks [web:8]

  let md = `## ${stripNewlines(question)}\n\n`;

  for (const c of clusters) {
    md += `- **${stripNewlines(c.label)} (${c.item_ids?.length ?? 0})**\n`;
    for (const id of c.item_ids ?? []) {
      const rawText = itemsById.get(id) ?? id;
      const text = stripNewlines(rawText).trim();
      md += `  - ${text} (${id})\n`;
    }
    md += '\n';
  }
  md += '\n\n';
  return md;
}

function splitOutUncategorized(clusters: Cluster[]) {
  const kept: Cluster[] = [];
  const uncategorizedIds: string[] = [];

  for (const c of clusters) {
    if (c.label === UNCATEGORIZED_LABEL) uncategorizedIds.push(...c.item_ids);
    else kept.push(c);
  }
  const uncategorized =
    uncategorizedIds.length > 0
      ? {
          label: UNCATEGORIZED_LABEL,
          item_ids: [...new Set(uncategorizedIds)],
        }
      : null;
  return { kept, uncategorized };
}

function mergeReassigned(
  baseClusters: Cluster[],
  assignments: Record<string, string[]>,
  uncategorizedIds: string[],
): Cluster[] {
  const byLabel = new Map<string, Cluster>();
  for (const c of baseClusters) {
    byLabel.set(c.label, { label: c.label, item_ids: [...c.item_ids] });
  }

  for (const [label, ids] of Object.entries(assignments)) {
    const target = byLabel.get(label);
    if (target) target.item_ids.push(...ids);
  }

  const out = [...byLabel.values()];
  if (uncategorizedIds.length > 0)
    out.push({ label: UNCATEGORIZED_LABEL, item_ids: uncategorizedIds });
  return out;
}

function validateReassignCoverage(
  expectedIds: string[],
  reassigned: ReassignOutput,
) {
  const expected = new Set(expectedIds);
  const got: string[] = [
    ...Object.values(reassigned.assignments).flat(),
    ...reassigned.uncategorized,
  ];

  const seen = new Set<string>();
  const dup: string[] = [];
  for (const id of got) {
    if (seen.has(id)) dup.push(id);
    seen.add(id);
  }

  const gotSet = new Set(got);
  const missing = [...expected].filter((id) => !gotSet.has(id));
  const extra = [...gotSet].filter((id) => !expected.has(id));

  return {
    missing,
    extra,
    dup,
    valid: missing.length === 0 && extra.length === 0 && dup.length === 0,
  };
}

function normalizeReassignOutput(
  expectedIds: string[],
  allowedLabels: string[],
  raw: ReassignOutput,
): ReassignOutput {
  const expected = new Set(expectedIds);
  const allowed = new Set(allowedLabels);

  const cleanedAssignments: Record<string, string[]> = {};
  for (const [label, ids] of Object.entries(raw.assignments ?? {})) {
    if (!allowed.has(label)) continue;
    cleanedAssignments[label] = (ids ?? []).filter((id) => expected.has(id));
  }

  const seen = new Set<string>();
  for (const label of Object.keys(cleanedAssignments)) {
    const deduped: string[] = [];
    for (const id of cleanedAssignments[label]) {
      if (seen.has(id)) continue;
      seen.add(id);
      deduped.push(id);
    }
    cleanedAssignments[label] = deduped;
  }

  const cleanedUncategorized: string[] = [];
  for (const id of raw.uncategorized ?? []) {
    if (!expected.has(id)) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    cleanedUncategorized.push(id);
  }

  const missing = expectedIds.filter((id) => !seen.has(id));
  if (missing.length > 0) cleanedUncategorized.push(...missing);

  return {
    assignments: cleanedAssignments,
    uncategorized: cleanedUncategorized,
  };
}

function sanitizeClustersByInputIds(
  clusters: Cluster[],
  inputItems: SurveyItem[],
): Cluster[] {
  const validIds = new Set(inputItems.map((i) => i.id));
  const seen = new Set<string>();

  return clusters
    .map((c) => {
      const item_ids = c.item_ids.filter((id) => {
        if (!validIds.has(id)) return false;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
      return { ...c, item_ids };
    })
    .filter((c) => c.item_ids.length > 0);
}

async function clusterWithStructuredOutput(
  question: string,
  items: SurveyItem[],
  llm: BaseChatModel,
  systemInstructions: string,
  signal?: AbortSignal,
): Promise<ClusteringOutput> {
  const parser = StructuredOutputParser.fromZodSchema(ClusteringOutputSchema);

  const prompt = PromptTemplate.fromTemplate(
    `
${systemInstructions}

你是一個嚴格的語義聚類引擎。
你會收到 JSON：{{ "question": string, "items": [{{ "id": string, "text": string }}] }}

任務：
- 將 items 依語義相似度分群（保守分組，意思明顯相近才放同一群）
- 每個 item 的 id 必須且只能出現在一個 cluster（不可漏、不可重複）
- 不允許輸出 items 的 text（只輸出 id）

輸出必須符合以下格式要求：
{format_instructions}

輸入：
{input_json}
  `.trim(),
  );

  const chain = RunnableSequence.from([prompt, llm, parser]);
  return chain.invoke(
    {
      format_instructions: parser.getFormatInstructions(),
      input_json: JSON.stringify({ question, items }),
    },
    { signal },
  );
}

async function reassignUncategorizedToExistingClusters(
  question: string,
  uncategorizedItems: SurveyItem[],
  existingClusters: Cluster[],
  llm: BaseChatModel,
  systemInstructions: string,
  signal?: AbortSignal,
): Promise<ReassignOutput> {
  const parser = StructuredOutputParser.fromZodSchema(ReassignSchema);

  const existingLabels = existingClusters
    .map((c) => c.label)
    .filter((l) => l !== UNCATEGORIZED_LABEL);

  const prompt = PromptTemplate.fromTemplate(
    `
    ${systemInstructions}

    你是一個嚴格的「再分配」引擎，只處理未分類項目。

    你會收到：
    - question
    - existing_labels（已存在 cluster label 清單）
    - uncategorized_items（只含 id/text）

    任務：
    - 只能分配到 existing_labels；不可創造新 label
    - 每個 item id 必須且只能出現一次（不可漏、不可重複）
    - assignments 的 key 只能是 existing_labels 內的值
    - 輸出只可包含 item 的 id（不可重寫 text）

    輸出必須符合以下格式要求：
    {format_instructions}

    輸入：
    {input_json}
  `.trim(),
  );

  const chain = RunnableSequence.from([prompt, llm, parser]);

  return chain.invoke(
    {
      format_instructions: parser.getFormatInstructions(),
      input_json: JSON.stringify({
        question,
        existing_labels: existingLabels,
        uncategorized_items: uncategorizedItems,
      }),
    },
    { signal },
  );
}

class SurveyAgent implements MetaSearchAgentType {
  async searchAndAnswer(
    message: string,
    history: BaseMessage[],
    llm: BaseChatModel,
    embeddings: Embeddings,
    optimizationMode: 'speed' | 'balanced' | 'quality',
    fileIds: string[],
    systemInstructions: string,
    signal?: AbortSignal,
    sfcExactMatch?: boolean,
    sfcTrainingRelated?: boolean,
    req?: Request,
  ): Promise<EventEmitter> {
    const emitter = new TypedEmitter();

    if (signal) {
      signal.addEventListener('abort', () => emitter.emit('end'));
    }

    (async () => {
      try {
        if (signal?.aborted) return;

        const surveyId = message.trim();
        const surveyIdInt = parseInt(surveyId, 10);

        if (isNaN(surveyIdInt) || surveyIdInt.toString() !== surveyId) {
          setImmediate(() => {
            emitter.emit(
              'data',
              JSON.stringify({
                type: 'response',
                data: 'Please provide limeSurvery ID',
              }),
            );
            emitter.emit('end');
          });
          return;
        }

        // Permission check start
        try {
          const userId = req?.headers.get('x-user-id');

          if (!userId) {
            throw new Error('User ID not found');
          }
          if (!/^\d+$/.test(userId)) {
            throw new Error('Invalid user ID');
          }

          const userRows = await executeSql(
            `select concat(dp_id,'.',dp_dept_id) as username from cap_user where id = '${userId}'`,
          );
          const username = userRows?.[0]?.username;

          if (!username) {
            throw new Error('Username not found');
          }

          const permittedSurveys =
            await getLimeSurveySummaryIdsByUserId(username);
          const permittedSids = permittedSurveys.map((s: any) => String(s.sid));

          if (!permittedSids.includes(surveyId)) {
            setImmediate(() => {
              emitter.emit(
                'data',
                JSON.stringify({
                  type: 'response',
                  data: 'No permission to access this survey.',
                }),
              );
              emitter.emit('end');
            });
            return;
          }
        } catch (err: any) {
          setImmediate(() => {
            emitter.emit(
              'data',
              JSON.stringify({
                type: 'response',
                data: 'Permission check failed.',
              }),
            );
            emitter.emit('end');
          });
          return;
        }
        // Permission check end

        let surveyData;
        try {
          surveyData = await getLimeSurveySummaryBySid(surveyId);
        } catch {
          setImmediate(() => {
            emitter.emit(
              'data',
              JSON.stringify({
                type: 'response',
                data: 'No such LimeSurvey ID exists',
              }),
            );
            emitter.emit('end');
          });
          return;
        }

        const raw = surveyData?.[0]?.result_json;
        const freeTextOnly: FreeTextMap = Array.isArray(raw)
          ? raw.reduce<FreeTextMap>((acc, obj) => {
              if (!obj || typeof obj !== 'object') return acc;

              for (const [question, answers] of Object.entries(
                obj as Record<string, unknown>,
              )) {
                const arr = Array.isArray(answers)
                  ? (answers as FreeTextAnswer[])
                  : [];
                // If same question appears multiple times, append.
                acc[question] = (acc[question] ?? []).concat(arr);
              }
              return acc;
            }, {})
          : ((raw ?? {}) as FreeTextMap);

        const questionKeys = Object.keys(freeTextOnly);

        if (questionKeys.length === 0) {
          setImmediate(() => {
            emitter.emit(
              'data',
              JSON.stringify({
                type: 'response',
                data: 'No free text questions found in the survey.',
              }),
            );
            emitter.emit('end');
          });
          return;
        }

        const totalQuestions = questionKeys.length;
        let currentQuestionIndex = 0;
        const results: { question: string; markdown: string }[] = [];

        emitter.emit(
          'data',
          JSON.stringify({
            type: 'progress',
            data: {
              status: 'started',
              total: totalQuestions,
              current: 0,
              message: `Starting to analyze ${totalQuestions} question(s)...`,
            } satisfies ProgressPayload,
          }),
        );

        for (const question of questionKeys) {
          if (signal?.aborted) break;

          currentQuestionIndex++;
          emitter.emit(
            'data',
            JSON.stringify({
              type: 'progress',
              data: {
                status: 'processing',
                total: totalQuestions,
                current: currentQuestionIndex,
                question,
                message: `Analyzing question ${currentQuestionIndex} of ${totalQuestions}: ${question.substring(0, 50)}${question.length > 50 ? '...' : ''}`,
              } satisfies ProgressPayload,
            }),
          );

          const answers: any[] = freeTextOnly[question] ?? [];
          const items: SurveyItem[] = answers.map((a) => ({
            id: String(a.id),
            text: a.value,
          }));
          const itemsById = new Map(items.map((i) => [i.id, i.text]));

          if (items.length === 0) {
            results.push({
              question,
              markdown: renderMarkdown(question, [], itemsById),
            });
            emitter.emit(
              'data',
              JSON.stringify({
                type: 'progress',
                data: {
                  status: 'completed',
                  total: totalQuestions,
                  current: currentQuestionIndex,
                  question,
                  message: `Completed analysis of question ${currentQuestionIndex} of ${totalQuestions}`,
                } satisfies ProgressPayload,
              }),
            );
            continue;
          }

          try {
            const structured = await clusterWithStructuredOutput(
              question,
              items,
              llm,
              systemInstructions,
              signal,
            );

            let finalClusters = sanitizeClustersByInputIds(
              structured.clusters,
              items,
            );

            const coverage = validateCoverage(items, finalClusters);
            if (coverage.missingIds.length > 0) {
              finalClusters = [
                ...finalClusters,
                {
                  label: UNCATEGORIZED_LABEL,
                  item_ids: coverage.missingIds,
                },
              ];
            }

            const { kept, uncategorized } =
              splitOutUncategorized(finalClusters);

            if (uncategorized && uncategorized.item_ids.length > 5) {
              emitter.emit(
                'data',
                JSON.stringify({
                  type: 'progress',
                  data: {
                    status: 'reassigning',
                    total: totalQuestions,
                    current: currentQuestionIndex,
                    question,
                    message: `Refining clusters for question ${currentQuestionIndex} of ${totalQuestions}...`,
                  } satisfies ProgressPayload,
                }),
              );

              const uncategorizedItems: SurveyItem[] =
                uncategorized.item_ids.map((id) => ({
                  id,
                  text: itemsById.get(id) ?? '',
                }));

              const reassigned = await reassignUncategorizedToExistingClusters(
                question,
                uncategorizedItems,
                kept,
                llm,
                systemInstructions,
                signal,
              );

              const normalized = normalizeReassignOutput(
                uncategorized.item_ids,
                kept.map((c) => c.label),
                reassigned,
              );
              const reassignCoverage = validateReassignCoverage(
                uncategorized.item_ids,
                normalized,
              );

              if (reassignCoverage.valid) {
                finalClusters = mergeReassigned(
                  kept,
                  normalized.assignments,
                  normalized.uncategorized,
                );
              }
            }

            const md = renderMarkdown(question, finalClusters, itemsById);
            results.push({ question, markdown: md });

            emitter.emit(
              'data',
              JSON.stringify({
                type: 'progress',
                data: {
                  status: 'completed',
                  total: totalQuestions,
                  current: currentQuestionIndex,
                  question,
                  message: `Completed analysis of question ${currentQuestionIndex} of ${totalQuestions}`,
                } satisfies ProgressPayload,
              }),
            );
          } catch (error) {
            results.push({
              question,
              markdown: `\n\nError processing question "${question}": ${error instanceof Error ? error.message : String(error)}\n\n`,
            });
          }
        }

        emitter.emit(
          'data',
          JSON.stringify({
            type: 'progress',
            data: {
              status: 'finished',
              total: totalQuestions,
              current: totalQuestions,
              message: 'All questions analyzed! Generating results...',
            } satisfies ProgressPayload,
          }),
        );

        const seen = new Set();
        const outputChunks: string[] = [];

        for (const r of results) {
          const q = r.question;
          if (seen.has(q)) continue;
          seen.add(q);

          outputChunks.push(r.markdown);
        }

        emitter.emit(
          'data',
          JSON.stringify({
            type: 'response',
            data: outputChunks.join('\n\n'),
          }),
        );
        emitter.emit('end');
      } catch (error: any) {
        if (error?.name === 'AbortError') return;
        setImmediate(() => {
          emitter.emit(
            'data',
            JSON.stringify({
              type: 'response',
              data: `Error: ${error instanceof Error ? error.message : String(error)}`,
            }),
          );
          emitter.emit('end');
        });
      }
    })();

    return emitter;
  }
}

export default SurveyAgent;
