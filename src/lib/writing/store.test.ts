import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  addWritingAttachment,
  ensureWritingWorkspace,
  listWritingAttachments,
  removeWritingAttachment,
  removeWritingOwnerDir,
  WritingAttachmentError,
} from './store';
import { MAX_WRITING_FILES, MAX_WRITING_PART_BYTES } from './types';

describe('writing attachment store', () => {
  let root: string;
  const prev = process.env.WRITING_FILES_ROOT;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'writing-att-'));
    process.env.WRITING_FILES_ROOT = root;
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.WRITING_FILES_ROOT;
    else process.env.WRITING_FILES_ROOT = prev;
    rmSync(root, { recursive: true, force: true });
  });

  const userId = 'user-42';

  it('converts via the injected converter and writes split parts', async () => {
    const markdown = '# One\n\n' + 'x'.repeat(80) + '\n\n# Two\n\n' + 'y'.repeat(80);
    const item = await addWritingAttachment({
      userId,
      filename: 'memo.docx',
      bytes: Buffer.from('not-a-real-docx'),
      convert: async () => ({ ok: true, markdown, format: 'docx' }),
    });
    expect(item.status).toBe('ready');
    expect(item.relDir).toMatch(/^memo-/);
    expect(item.parts).toBeGreaterThanOrEqual(1);
    const listed = listWritingAttachments(userId);
    expect(listed).toHaveLength(1);
    const index = readFileSync(
      join(root, userId, 'workspace', 'INDEX.md'),
      'utf8',
    );
    expect(index).toContain('memo.docx');
    expect(index).toContain(`${item.relDir}/INDEX.md`);
    expect(index).toMatch(/fromLine/);
    expect(index).not.toMatch(/read those first/i);
  });

  it('keeps a failed conversion in the manifest but not the workspace index', async () => {
    const item = await addWritingAttachment({
      userId,
      filename: 'locked.docx',
      bytes: Buffer.from('x'),
      convert: async () => ({
        ok: false,
        error: 'This file is encrypted or password-protected.',
        code: 'encrypted',
      }),
    });
    expect(item.status).toBe('failed');
    const index = readFileSync(
      join(ensureWritingWorkspace(userId), 'INDEX.md'),
      'utf8',
    );
    expect(index).toMatch(/No files uploaded/);
    expect(index).not.toContain('locked.docx');
  });

  it('removes a file and rewrites INDEX.md', async () => {
    const item = await addWritingAttachment({
      userId,
      filename: 'a.txt',
      bytes: Buffer.from('hello'),
      convert: async () => ({ ok: true, markdown: 'hello', format: 'txt' }),
    });
    expect(removeWritingAttachment(userId, item.fileId)).toBe(true);
    expect(listWritingAttachments(userId)).toEqual([]);
    const index = readFileSync(
      join(root, userId, 'workspace', 'INDEX.md'),
      'utf8',
    );
    expect(index).toMatch(/No files uploaded/);
  });

  it('caps the number of files per user', async () => {
    for (let i = 0; i < MAX_WRITING_FILES; i++) {
      await addWritingAttachment({
        userId,
        filename: `f${i}.txt`,
        bytes: Buffer.from('a'),
        convert: async () => ({ ok: true, markdown: 'a', format: 'txt' }),
      });
    }
    await expect(
      addWritingAttachment({
        userId,
        filename: 'overflow.txt',
        bytes: Buffer.from('a'),
        convert: async () => ({ ok: true, markdown: 'a', format: 'txt' }),
      }),
    ).rejects.toBeInstanceOf(WritingAttachmentError);
  });

  it('removes the whole user directory', async () => {
    await addWritingAttachment({
      userId,
      filename: 'a.txt',
      bytes: Buffer.from('hello'),
      convert: async () => ({ ok: true, markdown: 'hello', format: 'txt' }),
    });
    removeWritingOwnerDir(userId);
    expect(listWritingAttachments(userId)).toEqual([]);
  });

  it('splits parts under the read cap', async () => {
    const huge = '你'.repeat(MAX_WRITING_PART_BYTES);
    const item = await addWritingAttachment({
      userId,
      filename: 'long.md',
      bytes: Buffer.from('x'),
      convert: async () => ({ ok: true, markdown: huge, format: 'md' }),
    });
    expect(item.parts).toBeGreaterThan(1);
  });
});
