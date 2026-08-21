import { assistantContentAfterAbort } from '../../../chat/abortedReply';
import type { PooledAgent } from './piAgentSessionManager';

export type CompletePiAgentResult = {
  status: string;
  text: string;
};

function textFromEvent(event: any): string {
  const delta = event?.assistantMessageEvent;
  if (delta?.type === 'text_delta' && typeof delta.delta === 'string') {
    return delta.delta;
  }
  return '';
}

function textFromMessage(message: unknown): string {
  if (!message || typeof message !== 'object') return '';
  const content = (message as { content?: unknown }).content;
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .map((part) => {
      if (typeof part === 'string') return part;
      if (part && typeof part === 'object' && 'text' in part) {
        return String((part as { text?: unknown }).text ?? '');
      }
      return '';
    })
    .join('');
}

export async function completePiAgent(
  agent: PooledAgent,
  input: string,
  signal?: AbortSignal,
): Promise<CompletePiAgentResult> {
  let text = '';

  const onAbort = () => {
    try {
      agent.abort();
    } catch {
      /* ignore */
    }
  };
  if (signal?.aborted) onAbort();
  signal?.addEventListener('abort', onAbort);

  const unsubscribe = agent.subscribe((event) => {
    if (event?.type === 'message_update') {
      text += textFromEvent(event);
    } else if (event?.type === 'message_end' && !text) {
      text = textFromMessage(event.message);
    }
  });

  try {
    await agent.prompt(input);
    await agent.waitForIdle();
    if (signal?.aborted) {
      return { status: 'aborted', text: assistantContentAfterAbort(text) };
    }
    return { status: 'ok', text };
  } catch (error) {
    if (signal?.aborted) {
      try {
        await agent.waitForIdle();
      } catch {
        /* ignore */
      }
      return { status: 'aborted', text: assistantContentAfterAbort(text) };
    }
    throw error;
  } finally {
    unsubscribe();
    signal?.removeEventListener('abort', onAbort);
  }
}
