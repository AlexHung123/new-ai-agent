import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import { BaseMessage } from '@langchain/core/messages';
import eventEmitter from 'events';
import { getLimeSurveySummaryBySid } from '@/lib/postgres/limeSurvery';
import prompts from '../prompts';

// ✅ LangChain structured output 相關
import { z } from 'zod';
import { JsonMarkdownStructuredOutputParser, StructuredOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';

// --------------------
// Types
// --------------------
type SurveyItem = { id: string; text: string };
type Cluster = { label: string; item_ids: string[] };

// --------------------
// Schemas
// --------------------
const ClusterSchema = z.object({
  label: z.string().describe('cluster 的簡短標籤'),
  item_ids: z.array(z.string()).describe('id'),
});

const ClusteringOutputSchema = z.object({
  question: z.string(),
  clusters: z.array(ClusterSchema),
});

type ClusteringOutput = z.infer<typeof ClusteringOutputSchema>;

// ✅ 二次分配 schema：只能分配到「既有 label」或留在 uncategorized
const ReassignSchema = z.object({
  assignments: z.record(z.string(), z.array(z.string())).describe('key=existing label, value=item_ids'),
  uncategorized: z.array(z.string()).describe('still not fit any existing label'),
});

type ReassignOutput = z.infer<typeof ReassignSchema>;

// --------------------
// Helpers
// --------------------
function validateCoverage(inputItems: SurveyItem[], clusters: Cluster[]) {
  const inputIds = new Set(inputItems.map(i => i.id));
  const assigned: string[] = [];
  for (const c of clusters) assigned.push(...c.item_ids);

  const seen = new Set<string>();
  const duplicateIds: string[] = [];
  for (const id of assigned) {
    if (seen.has(id)) duplicateIds.push(id);
    seen.add(id);
  }

  const assignedSet = new Set(assigned);
  const missingIds = [...inputIds].filter(id => !assignedSet.has(id));
  const extraIds = [...assignedSet].filter(id => !inputIds.has(id));

  return {
    input_count: inputItems.length,
    assigned_count: seen.size,
    missingIds,
    extraIds,
    duplicateIds,
    valid: missingIds.length === 0 && extraIds.length === 0 && duplicateIds.length === 0,
  };
}

function renderMarkdown(question: string, clusters: Cluster[], itemsById: Map<string, string>) {
  let md = `## ${question}\n\n`;
  for (const c of clusters) {
    md += `- **${c.label} (${c.item_ids?.length})**\n`;
    for (const id of c.item_ids) {
      const text = itemsById.get(id) ?? id;
      md += `  - ${text} (${id})\n`;
    }
    md += '\n';
  }
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
    if (!target) continue;
    target.item_ids.push(...ids);
  }

  const out = [...byLabel.values()];

  if (uncategorizedIds.length > 0) {
    out.push({ label: '未分類/其他', item_ids: uncategorizedIds });
  }

  return out;
}

function validateReassignCoverage(expectedIds: string[], reassigned: ReassignOutput) {
  const expected = new Set(expectedIds);
  const got: string[] = [...Object.values(reassigned.assignments).flat(), ...reassigned.uncategorized];

  const seen = new Set<string>();
  const dup: string[] = [];
  for (const id of got) {
    if (seen.has(id)) dup.push(id);
    seen.add(id);
  }

  const gotSet = new Set(got);
  const missing = [...expected].filter(id => !gotSet.has(id));
  const extra = [...gotSet].filter(id => !expected.has(id));

  return { missing, extra, dup, valid: missing.length === 0 && extra.length === 0 && dup.length === 0 };
}

function normalizeReassignOutput(expectedIds: string[], raw: ReassignOutput): ReassignOutput {
  const expected = new Set(expectedIds);

  // 1) 過濾 assignments：只保留有出現於 expectedIds 嘅 id
  const cleanedAssignments: Record<string, string[]> = {};
  for (const [label, ids] of Object.entries(raw.assignments ?? {})) {
    cleanedAssignments[label] = (ids ?? []).filter(id => expected.has(id));
  }

  // 2) 先處理 assignments：做「全局去重」（同一 id 只保留第一次出現）
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

  // 3) 再處理 uncategorized：同樣過濾 + 去重（避免同 assignments 撞）
  const cleanedUncategorized: string[] = [];
  for (const id of raw.uncategorized ?? []) {
    if (!expected.has(id)) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    cleanedUncategorized.push(id);
  }

  // 4) 補漏：任何未出現過嘅 expectedIds，補返入 uncategorized
  const missing = expectedIds.filter(id => !seen.has(id));
  if (missing.length > 0) cleanedUncategorized.push(...missing);

  return { assignments: cleanedAssignments, uncategorized: cleanedUncategorized };
}


