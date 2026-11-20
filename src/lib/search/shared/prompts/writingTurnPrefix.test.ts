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
  it('always returns Dochub tools plus read_skill and am_render', () => {
    expect(writingToolsForTurn()).toEqual([
      'query',
      'get',
      'multi_get',
      'tree',
      'status',
      'read_skill',
      'am_render',
    ]);
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
    expect(prompt).toContain('[Pinned folder]\ncontracts/2024');
    expect(prompt).toContain('[Mentioned documents]');
    expect(prompt).toContain('contracts/2024/plan.md');
    expect(prompt).toContain('plan.docx');
    expect(prompt).toContain('[User request]\n季度規劃喺邊份合約');
    expect(prompt).not.toMatch(/fs_/);
    expect(prompt).not.toContain('[Attachments]');
    expect(prompt).not.toContain('# ');
  });
});
