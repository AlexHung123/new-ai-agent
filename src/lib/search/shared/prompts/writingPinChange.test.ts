import { describe, expect, it } from 'vitest';
import {
  KNOWLEDGE_OUT_OF_SCOPE_MARKER,
  markOutOfScopeKnowledgeToolResults,
  parsePinnedLabelsFromPrompt,
  pinChangeWarning,
  pinsChanged,
  previousPinnedLabelsFromMessages,
} from './writingPinChange';

describe('writing pin change helpers', () => {
  it('parses single and multiple pinned folder labels', () => {
    expect(
      parsePinnedLabelsFromPrompt(
        '[Pinned folder]\nprivate:contracts/2024\n\n[User request]\nHi',
      ),
    ).toEqual(['private:contracts/2024']);
    expect(
      parsePinnedLabelsFromPrompt(
        '[Pinned folders]\n- private:writing\n- public:spr\nUse list to see files\n',
      ),
    ).toEqual(['private:writing', 'public:spr']);
    expect(
      parsePinnedLabelsFromPrompt(
        '[Pinned folder]\npublic:spr (ordinary)\n',
      ),
    ).toEqual(['public:spr']);
    expect(parsePinnedLabelsFromPrompt('[User request]\nHi')).toBeNull();
  });

  it('reads the most recent pin block from prior user messages', () => {
    const labels = previousPinnedLabelsFromMessages([
      {
        role: 'user',
        content: '[Pinned folder]\nprivate:writing\n\n[User request]\nOne',
      },
      { role: 'assistant', content: 'ok' },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: '[Pinned folders]\n- public:g3\n- public:s17\n\n[User request]\nTwo',
          },
        ],
      },
    ]);
    expect(labels).toEqual(['public:g3', 'public:s17']);
  });

  it('detects pin changes and formats a warning', () => {
    expect(pinsChanged(['private:writing'], ['private:writing'])).toBe(false);
    expect(pinsChanged(null, ['private:writing'])).toBe(false);
    expect(pinsChanged(['private:writing'], ['public:spr'])).toBe(true);
    expect(pinChangeWarning(['private:writing'], ['public:spr'])).toContain(
      'Previously pinned: private:writing',
    );
  });

  it('marks prior knowledge tool results from unpinned folders without dropping them', () => {
    const messages = [
      { role: 'user', content: '[Pinned folder]\nprivate:writing\n' },
      {
        role: 'toolResult',
        toolName: 'search',
        content: JSON.stringify({
          ok: true,
          sources: ['private:writing'],
          hits: [{ file: 'writing/note.md', source: 'private:writing' }],
        }),
      },
      {
        role: 'toolResult',
        toolName: 'read',
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              ok: true,
              path: 'spr/wiki/index.md',
              source: 'public:spr',
              text: 'classified protection',
            }),
          },
        ],
      },
    ];
    const next = markOutOfScopeKnowledgeToolResults(messages, [
      'private:writing',
    ]);
    expect(next).toHaveLength(3);
    expect(JSON.stringify(next[1])).not.toContain(KNOWLEDGE_OUT_OF_SCOPE_MARKER);
    const marked = next[2] as { content: Array<{ text: string }> };
    expect(marked.content[0].text).toContain(KNOWLEDGE_OUT_OF_SCOPE_MARKER);
    expect(marked.content[0].text).toContain('classified protection');
  });

  it('clears the out-of-scope marker when a folder is pinned again', () => {
    const messages = [
      {
        role: 'toolResult',
        toolName: 'search',
        content: `${KNOWLEDGE_OUT_OF_SCOPE_MARKER}\n${JSON.stringify({
          ok: true,
          sources: ['public:spr'],
          hits: [{ source: 'public:spr', file: 'spr/a.md' }],
        })}`,
      },
    ];
    const next = markOutOfScopeKnowledgeToolResults(messages, ['public:spr']);
    const text = (next[0] as { content: string }).content;
    expect(text).not.toContain(KNOWLEDGE_OUT_OF_SCOPE_MARKER);
    expect(text).toContain('public:spr');
  });
});
