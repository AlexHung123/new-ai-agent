import { describe, expect, it } from 'vitest';
import { completePiAgent } from './completePiAgent';
import type { PooledAgent } from './piAgentSessionManager';

function createStreamingAgent(deltas: string[]): PooledAgent {
  const listeners = new Set<(event: any, signal?: AbortSignal) => void>();

  return {
    state: {
      systemPrompt: '',
      tools: [],
      messages: [],
      isStreaming: false,
    },
    async prompt() {
      for (const delta of deltas) {
        for (const listener of listeners) {
          listener({
            type: 'message_update',
            assistantMessageEvent: { type: 'text_delta', delta },
          });
        }
      }
      for (const listener of listeners) {
        listener({ type: 'agent_end' });
      }
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    abort() {},
    async waitForIdle() {},
  };
}

describe('completePiAgent', () => {
  it('collects streamed assistant text from prompt()', async () => {
    const agent = createStreamingAgent(['hel', 'lo']);
    const result = await completePiAgent(agent, 'hi');
    expect(result).toEqual({ status: 'ok', text: 'hello' });
  });

  it('returns empty text when the model streams nothing', async () => {
    const agent = createStreamingAgent([]);
    const result = await completePiAgent(agent, 'hi');
    expect(result).toEqual({ status: 'ok', text: '' });
  });

  it('aborts the pi-ai run and returns partial text', async () => {
    const listeners = new Set<(event: any, signal?: AbortSignal) => void>();
    let abortCalls = 0;
    let releasePrompt: (() => void) | undefined;
    const agent: PooledAgent = {
      state: {
        systemPrompt: '',
        tools: [],
        messages: [],
        isStreaming: true,
      },
      async prompt() {
        for (const listener of listeners) {
          listener({
            type: 'message_update',
            assistantMessageEvent: { type: 'text_delta', delta: 'hel' },
          });
        }
        await new Promise<void>((resolve) => {
          releasePrompt = resolve;
        });
      },
      subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      abort() {
        abortCalls += 1;
        releasePrompt?.();
      },
      async waitForIdle() {},
    };

    const ac = new AbortController();
    const pending = completePiAgent(agent, 'hi', ac.signal);
    await Promise.resolve();
    ac.abort();
    const result = await pending;

    expect(abortCalls).toBe(1);
    expect(result).toEqual({ status: 'aborted', text: 'hel' });
  });
});
