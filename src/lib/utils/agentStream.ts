import type { Agent } from '@shareai-lab/kode-sdk/dist/core/agent';
import eventEmitter from 'events';

interface StreamAgentProgressOptions {
  agent: any;
  emitter: eventEmitter;
  signal?: AbortSignal;
  progressBookmarkByAgent: WeakMap<Agent, string>;
  safeJson: (value: unknown) => string;
  /** Override the finished progress message (default: SFC wording for backward compat). */
  finishedMessage?: string;
  /** Called when a text_chunk is streamed so callers can track hasTextResponse. */
  onTextChunk?: (delta: string) => void;
  /** When true, skip emitting tool:start as tool_execution (caller handles tool events). */
  skipToolStartEvents?: boolean;
}

export interface StreamAgentProgressResult {
  hasTextResponse: boolean;
}

export async function streamAgentProgressToEmitter(
  options: StreamAgentProgressOptions,
): Promise<StreamAgentProgressResult> {
  const {
    agent,
    emitter,
    signal,
    progressBookmarkByAgent,
    finishedMessage = 'SFC Kode Agent execution finished',
    onTextChunk,
    skipToolStartEvents = false,
  } = options;

  let lastBookmark = progressBookmarkByAgent.get(agent as Agent);
  let hasEmittedWarning = false;
  let hasTextResponse = false;
  const collectedSources: any[] = [];

  for await (const envelope of agent.subscribe(['progress'], {
    since: lastBookmark,
  }) as AsyncIterable<any>) {
    if (signal?.aborted) break;
    if (!envelope?.event) continue;
    lastBookmark = envelope.bookmark ?? lastBookmark;

    const event = envelope.event;

    switch (event.type) {
      case 'text_chunk':
        hasTextResponse = true;
        onTextChunk?.(event.delta ?? '');
        if (!hasEmittedWarning) {
          // Emit the warning message before the first text chunk
          emitter.emit(
            'data',
            JSON.stringify({
              type: 'response',
              data: '<span class="text-red-500 font-bold">AI生成的回覆可能不準確，使用前請仔細核實。</span>\n\n',
            }),
          );
          hasEmittedWarning = true;
        }
        emitter.emit(
          'data',
          JSON.stringify({ type: 'response', data: event.delta }),
        );
        break;
      case 'tool:start': {
        if (skipToolStartEvents) break;

        emitter.emit(
          'data',
          JSON.stringify({
            type: 'tool_execution',
            data: {
              id: event.call.id,
              name: event.call.name,
              description: event.call.description,
              state: 'RUNNING',
              inputPreview: event.call.inputPreview || event.call.args,
            },
          }),
        );
        break;
      }
      case 'tool:end':
        if (
          event.call?.result?.chunks &&
          Array.isArray(event.call.result.chunks)
        ) {
          event.call.result.chunks.forEach((chunk: any) => {
            if (chunk.document_link) {
              // Extract URL and Title from anchor tag (e.g. <a href="URL"...>TITLE</a>)
              const linkMatch = chunk.document_link.match(
                /href="([^"]+)"[^>]*>(.*?)<\/a>/,
              );
              if (linkMatch) {
                const url = linkMatch[1];
                const title = linkMatch[2];
                // Deduplicate by URL
                if (!collectedSources.some((s) => s.metadata.url === url)) {
                  collectedSources.push({
                    pageContent: chunk.content || '',
                    metadata: { title, url },
                  });
                }
              }
            }
          });
        }
        break;
      case 'tool:error':
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

        if (collectedSources.length > 0) {
          emitter.emit(
            'data',
            JSON.stringify({
              type: 'sources',
              data: collectedSources,
            }),
          );
        }

        emitter.emit(
          'data',
          JSON.stringify({
            type: 'progress',
            data: {
              status: 'finished',
              total: 2,
              current: 2,
              message: finishedMessage,
            },
          }),
        );
        return { hasTextResponse };
    }
  }

  if (lastBookmark) {
    progressBookmarkByAgent.set(agent as Agent, lastBookmark);
  }

  return { hasTextResponse };
}
