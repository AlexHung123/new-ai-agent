import '../utils/shared/load-env';

import { BaseMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import eventEmitter from 'events';
import { MetaSearchAgentType } from './metaSearchAgent';
import { streamAgentProgressToEmitter } from '../utils/agentStream';
import { getSharedAgentContext } from './shared/agent/getSharedAgentContext';
import { DOCUMENT_AGENT_EMPTY_REPLY } from './shared/prompts/documentAgentSystemPrompt';
import { buildDocumentUserPrompt } from './shared/prompts/documentTurnPrefix';
import { bindTurnFsTools } from './shared/runtime/bindTurnFsTools';
import { getDocumentTurnContext } from './shared/runtime/documentTurnContext';
import { safeJson } from './shared/utils/safeJson';

const FS_TOOLS = ['fs_ls', 'fs_read', 'fs_grep', 'fs_find'];

export default class DocumentAgent implements MetaSearchAgentType {
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
      const documentCtx = getDocumentTurnContext();
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
              question: 'Initializing Document Agent',
              message: 'Initializing Document Agent...',
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
          'document-agent-template',
        );

        harnessAgentManager.markBusy(stableAgentId);
        harnessAgentManager.touchAgent(stableAgentId);
        const restoreFs = bindTurnFsTools(agent, { document: documentCtx });

        try {
          const subscriptionPromise = streamAgentProgressToEmitter({
            agent,
            emitter,
            signal,
            safeJson,
            emptyResponseFallback: DOCUMENT_AGENT_EMPTY_REPLY,
          });

          if (signal?.aborted) {
            try {
              agent.abort();
            } catch {
              /* ignore */
            }
          } else {
            await agent.prompt(buildDocumentUserPrompt(message, documentCtx));
          }
          await subscriptionPromise;
        } finally {
          restoreFs();
          await harnessAgentManager.markIdle(stableAgentId);
        }
      } catch (error: unknown) {
        console.error('-- ERROR IN DOCUMENT AGENT --', error);
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
