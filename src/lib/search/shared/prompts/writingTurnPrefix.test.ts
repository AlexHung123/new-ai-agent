import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runWithWritingTurn } from '../runtime/writingTurnContext';
import { buildWritingUserPrompt } from './writingTurnPrefix';

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

  it('uses an explicit writing context without ALS', () => {
    root = mkdtempSync(join(tmpdir(), 'writing-prefix-'));
    writeFileSync(
      join(root, 'INDEX.md'),
      '# Attachments\n\n- `memo-ab/INDEX.md` — memo.docx (1 part)\n',
      'utf8',
    );
    const prompt = buildWritingUserPrompt('Summarize this', {
      userId: 'user-42',
      rootAbs: root,
      files: [],
    });
    expect(prompt).toContain('[Attachments]');
    expect(prompt).toContain('memo.docx');
  });

  it('injects INDEX.md inside a writing turn', async () => {
    root = mkdtempSync(join(tmpdir(), 'writing-prefix-'));
    writeFileSync(
      join(root, 'INDEX.md'),
      '# Attachments\n\n- `memo-ab/INDEX.md` — memo.docx (1 part, 12 characters)\n',
      'utf8',
    );
    const prompt = await runWithWritingTurn(
      { userId: 'user-42', rootAbs: root, files: [] },
      () => buildWritingUserPrompt('Summarize this'),
    );
    expect(prompt).toContain('[Attachments]');
    expect(prompt).toContain('memo.docx');
    expect(prompt).toContain('[User request]\nSummarize this');
  });

  it('lists @mentioned files first', async () => {
    root = mkdtempSync(join(tmpdir(), 'writing-prefix-'));
    writeFileSync(join(root, 'INDEX.md'), '# Attachments\n', 'utf8');
    const prompt = await runWithWritingTurn(
      {
        userId: 'user-42',
        rootAbs: root,
        files: [
          {
            fileId: 'a1',
            userId: 'user-42',
            name: 'memo.docx',
            status: 'ready',
            relDir: 'memo-a1',
            parts: 2,
            charCount: 40,
            format: 'docx',
            createdAt: 't',
          },
        ],
      },
      () => buildWritingUserPrompt('rewrite @memo.docx'),
    );
    expect(prompt).toContain('[Mentioned files]');
    expect(prompt).toContain('memo.docx');
    expect(prompt).toMatch(/fs_grep/);
    expect(prompt).not.toMatch(/Read them first/i);
  });
});
