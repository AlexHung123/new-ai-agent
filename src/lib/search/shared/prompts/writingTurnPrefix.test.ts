import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runWithWritingTurn } from '../runtime/writingTurnContext';
import {
  buildWritingUserPrompt,
  writingFsToolsForTurn,
} from './writingTurnPrefix';

const MEMO = {
  fileId: 'a1',
  userId: 'user-42',
  name: 'memo.docx',
  status: 'ready' as const,
  relDir: 'memo-a1',
  parts: 2,
  charCount: 40,
  format: 'docx',
  createdAt: 't',
};

describe('writingFsToolsForTurn', () => {
  it('returns no fs tools when no file is selected', () => {
    expect(
      writingFsToolsForTurn('fix typos in this transcript', {
        userId: 'user-42',
        rootAbs: '/tmp/writing',
        files: [MEMO],
      }),
    ).toEqual([]);
  });

  it('returns fs tools when a file is @mentioned', () => {
    expect(
      writingFsToolsForTurn('rewrite @memo.docx', {
        userId: 'user-42',
        rootAbs: '/tmp/writing',
        files: [MEMO],
      }),
    ).toEqual(['fs_ls', 'fs_read', 'fs_grep', 'fs_find']);
  });
});

describe('buildWritingUserPrompt', () => {
  let root: string;

  afterEach(() => {
    if (root) rmSync(root, { recursive: true, force: true });
  });

  it('returns the user request when no writing turn is bound', () => {
    expect(buildWritingUserPrompt('Draft a memo')).toBe(
      '[User request]\nDraft a memo',
    );
  });

  it('does not inject attachments or fs instructions when no file is selected', () => {
    root = mkdtempSync(join(tmpdir(), 'writing-prefix-'));
    writeFileSync(
      join(root, 'INDEX.md'),
      '# Attachments\n\n- `memo-ab/INDEX.md` — memo.docx (1 part)\n',
      'utf8',
    );
    const prompt = buildWritingUserPrompt('Summarize this', {
      userId: 'user-42',
      rootAbs: root,
      files: [MEMO],
    });
    expect(prompt).toBe('[User request]\nSummarize this');
    expect(prompt).not.toMatch(/fs_/);
    expect(prompt).not.toContain('[Attachments]');
  });

  it('skips INDEX.md in a writing turn when no file is selected', async () => {
    root = mkdtempSync(join(tmpdir(), 'writing-prefix-'));
    writeFileSync(
      join(root, 'INDEX.md'),
      '# Attachments\n\n- `memo-ab/INDEX.md` — memo.docx (1 part, 12 characters)\n',
      'utf8',
    );
    const prompt = await runWithWritingTurn(
      { userId: 'user-42', rootAbs: root, files: [MEMO] },
      () => buildWritingUserPrompt('Summarize this'),
    );
    expect(prompt).toBe('[User request]\nSummarize this');
  });

  it('lists @mentioned files first', async () => {
    root = mkdtempSync(join(tmpdir(), 'writing-prefix-'));
    writeFileSync(join(root, 'INDEX.md'), '# Attachments\n', 'utf8');
    const prompt = await runWithWritingTurn(
      {
        userId: 'user-42',
        rootAbs: root,
        files: [MEMO],
      },
      () => buildWritingUserPrompt('rewrite @memo.docx'),
    );
    expect(prompt).toContain('[Mentioned files]');
    expect(prompt).toContain('memo.docx');
    expect(prompt).toMatch(/fs_grep/);
    expect(prompt).not.toMatch(/Read them first/i);
  });
});
