import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  addReaderMark,
  addReadingAttachment,
  getReadingAttachment,
  listReadingAttachments,
  readMarks,
  removeReadingAttachment,
  removeReadingOwnerDir,
  ReadingAttachmentError,
} from './store';
import { readingOriginalAbs, readingWorkspaceAbs } from './paths';

describe('reading attachment store', () => {
  let root: string;
  const prev = process.env.READING_FILES_ROOT;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'reading-att-'));
    process.env.READING_FILES_ROOT = root;
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.READING_FILES_ROOT;
    else process.env.READING_FILES_ROOT = prev;
    rmSync(root, { recursive: true, force: true });
  });

  const userId = 'user-42';

  it('rejects non-PDF uploads', async () => {
    await expect(
      addReadingAttachment({
        userId,
        filename: 'memo.docx',
        bytes: Buffer.from('x'),
        convert: async () => ({ ok: true, markdown: '# x', format: 'docx' }),
      }),
    ).rejects.toBeInstanceOf(ReadingAttachmentError);
  });

  it('writes original PDF, extracted parts, and empty marks', async () => {
    const item = await addReadingAttachment({
      userId,
      filename: 'paper.pdf',
      bytes: Buffer.from('%PDF-fake'),
      convert: async () => ({
        ok: true,
        markdown: '# Title\n\nHello paper.',
        format: 'pdf',
      }),
    });
    expect(item.status).toBe('ready');
    expect(item.parts).toBe(1);
    expect(getReadingAttachment(userId, item.fileId)?.name).toBe('paper.pdf');
    expect(readFileSync(readingOriginalAbs(userId, item.fileId)).toString()).toBe(
      '%PDF-fake',
    );
    const index = readFileSync(
      join(readingWorkspaceAbs(userId, item.fileId), 'INDEX.md'),
      'utf8',
    );
    expect(index).toContain('paper.pdf');
    expect(readMarks(userId, item.fileId)).toEqual([]);
  });

  it('keeps the original PDF when extraction fails', async () => {
    const item = await addReadingAttachment({
      userId,
      filename: 'scan.pdf',
      bytes: Buffer.from('%PDF-scan'),
      convert: async () => ({
        ok: false,
        error: 'Could not extract text from this file.',
      }),
    });
    expect(item.status).toBe('failed');
    expect(listReadingAttachments(userId)).toHaveLength(1);
  });

  it('stores highlight and ask marks', async () => {
    const item = await addReadingAttachment({
      userId,
      filename: 'paper.pdf',
      bytes: Buffer.from('%PDF-fake'),
      convert: async () => ({ ok: true, markdown: 'hi', format: 'pdf' }),
    });
    const mark = addReaderMark(userId, item.fileId, {
      kind: 'highlight',
      page: 2,
      quote: 'important sentence',
    });
    expect(mark.page).toBe(2);
    expect(readMarks(userId, item.fileId)).toHaveLength(1);
  });

  it('removes a file directory', async () => {
    const item = await addReadingAttachment({
      userId,
      filename: 'paper.pdf',
      bytes: Buffer.from('%PDF-fake'),
      convert: async () => ({ ok: true, markdown: 'hi', format: 'pdf' }),
    });
    expect(removeReadingAttachment(userId, item.fileId)).toBe(true);
    expect(listReadingAttachments(userId)).toEqual([]);
    removeReadingOwnerDir(userId);
  });
});