// --------------------
// LLM calls
// --------------------
async function clusterWithStructuredOutput(
  question: string,
  items: SurveyItem[],
  llm: BaseChatModel,
  systemInstructions: string,
  signal?: AbortSignal,
): Promise<ClusteringOutput> {
  const parser = StructuredOutputParser.fromZodSchema(ClusteringOutputSchema);

  const prompt = PromptTemplate.fromTemplate(`
${systemInstructions}
    你是一個嚴格的語義聚類引擎。
    你會收到一個 JSON：
    {{
      "意見：":,
      [{{"id": string, "value": string}}]
      }}

    任務：
    - 將 items 依語義相似度分群（保守分組，意思明顯相近才放同一群）
    - 每個 item 的 id 必須且只能出現在一個 cluster（不可漏、不可重複）
    - 不允許輸出 items 的 value（只輸出 id），避免文字被改寫導致對不上

    輸出必須符合以下格式要求：
    {format_instructions}

    輸入：
    {input_json}
  `.trim());

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
  // const parser = StructuredOutputParser.fromZodSchema(ReassignSchema);
  const parser = new JsonMarkdownStructuredOutputParser(ReassignSchema);

  const existingLabels = existingClusters
    .map(c => c.label)
    .filter(l => l !== '未分類/其他');

  const prompt = PromptTemplate.fromTemplate(`
${systemInstructions}

你是一個嚴格的「再分配」引擎，只處理未分類項目。

你會收到：
- question
- existing_labels（已存在 cluster label 清單；若為空或無法使用，需先自動新增 1 個預設 label）
- uncategorized_items（只含 id/text）

任務：
- 對每個uncategorized_item：若可合理分配到 existing_labels 其中之一，則分配過去；若全部 existing_labels 都不適合，**就創造一個新的 label**（使用能概括該 item 主題、且簡短一致的名稱），並把該 item 分配到新 label。
- 你可以創造多個新 label，但必須確保每個新 label 都至少分配到 1 個 item，且命名不可重複。
- 每個 item id 必須且只能出現一次（不可漏、不可重複）。
- assignments 的 key 允許使用：
  - existing_labels 內的文字
  - 你新創造的 label 文字
  不可使用其他未出現在上述兩者的 key。
- 輸出只可包含 item 的 id（不可重寫 text）。

輸出必須符合以下格式要求：
{format_instructions}

輸入：
{input_json}
  `.trim());

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

// --------------------
// SurveyAgent
// --------------------
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
  ): Promise<eventEmitter> {
    const emitter = new eventEmitter();

    if (signal) {
      signal.addEventListener('abort', () => {
        emitter.emit('end');
      });
    }

    (async () => {
      try {
        if (signal?.aborted) return;

        const surveyId = message.trim();
        const surveyIdInt = parseInt(surveyId, 10);

        if (isNaN(surveyIdInt) || surveyIdInt.toString() !== surveyId) {
          setImmediate(() => {
            emitter.emit('data', JSON.stringify({ type: 'response', data: 'Please provide limeSurvery ID' }));
            emitter.emit('end');
          });
          return;
        }

        let surveyData;
        try {
          surveyData = await getLimeSurveySummaryBySid(surveyId);
        } catch (error) {
          setImmediate(() => {
            emitter.emit('data', JSON.stringify({ type: 'response', data: 'No such LimeSurvey ID exists' }));
            emitter.emit('end');
          });
          return;
        }

        const freeTextOnly = surveyData[0]['result_json'] as unknown as Record<string, any[]>;
        const questionKeys = Object.keys(freeTextOnly);

        if (questionKeys.length === 0) {
          setImmediate(() => {
            emitter.emit('data', JSON.stringify({ type: 'response', data: 'No free text questions found in the survey.' }));
            emitter.emit('end');
          });
          return;
        }

        for (const question of questionKeys) {
          if (signal?.aborted) break;

          const answers: any[] = freeTextOnly[question] ?? [];

          // ✅ 直接用元素本身的 id/value
          const items: SurveyItem[] = answers.map(a => ({
            id: String(a.id),
            text: a.value,
          }));

          const itemsById = new Map(items.map(i => [i.id, i.text]));

          try {
            // ✅ 1) 第一輪 clustering
            const structured = await clusterWithStructuredOutput(question, items, llm, systemInstructions, signal);

            // ✅ 2) Coverage 驗證（唔漏、唔重、唔多）
            const coverage = validateCoverage(items, structured.clusters);
            let finalClusters = structured.clusters;

            // ✅ 3) 補漏：missing 的 item 全部放「未分類/其他」
            if (!coverage.valid) {
              const seen = new Set<string>();
              finalClusters = finalClusters
                .map(c => {
                  const dedupedIds = c.item_ids.filter(id => {
                    if (seen.has(id)) return false;
                    seen.add(id);
                    return true;
                  });
                  return { ...c, item_ids: dedupedIds };
                })
                // 可選：去走因為去重而變成空嘅 cluster
                .filter(c => c.item_ids.length > 0);
              const coverageAfterDedup = validateCoverage(items, finalClusters);
              if (coverageAfterDedup.missingIds.length > 0) {
                finalClusters = [...finalClusters, { label: '未分類/其他', item_ids: coverageAfterDedup.missingIds }];
              }
            }

            // ✅ 4) 若「未分類/其他」> 5：用既有 clusters 做第二輪再分配
            {
              const { kept, uncategorized } = splitOutUncategorized(finalClusters);

              if (uncategorized && uncategorized.item_ids.length > 5 && kept.length > 0) {
                const uncategorizedItems: SurveyItem[] = uncategorized.item_ids.map(id => ({
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

                const normalized = normalizeReassignOutput(uncategorized.item_ids, reassigned);
                const reassignCoverage = validateReassignCoverage(uncategorized.item_ids, normalized);

                if (reassignCoverage.valid) {
                  finalClusters = mergeReassigned(kept, normalized.assignments, normalized.uncategorized);
                } else {
                  console.warn('Reassign coverage issue:', {
                    question,
                    ...reassignCoverage,
                  });
                }
              }
            }

            // ✅ 5) 由程式 render Markdown，確保每條都會出現
            const md = renderMarkdown(question, finalClusters, itemsById);

            emitter.emit('data', JSON.stringify({ type: 'response', data: md }));
            emitter.emit('data', JSON.stringify({ type: 'response', data: '\n\n' }));
          } catch (error) {
            console.error(`Error processing question "${question}":`, error);
            emitter.emit(
              'data',
              JSON.stringify({
                type: 'response',
                data: `\n\nError processing question "${question}": ${error instanceof Error ? error.message : String(error)}\n\n`,
              }),
            );
          }
        }

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
