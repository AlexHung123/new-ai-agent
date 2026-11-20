import { describe, expect, it } from 'vitest';
import {
  buildRelativePath,
  isSafeRelativePath,
  joinKnowledgePath,
  markdownName,
  sanitizePathSegment,
} from './paths';

describe('sanitizePathSegment', () => {
  it('trims and accepts a simple folder name', () => {
    expect(sanitizePathSegment('  2024  ')).toBe('2024');
  });

  it('rejects empty, dots, slashes, and control characters', () => {
    expect(sanitizePathSegment('')).toBeNull();
    expect(sanitizePathSegment('   ')).toBeNull();
    expect(sanitizePathSegment('.')).toBeNull();
    expect(sanitizePathSegment('..')).toBeNull();
    expect(sanitizePathSegment('a/b')).toBeNull();
    expect(sanitizePathSegment('a\\b')).toBeNull();
    expect(sanitizePathSegment('a\nb')).toBeNull();
  });
});

describe('isSafeRelativePath', () => {
  it('accepts nested folder paths', () => {
    expect(isSafeRelativePath('contracts/2024')).toBe(true);
    expect(isSafeRelativePath('Report.PDF')).toBe(true);
  });

  it('rejects traversal, absolute, backslash, and empty paths', () => {
    expect(isSafeRelativePath('')).toBe(false);
    expect(isSafeRelativePath('/abs')).toBe(false);
    expect(isSafeRelativePath('foo/../bar')).toBe(false);
    expect(isSafeRelativePath('a\\b')).toBe(false);
    expect(isSafeRelativePath('contracts/2024/../../etc/passwd')).toBe(false);
  });
});

describe('joinKnowledgePath and buildRelativePath', () => {
  it('joins from root and from a parent', () => {
    expect(joinKnowledgePath('', '2024')).toBe('2024');
    expect(joinKnowledgePath('contracts', '2024')).toBe('contracts/2024');
  });

  it('builds an upload relative_path from a folder and filename', () => {
    expect(buildRelativePath('', 'Report.PDF')).toBe('Report.PDF');
    expect(buildRelativePath('contracts/2024', 'report.pdf')).toBe(
      'contracts/2024/report.pdf',
    );
  });

  it('strips directory components from the filename so .. cannot escape', () => {
    expect(buildRelativePath('docs', '../../evil.pdf')).toBe('docs/evil.pdf');
    expect(isSafeRelativePath(buildRelativePath('docs', '../../evil.pdf'))).toBe(
      true,
    );
  });
});

describe('markdownName', () => {
  it('replaces the extension with .md', () => {
    expect(markdownName('report.pdf')).toBe('report.md');
    expect(markdownName('notes.md')).toBe('notes.md');
    expect(markdownName('file')).toBe('file.md');
  });
});
