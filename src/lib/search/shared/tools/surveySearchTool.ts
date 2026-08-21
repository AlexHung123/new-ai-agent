import { Type } from 'typebox';
import type { AgentTool } from '@earendil-works/pi-agent-core';
import {
  getLimeSurveySummaryBySid,
  getLimeSurveySummaryIdsByUserId,
  limeSurveyExists,
} from '@/lib/postgres/limeSurvery';
import { executeSql } from '@/lib/postgres/itmsdb';
import { headers } from 'next/headers';
import { stripHtml } from '@/lib/utils';
import { jsonToolResult } from '../runtime/piToolResult';

export interface SurveyItem {
  id: string;
  text: string;
}

export interface SurveyCluster {
  label: string;
  item_ids: string[];
}

export interface SurveyQuestionPayload {
  surveyId: string;
  questionId: string;
  question: string;
  items: SurveyItem[];
}

interface RawCluster {
  label?: unknown;
  item_ids?: unknown;
}

export interface QuestionSectionResult {
  questionId: string;
  question: string;
  clusters: SurveyCluster[];
}

interface SurveyCacheEntry {
  surveyId: string;
  questions: SurveyQuestionPayload[];
  byQuestionId: Map<string, SurveyQuestionPayload>;
  sections: Map<string, QuestionSectionResult>;
}

export type LoadSurveyResult =
  | {
      ok: true;
      surveyId: string;
      total: number;
      questions: Array<{
        questionId: string;
        question: string;
        itemCount: number;
      }>;
      cached: true;
    }
  | { ok: false; error: string };

export type ProcessSurveyResult =
  | {
      ok: true;
      success: true;
      surveyId: string;
      questionId: string;
      question: string;
      clusterCount: number;
      itemCount: number;
      processedCount: number;
      totalCount: number;
      missingQuestionIds: string[];
      missingCount: number;
      done: boolean;
    }
  | { ok: false; error: string };

// In-memory Cache
const surveyCache = new Map<string, SurveyCacheEntry>();

export function extractSurveyId(
  surveyIdInput: string,
  queryInput: string = '',
): string {
  const candidate = surveyIdInput || queryInput;
  const matched = candidate.match(/\d+/)?.[0] ?? '';
  return matched.trim();
}

function sanitizeClustersByInputIds(
  clusters: RawCluster[],
  items: SurveyItem[],
): SurveyCluster[] {
  const validIds = new Set(items.map((i) => i.id));
  const seenIds = new Set<string>();
  const sanitized: SurveyCluster[] = [];

  for (const c of clusters || []) {
    if (!c?.label || !Array.isArray(c?.item_ids)) continue;
    const cleanIds: string[] = [];

    for (const id of c.item_ids) {
      if (typeof id === 'string' && validIds.has(id) && !seenIds.has(id)) {
        cleanIds.push(id);
        seenIds.add(id);
      }
    }

    if (cleanIds.length > 0) {
      sanitized.push({ label: String(c.label), item_ids: cleanIds });
    }
  }

  return sanitized;
}

function validateCoverage(items: SurveyItem[], clusters: SurveyCluster[]) {
  const allIds = new Set(items.map((i) => i.id));
  for (const c of clusters) {
    for (const id of c.item_ids) allIds.delete(id);
  }
  return { missingIds: Array.from(allIds) };
}

function renderMarkdown(
  question: string,
  clusters: SurveyCluster[],
  itemsById: Map<string, string>,
) {
  // LimeSurvey titles often include HTML (e.g. <strong>); keep markdown clean.
  let md = `## ${stripHtml(question)}\n\n`;
  for (const c of clusters) {
    md += `- **${c.label} (${c.item_ids.length})**\n`;
    for (const id of c.item_ids) {
      md += `  - ${itemsById.get(id) ?? ''} (${id})\n`;
    }
    md += '\n';
  }
  return md.trim();
}

