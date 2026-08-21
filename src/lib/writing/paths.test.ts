import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  attachmentSlug,
  writingFilesRoot,
  writingOwnerRoot,
  writingWorkspaceAbs,
} from './paths';

describe('writing paths', () => {
  const prev = process.env.WRITING_FILES_ROOT;
  let root: string | undefined;

  afterEach(() => {
    if (prev === undefined) delete process.env.WRITING_FILES_ROOT;
    else process.env.WRITING_FILES_ROOT = prev;
    if (root) rmSync(root, { recursive: true, force: true });
  });

  it('uses WRITING_FILES_ROOT when set', () => {
    root = mkdtempSync(join(tmpdir(), 'wroot-'));
    process.env.WRITING_FILES_ROOT = root;
    const userId = 'user-42';
    expect(writingFilesRoot()).toBe(root);
    expect(writingWorkspaceAbs(userId)).toBe(join(root, 'user-42', 'workspace'));
  });

  it('builds a stable slug from the filename and file id', () => {
    expect(attachmentSlug('Minutes of Meeting.docx', 'abcdef12zzzz')).toBe(
      'minutes-of-meeting-abcdef12',
    );
    expect(attachmentSlug('../../x.pdf', '12345678')).toMatch(/x-12345678/);
  });

  it('keeps the chat id as a single path segment', () => {
    expect(writingOwnerRoot('user/../x')).toBe(
      join(writingFilesRoot(), 'user_.._x'),
    );
  });
});
