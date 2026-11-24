import { describe, expect, it } from 'vitest';
import { bindTurnDochubTools } from './bindTurnDochubTools';
import { getWritingTurnContext } from './writingTurnContext';
import type { PooledAgent } from '../agent/piAgentSessionManager';

function fakeAgent(tools: PooledAgent['state']['tools']): PooledAgent {
  let current = tools;
  return {
    state: {
      systemPrompt: '',
      get tools() {
        return current;
      },
      set tools(next) {
        current = [...next];
      },
      messages: [],
      isStreaming: false,
    },
    prompt: async () => undefined,
    subscribe: () => () => undefined,
    abort: () => undefined,
    waitForIdle: async () => undefined,
  };
}

describe('bindTurnDochubTools', () => {
  it('re-enters writing context during search after the outer turn is gone', async () => {
    let seen: string | undefined;
    const agent = fakeAgent([
      {
        name: 'search',
        execute: async () => {
          seen = getWritingTurnContext()?.userId;
          return { ok: true };
        },
      } as PooledAgent['state']['tools'][number],
    ]);
    const restore = bindTurnDochubTools(agent, {
      userId: '1',
      pin: null,
      mentionedDocuments: [],
      tree: null,
    });
    expect(getWritingTurnContext()).toBeUndefined();
    await (agent.state.tools[0] as { execute: () => Promise<unknown> }).execute();
    expect(seen).toBe('1');
    restore();
  });
});
