import '../utils/shared/load-env';

import { BaseMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import eventEmitter from 'events';
import { MetaSearchAgentType } from './metaSearchAgent';
import { getSharedAgentContext } from './shared/agent/getSharedAgentContext';
import {
  assembleSurveyReportFromCache,
  getSurveyQuestionPayloadService,
  listSurveyQuestions,
  loadSurveyQuestionsService,
  processSurveyQuestionService,
  slimSurveyToolResultForClient,
} from './shared/tools/surveySearchTool';
import { clusterQuestionViaKodeAgent } from './shared/survey/clusterViaKodeAgent';

const SURVEY_AGENT_ID_PREFIX = 'survey:';

/** Max chars for the prior survey report injected into follow-up chat. */
const SURVEY_CHAT_REPORT_BUDGET = 28000;
/** Max chars per earlier history line (non-report turns). */
const SURVEY_CHAT_HISTORY_LINE_BUDGET = 4000;
/** How many recent history turns to include besides the report. */
const SURVEY_CHAT_HISTORY_TURNS = 12;

function getMessageText(m: BaseMessage): string {
  if (typeof m.content === 'string') return m.content;
  if (Array.isArray(m.content)) {
    return m.content
      .map((c: any) => (typeof c === 'string' ? c : c?.text ?? ''))
      .join('');
  }
  return String(m.content ?? '');
}

function getMessageRole(m: BaseMessage): 'user' | 'assistant' {
  const t = typeof m._getType === 'function' ? m._getType() : '';
  if (t === 'human' || t === 'user') return 'user';
  if (m.constructor?.name === 'HumanMessage') return 'user';
  return 'assistant';
}

/**
 * Only enter the LimeSurvey analysis pipeline when the user clearly intends
 * that. Arbitrary prose with digits (e.g. "總結下面文字…2024…") must stay
 * on the general Kode chat path.
 */
export function resolveSurveyAnalysisId(message: string): string {
  const text = (message || '').trim();
  if (!text) return '';

  // Most common: message is only the survey id
  if (/^\d{3,}$/.test(text)) return text;

  // Short command: "分析 12345" / "survey 12345" / "問卷ID 12345"
  const shortCmd = text.match(
    /^(?:請?(?:幫我)?(?:分析|跑|看|查|分群)|analyze|survey|limesurvey|sid|問卷(?:\s*id)?)\s*[:：#]?\s*(\d{3,})\s*[。.!！]?$/i,
  );
  if (shortCmd?.[1]) return shortCmd[1];

  // "12345 分析一下" / pure id + brief trailing phrase
  const leadingId = text.match(
    /^(\d{3,})\s*(?:請?(?:幫我)?(?:分析|跑|看|分群|摘要)|analyze|survey)?\s*[。.!！]?$/i,
  );
  if (leadingId?.[1] && text.length <= 48) return leadingId[1];

  // Explicit label in a short message only (avoid long pasted text)
  if (text.length <= 120) {
    const labeled = text.match(
      /(?:survey\s*id|surveyId|問卷\s*ID|LimeSurvey(?:\s*ID)?|sid)\s*[=:：#]?\s*(\d{3,})/i,
    )?.[1];
    if (labeled) return labeled;
  }

  return '';
}

/**
 * Prefer short pure-digit user turns (typical first message = LimeSurvey ID).
 * Fall back to explicit surveyId mentions; avoid grabbing random numbers from long text.
 */
function findSurveyIdInHistory(history: BaseMessage[]): string {
  for (const m of history ?? []) {
    if (getMessageRole(m) !== 'user') continue;
    const id = resolveSurveyAnalysisId(getMessageText(m));
    if (id) return id;
  }

  for (const m of history ?? []) {
    const text = getMessageText(m);
    const labeled = text.match(
      /(?:surveyId|survey\s*id|問卷\s*ID|LimeSurvey)[^\d]{0,20}(\d{3,})/i,
    )?.[1];
    if (labeled) return labeled;
  }

  return '';
}

/** Heuristic: assistant turn that looks like a generated cluster summary report. */
function looksLikeSurveyReport(text: string): boolean {
  if (!text || text.length < 200) return false;
  // Common markers from assemble markdown / disclaimer
  if (text.includes('AI生成的回覆可能不準確')) return true;
  // "## question" + "- **label (n)**" is the assemble markdown shape
  if (/^##\s+/m.test(text) && /\*\*[^*]+\(\d+\)\*\*/.test(text)) return true;
  if (/#{1,3}\s/.test(text) && text.includes('未分類')) return true;
  const clusterHits = (text.match(/^\s*[-*]\s+.+/gm) || []).length;
  return clusterHits >= 5 && text.length > 800;
}

function truncateKeepHead(text: string, budget: number): string {
  if (text.length <= budget) return text;
  return `${text.slice(0, budget)}\n\n…（內容過長，已截斷）`;
}

/**
 * General Kode chat prompt (no survey pipeline).
 * Handles greetings, free-form summarization, Q&A, and follow-ups on a prior
 * cluster report — without demanding a survey ID unless user wants LimeSurvey analysis.
 */
function buildSurveyChatPrompt(
  message: string,
  history: BaseMessage[],
): string {
  const turns = (history ?? [])
    .map((m) => ({
      role: getMessageRole(m),
      content: getMessageText(m).trim(),
    }))
    .filter((t) => t.content.length > 0);

  const surveyIdFromHistory = findSurveyIdInHistory(history);

  // Prefer in-memory report (same process) over truncated chat history.
  let reportFromCache = '';
  if (surveyIdFromHistory) {
    try {
      const cached = assembleSurveyReportFromCache(surveyIdFromHistory);
      if (cached.ok && cached.markdown?.trim()) {
        reportFromCache = cached.markdown.trim();
      }
    } catch {
      /* cache miss / cold start — fall back to history */
    }
  }

  const lastAssistantReport = [...turns]
    .reverse()
    .find((t) => t.role === 'assistant' && looksLikeSurveyReport(t.content));

  const analysisBody = reportFromCache || lastAssistantReport?.content || '';
  const hasAnalysis = analysisBody.length > 0;

  // Recent dialogue; collapse huge report body if already injected above.
  const recentTurns = turns.slice(-SURVEY_CHAT_HISTORY_TURNS).map((t) => {
    let content = t.content;
    if (
      t.role === 'assistant' &&
      hasAnalysis &&
      looksLikeSurveyReport(content)
    ) {
      content =
        '（已在上方「既有問卷分析結果」提供完整分群報告，此處省略重複全文）';
    } else {
      // User-pasted text for summarization needs a larger budget than short chat.
      const budget =
        t.role === 'user'
          ? Math.max(SURVEY_CHAT_HISTORY_LINE_BUDGET, 12000)
          : SURVEY_CHAT_HISTORY_LINE_BUDGET;
      content = truncateKeepHead(content, budget);
    }
    return `${t.role}: ${content}`;
  });

  const parts: string[] = [
    '你是通用對話助理（Kode agent），同時具備 LimeSurvey 自由文字問卷分析能力。請用繁體中文回覆。',
    '預設行為：像一般助理一樣處理使用者請求（總結、改寫、解釋、問答、翻譯、條列重點等）。不要無故索取問卷 ID。',
  ];

  if (surveyIdFromHistory) {
    parts.push(`本對話已知問卷 ID：${surveyIdFromHistory}（僅在討論該問卷時參考）`);
  }

  if (hasAnalysis) {
    parts.push(
      '## 既有問卷分析結果（若相關可引用）',
      '以下是稍早已完成的自由文字分群／摘要。若使用者問的是這份報告，請依此回答，不要再要 survey ID。',
      truncateKeepHead(analysisBody, SURVEY_CHAT_REPORT_BUDGET),
    );
  }

  if (recentTurns.length > 0) {
    parts.push('## 最近對話', recentTurns.join('\n'));
  }

  parts.push(
    '## 使用者最新訊息',
    message,
    '',
    '回覆規則：',
    '1. 一般任務（總結一段文字、問答、改寫、翻譯、條列重點等）：直接完成，不要提到 survey ID。',
    '2. 若上文有「既有問卷分析結果」且問題與之相關：依報告回答（總結／摘錄／比較等），禁止再要問卷 ID。',
    '3. 僅當使用者明確要「分析 LimeSurvey 問卷／開始分群」且上下文完全沒有可用報告或 ID 時，才禮貌請他提供問卷 ID。',
    '4. 不要虛構資料；資料不足時清楚說明。',
    '5. 不要輸出 JSON、不要描述系統內部流程。',
  );

  return parts.join('\n\n');
}

/**
 * Scheme A orchestrator:
 * - Clear survey-analysis intent + ID → load → cluster each question → assemble
 * - Everything else → general Kode chat agent (summarize, Q&A, report follow-up)
 * - Kode agent.complete used for single-question clustering (no tools)
 */
export default class NewSurverAgent implements MetaSearchAgentType {
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
  ): Promise<eventEmitter> {
    const emitter = new eventEmitter();
    let hasEnded = false;

    const emitJson = (payload: unknown) => {
      emitter.emit('data', JSON.stringify(payload));
    };

    const emitEndOnce = () => {
      if (hasEnded) return;
      hasEnded = true;
      emitter.emit('end');
    };

    const emitProgress = (data: {
      status: string;
      total: number;
      current: number;
      question?: string;
      message: string;
    }) => {
      emitJson({ type: 'progress', data });
    };

    /** Stable tool id so RUNNING → COMPLETED updates one row (not two). */
    const emitTool = (
      name: string,
      state: string,
      inputPreview: unknown,
      resultPreview: unknown,
      durationMs?: number,
      stableId?: string,
    ) => {
      emitJson({
        type: 'tool_execution',
        data: {
          id:
            stableId ||
            `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name,
          state,
          durationMs,
          inputPreview,
          resultPreview: slimSurveyToolResultForClient(name, resultPreview),
        },
      });
    };

    const emitResponse = (text: string) => {
      emitJson({
        type: 'response',
        data: text.startsWith('\n') ? text : `\n\n${text}`,
      });
    };

    if (signal) {
      signal.addEventListener('abort', () => emitEndOnce());
    }

    (async () => {
      let shellAgentId: string | undefined;
      let harnessAgentManager:
        | ReturnType<typeof getSharedAgentContext>['manager']
        | undefined;

      try {
        if (signal?.aborted) return;

        const ctx = getSharedAgentContext();
        harnessAgentManager = ctx.manager;

        const requestAgentId =
          req?.headers.get('x-agent-id') ??
          req?.headers.get('x-chat-id') ??
          undefined;
        const baseId = harnessAgentManager.normalizeAgentId(requestAgentId);
        const stableBaseId = baseId.startsWith(SURVEY_AGENT_ID_PREFIX)
          ? baseId
          : `${SURVEY_AGENT_ID_PREFIX}${baseId}`;

        // Only pure/explicit survey-analysis entry runs the pipeline.
        // Long text, summarization, Q&A, etc. → general Kode chat.
        const surveyId = resolveSurveyAnalysisId(message);

        // ── General Kode chat (default) ──────────────────────────────────
        if (!surveyId) {
          emitProgress({
            status: 'processing',
            total: 1,
            current: 0,
            question: 'Chat',
            message: 'Responding via Kode chat agent…',
          });

          // Dedicated chat agent (stable per chat) so multi-turn context is kept.
          // Do not reuse the analysis shell agent — different template / tools.
          shellAgentId = `${stableBaseId}:chat`;
          const chatAgent = await harnessAgentManager.getOrCreateAgent(
            shellAgentId,
            [],
            'rag-survey-chat-template',
          );
          harnessAgentManager.markBusy(shellAgentId);
          harnessAgentManager.touchAgent(shellAgentId);

          try {
            const chatPrompt = buildSurveyChatPrompt(message, history);
            const result = await chatAgent.complete(chatPrompt);
            const text =
              (result?.text && result.text.trim()) ||
              '你好！我可以幫你總結文字、回答問題，或在你提供 LimeSurvey 問卷 ID 後分析自由文字題。';

            emitResponse(text);
            emitProgress({
              status: 'finished',
              total: 1,
              current: 1,
              message: 'Chat finished',
            });
          } finally {
            harnessAgentManager.markIdle(shellAgentId);
          }
          return;
        }

        emitProgress({
          status: 'processing',
          total: 1,
          current: 0,
          question: '載入問卷',
          message: `正在檢查問卷 ID「${surveyId}」…`,
        });

        shellAgentId = stableBaseId;

        // Keep a shell agent in the Kode pool for this survey session (isolation / capacity).
        await harnessAgentManager.getOrCreateAgent(
          shellAgentId,
          [
            'load_survey_questions',
            'get_question_payload',
            'process_survey_question',
            'assemble_markdown_report',
          ],
          'rag-survey-template',
        );
        harnessAgentManager.markBusy(shellAgentId);
        harnessAgentManager.touchAgent(shellAgentId);

        const userId = req?.headers.get('x-user-id') ?? null;

        // ── 1. Load (programmatic, same service as Kode tool) ─────────────
        const loadToolId = `load_survey_questions:${surveyId}`;
        const loadStarted = Date.now();
        emitTool(
          'load_survey_questions',
          'RUNNING',
          { surveyId, query: message.slice(0, 80) },
          undefined,
          undefined,
          loadToolId,
        );

        const loadResult = await loadSurveyQuestionsService({
          surveyId,
          query: message,
          userId,
        });

        emitTool(
          'load_survey_questions',
          loadResult.ok ? 'COMPLETED' : 'FAILED',
          { surveyId },
          loadResult,
          Date.now() - loadStarted,
          loadToolId,
        );

        if (!loadResult.ok) {
          const errText =
            loadResult.error?.trim() ||
            `無法載入問卷 ID「${surveyId}」，請稍後再試。`;
          emitProgress({
            status: 'completed',
            total: 1,
            current: 0,
            question: '載入失敗',
            message: errText,
          });
          // Clear, user-visible chat reply (not only tool panel)
          emitResponse(errText);
          return;
        }

        const questions = listSurveyQuestions(loadResult.surveyId);
        if (!questions?.length) {
          const errText = `問卷 ID「${loadResult.surveyId}」沒有可分析的自由文字題。`;
          emitProgress({
            status: 'completed',
            total: 1,
            current: 0,
            question: '載入失敗',
            message: errText,
          });
          emitResponse(errText);
          return;
        }

        const total = questions.length;
        // Fresh run id so cluster agents never resume polluted history
        const runId = Date.now().toString(36);

        emitProgress({
          status: 'processing',
          total,
          current: 0,
          question: '問卷已載入',
          message: `已載入 ${total} 題自由文字，開始分群分析…`,
        });

        // ── 2. For each question: Kode cluster → process to cache ─────────
        let successCount = 0;
        const failures: string[] = [];

        for (let i = 0; i < questions.length; i++) {
          if (signal?.aborted) break;

          const q = questions[i];
          const current = i + 1;
          const shortQ =
            q.question.length > 60
              ? `${q.question.slice(0, 60)}…`
              : q.question;

          emitProgress({
            status: 'processing',
            total,
            current,
            question: q.question,
            message: `Clustering question ${current}/${total}: ${shortQ}`,
          });

          const payload = getSurveyQuestionPayloadService(
            loadResult.surveyId,
            q.questionId,
          );
          if (!payload.ok) {
            failures.push(`${q.questionId}: ${payload.error}`);
            continue;
          }

          // Empty answers → store empty section (no tool row; not user-facing work)
          if (payload.items.length === 0) {
            const processed = processSurveyQuestionService({
              surveyId: loadResult.surveyId,
              questionId: q.questionId,
              clusters: [],
            });
            if (processed.ok) successCount += 1;
            else failures.push(`${q.questionId}: ${processed.error}`);
            continue;
          }

          // Dedicated Kode agent per question — no multi-turn history pollution
          const clusterAgentId = `${shellAgentId}:run${runId}:q${i}`;
          // One stable row per question (RUNNING → COMPLETED/FAILED)
          const clusterToolId = `cluster_survey_question:${loadResult.surveyId}:${q.questionId}`;

          const clusterStarted = Date.now();
          emitTool(
            'cluster_survey_question',
            'RUNNING',
            {
              surveyId: loadResult.surveyId,
              questionId: q.questionId,
              question: shortQ,
              itemCount: payload.items.length,
              index: current,
              total,
            },
            undefined,
            undefined,
            clusterToolId,
          );

          try {
            const clusterAgent = await harnessAgentManager.getOrCreateAgent(
              clusterAgentId,
              [], // no tools — pure clustering complete()
              'rag-survey-template',
            );
            harnessAgentManager.markBusy(clusterAgentId);

            const clusters = await clusterQuestionViaKodeAgent({
              agent: clusterAgent,
              question: payload.question,
              items: payload.items,
              signal,
              maxRetries: 1,
            });

            const processed = processSurveyQuestionService({
              surveyId: loadResult.surveyId,
              questionId: q.questionId,
              clusters,
            });

            emitTool(
              'cluster_survey_question',
              processed.ok ? 'COMPLETED' : 'FAILED',
              {
                surveyId: loadResult.surveyId,
                questionId: q.questionId,
                question: shortQ,
                itemCount: payload.items.length,
                index: current,
                total,
              },
              {
                ok: processed.ok,
                questionId: q.questionId,
                question: payload.question,
                clusterCount: clusters.length,
                itemCount: payload.items.length,
                error: processed.ok ? undefined : processed.error,
              },
              Date.now() - clusterStarted,
              clusterToolId,
            );

            if (processed.ok) {
              successCount += 1;
              emitProgress({
                status: 'processing',
                total,
                current,
                question: q.question,
                message: `Processed ${processed.processedCount}/${processed.totalCount}`,
              });
            } else {
              failures.push(`${q.questionId}: ${processed.error}`);
            }
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error(
              `[survey-orchestrator] cluster failed q=${q.questionId}:`,
              err,
            );
            emitTool(
              'cluster_survey_question',
              'FAILED',
              {
                questionId: q.questionId,
                question: shortQ,
                index: current,
                total,
              },
              { ok: false, error: msg, questionId: q.questionId },
              Date.now() - clusterStarted,
              clusterToolId,
            );
            emitJson({
              type: 'tool_error',
              data: {
                name: 'cluster_survey_question',
                error: msg,
                questionId: q.questionId,
              },
            });
            failures.push(`${q.questionId}: ${msg}`);

            // Still store question under 未分類 if clustering fails? Skip so incomplete note shows.
          } finally {
            if (clusterAgentId && harnessAgentManager) {
              try {
                harnessAgentManager.markIdle(clusterAgentId);
              } catch {
                /* ignore */
              }
            }
          }
        }

        if (signal?.aborted) return;

        // ── 3. Assemble from cache (programmatic) ─────────────────────────
        const assembleToolId = `assemble_markdown_report:${loadResult.surveyId}`;
        const assembleStarted = Date.now();
        emitTool(
          'assemble_markdown_report',
          'RUNNING',
          { surveyId: loadResult.surveyId },
          undefined,
          undefined,
          assembleToolId,
        );

        const report = assembleSurveyReportFromCache(loadResult.surveyId);

        emitTool(
          'assemble_markdown_report',
          report.ok ? 'COMPLETED' : 'FAILED',
          { surveyId: loadResult.surveyId },
          report,
          Date.now() - assembleStarted,
          assembleToolId,
        );

        if (report.ok && report.markdown) {
          // Disclaimer + report (same style as streamAgentProgressToEmitter)
          emitResponse(
            '<span class="text-red-500 font-bold">AI生成的回覆可能不準確，使用前請仔細核實。</span>\n\n' +
              report.markdown,
          );
        } else {
          const failNote =
            failures.length > 0
              ? `\n\n失敗題目：\n- ${failures.slice(0, 15).join('\n- ')}`
              : '';
          emitResponse(
            (report.error || 'Failed to assemble survey report.') + failNote,
          );
        }

        emitProgress({
          status: 'finished',
          total,
          current: successCount,
          message: `Survey analysis finished (${successCount}/${total})`,
        });

        console.log(
          `[survey-orchestrator] done surveyId=${loadResult.surveyId} success=${successCount}/${total} failures=${failures.length}`,
        );
      } catch (error: unknown) {
        console.error('-- ERROR IN NEW SURVER AGENT --', error);
        if (error instanceof Error && error.name === 'AbortError') return;
        if (signal?.aborted) return;
        emitResponse(
          `Error: ${error instanceof Error ? error.message : String(error)}`,
        );
      } finally {
        if (shellAgentId && harnessAgentManager) {
          try {
            harnessAgentManager.markIdle(shellAgentId);
          } catch {
            /* ignore */
          }
        }
        emitEndOnce();
      }
    })();

    return emitter;
  }
}
