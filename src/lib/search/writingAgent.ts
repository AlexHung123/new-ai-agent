import '../utils/shared/load-env';

import { BaseMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import eventEmitter from 'events';
import { MetaSearchAgentType } from './metaSearchAgent';
import { formatAgentFailureResponse } from '../models/llmProviderError';
import { streamAgentProgressToEmitter } from '../utils/agentStream';
import { getSharedAgentContext } from './shared/agent/getSharedAgentContext';
import { promptWithImages } from '@/lib/chat/attachedImages';
import { getTurnImages } from '@/lib/chat/turnImages';
import {
  buildWritingUserPrompt,
  writingToolsForTurn,
} from './shared/prompts/writingTurnPrefix';
import { bindTurnDochubTools } from './shared/runtime/bindTurnDochubTools';
import { bindTurnFsTools } from './shared/runtime/bindTurnFsTools';
import { stripHtmlTurnPrefixesFromMessages } from '@/lib/html/htmlSkill';
import { WRITING_AGENT_EMPTY_REPLY } from './shared/prompts/writingAgentSystemPrompt';
import {
  getWritingTurnContext,
  writingSearchScopes,
  writingTurnScopes,
  writingWikiScopes,
} from './shared/runtime/writingTurnContext';
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
      const turnImages = getTurnImages();
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
              question: 'Initializing Knowledge Agent',
              message: 'Initializing Knowledge Agent...',
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

        const tools = writingToolsForTurn(writingCtx);
        const agent = await harnessAgentManager.getOrCreateAgent(
          stableAgentId,
          tools,
          'writing-agent-template',
        );

        harnessAgentManager.markBusy(stableAgentId);
        harnessAgentManager.touchAgent(stableAgentId);
        agent.state.messages = stripHtmlTurnPrefixesFromMessages(
          agent.state.messages ?? [],
        );
        const localWikis = writingWikiScopes(writingCtx).filter(
          (scope) => scope.wikiRootAbs,
        );
        const onlyLocalWiki =
          Boolean(writingCtx) &&
          ((writingCtx?.retrievalMode === 'wiki' &&
            Boolean(writingCtx.wikiRootAbs) &&
            writingTurnScopes(writingCtx).length <= 1) ||
            (localWikis.length === 1 &&
              writingSearchScopes(writingCtx).length === 0 &&
              writingWikiScopes(writingCtx).every((scope) => scope.wikiRootAbs) &&
              writingCtx!.mentionedDocuments.length === 0));
        const restoreFs =
          writingCtx && localWikis.length === 1 && localWikis[0].wikiRootAbs
            ? bindTurnFsTools(agent, {
                document: {
                  id: localWikis[0].path || writingCtx.pin || 'folder',
                  title:
                    localWikis[0].wikiTitle ||
                    localWikis[0].path ||
                    writingCtx.wikiTitle ||
                    writingCtx.pin ||
                    'bound folder',
                  rootAbs: localWikis[0].wikiRootAbs,
                },
              })
            : writingCtx?.retrievalMode === 'wiki' && writingCtx.wikiRootAbs
              ? bindTurnFsTools(agent, {
                  document: {
                    id: writingCtx.pin || 'folder',
                    title: writingCtx.wikiTitle || writingCtx.pin || 'bound folder',
                    rootAbs: writingCtx.wikiRootAbs,
                  },
                })
              : () => undefined;
        const restoreDochub =
          writingCtx && !onlyLocalWiki
            ? bindTurnDochubTools(agent, writingCtx)
            : () => undefined;
        const restoreTools = () => {
          restoreDochub();
          restoreFs();
        };
        try {
          const subscriptionPromise = streamAgentProgressToEmitter({
            agent,
            emitter,
            signal,
            safeJson,
            emptyResponseFallback: WRITING_AGENT_EMPTY_REPLY,
          });

          if (signal?.aborted) {
            try {
              agent.abort();
            } catch {
              /* ignore */
            }
          } else {
            const prompt = promptWithImages(
              buildWritingUserPrompt(message, writingCtx),
              turnImages,
              'agentKnowledge',
            );
            await agent.prompt(prompt.text, prompt.images);
          }
          await subscriptionPromise;
        } finally {
          restoreTools();
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
