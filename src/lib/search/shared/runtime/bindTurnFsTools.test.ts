import { describe, expect, it } from 'vitest';
import { bindTurnFsTools } from './bindTurnFsTools';
import { getDocumentTurnContext } from './documentTurnContext';
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

describe('bindTurnFsTools', () => {
  it('re-enters document context during fs_ls', async () => {
    let seen: string | undefined;
    const agent = fakeAgent([
      {
        name: 'fs_ls',
        execute: async () => {
          seen = getDocumentTurnContext()?.rootAbs;
          return { ok: true };
        },
      } as PooledAgent['state']['tools'][number],
    ]);

    bindTurnFsTools(agent, {
      document: { id: 'spr', title: 'SPR', rootAbs: '/tmp/spr' },
    });
    const wrapped = agent.state.tools[0] as {
      execute: () => Promise<unknown>;
    };
    await wrapped.execute();
    expect(seen).toBe('/tmp/spr');
  });
});
