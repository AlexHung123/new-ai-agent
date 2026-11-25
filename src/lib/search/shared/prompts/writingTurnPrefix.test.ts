import { describe, expect, it } from 'vitest';
import {
  buildWritingUserPrompt,
  writingToolsForTurn,
} from './writingTurnPrefix';
import type { WritingTurnContext } from '../runtime/writingTurnContext';

const ctx: WritingTurnContext = {
  userId: '1',
  pin: 'contracts/2024',
  mentionedDocuments: [
    {
      fileId: 'p1',
      path: 'contracts/2024/plan.docx',
      name: 'plan.docx',
      markdownRelpath: 'contracts/2024/plan.md',
    },
  ],
  tree: { type: 'dir', name: '', path: '', children: [] },
};

const KNOWLEDGE_TOOLS = ['search', 'read', 'list'];

describe('writingToolsForTurn', () => {
  it('binds no knowledge tools without a turn context', () => {
    expect(writingToolsForTurn()).toEqual([]);
  });

  it('exposes search, read, and list for a structured folder', () => {
    expect(
      writingToolsForTurn({
        ...ctx,
        pinLibrary: 'public',
        mentionedDocuments: [],
        scopes: [
          {
            path: 'spr',
            library: 'public',
          },
        ],
      }),
    ).toEqual(KNOWLEDGE_TOOLS);
  });
});

describe('buildWritingUserPrompt', () => {
  it('returns only the user request without context', () => {
    expect(buildWritingUserPrompt('Draft a memo')).toBe(
      '[User request]\nDraft a memo',
    );
  });

  it('adds pin and mention notes and does not inject file bodies', () => {
    const prompt = buildWritingUserPrompt('季度規劃喺邊份合約', ctx);
    expect(prompt).toContain('[Pinned folder]\nprivate:contracts/2024\n');
    expect(prompt).not.toContain('(ordinary)');
    expect(prompt).toContain('[Knowledge tools]');
    expect(prompt).toContain('Use list to see files');
    expect(prompt).toContain('Use search then read');
    expect(prompt).toContain('[Mentioned documents]');
    expect(prompt).toContain('contracts/2024/plan.md');
    expect(prompt).toContain('plan.docx');
    expect(prompt).toContain('[User request]\n季度規劃喺邊份合約');
    expect(prompt).not.toMatch(/fs_/);
    expect(prompt).not.toContain('[Attachments]');
    expect(prompt).not.toContain('# ');
  });

  it('warns when the knowledge library is unreachable', () => {
    const prompt = buildWritingUserPrompt('List files', {
      ...ctx,
      tree: null,
      libraryAvailable: false,
      libraryError: 'Knowledge service is unavailable. Knowledge tools will fail.',
    });
    expect(prompt).toContain('[Knowledge library]');
    expect(prompt).toContain('Knowledge service is unavailable');
  });

  it('includes collection context and a keyword-search hint', () => {
    const prompt = buildWritingUserPrompt('Find the OKR note', {
      ...ctx,
      contexts: [{ path: 'contracts', text: 'Signed contracts' }],
      index: {
        keyword_search_ready: true,
        semantic_search_ready: false,
        hint: 'Use keyword search',
      },
    });
    expect(prompt).toContain('[Collection context]');
    expect(prompt).toContain('Signed contracts');
    expect(prompt).toContain('[Index status]');
    expect(prompt).toContain('Use keyword search');
  });

  it('treats a structured public pin as a Dochub folder', () => {
    const prompt = buildWritingUserPrompt('What is the threshold?', {
      ...ctx,
      pin: 'spr',
      pinLibrary: 'public',
      mentionedDocuments: [],
      scopes: [
        {
          path: 'spr',
          library: 'public',
        },
      ],
    });
    expect(prompt).toContain('[Pinned folder]\npublic:spr\n');
    expect(prompt).not.toContain('(ordinary)');
    expect(prompt).toContain('Use search then read');
    expect(prompt).not.toContain('[Structured folder]');
    expect(prompt).not.toContain('Never use the word "wiki"');
    expect(prompt).not.toMatch(/fs_read|fs_grep|\bgrep\b|\bmulti_get\b/);
  });

  it('lists mixed scopes and binds search, read, and list', () => {
    const mixed = {
      ...ctx,
      pin: 'writing',
      pinLibrary: 'private' as const,
      scopes: [
        { path: 'writing', library: 'private' as const },
        { path: 'testing1', library: 'public' as const },
        {
          path: 'spr',
          library: 'public' as const,
        },
      ],
    };
    const prompt = buildWritingUserPrompt('Compare the policy', mixed);
    expect(prompt).toContain('[Pinned folders]');
    expect(prompt).toContain('- private:writing');
    expect(prompt).toContain('- public:testing1');
    expect(prompt).toContain('- public:spr');
    expect(prompt).not.toContain('(ordinary)');
    expect(prompt).not.toContain('[Structured folder]');
    expect(prompt).not.toContain('structured folders with keyword search');
    expect(prompt).toContain('One search covers all pinned folders');
    expect(prompt).not.toContain('Never mix those modes in one query');
    expect(writingToolsForTurn(mixed)).toEqual(KNOWLEDGE_TOOLS);
  });

  it('does not bind knowledge tools when nothing is pinned or mentioned', () => {
    expect(
      writingToolsForTurn({
        userId: '1',
        pin: null,
        scopes: [],
        mentionedDocuments: [],
        tree: null,
      }),
    ).toEqual([]);
  });

  it('binds search, read, and list when only folders are pinned', () => {
    expect(
      writingToolsForTurn({
        ...ctx,
        pin: 'writing',
        pinLibrary: 'private',
        mentionedDocuments: [],
        scopes: [{ path: 'writing', library: 'private' }],
      }),
    ).toEqual(KNOWLEDGE_TOOLS);
  });

  it('binds search, read, and list for multiple structured folders', () => {
    const multiWiki = {
      ...ctx,
      pin: 'g3',
      pinLibrary: 'public' as const,
      scopes: [
        {
          path: 'g3',
          library: 'public' as const,
        },
        {
          path: 's17',
          library: 'public' as const,
        },
      ],
    };
    expect(writingToolsForTurn(multiWiki)).toEqual(KNOWLEDGE_TOOLS);
    expect(writingToolsForTurn(multiWiki)).not.toContain('fs_grep');
    expect(writingToolsForTurn(multiWiki)).not.toContain('grep');
    expect(writingToolsForTurn(multiWiki)).not.toContain('query');
  });

  it('warns when pinned folders changed from the previous turn', () => {
    const prompt = buildWritingUserPrompt(
      'Summarize the policy',
      {
        ...ctx,
        mentionedDocuments: [],
        pin: 'spr',
        pinLibrary: 'public',
        scopes: [{ path: 'spr', library: 'public' }],
      },
      { previousPins: ['private:contracts/2024'] },
    );
    expect(prompt).toContain('[Pinned folders changed]');
    expect(prompt).toContain('Previously pinned: private:contracts/2024');
    expect(prompt).toContain('Currently pinned: public:spr');
    expect(prompt).toContain('out of scope');
  });

  it('does not warn when pins are unchanged', () => {
    const prompt = buildWritingUserPrompt('Continue', ctx, {
      previousPins: ['private:contracts/2024'],
    });
    expect(prompt).not.toContain('[Pinned folders changed]');
  });
});
