import '../utils/shared/load-env';

import { BaseMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import eventEmitter from 'events';
import { MetaSearchAgentType } from './metaSearchAgent';
import { streamAgentProgressToEmitter } from '../utils/agentStream';
import { getSharedAgentContext } from './shared/agent/getSharedAgentContext';
import { READING_AGENT_EMPTY_REPLY } from './shared/prompts/readingAgentSystemPrompt';
import { buildReadingUserPrompt } from './shared/prompts/readingTurnPrefix';
import { bindTurnFsTools } from './shared/runtime/bindTurnFsTools';
import { getReadingTurnContext } from './shared/runtime/readingTurnContext';
import { safeJson } from './shared/utils/safeJson';

const FS_TOOLS = ['fs_ls', 'fs_read', 'fs_grep', 'fs_find'];

export default class ReaderAgent implements MetaSearchAgentType {
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
      const readingCtx = getReadingTurnContext();
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
              question: 'Initializing Reader Agent',
              message: 'Opening the bound PDF…',
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
          FS_TOOLS,
          'reader-agent-template',
        );

        harnessAgentManager.markBusy(stableAgentId);
        harnessAgentManager.touchAgent(stableAgentId);
        const restoreFs = bindTurnFsTools(agent, { reading: readingCtx });

        try {
          const subscriptionPromise = streamAgentProgressToEmitter({
            agent,
            emitter,
            signal,
            safeJson,
            emptyResponseFallback: READING_AGENT_EMPTY_REPLY,
          });

          if (signal?.aborted) {
            try {
              agent.abort();
            } catch {
              /* ignore */
            }
          } else {
            await agent.prompt(buildReadingUserPrompt(message, readingCtx));
          }
          await subscriptionPromise;
        } finally {
          restoreFs();
          await harnessAgentManager.markIdle(stableAgentId);
        }
      } catch (error: unknown) {
        console.error('-- ERROR IN READER AGENT --', error);
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
