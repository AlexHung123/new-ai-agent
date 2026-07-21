import '../utils/shared/load-env';

import { BaseMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import eventEmitter from 'events';
import { MetaSearchAgentType } from './metaSearchAgent';
import { getSharedAgentContext } from './shared/agent/getSharedAgentContext';
import {
  assembleSurveyReportFromCache,
  extractSurveyId,
  getSurveyQuestionPayloadService,
  listSurveyQuestions,
  loadSurveyQuestionsService,
  processSurveyQuestionService,
  slimSurveyToolResultForClient,
} from './shared/tools/surveySearchTool';
import { clusterQuestionViaKodeAgent } from './shared/survey/clusterViaKodeAgent';

const SURVEY_AGENT_ID_PREFIX = 'survey:';

/** Build a short prompt for Kode chat when no survey ID is present. */
function buildSurveyChatPrompt(
  message: string,
  history: BaseMessage[],
): string {
  const recent = (history ?? [])
    .slice(-6)
    .map((m) => {
      const role =
        m._getType?.() === 'human' || m.constructor?.name === 'HumanMessage'
          ? 'user'
          : 'assistant';
      const content =
        typeof m.content === 'string'
          ? m.content
          : Array.isArray(m.content)
            ? m.content
                .map((c: any) => (typeof c === 'string' ? c : c?.text ?? ''))
                .join('')
            : String(m.content ?? '');
      return `${role}: ${content.slice(0, 500)}`;
    })
    .filter((line) => line.length > 8)
    .join('\n');

  if (!recent) {
    return message;
  }

  return `以下是最近對話（供參考，請用繁體中文回覆最新訊息）：\n${recent}\n\nuser: ${message}\n\n請直接回覆使用者最新訊息。`;
}

/**
 * Scheme A orchestrator:
 * - No survey ID → Kode chat agent (rag-survey-chat-template) for greetings / Q&A
 * - With survey ID → code owns load → for-each question → process → assemble
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

    const emitTool = (
      name: string,
      state: string,
      inputPreview: unknown,
      resultPreview: unknown,
      durationMs?: number,
    ) => {
      emitJson({
        type: 'tool_execution',
        data: {
          id: `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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

        const surveyId = extractSurveyId('', message);

        // ── No survey ID: conversational reply via Kode chat agent ───────
        if (!surveyId) {
          emitProgress({
            status: 'processing',
            total: 1,
            current: 0,
            question: 'Survey chat',
            message: 'Responding via Kode survey chat agent…',
          });

          // Dedicated chat agent (stable per chat) so multi-turn greetings keep context.
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
              '你好！我是問卷分析助理。請提供 LimeSurvey 問卷 ID，我就可以開始分析自由文字題。';

            emitResponse(text);
            emitProgress({
              status: 'finished',
              total: 1,
              current: 1,
              message: 'Survey chat finished',
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
          question: 'Initializing Survey Orchestrator',
          message: 'Starting programmatic survey analysis (Kode clustering)…',
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
        const loadStarted = Date.now();
        emitTool(
          'load_survey_questions',
          'RUNNING',
          { surveyId, query: message.slice(0, 80) },
          undefined,
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
        );

        if (!loadResult.ok) {
          emitResponse(loadResult.error);
          return;
        }

        const questions = listSurveyQuestions(loadResult.surveyId);
        if (!questions?.length) {
          emitResponse('No free text questions found in the survey.');
          return;
        }

        const total = questions.length;
        // Fresh run id so cluster agents never resume polluted history
        const runId = Date.now().toString(36);

        emitProgress({
          status: 'processing',
          total,
          current: 0,
          question: 'Survey loaded',
          message: `Loaded ${total} questions — clustering via Kode agent…`,
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

          emitTool(
            'get_question_payload',
            'COMPLETED',
            { surveyId: loadResult.surveyId, questionId: q.questionId },
            {
              ok: true,
              surveyId: payload.surveyId,
              questionId: payload.questionId,
              question: payload.question,
              items: payload.items,
            },
          );

          // Empty answers → store empty section
          if (payload.items.length === 0) {
            const processed = processSurveyQuestionService({
              surveyId: loadResult.surveyId,
              questionId: q.questionId,
              clusters: [],
            });
            emitTool(
              'process_survey_question',
              processed.ok ? 'COMPLETED' : 'FAILED',
              { surveyId: loadResult.surveyId, questionId: q.questionId },
              processed,
            );
            if (processed.ok) successCount += 1;
            continue;
          }

          // Dedicated Kode agent per question — no multi-turn history pollution
          const clusterAgentId = `${shellAgentId}:run${runId}:q${i}`;

          const clusterStarted = Date.now();
          emitTool(
            'cluster_survey_question',
            'RUNNING',
            {
              surveyId: loadResult.surveyId,
              questionId: q.questionId,
              itemCount: payload.items.length,
            },
            undefined,
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

            emitTool(
              'cluster_survey_question',
              'COMPLETED',
              {
                surveyId: loadResult.surveyId,
                questionId: q.questionId,
                itemCount: payload.items.length,
              },
              {
                ok: true,
                questionId: q.questionId,
                clusterCount: clusters.length,
              },
              Date.now() - clusterStarted,
            );

            const processStarted = Date.now();
            const processed = processSurveyQuestionService({
              surveyId: loadResult.surveyId,
              questionId: q.questionId,
              clusters,
            });

            emitTool(
              'process_survey_question',
              processed.ok ? 'COMPLETED' : 'FAILED',
              {
                surveyId: loadResult.surveyId,
                questionId: q.questionId,
                clusterCount: clusters.length,
              },
              processed,
              Date.now() - processStarted,
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
              { questionId: q.questionId },
              { ok: false, error: msg },
              Date.now() - clusterStarted,
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
        const assembleStarted = Date.now();
        emitTool(
          'assemble_markdown_report',
          'RUNNING',
          { surveyId: loadResult.surveyId },
          undefined,
        );

        const report = assembleSurveyReportFromCache(loadResult.surveyId);

        emitTool(
          'assemble_markdown_report',
          report.ok ? 'COMPLETED' : 'FAILED',
          { surveyId: loadResult.surveyId },
          report,
          Date.now() - assembleStarted,
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