function mustGetSurveyCache(surveyId: string) {
  const cached = surveyCache.get(surveyId);
  if (!cached)
    throw new Error(`Survey cache not found for surveyId=${surveyId}`);
  return cached;
}

function mustGetQuestionFromCache(surveyId: string, questionId: string) {
  const cached = mustGetSurveyCache(surveyId);
  const payload = cached.byQuestionId.get(questionId);
  if (!payload)
    throw new Error(
      `Question not found in cache: surveyId=${surveyId}, questionId=${questionId}`,
    );
  return payload;
}

async function resolveUserId(userIdOverride?: string | null): Promise<string> {
  if (userIdOverride && /^\d+$/.test(userIdOverride)) {
    return userIdOverride;
  }
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  if (!userId) {
    throw new Error('User ID not found');
  }
  if (!/^\d+$/.test(userId)) {
    throw new Error('Invalid user ID');
  }
  return userId;
}

/** Programmatic load — used by orchestrator and Kode tool wrapper. */
export async function loadSurveyQuestionsService(args: {
  surveyId?: string;
  query?: string;
  userId?: string | null;
}): Promise<LoadSurveyResult> {
  const surveyIdInput = String(args?.surveyId ?? '').trim();
  const queryInput = String(args?.query ?? '').trim();
  const surveyId = extractSurveyId(surveyIdInput, queryInput);

  if (!surveyId) {
    return {
      ok: false,
      error: '請提供 LimeSurvey 問卷 ID（純數字）。',
    };
  }

  // 1) Existence (fast) — avoid heavy summary query for fake IDs
  const exists = await limeSurveyExists(surveyId);
  if (!exists) {
    return {
      ok: false,
      error: `找不到問卷 ID「${surveyId}」。此 LimeSurvey 問卷不存在，請確認 ID 後再試。`,
    };
  }

  // 2) Permission
  try {
    const userId = await resolveUserId(args.userId);
    const userRows = await executeSql(
      `select concat(dp_id,'.',dp_dept_id) as username from cap_user where id = '${userId}'`,
    );
    const username = userRows?.[0]?.username;

    if (!username) {
      return {
        ok: false,
        error: '無法確認登入使用者，請重新登入後再試。',
      };
    }

    const permittedSurveys = await getLimeSurveySummaryIdsByUserId(username);
    const permittedSids = permittedSurveys.map((s: any) => String(s.sid));

    if (!permittedSids.includes(surveyId)) {
      return {
        ok: false,
        error: `您沒有權限存取問卷 ID「${surveyId}」。請向管理員申請權限，或改用您有權限的問卷。`,
      };
    }
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (/User ID not found|Invalid user ID/i.test(msg)) {
      return {
        ok: false,
        error: '無法確認登入使用者，請重新登入後再試。',
      };
    }
    return {
      ok: false,
      error: `權限檢查失敗：${msg}`,
    };
  }

  // 3) Load free-text summary payload
  let surveyData;
  try {
    surveyData = await getLimeSurveySummaryBySid(surveyId);
  } catch (err: any) {
    console.error('[loadSurveyQuestionsService] summary failed', surveyId, err);
    return {
      ok: false,
      error: `無法讀取問卷 ID「${surveyId}」的資料（問卷可能已刪除或資料表異常）。請確認 ID 後再試。`,
    };
  }

  const raw = surveyData?.[0]?.result_json;
  if (raw == null || (Array.isArray(raw) && raw.length === 0)) {
    return {
      ok: false,
      error: `問卷 ID「${surveyId}」目前沒有可分析的自由文字回覆（可能尚無作答，或沒有自由文字題）。`,
    };
  }

  type FreeTextAnswer = { id: number | string; value: string };
  type FreeTextMap = Record<string, FreeTextAnswer[]>;

  const freeTextOnly: FreeTextMap = Array.isArray(raw)
    ? raw.reduce<FreeTextMap>((acc, obj) => {
        if (!obj || typeof obj !== 'object') return acc;
        for (const [question, answers] of Object.entries(
          obj as Record<string, unknown>,
        )) {
          const arr = Array.isArray(answers)
            ? (answers as FreeTextAnswer[])
            : [];
          acc[question] = (acc[question] ?? []).concat(arr);
        }
        return acc;
      }, {})
    : ((raw ?? {}) as FreeTextMap);

  const questionKeys = Object.keys(freeTextOnly);

  if (questionKeys.length === 0) {
    return {
      ok: false,
      error: `問卷 ID「${surveyId}」沒有可分析的自由文字題。`,
    };
  }

  const questions: SurveyQuestionPayload[] = questionKeys.map(
    (questionId) => ({
      surveyId,
      // Keep original key for cache lookup; strip HTML for human-facing title.
      questionId,
      question: stripHtml(questionId) || questionId,
      items: (freeTextOnly[questionId] || []).map((i) => ({
        id: String(i.id),
        text: i.value,
      })),
    }),
  );

  surveyCache.set(surveyId, {
    surveyId,
    questions,
    byQuestionId: new Map(questions.map((q) => [q.questionId, q])),
    sections: new Map(),
  });

  return {
    ok: true,
    surveyId,
    total: questions.length,
    questions: questions.map((q) => ({
      questionId: q.questionId,
      question: q.question,
      itemCount: q.items.length,
    })),
    cached: true,
  };
}

