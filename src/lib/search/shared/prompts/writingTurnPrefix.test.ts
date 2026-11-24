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

describe('writingToolsForTurn', () => {
  it('returns only the Dochub tools', () => {
    expect(writingToolsForTurn()).toEqual([
      'query',
      'get',
      'multi_get',
      'tree',
      'status',
    ]);
  });

  it('uses index-first filesystem tools for a local structured folder', () => {
    expect(
      writingToolsForTurn({
        ...ctx,
        retrievalMode: 'wiki',
        wikiRootAbs: '/tmp/spr',
        wikiTitle: 'SPR',
        pinLibrary: 'public',
      }),
    ).toEqual(['fs_ls', 'fs_read', 'fs_grep', 'fs_find']);
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
    expect(prompt).toContain('[Pinned folder]\nprivate:contracts/2024 (ordinary)');
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

  it('tells the model to read the index first and never say wiki to the user', () => {
    const prompt = buildWritingUserPrompt('What is the threshold?', {
      ...ctx,
      pin: 'spr',
      pinLibrary: 'public',
      retrievalMode: 'wiki',
      wikiTitle: 'Stores and Procurement Regulations (SPR)',
    });
    expect(prompt).toContain('[Pinned folder]\npublic:spr (structured)');
    expect(prompt).toContain('[Structured folder]');
    expect(prompt).toContain('Call get on wiki/index.md first');
    expect(prompt).toContain('Do not start with query');
    expect(prompt).toContain('Never use the word "wiki"');
  });
});
