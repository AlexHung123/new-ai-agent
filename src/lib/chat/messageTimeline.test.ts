import { describe, expect, it } from 'vitest';
import { buildTimelineTurns } from './messageTimeline';

describe('buildTimelineTurns', () => {
  it('pairs each user turn with the following assistant reply', () => {
    const turns = buildTimelineTurns([
      { role: 'user', messageId: 'u1', content: 'What is SFC?' },
      { role: 'assistant', messageId: 'a1', content: 'Special Finance Committee.' },
      { role: 'user', messageId: 'u2', content: 'Show 2024' },
    ]);

    expect(turns).toEqual([
      {
        index: 1,
        userMessageId: 'u1',
        userPreview: 'What is SFC?',
        assistantPreview: 'Special Finance Committee.',
      },
      {
        index: 2,
        userMessageId: 'u2',
        userPreview: 'Show 2024',
        assistantPreview: '',
      },
    ]);
  });

  it('ignores source and suggestion messages', () => {
    const turns = buildTimelineTurns([
      { role: 'user', messageId: 'u1', content: 'Hello' },
      { role: 'source', messageId: 's1', content: '' },
      { role: 'assistant', messageId: 'a1', content: 'Hi' },
      { role: 'suggestion', messageId: 'g1', content: '' },
    ]);
    expect(turns).toHaveLength(1);
    expect(turns[0].assistantPreview).toBe('Hi');
  });

  it('strips HTML tags and the accuracy disclaimer from assistant preview', () => {
    const turns = buildTimelineTurns([
      { role: 'user', messageId: 'u1', content: 'hello' },
      {
        role: 'assistant',
        messageId: 'a1',
        content:
          '<span class="text-red-500 font-bold">AI生成的回覆可能不準確，使用前請仔細核實。</span>\n\nHello! How can I help you today?',
      },
    ]);

    expect(turns[0].assistantPreview).toBe(
      'Hello! How can I help you today?',
    );
    expect(turns[0].assistantPreview.includes('<span')).toBe(false);
  });
});
