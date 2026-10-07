import { describe, expect, it } from 'vitest';
import type { NamedTool, PooledAgent } from '@/lib/search/shared/agent/piAgentSessionManager';
import { bindTurnHtmlTool } from './bindTurnHtmlTool';
import {
  HTML_SKILL_HEADING,
  stripHtmlTurnPrefixFromUserText,
} from './htmlSkill';
import { runWithHtmlTurn } from './htmlTurnContext';
import { WRITING_AGENT_SYSTEM_PROMPT } from '@/lib/search/shared/prompts/writingAgentSystemPrompt';

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
  it('keeps the skills catalog on the writing system prompt', () => {
    expect(WRITING_AGENT_SYSTEM_PROMPT).toContain('<available_skills>');
    expect(WRITING_AGENT_SYSTEM_PROMPT).toContain('html-explainer');
    expect(WRITING_AGENT_SYSTEM_PROMPT).toMatch(/read_skill/);
    expect(WRITING_AGENT_SYSTEM_PROMPT).not.toMatch(/This turn must produce/);
    expect(WRITING_AGENT_SYSTEM_PROMPT).not.toMatch(/```flow/);
    expect(WRITING_AGENT_SYSTEM_PROMPT).not.toMatch(/composer HTML tag/i);
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

  it('strips leftover HTML prefixes from Agent.prompt text-block content', () => {
    const agent = fakeAgent([{ name: 'fs_read' }, { name: 'am_render' }], {
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: '[HTML explainer skill]\nCall am_render. Do not answer in plain text only.\n\n[User request]\nhello',
            },
          ],
        },
      ],
    });
    const restore = bindTurnHtmlTool(agent);
    expect(agent.state.messages).toEqual([
      { role: 'user', content: [{ type: 'text', text: '[User request]\nhello' }] },
    ]);
    restore();
  });

  it('does not inject the skill body even if a leftover htmlMode flag is on', async () => {
    const agent = fakeAgent([{ name: 'fs_read' }]);
    const restore = await runWithHtmlTurn({ userId: '1', htmlMode: true }, () =>
      bindTurnHtmlTool(agent),
    );
    expect(agent.state.systemPrompt).toBe('You are a writing assistant.');
    expect(agent.state.systemPrompt).not.toContain(HTML_SKILL_HEADING);
    expect(agent.state.tools.map((t) => t.name)).toEqual([
      'fs_read',
      'read_skill',
      'am_render',
    ]);
    restore();
    expect(agent.state.systemPrompt).toBe('You are a writing assistant.');
    expect(agent.state.tools.map((t) => t.name)).toEqual(['fs_read']);
  });

  it('keeps am_render when untagged, without the full tutorial', () => {
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
    expect(agent.state.tools.map((t) => t.name)).toEqual([
      'fs_read',
      'read_skill',
      'am_render',
    ]);
    expect(agent.state.messages).toEqual([
      { role: 'user', content: '[User request]\nhello' },
    ]);
    restore();
  });
});
