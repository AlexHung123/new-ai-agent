import { describe, expect, it } from 'vitest';
import {
  atQueryAtCursor,
  filterFilesByQuery,
  insertMention,
  insertMentionAtCursor,
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

  it('resolves @mentions whose filenames contain spaces', () => {
    const resume: WritingAttachment = {
      fileId: 'r1',
      userId: 'u',
      name: 'Yuan Shiwei Resume-English.pdf',
      status: 'ready',
      relDir: 'yuan-shiwei-resume-english-r1',
      parts: 1,
      charCount: 100,
      format: 'pdf',
      createdAt: 't',
    };
    const hits = resolveMentionedFiles(
      '@Yuan Shiwei Resume-English.pdf 帮我总结一下这份文件',
      [resume],
    );
    expect(hits.map((f) => f.fileId)).toEqual(['r1']);
  });
});

describe('insertMentionAtCursor', () => {
  it('completes an active @ query with the token', () => {
    const next = insertMentionAtCursor(
      'see @fi',
      7,
      'private/notes/file-sample.doc',
    );
    expect(next.text).toBe('see @private/notes/file-sample.doc ');
    expect(next.cursor).toBe('see @private/notes/file-sample.doc '.length);
  });

  it('inserts a mention at the cursor when no @ query is active', () => {
    const next = insertMentionAtCursor(
      'please summarize',
      16,
      'private/notes/file-sample.doc',
    );
    expect(next.text).toBe('please summarize @private/notes/file-sample.doc ');
    expect(next.cursor).toBe(
      'please summarize @private/notes/file-sample.doc '.length,
    );
  });

  it('adds a leading space when the cursor is after a word', () => {
    const next = insertMentionAtCursor('hello', 5, 'public/spr');
    expect(next.text).toBe('hello @public/spr ');
  });

  it('inserts at the last known cursor when the composer is empty', () => {
    const next = insertMentionAtCursor('', 0, 'private/writing/brief.pdf');
    expect(next.text).toBe('@private/writing/brief.pdf ');
    expect(next.cursor).toBe('@private/writing/brief.pdf '.length);
  });
});
