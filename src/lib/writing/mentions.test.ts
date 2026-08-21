import { describe, expect, it } from 'vitest';
import {
  atQueryAtCursor,
  filterFilesByQuery,
  insertMention,
  resolveMentionedFiles,
} from './mentions';
import type { WritingAttachment } from './types';

const files: WritingAttachment[] = [
  {
    fileId: 'a1',
    userId: 'u',
    name: 'file-sample.doc',
    status: 'ready',
    relDir: 'file-sample-a1',
    parts: 1,
    charCount: 10,
    format: 'doc',
    createdAt: 't',
  },
  {
    fileId: 'b2',
    userId: 'u',
    name: 'file-sample.xls',
    status: 'ready',
    relDir: 'file-sample-b2',
    parts: 1,
    charCount: 10,
    format: 'xls',
    createdAt: 't',
  },
];

describe('atQueryAtCursor', () => {
  it('detects an @ query at the cursor', () => {
    expect(atQueryAtCursor('hello @fi', 9)).toEqual({ start: 6, query: 'fi' });
    expect(atQueryAtCursor('@', 1)).toEqual({ start: 0, query: '' });
    expect(atQueryAtCursor('no mention', 10)).toBeNull();
  });
});

describe('filterFilesByQuery', () => {
  it('filters by filename substring', () => {
    expect(filterFilesByQuery(files, 'xls').map((f) => f.name)).toEqual([
      'file-sample.xls',
    ]);
    expect(filterFilesByQuery(files, '').length).toBe(2);
  });
});

describe('insertMention', () => {
  it('replaces the @query with @filename', () => {
    const next = insertMention('see @fi', 7, 4, 'file-sample.doc');
    expect(next.text).toBe('see @file-sample.doc ');
    expect(next.cursor).toBe('see @file-sample.doc '.length);
  });
});

describe('resolveMentionedFiles', () => {
  it('resolves @filename tokens against the user library', () => {
    const hits = resolveMentionedFiles(
      'rewrite @file-sample.doc using @file-sample.xls',
      files,
    );
    expect(hits.map((f) => f.fileId)).toEqual(['a1', 'b2']);
  });
});
