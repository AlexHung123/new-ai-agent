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
  IMAGE_AGENT_EMPTY_REPLY,
  IMAGE_AGENT_TOOLS,
} from './shared/prompts/imageAgentSystemPrompt';
import { getImageAgentTurnContext } from './shared/runtime/imageAgentTurnContext';
import { safeJson } from './shared/utils/safeJson';
import { GENERATED_IMAGE_EVENT_TYPE } from '@/lib/image/generatedImageEvent';

export default class ImageAgent implements MetaSearchAgentType {
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
      const imageCtx = getImageAgentTurnContext();
      if (imageCtx) {
        imageCtx.emitImage = (event) => {
          emitter.emit(
            'data',
            JSON.stringify({
              type: GENERATED_IMAGE_EVENT_TYPE,
              data: event,
            }),
          );
        };
        if (!imageCtx.signal && signal) {
          imageCtx.signal = signal;
        }
      }
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
              question: 'Initializing Image Agent',
              message: 'Initializing Image Agent...',
            },
          }),
        );
        const { manager: harnessAgentManager } = getSharedAgentContext();

        const requestAgentId =
          req?.headers.get('x-agent-id') ??
          req?.headers.get('x-chat-id') ??
          undefined;

        const stableAgentId =
          harnessAgentManager.normalizeAgentId(requestAgentId);

        const agent = await harnessAgentManager.getOrCreateAgent(
          stableAgentId,
          IMAGE_AGENT_TOOLS,
          'image-agent-template',
        );

        harnessAgentManager.markBusy(stableAgentId);
        harnessAgentManager.touchAgent(stableAgentId);

        try {
          const subscriptionPromise = streamAgentProgressToEmitter({
            agent,
            emitter,
            signal,
            safeJson,
            emptyResponseFallback: IMAGE_AGENT_EMPTY_REPLY,
            finishedMessage: 'Image Agent execution finished',
          });

          if (signal?.aborted) {
            try {
              agent.abort();
            } catch {
              /* ignore */
            }
          } else {
            await agent.prompt(message);
          }
          await subscriptionPromise;
        } finally {
          await harnessAgentManager.markIdle(stableAgentId);
        }
      } catch (error: unknown) {
        console.error('-- ERROR IN IMAGE AGENT --', error);
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
