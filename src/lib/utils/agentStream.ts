import type { Agent } from '@shareai-lab/kode-sdk/dist/core/agent';
import eventEmitter from 'events';

interface StreamAgentProgressOptions {
  agent: any;
  emitter: eventEmitter;
  signal?: AbortSignal;
  progressBookmarkByAgent: WeakMap<Agent, string>;
  safeJson: (value: unknown) => string;
}

export async function streamAgentProgressToEmitter(
  options: StreamAgentProgressOptions,
): Promise<void> {
  const { agent, emitter, signal, progressBookmarkByAgent, safeJson } = options;

  let lastBookmark = progressBookmarkByAgent.get(agent as Agent);

  for await (const envelope of agent.subscribe(['progress'], {
    since: lastBookmark,
  }) as AsyncIterable<any>) {
    if (signal?.aborted) break;
    if (!envelope?.event) continue;
    lastBookmark = envelope.bookmark ?? lastBookmark;

    const event = envelope.event;

    switch (event.type) {
      case 'text_chunk':
        emitter.emit(
          'data',
          JSON.stringify({ type: 'response', data: event.delta }),
        );
        break;
      case 'tool:start':
        // console.log('\n[progress:tool:start]');
        // console.log(
        //   safeJson({
        //     id: event.call.id,
        //     name: event.call.name,
        //     inputPreview: event.call.inputPreview || event.call.args,
        //   }),
        // );
        emitter.emit(
          'data',
          JSON.stringify({
            type: 'tool_execution',
            data: {
              id: event.call.id,
              name: event.call.name,
              state: 'RUNNING',
              inputPreview: event.call.inputPreview || event.call.args,
            },
          }),
        );
        break;
      case 'tool:end':
        break;
      case 'tool:error':
        // console.error('\n[progress:tool:error]');
        // console.error(
        //   safeJson({
        //     id: event.call.id,
        //     name: event.call.name,
        //     state: event.call.state,
        //     error: event.error,
        //   }),
        // );
        emitter.emit(
          'data',
          JSON.stringify({
            type: 'tool_error',
            data: {
              id: event.call.id,
              name: event.call.name,
              state: event.call.state, // e.g., 'FAILED'
              error: event.error,
              inputPreview: event.call.inputPreview || event.call.args,
            },
          }),
        );
        break;
      case 'done':
        if (lastBookmark) {
          progressBookmarkByAgent.set(agent as Agent, lastBookmark);
        }
        emitter.emit(
          'data',
          JSON.stringify({
            type: 'progress',
            data: {
              status: 'finished',
              total: 2,
              current: 2,
              message: 'SFC Kode Agent execution finished',
            },
          }),
        );
        return;
    }
  }

  if (lastBookmark) {
    progressBookmarkByAgent.set(agent as Agent, lastBookmark);
  }
}
