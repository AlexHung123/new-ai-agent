import { describe, expect, it } from 'vitest';
import type { NamedTool, PooledAgent } from '@/lib/search/shared/agent/piAgentSessionManager';
import { bindTurnHtmlTool } from './bindTurnHtmlTool';
import { getHtmlTurnContext, runWithHtmlTurn } from './htmlTurnContext';

function fakeAgent(tools: NamedTool[]): PooledAgent {
  return {
    state: {
      systemPrompt: '',
      tools,
      messages: [],
      isStreaming: false,
    },
    prompt: async () => undefined,
    subscribe: () => () => undefined,
    abort: () => undefined,
    waitForIdle: async () => undefined,
  };
}

describe('bindTurnHtmlTool', () => {
  it('strips am_render when HTML mode is off', () => {
    const agent = fakeAgent([
      { name: 'fs_read' },
      { name: 'am_render' },
    ]);
    const restore = bindTurnHtmlTool(agent);
    expect(agent.state.tools.map((t) => t.name)).toEqual(['fs_read']);
    restore();
    expect(agent.state.tools.map((t) => t.name)).toEqual([
      'fs_read',
      'am_render',
    ]);
  });

  it('keeps am_render and re-enters ALS on execute after the bind scope ends', async () => {
    const stub = {
      name: 'am_render',
      execute: async () => getHtmlTurnContext(),
    };
    const agent = fakeAgent([{ name: 'fs_read' }, stub]);
    const restore = await runWithHtmlTurn(
      { userId: '42', htmlMode: true },
      () => bindTurnHtmlTool(agent),
    );
    expect(agent.state.tools.map((t) => t.name)).toEqual([
      'fs_read',
      'am_render',
    ]);
    expect(getHtmlTurnContext()).toBeUndefined();
    const tool = agent.state.tools.find((t) => t.name === 'am_render') as unknown as {
      execute: (...args: unknown[]) => Promise<unknown>;
    };
    const ctx = await tool.execute('call-1', { draft: 'x' });
    expect(ctx).toMatchObject({ userId: '42', htmlMode: true });
    restore();
    expect(agent.state.tools).toContain(stub);
  });
});
