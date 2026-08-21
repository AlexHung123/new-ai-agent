import { describe, expect, it } from 'vitest';
import {
  displayFilename,
  isAllowedWritingFilename,
  isImageFilename,
  isPlainTextFilename,
  writingOwnerDir,
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
});
