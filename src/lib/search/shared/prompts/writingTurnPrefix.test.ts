import { describe, expect, it } from 'vitest';
import { runWithHtmlTurn } from '@/lib/html/htmlTurnContext';
import {
  buildWritingUserPrompt,
  writingToolsForTurn,
} from './writingTurnPrefix';

describe('writingToolsForTurn', () => {
  it('always includes read_skill and am_render', () => {
    expect(writingToolsForTurn()).toEqual(['read_skill', 'am_render']);
  });
});

describe('buildWritingUserPrompt', () => {
  it('returns the user request when no writing turn is bound', () => {
    expect(buildWritingUserPrompt('Draft a memo')).toBe(
      '[User request]\nDraft a memo',
    );
  });

  it('keeps HTML skill instructions off the user turn', async () => {
    const on = await runWithHtmlTurn({ userId: 'user-42', htmlMode: true }, () =>
      buildWritingUserPrompt('explain the flow to buy a server'),
    );
    expect(on).toBe('[User request]\nexplain the flow to buy a server');

    const off = await runWithHtmlTurn(
      { userId: 'user-42', htmlMode: false },
      () => buildWritingUserPrompt('幫我總結一下 需要100字'),
    );
    expect(off).toBe('[User request]\n幫我總結一下 需要100字');
  });
});
