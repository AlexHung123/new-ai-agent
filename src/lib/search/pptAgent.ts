import '../utils/shared/load-env';

import { BaseMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import eventEmitter from 'events';
import { MetaSearchAgentType } from './metaSearchAgent';
import { streamAgentProgressToEmitter } from '../utils/agentStream';
import { getSharedAgentContext } from './shared/agent/getSharedAgentContext';
import { buildPptUserPrompt } from './shared/prompts/pptTurnPrefix';
import { bindTurnFsTools } from './shared/runtime/bindTurnFsTools';
import { bindTurnPptTools } from './shared/runtime/bindTurnPptTools';
import { getWritingTurnContext } from './shared/runtime/writingTurnContext';
import { safeJson } from './shared/utils/safeJson';
import { PPT_TOOL_NAMES } from '../ppt/stage';
import { loadPptDeck } from '../ppt/store';
import { emptyPptDeck } from '../ppt/types';

const PPT_TOOLS = ['fs_ls', 'fs_read', 'fs_grep', 'fs_find', ...PPT_TOOL_NAMES];

export default class PptAgent implements MetaSearchAgentType {
  async searchAndAnswer(
    message: string,
    _history: BaseMessage[],
    _llm: BaseChatModel,
    _embeddings: Embeddings,
    _optimizationMode: 'speed' | 'balanced' | 'quality',
    _fileIds: string[],
    _systemInstructions: string,
    signal?: AbortSignal,
    _sfcExactMatch?: boolean,
    _sfcTrainingRelated?: boolean,
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
      const chatId =
        req?.headers.get('x-chat-id') ??
        req?.headers.get('x-agent-id') ??
        '';
      const userId = req?.headers.get('x-user-id') ?? writingCtx?.userId ?? '';
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
              question: 'Preparing PPT agent',
              message: 'Reading brief and attachments…',
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

        const agent = await harnessAgentManager.getOrCreateAgent(
          stableAgentId,
          PPT_TOOLS,
          'ppt-agent-template',
        );

        harnessAgentManager.markBusy(stableAgentId);
        harnessAgentManager.touchAgent(stableAgentId);

        const pptTurn = {
          chatId,
          userId,
          emit: (payload: { deck: unknown }) => {
            emitter.emit(
              'data',
              `${JSON.stringify({ type: 'ppt', data: payload })}\n`,
            );
          },
        };
        const restorePpt = bindTurnPptTools(agent, pptTurn);
        const restoreFs = bindTurnFsTools(agent, { writing: writingCtx });

        try {
          const subscriptionPromise = streamAgentProgressToEmitter({
            agent,
            emitter,
            signal,
            safeJson,
            finishedMessage: 'PPT agent finished',
          });

          const deck =
            chatId && userId
              ? await loadPptDeck(chatId, userId)
              : emptyPptDeck();

          if (signal?.aborted) {
            try {
              agent.abort();
            } catch {
              /* ignore */
            }
          } else {
            await agent.prompt(buildPptUserPrompt(message, deck, writingCtx));
          }
          await subscriptionPromise;
        } finally {
          restorePpt();
          restoreFs();
          await harnessAgentManager.markIdle(stableAgentId);
        }
      } catch (error: unknown) {
        console.error('-- ERROR IN PPT AGENT --', error);
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
