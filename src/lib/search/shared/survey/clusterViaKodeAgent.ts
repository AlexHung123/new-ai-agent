import type { SurveyCluster, SurveyItem } from '../tools/surveySearchTool';

const UNCATEGORIZED_LABEL = '未分類/其他';

export function buildClusterPrompt(
  question: string,
  items: SurveyItem[],
): string {
  return `
你是嚴格的語義聚類引擎（單題任務）。請只分析下列這一題的 items。

規則：
1. 依語義相似度將 items 分群；意思明顯相近才放同一群（保守）。
2. 所有 cluster label 必須使用繁體中文，且具體、精準，避免「一般」「雜項」等空泛標籤。
3. 每個 item id 最多出現在一個 cluster；不確定的可省略（系統會歸入「未分類/其他」）。
4. 不要輸出 item 的 text，只輸出 id。
5. 不要輸出解釋文字；只輸出 JSON。

輸出 JSON 格式（不要 markdown code fence）：
{"clusters":[{"label":"主題標籤","item_ids":["id1","id2"]}]}

輸入：
${JSON.stringify({ question, items }, null, 0)}
`.trim();
}

export function extractJsonObject(text: string): unknown {
  if (!text || typeof text !== 'string') {
    throw new Error('Empty cluster response');
  }

  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = (fence?.[1] ?? text).trim();

  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) {
    throw new Error('No JSON object in cluster response');
  }

  return JSON.parse(raw.slice(start, end + 1));
}

export function parseClustersFromAgentText(text: string): SurveyCluster[] {
  const parsed = extractJsonObject(text) as {
    clusters?: Array<{ label?: unknown; item_ids?: unknown }>;
  };

  if (!parsed || !Array.isArray(parsed.clusters)) {
    throw new Error('Invalid clusters JSON: missing clusters array');
  }

  const clusters: SurveyCluster[] = [];
  for (const c of parsed.clusters) {
    if (!c?.label || !Array.isArray(c.item_ids)) continue;
    const item_ids = c.item_ids
      .filter((id): id is string => typeof id === 'string' && id.length > 0)
      .map(String);
    if (item_ids.length === 0) continue;
    clusters.push({ label: String(c.label), item_ids });
  }

  return clusters;
}

/**
 * Cluster one question via Kode agent.complete (no tools).
 * Uses a dedicated agent id so history does not accumulate across questions.
 */
export async function clusterQuestionViaKodeAgent(options: {
  agent: {
    complete: (
      input: string,
    ) => Promise<{ status: string; text?: string }>;
  };
  question: string;
  items: SurveyItem[];
  signal?: AbortSignal;
  maxRetries?: number;
}): Promise<SurveyCluster[]> {
  const { agent, question, items, signal, maxRetries = 1 } = options;

  if (items.length === 0) {
    return [];
  }

  // Single-item: no need to call model
  if (items.length === 1) {
    return [
      {
        label: items[0].text.slice(0, 40) || UNCATEGORIZED_LABEL,
        item_ids: [items[0].id],
      },
    ];
  }

  const prompt = buildClusterPrompt(question, items);
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (signal?.aborted) {
      throw new Error('Aborted');
    }

    try {
      const result = await agent.complete(
        attempt === 0
          ? prompt
          : `${prompt}\n\n上次輸出無法解析。請嚴格只輸出合法 JSON，不要加任何說明。`,
      );

      const text = result?.text ?? '';
      return parseClustersFromAgentText(text);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(String(lastError ?? 'Cluster failed'));
}
