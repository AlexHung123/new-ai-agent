import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { addWritingAttachment } from './store';
import { readWritingFile } from './readWritingFile';

describe('readWritingFile', () => {
  let root: string;
  const prev = process.env.WRITING_FILES_ROOT;
  const userId = 'user-preview';

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'writing-preview-'));
    process.env.WRITING_FILES_ROOT = root;
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.WRITING_FILES_ROOT;
    else process.env.WRITING_FILES_ROOT = prev;
    rmSync(root, { recursive: true, force: true });
  });

  it('joins converted markdown parts for a ready file', async () => {
    const item = await addWritingAttachment({
      userId,
      filename: 'brief.docx',
      bytes: Buffer.from('x'),
      convert: async () => ({
        ok: true,
        markdown: '# Brief\n\nHello preview.',
        format: 'docx',
      }),
    });

    const result = readWritingFile(userId, item.fileId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.name).toBe('brief.docx');
    expect(result.language).toBe('markdown');
    expect(result.content).toContain('# Brief');
    expect(result.content).toContain('Hello preview.');
    expect(result.content).not.toMatch(/<!-- .* part /);
  });

  it('rejects missing, foreign, and failed files', async () => {
    expect(readWritingFile(userId, 'missing').ok).toBe(false);
    const failed = await addWritingAttachment({
      userId,
      filename: 'locked.docx',
      bytes: Buffer.from('x'),
      convert: async () => ({
        ok: false,
        error: 'This file is encrypted or password-protected.',
        code: 'encrypted',
      }),
    });
    const result = readWritingFile(userId, failed.fileId);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBeGreaterThanOrEqual(400);
  });
});
