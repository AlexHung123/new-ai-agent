import '../utils/shared/load-env';

import { BaseMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import eventEmitter from 'events';
import { MetaSearchAgentType } from './metaSearchAgent';
import { formatAgentFailureResponse } from '../models/llmProviderError';
import { streamAgentProgressToEmitter } from '../utils/agentStream';
import { getSharedAgentContext } from './shared/agent/getSharedAgentContext';
import { safeJson } from './shared/utils/safeJson';

export default class NewSfcAgent implements MetaSearchAgentType {
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
    const emitJsonLine = (payload: unknown) => {
      emitter.emit('data', `${safeJson(payload)}\n`);
    };
    // console.log('\n[SFC Agent] searchAndAnswer called with message:', message);
    const emitEndOnce = () => {
      if (hasEnded) return;
      hasEnded = true;
      emitter.emit('end');
    };

    (async () => {
      try {
        if (signal?.aborted) return;

        emitJsonLine({
          type: 'progress',
          data: {
            status: 'processing',
            total: 2,
            current: 1,
            question: 'Initializing SFC Agent',
            message: 'Initializing SFC Kode Agent...',
          },
        });
        const { manager: harnessAgentManager } = getSharedAgentContext();

        const requestAgentId =
          req?.headers.get('x-agent-id') ??
          req?.headers.get('x-chat-id') ??
          undefined;

        const stableAgentId =
          harnessAgentManager.normalizeAgentId(requestAgentId);
        const agent = await harnessAgentManager.getOrCreateAgent(
          stableAgentId,
          ['es_bm25_search'],
          'rag-base-template' // Explicitly specify the template
        );

        harnessAgentManager.markBusy(stableAgentId);
        harnessAgentManager.touchAgent(stableAgentId);

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
            await agent.prompt(message);
          }
          await subscriptionPromise;
        } finally {
          await harnessAgentManager.markIdle(stableAgentId);
        }
      } catch (error: unknown) {
        console.error('-- ERROR IN SFC AGENT --', error);
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        emitJsonLine({
          type: 'response',
          data: formatAgentFailureResponse(error),
        });
      } finally {
        emitEndOnce();
      }
    })();

    return emitter;
  }
}
