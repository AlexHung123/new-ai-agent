import { describe, expect, it } from 'vitest';
import {
  displayFilename,
  formatWritingBytes,
  isAllowedWritingFilename,
  isImageFilename,
  isPlainTextFilename,
  toPublicWritingAttachment,
  writingOwnerDir,
  type WritingAttachment,
} from './types';

describe('writing attachment filename rules', () => {
  it('allows office, pdf, csv, text, and images', () => {
    expect(isAllowedWritingFilename('memo.docx')).toBe(true);
    expect(isAllowedWritingFilename('sheet.XLSX')).toBe(true);
    expect(isAllowedWritingFilename('scan.pdf')).toBe(true);
    expect(isAllowedWritingFilename('notes.txt')).toBe(true);
    expect(isAllowedWritingFilename('notes.md')).toBe(true);
    expect(isAllowedWritingFilename('photo.png')).toBe(true);
    expect(isAllowedWritingFilename('Dockerfile.pi')).toBe(true);
    expect(isPlainTextFilename('notes.md')).toBe(true);
    expect(isImageFilename('photo.JPG')).toBe(true);
  });

  it('rejects archives and executables', () => {
    expect(isAllowedWritingFilename('run.exe')).toBe(false);
    expect(isAllowedWritingFilename('pack.zip')).toBe(false);
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
