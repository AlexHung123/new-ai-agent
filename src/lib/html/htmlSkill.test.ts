import { describe, expect, it } from 'vitest';
import type { NamedTool, PooledAgent } from '@/lib/search/shared/agent/piAgentSessionManager';
import { bindTurnHtmlTool } from './bindTurnHtmlTool';
import {
  HTML_SKILL_HEADING,
  stripHtmlTurnPrefixFromUserText,
  withHtmlSkillSystemPrompt,
} from './htmlSkill';
import { runWithHtmlTurn } from './htmlTurnContext';

function fakeAgent(
  tools: NamedTool[],
  extra?: { systemPrompt?: string; messages?: unknown[] },
): PooledAgent {
  return {
    state: {
      systemPrompt: extra?.systemPrompt ?? 'You are a writing assistant.',
      tools,
      messages: extra?.messages ?? [],
      isStreaming: false,
    },
    prompt: async () => undefined,
    subscribe: () => () => undefined,
    abort: () => undefined,
    waitForIdle: async () => undefined,
  };
}

describe('HTML explainer skill', () => {
  it('appends the skill to the system prompt', () => {
    const out = withHtmlSkillSystemPrompt('You are a writing assistant.');
    expect(out.startsWith('You are a writing assistant.')).toBe(true);
    expect(out).toContain(HTML_SKILL_HEADING);
    expect(out).toMatch(/am_render/);
    expect(withHtmlSkillSystemPrompt(out)).toBe(out);
  });

  it('strips leftover HTML turn prefixes from user text', () => {
    expect(
      stripHtmlTurnPrefixFromUserText(
        '[HTML mode]\nCall am_render.\n\n[User request]\nhello',
      ),
    ).toBe('[User request]\nhello');
    expect(
      stripHtmlTurnPrefixFromUserText(
        '[Plain text]\nDo not call am_render.\n\n[User request]\nhello',
      ),
    ).toBe('[User request]\nhello');
    expect(
      stripHtmlTurnPrefixFromUserText(
        '[HTML explainer skill]\nCall am_render.\n\n[User request]\nhello',
      ),
    ).toBe('[User request]\nhello');
  });

  it('injects the skill and am_render only while HTML is tagged', async () => {
    const agent = fakeAgent([{ name: 'fs_read' }]);
    const restore = await runWithHtmlTurn({ userId: '1', htmlMode: true }, () =>
      bindTurnHtmlTool(agent),
    );
    expect(agent.state.systemPrompt).toContain(HTML_SKILL_HEADING);
    expect(agent.state.tools.map((t) => t.name)).toEqual([
      'fs_read',
      'am_render',
    ]);
    restore();
    expect(agent.state.systemPrompt).toBe('You are a writing assistant.');
    expect(agent.state.tools.map((t) => t.name)).toEqual(['fs_read']);
  });

  it('does not inject the skill when HTML is untagged and strips old prefixes', () => {
    const agent = fakeAgent([{ name: 'fs_read' }, { name: 'am_render' }], {
      messages: [
        {
          role: 'user',
          content:
            '[HTML mode]\nCall am_render.\n\n[User request]\nhello',
        },
      ],
    });
    const restore = bindTurnHtmlTool(agent);
    expect(agent.state.systemPrompt).toBe('You are a writing assistant.');
    expect(agent.state.systemPrompt).not.toContain(HTML_SKILL_HEADING);
    expect(agent.state.tools.map((t) => t.name)).toEqual(['fs_read']);
    expect(agent.state.messages).toEqual([
      { role: 'user', content: '[User request]\nhello' },
    ]);
    restore();
  });
});
