import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  readWcmsWorkingHtml,
  saveWcmsWorkingHtml,
} from './wcmsHtmlStore';

describe('wcms working HTML store', () => {
  const prev = process.env.HTML_PAGES_ROOT;
  let root: string | undefined;

  afterEach(() => {
    if (prev === undefined) delete process.env.HTML_PAGES_ROOT;
    else process.env.HTML_PAGES_ROOT = prev;
    if (root) rmSync(root, { recursive: true, force: true });
  });

  it('round-trips a working copy per user, content id, and page', () => {
    root = mkdtempSync(join(tmpdir(), 'wcms-html-'));
    process.env.HTML_PAGES_ROOT = root;
    const bind = { wcmsContentId: 15, pageIndex: 1, lang: 'en' as const };
    expect(readWcmsWorkingHtml('42', bind)).toBeNull();
    saveWcmsWorkingHtml({
      userId: '42',
      bind,
      html: '<p>edited</p>',
    });
    expect(readWcmsWorkingHtml('42', bind)).toBe('<p>edited</p>');
    expect(readWcmsWorkingHtml('99', bind)).toBeNull();
    expect(
      readWcmsWorkingHtml('42', { wcmsContentId: 15, pageIndex: 0, lang: 'en' }),
    ).toBeNull();
  });

  it('rejects a save whose revision is older than the stored copy', () => {
    root = mkdtempSync(join(tmpdir(), 'wcms-html-rev-'));
    process.env.HTML_PAGES_ROOT = root;
    const bind = { wcmsContentId: 15, pageIndex: 0, lang: 'en' as const };
    expect(
      saveWcmsWorkingHtml({
        userId: '42',
        bind,
        html: '<p>first</p>',
        expectedRevision: 0,
      }),
    ).toEqual({ ok: true, revision: 1 });
    expect(
      saveWcmsWorkingHtml({
        userId: '42',
        bind,
        html: '<p>second</p>',
        expectedRevision: 1,
      }),
    ).toEqual({ ok: true, revision: 2 });
    expect(
      saveWcmsWorkingHtml({
        userId: '42',
        bind,
        html: '<p>stale</p>',
        expectedRevision: 1,
      }),
    ).toEqual({ ok: false, revision: 2 });
    expect(readWcmsWorkingHtml('42', bind)).toBe('<p>second</p>');
  });
});
