import { describe, expect, it } from 'vitest';
import {
  MAX_WRITING_FILES,
  WRITING_ACCEPT,
  displayFilename,
  formatWritingBytes,
  filterAllowedWritingFiles,
  isAllowedWritingFilename,
  isImageFilename,
  isPlainTextFilename,
  planWritingUploads,
  toPublicWritingAttachment,
  writingFileLimitMessage,
  writingOwnerDir,
  writingUnsupportedTypeMessage,
  type WritingAttachment,
} from './types';

describe('writing attachment filename rules', () => {
  it('caps Agent Writing uploads at five files', () => {
    expect(MAX_WRITING_FILES).toBe(5);
  });

  it('keeps only remaining slots when picking extra files', () => {
    expect(planWritingUploads(0, ['a', 'b', 'c', 'd', 'e', 'f'])).toEqual({
      accepted: ['a', 'b', 'c', 'd', 'e'],
      rejected: 1,
    });
    expect(planWritingUploads(5, ['x'])).toEqual({
      accepted: [],
      rejected: 1,
    });
    expect(planWritingUploads(3, ['a', 'b'])).toEqual({
      accepted: ['a', 'b'],
      rejected: 0,
    });
  });

  it('states the five-file upload limit', () => {
    expect(writingFileLimitMessage()).toBe('At most 5 files per user.');
  });

  it('allows Word, PowerPoint, Excel, OpenDocument, RTF, EPUB, CSV, and PDF', () => {
    expect(isAllowedWritingFilename('memo.docx')).toBe(true);
    expect(isAllowedWritingFilename('brief.doc')).toBe(true);
    expect(isAllowedWritingFilename('sheet.XLSX')).toBe(true);
    expect(isAllowedWritingFilename('deck.pptx')).toBe(true);
    expect(isAllowedWritingFilename('report.odt')).toBe(true);
    expect(isAllowedWritingFilename('notes.rtf')).toBe(true);
    expect(isAllowedWritingFilename('book.epub')).toBe(true);
    expect(isAllowedWritingFilename('rows.csv')).toBe(true);
    expect(isAllowedWritingFilename('scan.pdf')).toBe(true);
    expect(isPlainTextFilename('notes.md')).toBe(true);
    expect(isImageFilename('photo.JPG')).toBe(true);
  });

  it('rejects text, images, archives, and unknown types', () => {
    expect(isAllowedWritingFilename('notes.txt')).toBe(false);
    expect(isAllowedWritingFilename('notes.md')).toBe(false);
    expect(isAllowedWritingFilename('photo.png')).toBe(false);
    expect(isAllowedWritingFilename('Dockerfile.pi')).toBe(false);
    expect(isAllowedWritingFilename('run.exe')).toBe(false);
    expect(isAllowedWritingFilename('pack.zip')).toBe(false);
    expect(isAllowedWritingFilename('no-extension')).toBe(false);
  });

  it('limits the file picker to the same document types', () => {
    expect(WRITING_ACCEPT).toContain('.docx');
    expect(WRITING_ACCEPT).toContain('.pptx');
    expect(WRITING_ACCEPT).toContain('.xlsx');
    expect(WRITING_ACCEPT).toContain('.odt');
    expect(WRITING_ACCEPT).toContain('.rtf');
    expect(WRITING_ACCEPT).toContain('.epub');
    expect(WRITING_ACCEPT).toContain('.csv');
    expect(WRITING_ACCEPT).toContain('.pdf');
    expect(WRITING_ACCEPT).not.toContain('.txt');
    expect(WRITING_ACCEPT).not.toContain('.png');
    expect(WRITING_ACCEPT).not.toContain('.md');
  });

  it('states the allowed document types', () => {
    expect(writingUnsupportedTypeMessage()).toMatch(
      /Word, PowerPoint, Excel, OpenDocument, RTF, EPUB, CSV, or PDF/,
    );
  });

  it('keeps only allowed document types from a mixed pick', () => {
    expect(
      filterAllowedWritingFiles([
        { name: 'memo.docx' },
        { name: 'photo.png' },
        { name: 'rows.csv' },
        { name: 'notes.txt' },
      ]),
    ).toEqual({
      accepted: [{ name: 'memo.docx' }, { name: 'rows.csv' }],
      rejected: 2,
    });
  });

  it('strips path components from display names', () => {
    expect(displayFilename('C:\\\\temp\\\\a.docx')).toBe('a.docx');
    expect(displayFilename('../../etc/passwd.txt')).toBe('passwd.txt');
  });

  it('sanitizes user ids to a single path segment', () => {
    expect(writingOwnerDir('42')).toBe('42');
    expect(writingOwnerDir('user/../x')).toBe('user_.._x');
    expect(writingOwnerDir('')).toBe('');
  });

  it('formats file sizes like the FILES panel', () => {
    expect(formatWritingBytes(0)).toBe('0 B');
    expect(formatWritingBytes(375 * 1024 + 205)).toBe('375.2 KB');
    expect(formatWritingBytes(1.3 * 1024 * 1024)).toBe('1.3 MB');
    expect(formatWritingBytes(undefined)).toBe('');
  });

  it('exposes sizeBytes on the public writing file view', () => {
    const item: WritingAttachment = {
      fileId: 'f1',
      userId: '1',
      name: 'policy.pdf',
      status: 'ready',
      relDir: 'policy-f1',
      parts: 1,
      charCount: 12,
      format: 'pdf',
      sizeBytes: 1_300_000,
      createdAt: '2026-08-23T00:00:00.000Z',
    };
    expect(toPublicWritingAttachment(item).sizeBytes).toBe(1_300_000);
  });
});
