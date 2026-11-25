import { describe, expect, it } from 'vitest';
import {
  filterHiddenPublicHits,
  formatKnowledgePin,
  formatKnowledgePins,
  isHiddenPublicFolder,
  knowledgeFolderFromLegacyDocumentId,
  knowledgeMentionMatches,
  knowledgeMentionToken,
  KNOWLEDGE_PIN_CAP_REASON,
  MAX_KNOWLEDGE_PINS,
  parseKnowledgeLibrary,
  parseKnowledgeLibraryStrict,
  parseKnowledgePin,
  parseKnowledgePins,
  pinTitle,
  removeKnowledgePin,
  toggleKnowledgePin,
} from './library';

describe('knowledge library pins', () => {
  it('parses visibility and defaults to private', () => {
    expect(parseKnowledgeLibrary('public')).toBe('public');
    expect(parseKnowledgeLibrary('shared')).toBe('public');
    expect(parseKnowledgeLibrary('private')).toBe('private');
    expect(parseKnowledgeLibrary(undefined)).toBe('private');
    expect(parseKnowledgeLibraryStrict('all')).toBeNull();
  });

  it('formats and parses private and public pins', () => {
    expect(formatKnowledgePin({ library: 'public', path: 'spr' })).toBe('public:spr');
    expect(formatKnowledgePin({ library: 'private', path: 'notes' })).toBe(
      'private:notes',
    );
    expect(parseKnowledgePin('public:spr')).toEqual({
      library: 'public',
      path: 'spr',
    });
    expect(parseKnowledgePin('private/notes')).toEqual({
      library: 'private',
      path: 'notes',
    });
    expect(parseKnowledgePin('contracts/2024')).toEqual({
      library: 'private',
      path: 'contracts/2024',
    });
    expect(knowledgeMentionToken({ library: 'public', path: 'spr' })).toBe(
      'public/spr',
    );
  });

  it('matches @ queries on name and path, not a library-name substring', () => {
    const writing = {
      name: 'writing',
      path: 'writing',
      library: 'private' as const,
    };
    const spr = { name: 'spr', path: 'spr', library: 'public' as const };
    const plan = {
      name: 'plan.md',
      path: 'writing/plan.md',
      library: 'private' as const,
    };
    expect(knowledgeMentionMatches({ ...writing, query: '' })).toBe(true);
    expect(knowledgeMentionMatches({ ...writing, query: 'writ' })).toBe(true);
    expect(knowledgeMentionMatches({ ...plan, query: 'plan' })).toBe(true);
    expect(knowledgeMentionMatches({ ...writing, query: 'p' })).toBe(false);
    expect(knowledgeMentionMatches({ ...writing, query: 'pri' })).toBe(false);
    expect(knowledgeMentionMatches({ ...spr, query: 'pu' })).toBe(false);
    expect(knowledgeMentionMatches({ ...writing, query: 'private' })).toBe(true);
    expect(knowledgeMentionMatches({ ...spr, query: 'public' })).toBe(true);
    expect(knowledgeMentionMatches({ ...spr, query: 'public/spr' })).toBe(true);
    expect(knowledgeMentionMatches({ ...writing, query: 'public/spr' })).toBe(
      false,
    );
  });

  it('hides the reserved sfc public folder and titles pins from the last segment', () => {
    expect(isHiddenPublicFolder('sfc')).toBe(true);
    expect(isHiddenPublicFolder('sfc/wiki')).toBe(true);
    expect(isHiddenPublicFolder('spr')).toBe(false);
    expect(pinTitle({ library: 'public', path: 'spr' })).toBe('spr');
  });

  it('does not map a hidden sfc document id onto a Knowledge pin', () => {
    expect(knowledgeFolderFromLegacyDocumentId('sfc')).toBeNull();
    expect(knowledgeFolderFromLegacyDocumentId('public:sfc')).toBeNull();
    expect(knowledgeFolderFromLegacyDocumentId('spr')).toBe('public:spr');
    expect(knowledgeFolderFromLegacyDocumentId('')).toBeNull();
  });

  it('drops hidden public sfc hits from search results', () => {
    expect(
      filterHiddenPublicHits([
        { file: 'qmd://markdown/spr/wiki/index.md', snippet: 'spr' },
        { file: 'qmd://markdown/sfc/wiki/index.md', snippet: 'sfc' },
        { path: 'sfc/testing2/a.md', text: 'x' },
      ]),
    ).toEqual([{ file: 'qmd://markdown/spr/wiki/index.md', snippet: 'spr' }]);
  });

  it('loads a legacy single pin as a one-item list', () => {
    expect(parseKnowledgePins('public:spr')).toEqual([
      { library: 'public', path: 'spr' },
    ]);
    expect(parseKnowledgePins('private:notes')).toEqual([
      { library: 'private', path: 'notes' },
    ]);
    expect(parseKnowledgePins('contracts/2024')).toEqual([
      { library: 'private', path: 'contracts/2024' },
    ]);
    expect(formatKnowledgePins(parseKnowledgePins('public:spr'))).toBe(
      'public:spr',
    );
  });

  it('parses and formats a list of pin keys', () => {
    expect(parseKnowledgePins('public:spr,private:notes')).toEqual([
      { library: 'public', path: 'spr' },
      { library: 'private', path: 'notes' },
    ]);
    expect(
      parseKnowledgePins(['private:123', 'public:testing1', 'public:acqn']),
    ).toEqual([
      { library: 'private', path: '123' },
      { library: 'public', path: 'testing1' },
      { library: 'public', path: 'acqn' },
    ]);
    expect(
      parseKnowledgePins('["public:spr","private:notes"]'),
    ).toEqual([
      { library: 'public', path: 'spr' },
      { library: 'private', path: 'notes' },
    ]);
    expect(
      formatKnowledgePins([
        { library: 'public', path: 'spr' },
        { library: 'private', path: 'notes' },
      ]),
    ).toBe('public:spr,private:notes');
    expect(parseKnowledgePins('')).toEqual([]);
    expect(parseKnowledgePins(null)).toEqual([]);
  });

  it('adds, removes, and caps pins at 5', () => {
    const first = toggleKnowledgePin('', 'private:123');
    expect(first).toMatchObject({
      value: 'private:123',
      added: true,
    });
    const second = toggleKnowledgePin(first.value, 'public:testing1');
    expect(second.value).toBe('private:123,public:testing1');
    expect(second.added).toBe(true);
    const removed = toggleKnowledgePin(second.value, 'private:123');
    expect(removed.value).toBe('public:testing1');
    expect(removed.added).toBe(false);
    expect(removeKnowledgePin(second.value, 'public:testing1')).toBe(
      'private:123',
    );

    let value = '';
    for (let i = 1; i <= MAX_KNOWLEDGE_PINS; i += 1) {
      const result = toggleKnowledgePin(value, `private:folder${i}`);
      expect(result.added).toBe(true);
      expect(result.reason).toBeUndefined();
      value = result.value;
    }
    const capped = toggleKnowledgePin(value, 'public:extra');
    expect(capped.added).toBe(false);
    expect(capped.reason).toBe(KNOWLEDGE_PIN_CAP_REASON);
    expect(parseKnowledgePins(capped.value)).toHaveLength(MAX_KNOWLEDGE_PINS);
    expect(capped.value).toBe(value);
  });
});
