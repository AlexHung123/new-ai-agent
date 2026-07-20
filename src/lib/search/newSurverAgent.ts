import '../utils/shared/load-env';

import { BaseMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import eventEmitter from 'events';
import { MetaSearchAgentType } from './metaSearchAgent';
import { streamAgentProgressToEmitter } from '../utils/agentStream';
import { getSharedAgentContext } from './shared/agent/getSharedAgentContext';
import { safeJson } from './shared/utils/safeJson';

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
    let finalMarkdownFromTool = '';
    let hasTextResponse = false;
    let surveyProgress = {
      total: 0,
      current: 0,
      question: 'Initializing Survey Agent',
      message: 'Initializing Survey Kode Agent...',
    };

    const emitEndOnce = () => {
      if (hasEnded) return;
      hasEnded = true;
      emitter.emit('end');
    };

    if (signal) {
      signal.addEventListener('abort', () => {
        emitEndOnce();
      });
    }

    (async () => {
      try {
        if (signal?.aborted) return;

        emitter.emit(
          'data',
          JSON.stringify({
            type: 'progress',
            data: {
              status: 'processing',
              total: 1,
              current: 0,
              question: surveyProgress.question,
              message: surveyProgress.message,
            },
          }),
        );

        const { manager: harnessAgentManager, progressBookmarkByAgent } =
          getSharedAgentContext();

        const requestAgentId =
          req?.headers.get('x-agent-id') ??
          req?.headers.get('x-chat-id') ??
          undefined;

        const stableAgentId =
          harnessAgentManager.normalizeAgentId(requestAgentId);

        const agent = await harnessAgentManager.getOrCreateAgent(
          stableAgentId,
          [
            'load_survey_questions',
            'get_question_payload',
            'process_survey_question',
            'assemble_markdown_report',
          ],
          'rag-survey-template',
        );

        harnessAgentManager.markBusy(stableAgentId);
        harnessAgentManager.touchAgent(stableAgentId);

        const onToolExecuted = (event: any) => {
          const call = event.call ?? event;
          const result = event.result ?? call?.result;

          console.log(
            `\n[survey-orchestrator-main] [tool_executed] ${call?.name ?? 'unknown'} (${call?.durationMs ?? 0}ms)`,
          );
          if (call?.args) {
            console.log(
              `[survey-orchestrator-main] args: ${safeJson(call.args)}`,
            );
          }
          if (result) {
            console.log(
              `[survey-orchestrator-main] result: ${safeJson(result)}`,
            );
          }

          if (call?.name === 'load_survey_questions' && result?.ok) {
            surveyProgress = {
              total: result.total ?? 0,
              current: 0,
              question: 'Survey loaded',
              message: `Loaded ${result.total ?? 0} questions`,
            };

            emitter.emit(
              'data',
              JSON.stringify({
                type: 'progress',
                data: {
                  status: 'processing',
                  total: surveyProgress.total || 1,
                  current: 0,
                  question: surveyProgress.question,
                  message: surveyProgress.message,
                },
              }),
            );
          }

          if (call?.name === 'process_survey_question' && result?.ok) {
            surveyProgress = {
              total: result.totalCount ?? surveyProgress.total,
              current: result.processedCount ?? surveyProgress.current,
              question:
                result.question ?? result.questionId ?? 'Processing question',
              message: `Processed ${result.processedCount ?? 0}/${result.totalCount ?? surveyProgress.total}`,
            };

            emitter.emit(
              'data',
              JSON.stringify({
                type: 'progress',
                data: {
                  status: 'processing',
                  total: surveyProgress.total || 1,
                  current: surveyProgress.current,
                  question: surveyProgress.question,
                  message: surveyProgress.message,
                },
              }),
            );
          }

          if (call?.name === 'assemble_markdown_report' && result?.markdown) {
            finalMarkdownFromTool = result.markdown;
          }

          let inputPreview = undefined;
          try {
            inputPreview = call?.inputPreview ?? call?.args;
          } catch {}

          emitter.emit(
            'data',
            JSON.stringify({
              type: 'tool_execution',
              data: {
                id: call?.id,
                name: call?.name,
                state: call?.state,
                durationMs: call?.durationMs,
                inputPreview,
                resultPreview: result,
              },
            }),
          );
        };

        const disposeToolExecuted = agent.on('tool_executed', onToolExecuted);

        const onTextChunk = () => {
          hasTextResponse = true;
        };
        // agent.on?.('text_chunk', onTextChunk);
        (agent as any).on?.('text_chunk', onTextChunk);

        const onAgentError = (event: any) => {
          console.error(
            `\n[survey-orchestrator-main] [error] phase=${event?.phase ?? 'unknown'} message=${event?.message ?? event}`,
          );
          if (event?.detail) {
            console.error(
              `[survey-orchestrator-main] detail: ${safeJson(event.detail)}`,
            );
          }
          emitter.emit(
            'data',
            JSON.stringify({
              type: 'tool_error',
              data: {
                error: event.message || 'An unknown agent error occurred',
                phase: event.phase,
                detail: event.detail,
              },
            }),
          );
        };
        const disposeAgentError = agent.on('error', onAgentError);

        try {
          const subscriptionPromise = streamAgentProgressToEmitter({
            agent,
            emitter,
            signal,
            progressBookmarkByAgent,
            safeJson,
          });

          await agent.send(message);
          await subscriptionPromise;

          if (!hasTextResponse && finalMarkdownFromTool) {
            emitter.emit(
              'data',
              JSON.stringify({
                type: 'response',
                data: `\n\n${finalMarkdownFromTool}`,
              }),
            );
          }
        } finally {
          harnessAgentManager.markIdle(stableAgentId);
          disposeToolExecuted();
          disposeAgentError();
        }
      } catch (error: unknown) {
        console.error('-- ERROR IN NEW SURVER AGENT --', error);
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        emitter.emit(
          'data',
          JSON.stringify({
            type: 'response',
            data: `\n\nError: ${error instanceof Error ? error.message : String(error)}`,
          }),
        );
      } finally {
        emitEndOnce();
      }
    })();

    return emitter;
  }
}
