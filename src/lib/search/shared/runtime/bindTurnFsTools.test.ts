import { describe, expect, it } from 'vitest';
import { bindTurnFsTools } from './bindTurnFsTools';
import { getWritingTurnContext } from './writingTurnContext';
import { getDocumentTurnContext } from './documentTurnContext';
import { getReadingTurnContext } from './readingTurnContext';
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
  it('re-enters writing context during fs_read after the outer turn is gone', async () => {
    let seen: string | undefined;
    const agent = fakeAgent([
      {
        name: 'fs_read',
        execute: async () => {
          seen = getWritingTurnContext()?.rootAbs;
          return { ok: true };
        },
      } as PooledAgent['state']['tools'][number],
    ]);

    const restore = bindTurnFsTools(agent, {
      writing: { userId: 'u1', rootAbs: '/tmp/writing-root', files: [] },
    });
    expect(getWritingTurnContext()).toBeUndefined();

    const wrapped = agent.state.tools[0] as {
      execute: () => Promise<unknown>;
    };
    await wrapped.execute();
    expect(seen).toBe('/tmp/writing-root');

    restore();
    const original = agent.state.tools[0] as {
      execute: () => Promise<unknown>;
    };
    seen = 'unset';
    await original.execute();
    expect(seen).toBeUndefined();
  });

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

  it('overlays writing fs_read schema only on writing turns', () => {
    const agent = fakeAgent([
      {
        name: 'fs_read',
        description: 'base read',
        execute: async () => ({ ok: true }),
      } as PooledAgent['state']['tools'][number],
    ]);

    bindTurnFsTools(agent, {
      writing: { userId: 'u1', rootAbs: '/tmp/writing-root', files: [] },
    });
    expect(
      (agent.state.tools[0] as { description?: string }).description,
    ).toMatch(/fromLine/);

    const docAgent = fakeAgent([
      {
        name: 'fs_read',
        description: 'base read',
        execute: async () => ({ ok: true }),
      } as PooledAgent['state']['tools'][number],
    ]);
    bindTurnFsTools(docAgent, {
      document: { id: 'spr', title: 'SPR', rootAbs: '/tmp/spr' },
    });
    expect(
      (docAgent.state.tools[0] as { description?: string }).description,
    ).toBe('base read');
  });

  it('re-enters reading context during fs_grep', async () => {
    let seen: string | undefined;
    const agent = fakeAgent([
      {
        name: 'fs_grep',
        execute: async () => {
          seen = getReadingTurnContext()?.rootAbs;
          return { ok: true };
        },
      } as PooledAgent['state']['tools'][number],
    ]);

    bindTurnFsTools(agent, {
      reading: {
        userId: 'u1',
        fileId: 'f1',
        title: 'paper.pdf',
        rootAbs: '/tmp/reading-root',
        status: 'ready',
      },
    });
    const wrapped = agent.state.tools[0] as {
      execute: () => Promise<unknown>;
    };
    await wrapped.execute();
    expect(seen).toBe('/tmp/reading-root');
  });
});
