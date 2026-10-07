import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  htmlOwnerRoot,
  htmlPageAbs,
  htmlPagesRoot,
  isHtmlPageId,
} from './paths';

describe('html paths', () => {
  const prev = process.env.HTML_PAGES_ROOT;
  let root: string | undefined;

  afterEach(() => {
    if (prev === undefined) delete process.env.HTML_PAGES_ROOT;
    else process.env.HTML_PAGES_ROOT = prev;
    if (root) rmSync(root, { recursive: true, force: true });
  });

  it('uses HTML_PAGES_ROOT when set', () => {
    root = mkdtempSync(join(tmpdir(), 'hroot-'));
    process.env.HTML_PAGES_ROOT = root;
    expect(htmlPagesRoot()).toBe(root);
    expect(htmlOwnerRoot('user-42')).toBe(join(root, 'user-42'));
    expect(htmlPageAbs('user-42', 'abc123def')).toBe(
      join(root, 'user-42', 'abc123def.html'),
    );
  });

  it('sanitizes the owner directory', () => {
    expect(htmlOwnerRoot('user/../x')).toMatch(/user_.._x$/);
  });

  it('accepts hex page ids and rejects path segments', () => {
    expect(isHtmlPageId('a1b2c3d4e5f67890')).toBe(true);
    expect(isHtmlPageId('../etc/passwd')).toBe(false);
    expect(isHtmlPageId('ab')).toBe(false);
  });
});
