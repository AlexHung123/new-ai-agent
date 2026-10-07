import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { readHtmlPage, saveHtmlPage } from './store';

describe('html page store', () => {
  const prev = process.env.HTML_PAGES_ROOT;
  let root: string | undefined;

  afterEach(() => {
    if (prev === undefined) delete process.env.HTML_PAGES_ROOT;
    else process.env.HTML_PAGES_ROOT = prev;
    if (root) rmSync(root, { recursive: true, force: true });
  });

  it('writes and reads a page for the owner', () => {
    root = mkdtempSync(join(tmpdir(), 'hstore-'));
    process.env.HTML_PAGES_ROOT = root;
    saveHtmlPage({
      userId: '42',
      pageId: 'abc123def',
      html: '<html><body>hi</body></html>',
    });
    expect(readHtmlPage({ userId: '42', pageId: 'abc123def' })).toContain(
      '>hi<',
    );
  });

  it('returns null for a missing page', () => {
    root = mkdtempSync(join(tmpdir(), 'hstore-'));
    process.env.HTML_PAGES_ROOT = root;
    expect(readHtmlPage({ userId: '42', pageId: 'missing1' })).toBeNull();
  });

  it('refuses a path-like page id', () => {
    root = mkdtempSync(join(tmpdir(), 'hstore-'));
    process.env.HTML_PAGES_ROOT = root;
    expect(() =>
      saveHtmlPage({
        userId: '42',
        pageId: '../secret',
        html: 'x',
      }),
    ).toThrow(/Invalid HTML page id/);
  });
});
