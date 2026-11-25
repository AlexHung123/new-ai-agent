import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { addWritingAttachment } from './store';
import {
  contentDispositionInline,
  contentTypeForFilename,
  readWritingOriginalFile,
} from './readWritingOriginalFile';

describe('readWritingOriginalFile', () => {
  let root: string;
  const prev = process.env.WRITING_FILES_ROOT;
  const userId = 'user-original-preview';

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'writing-original-'));
    process.env.WRITING_FILES_ROOT = root;
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.WRITING_FILES_ROOT;
    else process.env.WRITING_FILES_ROOT = prev;
    rmSync(root, { recursive: true, force: true });
  });

  it('returns the stored original bytes with a document content type', async () => {
    const bytes = Buffer.from('%PDF-1.4 original-bytes');
    const item = await addWritingAttachment({
      userId,
      filename: 'policy.pdf',
      bytes,
      mimeType: 'application/pdf',
      convert: async () => ({
        ok: true,
        markdown: '# Policy',
        format: 'pdf',
      }),
    });

    const result = readWritingOriginalFile(userId, item.fileId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.name).toBe('policy.pdf');
    expect(result.contentType).toBe('application/pdf');
    expect(Buffer.from(result.bytes).equals(bytes)).toBe(true);
  });

  it('rejects missing and foreign files', async () => {
    expect(readWritingOriginalFile(userId, 'missing').ok).toBe(false);
    const unauthorized = readWritingOriginalFile('', 'x');
    expect(unauthorized.ok).toBe(false);
    if (!unauthorized.ok) expect(unauthorized.status).toBe(401);
    const missingId = readWritingOriginalFile(userId, '');
    expect(missingId.ok).toBe(false);
    if (!missingId.ok) expect(missingId.status).toBe(400);
  });

  it('maps office types and builds an inline content-disposition', () => {
    expect(contentTypeForFilename('memo.docx')).toContain('wordprocessingml');
    expect(contentTypeForFilename('sheet.xlsx')).toContain('spreadsheetml');
    expect(contentDispositionInline('resume.pdf')).toMatch(/inline;/);
    expect(contentDispositionInline('resume.pdf')).toMatch(
      /filename="resume.pdf"/,
    );
  });
});
