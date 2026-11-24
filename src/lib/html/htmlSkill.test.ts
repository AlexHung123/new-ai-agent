import { describe, expect, it } from 'vitest';
import {
  stripHtmlTurnPrefixFromUserText,
  stripHtmlTurnPrefixesFromMessages,
} from './htmlSkill';
import { WRITING_AGENT_SYSTEM_PROMPT } from '@/lib/search/shared/prompts/writingAgentSystemPrompt';
import { DOCUMENT_AGENT_SYSTEM_PROMPT } from '@/lib/search/shared/prompts/documentAgentSystemPrompt';

describe('HTML explainer leftover prefix stripping', () => {
  it('does not advertise html-explainer on writing or document prompts', () => {
    expect(WRITING_AGENT_SYSTEM_PROMPT).not.toContain('html-explainer');
    expect(WRITING_AGENT_SYSTEM_PROMPT).not.toMatch(/am_render/);
    expect(DOCUMENT_AGENT_SYSTEM_PROMPT).not.toContain('html-explainer');
    expect(DOCUMENT_AGENT_SYSTEM_PROMPT).not.toMatch(/am_render/);
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

  it('strips leftover HTML prefixes from text-block message content', () => {
    const messages = stripHtmlTurnPrefixesFromMessages([
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: '[HTML explainer skill]\nCall am_render. Do not answer in plain text only.\n\n[User request]\nhello',
          },
        ],
      },
    ]);
    expect(messages).toEqual([
      { role: 'user', content: [{ type: 'text', text: '[User request]\nhello' }] },
    ]);
  });
});
