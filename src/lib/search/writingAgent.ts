import '../utils/shared/load-env';

import { BaseMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import eventEmitter from 'events';
import { MetaSearchAgentType } from './metaSearchAgent';
import { formatAgentFailureResponse } from '../models/llmProviderError';
import { streamAgentProgressToEmitter } from '../utils/agentStream';
import { getSharedAgentContext } from './shared/agent/getSharedAgentContext';
import {
  buildWritingUserPrompt,
  writingFsToolsForTurn,
} from './shared/prompts/writingTurnPrefix';
import { bindTurnFsTools } from './shared/runtime/bindTurnFsTools';
import { getWritingTurnContext } from './shared/runtime/writingTurnContext';
import { safeJson } from './shared/utils/safeJson';

export default class WritingAgent implements MetaSearchAgentType {
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
    const emitEndOnce = () => {
      if (hasEnded) return;
      hasEnded = true;
      emitter.emit('end');
    };

    (async () => {
      const writingCtx = getWritingTurnContext();
      try {
        if (signal?.aborted) return;

        emitter.emit(
          'data',
          `${JSON.stringify({
            type: 'progress',
            data: {
              status: 'processing',
              total: 2,
              current: 1,
              question: 'Initializing Writing Agent',
              message: 'Initializing Writing Kode Agent...',
            },
          })}\n`,
        );
        const { manager: harnessAgentManager } = getSharedAgentContext();

        const requestAgentId =
          req?.headers.get('x-agent-id') ??
          req?.headers.get('x-chat-id') ??
          undefined;

        const stableAgentId =
          harnessAgentManager.normalizeAgentId(requestAgentId);

        const fsTools = writingFsToolsForTurn(message, writingCtx);
        const agent = await harnessAgentManager.getOrCreateAgent(
          stableAgentId,
          fsTools,
          'writing-agent-template',
        );

        harnessAgentManager.markBusy(stableAgentId);
        harnessAgentManager.touchAgent(stableAgentId);
        const restoreFs = bindTurnFsTools(
          agent,
          fsTools.length > 0 ? { writing: writingCtx } : {},
        );

        try {
          const subscriptionPromise = streamAgentProgressToEmitter({
            agent,
            emitter,
            signal,
            safeJson,
          });

          if (signal?.aborted) {
            try {
              agent.abort();
            } catch {
              /* ignore */
            }
          } else {
            await agent.prompt(buildWritingUserPrompt(message, writingCtx));
          }
          await subscriptionPromise;
        } finally {
          restoreFs();
          await harnessAgentManager.markIdle(stableAgentId);
        }
      } catch (error: unknown) {
        console.error('-- ERROR IN WRITING AGENT --', error);
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        emitter.emit(
          'data',
          JSON.stringify({
            type: 'response',
            data: formatAgentFailureResponse(error),
          }),
        );
      } finally {
        emitEndOnce();
      }
    })();

    return emitter;
  }
}