export function listSurveyQuestions(
  surveyId: string,
): SurveyQuestionPayload[] | null {
  return surveyCache.get(surveyId)?.questions ?? null;
}

export function getSurveyQuestionPayloadService(
  surveyId: string,
  questionId: string,
):
  | { ok: true; surveyId: string; questionId: string; question: string; items: SurveyItem[] }
  | { ok: false; error: string } {
  try {
    const payload = mustGetQuestionFromCache(surveyId, questionId);
    return {
      ok: true,
      surveyId: payload.surveyId,
      questionId: payload.questionId,
      question: payload.question,
      items: payload.items,
    };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}

/** Programmatic process — sanitizes, covers missing ids, writes cache. */
export function processSurveyQuestionService(args: {
  surveyId: string;
  questionId: string;
  clusters: SurveyCluster[];
}): ProcessSurveyResult {
  try {
    const cached = mustGetSurveyCache(args.surveyId);
    const payload = mustGetQuestionFromCache(args.surveyId, args.questionId);
    const finalClusters = sanitizeClustersByInputIds(
      args.clusters,
      payload.items,
    );
    const coverage = validateCoverage(payload.items, finalClusters);

    if (coverage.missingIds.length > 0) {
      finalClusters.push({
        label: '未分類/其他',
        item_ids: coverage.missingIds,
      });
    }

    const result: QuestionSectionResult = {
      questionId: payload.questionId,
      question: payload.question,
      clusters: finalClusters,
    };

    cached.sections.set(payload.questionId, result);

    const totalCount = cached.questions.length;
    const processedCount = cached.sections.size;
    const missingQuestionIds = cached.questions
      .map((q) => q.questionId)
      .filter((id) => !cached.sections.has(id));

    return {
      ok: true,
      success: true,
      surveyId: args.surveyId,
      questionId: result.questionId,
      question: result.question,
      clusterCount: finalClusters.length,
      itemCount: payload.items.length,
      processedCount,
      totalCount,
      missingQuestionIds: missingQuestionIds.slice(0, 30),
      missingCount: missingQuestionIds.length,
      done: missingQuestionIds.length === 0,
    };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}

export type AssembleSurveyReportResult = {
  ok: boolean;
  markdown?: string;
  error?: string;
  processedCount: number;
  totalCount: number;
  missingQuestionIds: string[];
  incomplete: boolean;
  surveyId: string;
};

/**
 * Build markdown from in-memory cache without requiring the LLM to call
 * assemble_markdown_report.
 */
export function assembleSurveyReportFromCache(
  surveyId: string,
): AssembleSurveyReportResult {
  const cached = surveyCache.get(surveyId);
  if (!cached) {
    return {
      ok: false,
      error: `Survey cache not found for surveyId=${surveyId}`,
      processedCount: 0,
      totalCount: 0,
      missingQuestionIds: [],
      incomplete: true,
      surveyId,
    };
  }

  const missingQuestionIds = cached.questions
    .map((q) => q.questionId)
    .filter((id) => !cached.sections.has(id));

  if (cached.sections.size === 0) {
    return {
      ok: false,
      error: 'No processed sections found in cache.',
      processedCount: 0,
      totalCount: cached.questions.length,
      missingQuestionIds,
      incomplete: true,
      surveyId,
    };
  }

  const ordered = cached.questions
    .map((q) => {
      const section = cached.sections.get(q.questionId);
      if (!section) return null;
      const itemsById = new Map(q.items.map((i) => [i.id, i.text] as const));
      return renderMarkdown(q.question, section.clusters, itemsById);
    })
    .filter((v): v is string => Boolean(v && v.trim()));

  const markdown = ordered.join('\n\n');
  const incomplete = missingQuestionIds.length > 0;
  const note =
    incomplete && markdown
      ? `\n\n---\n\n> 注意：共 ${cached.questions.length} 題，成功分析 ${cached.sections.size} 題；未完成：${missingQuestionIds.slice(0, 10).join(', ')}${missingQuestionIds.length > 10 ? '…' : ''}`
      : '';

  return {
    ok: true,
    markdown: markdown + note,
    processedCount: cached.sections.size,
    totalCount: cached.questions.length,
    missingQuestionIds,
    incomplete,
    surveyId,
  };
}

/** Unwrap SDK tool results that may be stringified or nested. */
export function unwrapSurveyToolResult(result: unknown): any {
  if (result == null) return result;
  let cur: any = result;
  for (let i = 0; i < 3; i++) {
    if (typeof cur === 'string') {
      try {
        cur = JSON.parse(cur);
        continue;
      } catch {
        return cur;
      }
    }
    if (cur && typeof cur === 'object') {
      if (
        cur.ok !== undefined ||
        cur.markdown !== undefined ||
        cur.success !== undefined ||
        cur.surveyId !== undefined ||
        cur.processedCount !== undefined
      ) {
        return cur;
      }
      if (cur.data != null) {
        cur = cur.data;
        continue;
      }
      if (cur.output != null) {
        cur = cur.output;
        continue;
      }
      if (cur.result != null) {
        cur = cur.result;
        continue;
      }
    }
    break;
  }
  return cur;
}

/** Slim tool results for SSE / UI. */
export function slimSurveyToolResultForClient(
  toolName: string,
  result: unknown,
): unknown {
  const r = unwrapSurveyToolResult(result);
  if (!r || typeof r !== 'object') return r;

  switch (toolName) {
    case 'load_survey_questions':
      return {
        ok: r.ok,
        surveyId: r.surveyId,
        total: r.total,
        error: r.error,
        questions: Array.isArray(r.questions)
          ? r.questions.map((q: any) => ({
              questionId: q.questionId,
              itemCount: q.itemCount,
            }))
          : undefined,
      };
    case 'get_question_payload':
      return {
        ok: r.ok,
        surveyId: r.surveyId,
        questionId: r.questionId,
        question: r.question,
        itemCount: Array.isArray(r.items) ? r.items.length : undefined,
      };
    case 'process_survey_question':
      return {
        ok: r.ok,
        success: r.success,
        surveyId: r.surveyId,
        questionId: r.questionId,
        question: r.question,
        processedCount: r.processedCount,
        totalCount: r.totalCount,
        clusterCount: r.clusterCount,
        missingCount: r.missingCount,
        error: r.error,
      };
    case 'assemble_markdown_report':
      return {
        ok: r.ok,
        processedCount: r.processedCount,
        totalCount: r.totalCount,
        incomplete: r.incomplete,
        markdownLength:
          typeof r.markdown === 'string' ? r.markdown.length : undefined,
        missingCount: Array.isArray(r.missingQuestionIds)
          ? r.missingQuestionIds.length
          : undefined,
        error: r.error,
      };
    case 'cluster_survey_question':
      return {
        ok: r.ok,
        questionId: r.questionId,
        question:
          typeof r.question === 'string'
            ? r.question.slice(0, 80)
            : undefined,
        clusterCount: r.clusterCount,
        itemCount: r.itemCount,
        error: r.error,
      };
    default:
      return r;
  }
}

const surveyClusterSchema = Type.Object({
  label: Type.String(),
  item_ids: Type.Array(Type.String()),
});

export function createSurveySearchTools(): AgentTool[] {
  const loadSurveyQuestionsTool: AgentTool = {
    name: 'load_survey_questions',
    label: 'Load survey questions',
    description:
      'Load survey questions once by surveyId or query and cache them in memory',
    parameters: Type.Object({
      surveyId: Type.Optional(
        Type.String({
          description: 'Survey ID (optional if query provided)',
        }),
      ),
      query: Type.Optional(
        Type.String({
          description: 'User query that contains a survey ID',
        }),
      ),
    }),
    execute: async (_id, raw) => {
      const args = raw as { surveyId?: string; query?: string };
      return jsonToolResult(await loadSurveyQuestionsService(args));
    },
  };

  const getQuestionPayloadTool: AgentTool = {
    name: 'get_question_payload',
    label: 'Get question payload',
    description:
      'Get one cached survey question payload by surveyId and questionId.',
    parameters: Type.Object({
      surveyId: Type.String(),
      questionId: Type.String(),
    }),
    execute: async (_id, raw) => {
      const args = raw as { surveyId: string; questionId: string };
      return jsonToolResult(
        getSurveyQuestionPayloadService(String(args.surveyId), String(args.questionId)),
      );
    },
  };

  const processSurveyQuestionTool: AgentTool = {
    name: 'process_survey_question',
    label: 'Process survey question',
    description:
      'Process one survey question by questionId using cached original data. Submit cluster labels and item_ids only.',
    parameters: Type.Object({
      surveyId: Type.String(),
      questionId: Type.String(),
      clusters: Type.Array(surveyClusterSchema),
    }),
    execute: async (_id, raw) => {
      const args = raw as {
        surveyId: string;
        questionId: string;
        clusters?: SurveyCluster[];
      };
      return jsonToolResult(
        processSurveyQuestionService({
          surveyId: String(args.surveyId),
          questionId: String(args.questionId),
          clusters: args.clusters ?? [],
        }),
      );
    },
  };

  const assembleMarkdownReportTool: AgentTool = {
    name: 'assemble_markdown_report',
    label: 'Assemble markdown report',
    description:
      'Assemble final markdown from cached process_survey_question results. Only surveyId is required.',
    parameters: Type.Object({
      surveyId: Type.String(),
      sections: Type.Optional(
        Type.Array(
          Type.Object({
            questionId: Type.String(),
            clusters: Type.Array(surveyClusterSchema),
          }),
          { description: 'Optional overrides; prefer cache.' },
        ),
      ),
    }),
    execute: async (_id, raw) => {
      const args = raw as {
        surveyId: string;
        sections?: Array<{ questionId: string; clusters: SurveyCluster[] }>;
      };
      const sections = args.sections;
      if (Array.isArray(sections) && sections.length > 0) {
        for (const s of sections) {
          if (!s?.questionId) continue;
          processSurveyQuestionService({
            surveyId: String(args.surveyId),
            questionId: s.questionId,
            clusters: s.clusters ?? [],
          });
        }
      }
      return jsonToolResult(assembleSurveyReportFromCache(String(args.surveyId)));
    },
  };

  return [
    loadSurveyQuestionsTool,
    getQuestionPayloadTool,
    processSurveyQuestionTool,
    assembleMarkdownReportTool,
  ];
}
