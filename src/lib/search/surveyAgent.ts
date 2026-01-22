import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import { BaseMessage } from '@langchain/core/messages';
import { EventEmitter } from 'events';
import { getLimeSurveySummaryBySid } from '@/lib/postgres/limeSurvery';

import { z } from 'zod';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';

type SurveyItem = { id: string; text: string };
type Cluster = { label: string; item_ids: string[] };

type FreeTextAnswer = { id: number | string; value: string };
type FreeTextMap = Record<string, FreeTextAnswer[]>;

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
    .describe('key=label(可為既有或新增), value=item_ids'),
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
  let uncategorized: Cluster | null = null;

  for (const c of clusters) {
    if (c.label === '未分類/其他') uncategorized = c;
    else kept.push(c);
  }
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
    else byLabel.set(label, { label, item_ids: [...ids] }); // ✅ 新 label 直接加入
  }

  const out = [...byLabel.values()];
  if (uncategorizedIds.length > 0)
    out.push({ label: '未分類/其他', item_ids: uncategorizedIds });
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
  raw: ReassignOutput,
): ReassignOutput {
  const expected = new Set(expectedIds);

  const cleanedAssignments: Record<string, string[]> = {};
  for (const [label, ids] of Object.entries(raw.assignments ?? {})) {
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
    .filter((l) => l !== '未分類/其他');

  const prompt = PromptTemplate.fromTemplate(
    `
    ${systemInstructions}

    你是一個嚴格的「再分配」引擎，只處理未分類項目。

    你會收到：
    - question
    - existing_labels（已存在 cluster label 清單）
    - uncategorized_items（只含 id/text）

    任務：
    - 優先分配到 existing_labels；若全部都不適合，允許創造新 label（簡短、能概括主題、不可重複）
    - 每個 item id 必須且只能出現一次（不可漏、不可重複）
    - assignments 的 key 可為 existing_labels 或你新創 label
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

class SurveyAgent {
  async searchAndAnswer(
    message: string,
    history: BaseMessage[],
    llm: BaseChatModel,
    embeddings: Embeddings,
    optimizationMode: 'speed' | 'balanced' | 'quality',
    fileIds: string[],
    systemInstructions: string,
    signal?: AbortSignal,
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

          try {
            const structured = await clusterWithStructuredOutput(
              question,
              items,
              llm,
              systemInstructions,
              signal,
            );

            const coverage = validateCoverage(items, structured.clusters);
            let finalClusters = structured.clusters;

            if (!coverage.valid) {
              const seen = new Set<string>();
              finalClusters = finalClusters
                .map((c) => {
                  const dedupedIds = c.item_ids.filter((id) => {
                    if (seen.has(id)) return false;
                    seen.add(id);
                    return true;
                  });
                  return { ...c, item_ids: dedupedIds };
                })
                .filter((c) => c.item_ids.length > 0);

              const coverageAfterDedup = validateCoverage(items, finalClusters);
              if (coverageAfterDedup.missingIds.length > 0) {
                finalClusters = [
                  ...finalClusters,
                  {
                    label: '未分類/其他',
                    item_ids: coverageAfterDedup.missingIds,
                  },
                ];
              }
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
