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
              total: 2,
              current: 1,
              question: 'Initializing Survey Agent',
              message: 'Initializing Survey Kode Agent...',
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
          'rag-survey-template', // Explicitly specify the template
        );

        harnessAgentManager.markBusy(stableAgentId);
        harnessAgentManager.touchAgent(stableAgentId);

        const onToolExecuted = (event: any) => {
          const call = event.call ?? event;
          const result = event.result ?? call?.result;

          // Debug logging as requested
          console.log(
            `\n[survey-orchestrator-main] [tool_executed] ${call?.name ?? 'unknown'} (${call?.durationMs ?? 0}ms)`,
          );
          if (call?.args)
            console.log(
              `[survey-orchestrator-main] args: ${safeJson(call.args)}`,
            );
          if (result)
            console.log(
              `[survey-orchestrator-main] result: ${safeJson(result)}`,
            );

          if (call?.name === 'assemble_markdown_report' && result?.markdown) {
            finalMarkdownFromTool = result.markdown;
          }

          let inputPreview = undefined;
          try {
            if (call?.inputPreview) {
              inputPreview = call.inputPreview;
            } else if (call?.args) {
              inputPreview =
                typeof call.args === 'string' ? call.args : call.args;
            }
          } catch (e) {}

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

          // Use the finalMarkdownFromTool if agent doesn't emit any response text
          // if (finalMarkdownFromTool) {
          //   emitter.emit(
          //     'data',
          //     JSON.stringify({
          //       type: 'response',
          //       data: `\n\n${finalMarkdownFromTool}`,
          //     }),
          //   );
          // }
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
