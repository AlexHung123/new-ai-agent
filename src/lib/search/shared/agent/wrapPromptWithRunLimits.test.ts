import { describe, expect, it } from 'vitest';
import { wrapPromptWithRunLimits } from './wrapPromptWithRunLimits';

function createFakeAgent() {
  const listeners: Array<(event: { type: string }) => void> = [];
  return {
    aborted: false,
    beforeToolCall:
      undefined as
        | ((ctx: { toolCall: { name?: string }; args: unknown }) => Promise<
            { block?: boolean; reason?: string } | undefined
          >)
        | undefined,
    afterToolCall:
      undefined as
        | ((ctx: {
            toolCall: { name?: string };
            args: unknown;
            isError: boolean;
          }) => Promise<{ terminate?: boolean } | undefined>)
        | undefined,
    abort() {
      this.aborted = true;
    },
    subscribe(listener: (event: { type: string }) => void) {
      listeners.push(listener);
      return () => {
        const i = listeners.indexOf(listener);
        if (i >= 0) listeners.splice(i, 1);
      };
    },
    emit(type: string) {
      for (const listener of listeners) listener({ type });
    },
    async prompt(_input?: string) {
      this.emit('turn_start');
    },
  };
}

describe('wrapPromptWithRunLimits', () => {
  it('blocks the 31st tool call in one prompt', async () => {
    const agent = createFakeAgent();
    const outcomes: string[] = [];
    const innerPrompt = agent.prompt.bind(agent);
    agent.prompt = async () => {
      await innerPrompt();
      for (let i = 0; i < 35; i++) {
        const result = await agent.beforeToolCall!({
          toolCall: { name: 'fs_read' },
          args: { i },
        });
        if (result?.block) {
          outcomes.push('block');
          break;
        }
        outcomes.push('ok');
        await agent.afterToolCall!({
          toolCall: { name: 'fs_read' },
          args: { i },
          isError: false,
        });
      }
    };
    wrapPromptWithRunLimits(agent, {
      maxToolCalls: 30,
      maxToolFailures: 2,
      maxTurns: 25,
    });
    await agent.prompt('q');
    expect(outcomes.filter((o) => o === 'ok')).toHaveLength(30);
    expect(outcomes.at(-1)).toBe('block');
  });

  it('starts a fresh budget on the next prompt', async () => {
    const agent = createFakeAgent();
    const results: Array<{ block?: boolean } | undefined> = [];
    const innerPrompt = agent.prompt.bind(agent);
    agent.prompt = async () => {
      await innerPrompt();
      results.push(
        await agent.beforeToolCall!({
          toolCall: { name: 'fs_ls' },
          args: { path: '.' },
        }),
      );
    };
    wrapPromptWithRunLimits(agent, {
      maxToolCalls: 1,
      maxToolFailures: 2,
      maxTurns: 25,
    });
    await agent.prompt('first');
    await agent.prompt('second');
    expect(results[0]).toBeUndefined();
    expect(results[1]).toBeUndefined();
  });
});
