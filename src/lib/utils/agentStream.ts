import type { EventEmitter } from 'events';
import { buildToolEndSummary } from '../chat/toolSummary';
import type { PooledAgent } from '../search/shared/agent/piAgentSessionManager';

interface StreamAgentProgressOptions {
  agent: PooledAgent;
  emitter: EventEmitter;
  signal?: AbortSignal;
  safeJson?: (value: unknown) => string;
  /** Override the finished progress message (default: SFC wording for backward compat). */
  finishedMessage?: string;
  /** Called when a text_delta is streamed so callers can track hasTextResponse. */
  onTextChunk?: (delta: string) => void;
  /** When true, skip emitting tool_execution_start as tool_execution. */
  skipToolStartEvents?: boolean;
  /**
   * If the run ends with no text_delta (e.g. aborted on the turn cap after
   * tools only), emit the disclaimer plus this reply so the UI still has a
   * Result. Skipped when the user abort signal is already aborted.
   */
  emptyResponseFallback?: string;
}

export interface StreamAgentProgressResult {
  hasTextResponse: boolean;
}

const DISCLAIMER =
  '<span class="text-red-500 font-bold">AI生成的回覆可能不準確，使用前請仔細核實。</span>\n\n';

function emitJson(emitter: EventEmitter, payload: unknown) {
  let text: string;
  try {
    text = JSON.stringify(payload);
  } catch {
    text = JSON.stringify({
      type: 'response',
      data: '[unserializable event]',
    });
  }
  emitter.emit('data', `${text}\n`);
}

function toolErrorText(result: unknown): string {
  if (!result || typeof result !== 'object') return 'Tool failed';
  const rec = result as {
    content?: Array<{ text?: string }>;
    error?: unknown;
    details?: { error?: unknown };
  };
  if (typeof rec.error === 'string' && rec.error.trim()) return rec.error;
  if (typeof rec.details?.error === 'string' && rec.details.error.trim()) {
    return rec.details.error;
  }
  const text = rec.content
    ?.map((part) => part?.text ?? '')
    .join('')
    .trim();
  return text || 'Tool failed';
}

function collectSourcesFromResult(
  result: unknown,
  collectedSources: Array<{ pageContent: string; metadata: { title: string; url: string } }>,
) {
  const chunks = (result as { details?: { chunks?: unknown[] } })?.details
    ?.chunks;
  if (!Array.isArray(chunks)) return;

  for (const chunk of chunks) {
    if (!chunk || typeof chunk !== 'object') continue;
    const documentLink = (chunk as { document_link?: string }).document_link;
    if (!documentLink) continue;
    const linkMatch = documentLink.match(/href="([^"]+)"[^>]*>(.*?)<\/a>/);
    if (!linkMatch) continue;
    const url = linkMatch[1];
    const title = linkMatch[2];
    if (collectedSources.some((s) => s.metadata.url === url)) continue;
    collectedSources.push({
      pageContent: (chunk as { content?: string }).content || '',
      metadata: { title, url },
    });
  }
}

export function streamAgentProgressToEmitter(
  options: StreamAgentProgressOptions,
): Promise<StreamAgentProgressResult> {
  const {
    agent,
    emitter,
    signal,
    finishedMessage = 'SFC Kode Agent execution finished',
    onTextChunk,
    skipToolStartEvents = false,
    emptyResponseFallback,
  } = options;

  let hasEmittedWarning = false;
  let hasTextResponse = false;
  let settled = false;
  const collectedSources: Array<{
    pageContent: string;
    metadata: { title: string; url: string };
  }> = [];

  return new Promise((resolve) => {
    const finish = () => {
      if (settled) return;
      settled = true;
      unsubscribe();
      signal?.removeEventListener('abort', onAbort);

      if (
        !hasTextResponse &&
        emptyResponseFallback &&
        !signal?.aborted
      ) {
        emitJson(emitter, { type: 'response', data: DISCLAIMER });
        emitJson(emitter, { type: 'response', data: emptyResponseFallback });
        hasTextResponse = true;
      }

      if (collectedSources.length > 0) {
        emitJson(emitter, {
          type: 'sources',
          data: collectedSources,
        });
      }

      emitJson(emitter, {
        type: 'progress',
        data: {
          status: 'finished',
          total: 2,
          current: 2,
          message: finishedMessage,
        },
      });
      resolve({ hasTextResponse });
    };

    const onAbort = () => {
      try {
        agent.abort();
      } catch {
        /* ignore */
      }
      // Idle / not yet prompted: nothing to drain. During a run, wait for
      // agent_end so pi-ai streamSimple can settle like pi-rag.
      if (!agent.state.isStreaming) finish();
    };

    const unsubscribe = agent.subscribe((event) => {
      if (!event?.type) return;

      switch (event.type) {
        case 'message_update': {
          const ame = event.assistantMessageEvent;
          if (ame?.type !== 'text_delta' || typeof ame.delta !== 'string') break;
          hasTextResponse = true;
          onTextChunk?.(ame.delta);
          if (!hasEmittedWarning) {
            emitJson(emitter, { type: 'response', data: DISCLAIMER });
            hasEmittedWarning = true;
          }
          emitJson(emitter, { type: 'response', data: ame.delta });
          break;
        }
        case 'tool_execution_start': {
          if (skipToolStartEvents) break;
          emitJson(emitter, {
            type: 'tool_execution',
            data: {
              id: event.toolCallId,
              name: event.toolName,
              state: 'RUNNING',
              inputPreview: event.args,
            },
          });
          break;
        }
        case 'tool_execution_end': {
          if (event.isError) {
            emitJson(emitter, {
              type: 'tool_error',
              data: {
                id: event.toolCallId,
                name: event.toolName,
                state: 'FAILED',
                error: toolErrorText(event.result),
              },
            });
            break;
          }
          collectSourcesFromResult(event.result, collectedSources);
          const { summary } = buildToolEndSummary(
            event.toolName,
            event.result,
            false,
          );
          emitJson(emitter, {
            type: 'tool_execution',
            data: {
              id: event.toolCallId,
              name: event.toolName,
              state: 'COMPLETED',
              inputPreview: event.args,
              summary,
              resultPreview: event.result?.details ?? event.result,
            },
          });
          break;
        }
        case 'agent_end':
          finish();
          break;
        default:
          break;
      }
    });

    if (signal) {
      if (signal.aborted) {
        onAbort();
        return;
      }
      signal.addEventListener('abort', onAbort);
    }
  });
}
