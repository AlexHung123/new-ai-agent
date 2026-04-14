import '../utils/shared/load-env';

import { BaseMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import eventEmitter from 'events';
import { MetaSearchAgentType } from './metaSearchAgent';
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
    console.log('\n[SFC Agent] searchAndAnswer called with message:', message);
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
              question: 'Initializing SFC Agent',
              message: 'Initializing SFC Kode Agent...',
            },
          }),
        );
    console.log('--1--');
        const { manager: harnessAgentManager, progressBookmarkByAgent } =
          getSharedAgentContext();
        console.log('--2-- getSharedAgentContext done');

        const requestAgentId =
          req?.headers.get('x-agent-id') ??
          req?.headers.get('x-chat-id') ??
          undefined;

        const stableAgentId =
          harnessAgentManager.normalizeAgentId(requestAgentId);
        console.log(`--3-- stableAgentId: ${stableAgentId}, calling getOrCreateAgent...`);
        
        const agent = await harnessAgentManager.getOrCreateAgent(stableAgentId);
        console.log('--4-- getOrCreateAgent done');
        
        harnessAgentManager.markBusy(stableAgentId);
        harnessAgentManager.touchAgent(stableAgentId);

        const onToolExecuted = (event: any) => {
          console.log(`-- tool_executed --: ${event.call.name}`);
          emitter.emit(
            'data',
            JSON.stringify({
              type: 'tool_execution',
              data: {
                id: event.call.id,
                name: event.call.name,
                state: event.call.state,
                durationMs: event.call.durationMs,
                inputPreview: event.call.inputPreview,
                resultPreview: event.call.result,
              },
            }),
          );
        };
        const disposeToolExecuted = agent.on('tool_executed', onToolExecuted);

        try {
          console.log('--5-- calling streamAgentProgressToEmitter...');
          const subscriptionPromise = streamAgentProgressToEmitter({
            agent,
            emitter,
            signal,
            progressBookmarkByAgent,
            safeJson,
          });
          console.log('--6-- streamAgentProgressToEmitter done');

          console.log('\n[SFC Agent] Sending message to agent:', agent.id || 'unknown id');
          await agent.send(message);
          console.log('--7-- agent.send done, waiting for subscriptionPromise...');
          
          await subscriptionPromise;
          console.log('--8-- subscriptionPromise resolved');
        } finally {
          harnessAgentManager.markIdle(stableAgentId);
          disposeToolExecuted();
        }
      } catch (error: unknown) {
        console.error('-- ERROR IN SFC AGENT --', error);
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
