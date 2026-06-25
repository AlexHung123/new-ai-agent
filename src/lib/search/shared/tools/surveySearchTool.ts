import {
  defineTool,
  EnhancedToolContext,
} from '@shareai-lab/kode-sdk/dist/tools/define';
import {
  getLimeSurveySummaryBySid,
  getLimeSurveySummaryIdsByUserId,
} from '@/lib/postgres/limeSurvery';
import { executeSql } from '@/lib/postgres/itmsdb';
import { headers } from 'next/headers';

interface Item {
  id: string;
  text: string;
}

interface Cluster {
  label: string;
  item_ids: string[];
}

interface SurveyQuestionPayload {
  surveyId: string;
  questionId: string;
  question: string;
  items: Item[];
}

interface RawCluster {
  label?: unknown;
  item_ids?: unknown;
}

interface QuestionSectionResult {
  questionId: string;
  question: string;
  clusters: Cluster[];
}

// In-memory Cache
const surveyCache = new Map<
  string,
  {
    surveyId: string;
    questions: SurveyQuestionPayload[];
    byQuestionId: Map<string, SurveyQuestionPayload>;
  }
>();

function extractSurveyId(surveyIdInput: string, queryInput: string): string {
  const candidate = surveyIdInput || queryInput;
  const matched = candidate.match(/\d+/)?.[0] ?? '';
  return matched.trim();
}

function sanitizeClustersByInputIds(
  clusters: RawCluster[],
  items: Item[],
): Cluster[] {
  const validIds = new Set(items.map((i) => i.id));
  const seenIds = new Set<string>();
  const sanitized: Cluster[] = [];

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

function validateCoverage(items: Item[], clusters: Cluster[]) {
  const allIds = new Set(items.map((i) => i.id));
  for (const c of clusters) {
    for (const id of c.item_ids) allIds.delete(id);
  }
  return { missingIds: Array.from(allIds) };
}

function renderMarkdown(
  question: string,
  clusters: Cluster[],
  itemsById: Map<string, string>,
) {
  let md = `## ${question}\n\n`;
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

export function createSurveySearchTools() {
  const loadSurveyQuestionsTool = defineTool({
    name: 'load_survey_questions',
    description:
      'Load survey questions once by surveyId or query and cache them in memory',
    params: {
      surveyId: {
        type: 'string',
        description: 'Survey ID (optional if query provided)',
        required: false,
      },
      query: {
        type: 'string',
        description: 'User query that contains a survey ID',
        required: false,
      },
    },
    attributes: { readonly: false, noEffect: false },
    async exec(args: { surveyId?: string; query?: string }) {
      const surveyIdInput = String(args?.surveyId ?? '').trim();
      const queryInput = String(args?.query ?? '').trim();
      const surveyId = extractSurveyId(surveyIdInput, queryInput);

      if (!surveyId) {
        return { ok: false, error: 'Please provide survey ID' };
      }

      let surveyData;
      try {
        surveyData = await getLimeSurveySummaryBySid(surveyId);
      } catch {
        return { ok: false, error: 'No such LimeSurvey ID exists' };
      }

      // Permission check start
      try {
        const headersList = await headers();
        const userId = headersList.get('x-user-id');

        if (!userId) {
          return { ok: false, error: 'User ID not found' };
        }
        if (!/^\d+$/.test(userId)) {
          return { ok: false, error: 'Invalid user ID' };
        }

        const userRows = await executeSql(
          `select concat(dp_id,'.',dp_dept_id) as username from cap_user where id = '${userId}'`,
        );
        const username = userRows?.[0]?.username;

        if (!username) {
          return { ok: false, error: 'Username not found' };
        }

        const permittedSurveys =
          await getLimeSurveySummaryIdsByUserId(username);
        const permittedSids = permittedSurveys.map((s: any) => String(s.sid));

        if (!permittedSids.includes(surveyId)) {
          return { ok: false, error: 'No permission to access this survey.' };
        }
      } catch (err: any) {
        return { ok: false, error: 'Permission check failed.' };
      }
      // Permission check end

      const raw = surveyData?.[0]?.result_json;
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
          error: 'No free text questions found in the survey.',
        };
      }

      const questions: SurveyQuestionPayload[] = questionKeys.map(
        (questionId) => ({
          surveyId,
          questionId,
          question: questionId,
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
    },
  });

  const getQuestionPayloadTool = defineTool({
    name: 'get_question_payload',
    description:
      'Get one cached survey question payload by surveyId and questionId. Use this right before clustering.',
    params: {
      surveyId: { type: 'string' },
      questionId: { type: 'string' },
    },
    attributes: { readonly: true, noEffect: true },
    async exec(args: { surveyId: string; questionId: string }) {
      const payload = mustGetQuestionFromCache(args.surveyId, args.questionId);
      return {
        surveyId: payload.surveyId,
        questionId: payload.questionId,
        question: payload.question,
        items: payload.items,
      };
    },
  });

  const processSurveyQuestionTool = defineTool({
    name: 'process_survey_question',
    description:
      'Process one survey question by questionId using cached original data. The model only needs to submit cluster labels and item_ids.',
    params: {
      surveyId: { type: 'string' },
      questionId: { type: 'string' },
      clusters: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string' },
            item_ids: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
    attributes: { readonly: false, noEffect: false },
    async exec(
      args: { surveyId: string; questionId: string; clusters: Cluster[] },
      ctx: EnhancedToolContext,
    ) {
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

      ctx.emit('question_processed', result);

      return {
        success: true,
        ...result,
      };
    },
  });

  const assembleMarkdownReportTool = defineTool({
    name: 'assemble_markdown_report',
    description:
      'Assemble final markdown sections in original question order from cached survey order, rendering the markdown for each section',
    params: {
      surveyId: { type: 'string' },
      sections: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            questionId: { type: 'string' },
            clusters: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  label: { type: 'string' },
                  item_ids: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
      },
    },
    attributes: { readonly: true, noEffect: true },
    async exec(args: {
      surveyId: string;
      sections: Array<{ questionId: string; clusters: Cluster[] }>;
    }) {
      const cached = mustGetSurveyCache(args.surveyId);

      const byId = new Map(
        args.sections.map((s) => {
          const payload = mustGetQuestionFromCache(args.surveyId, s.questionId);
          const itemsById = new Map(
            payload.items.map((i) => [i.id, i.text] as const),
          );
          const markdown = renderMarkdown(
            payload.question,
            s.clusters,
            itemsById,
          );
          return [s.questionId, markdown];
        }),
      );

      const ordered = cached.questions
        .map((q) => byId.get(q.questionId))
        .filter((v): v is string => Boolean(v && v.trim()));

      return {
        markdown: ordered.join('\n\n'),
      };
    },
  });

  return [
    loadSurveyQuestionsTool,
    getQuestionPayloadTool,
    processSurveyQuestionTool,
    assembleMarkdownReportTool,
  ];
}
