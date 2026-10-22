import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readWcmsWorkingHtml } from '@/lib/html/wcmsHtmlStore';
import { runWithHtmlAgentTurn } from '../runtime/htmlAgentTurnContext';
import { createHtmlGetTool, createHtmlSetTool } from './htmlDocumentTool';

describe('html_get / html_set', () => {
  const prev = process.env.HTML_PAGES_ROOT;
  let root: string | undefined;

  afterEach(() => {
    if (prev === undefined) delete process.env.HTML_PAGES_ROOT;
    else process.env.HTML_PAGES_ROOT = prev;
    if (root) rmSync(root, { recursive: true, force: true });
  });

  it('returns the bound document', async () => {
    const tool = createHtmlGetTool();
    const result = await runWithHtmlAgentTurn(
      {
        userId: '42',
        bind: { wcmsContentId: 7, pageIndex: 0, lang: 'en' },
        html: '<p>from db</p>',
      },
      () => tool.execute('t1', {}),
    );
    expect(result.details).toMatchObject({
      ok: true,
      html: '<p>from db</p>',
      wcmsContentId: 7,
    });
  });

  it('writes html_set to the working copy and emits the new html', async () => {
    root = mkdtempSync(join(tmpdir(), 'html-set-'));
    process.env.HTML_PAGES_ROOT = root;
    const emitted: string[] = [];
    const tool = createHtmlSetTool();
    const bind = { wcmsContentId: 7, pageIndex: 0, lang: 'en' as const };
    const result = await runWithHtmlAgentTurn(
      {
        userId: '42',
        bind,
        html: '<p>old</p>',
        emitHtml: (html) => emitted.push(html),
      },
      () => tool.execute('t1', { html: '<script>ok()</script><p>new</p>' }),
    );
    expect(result.details).toMatchObject({ ok: true });
    expect(emitted).toEqual(['<script>ok()</script><p>new</p>']);
    expect(readWcmsWorkingHtml('42', bind)).toBe(
      '<script>ok()</script><p>new</p>',
    );
  });

  it('errors when no HTML turn is bound', async () => {
    const result = await createHtmlSetTool().execute('t1', { html: '<p>x</p>' });
    expect(result.details).toMatchObject({ ok: false });
  });

  it('rejects a much shorter document unless the user asked to delete', async () => {
    root = mkdtempSync(join(tmpdir(), 'html-set-shrink-'));
    process.env.HTML_PAGES_ROOT = root;
    const tool = createHtmlSetTool();
    const bind = { wcmsContentId: 7, pageIndex: 0, lang: 'en' as const };
    const previous = `<p>${'a'.repeat(400)}</p>`;
    const result = await runWithHtmlAgentTurn(
      {
        userId: '42',
        bind,
        html: previous,
        userMessage: 'Make the heading larger',
      },
      () => tool.execute('t1', { html: '<p>short</p>' }),
    );
    expect(result.details).toMatchObject({ ok: false });
    expect(readWcmsWorkingHtml('42', bind)).toBeNull();
  });

  it('allows a short replacement when the user asked to delete', async () => {
    root = mkdtempSync(join(tmpdir(), 'html-set-delete-'));
    process.env.HTML_PAGES_ROOT = root;
    const tool = createHtmlSetTool();
    const bind = { wcmsContentId: 7, pageIndex: 0, lang: 'en' as const };
    const result = await runWithHtmlAgentTurn(
      {
        userId: '42',
        bind,
        html: `<p>${'a'.repeat(400)}</p>`,
        userMessage: 'Delete the extra paragraphs',
      },
      () => tool.execute('t1', { html: '<p>kept</p>' }),
    );
    expect(result.details).toMatchObject({ ok: true });
    expect(readWcmsWorkingHtml('42', bind)).toBe('<p>kept</p>');
  });

  it('returns an error instead of clipping a huge document', async () => {
    const tool = createHtmlSetTool();
    const result = await runWithHtmlAgentTurn(
      {
        userId: '42',
        bind: { wcmsContentId: 7, pageIndex: 0, lang: 'en' },
        html: '<p>old</p>',
      },
      () => tool.execute('t1', { html: 'x'.repeat(400_001) }),
    );
    expect(result.details).toMatchObject({ ok: false });
    expect(String((result.details as { error?: string }).error)).toMatch(/400000|too large/i);
  });

  it('inlines relative assets from the turn file base', async () => {
    const prevOrigin = process.env.ITMS_PUBLIC_ORIGIN;
    const prevSuffixes = process.env.ITMS_ASSET_HOST_SUFFIXES;
    process.env.ITMS_PUBLIC_ORIGIN = 'https://itms.example';
    process.env.ITMS_ASSET_HOST_SUFFIXES = 'csb.ccgo.hksarg';
    const calls: string[] = [];
    vi.stubGlobal('fetch', async (url: string) => {
      calls.push(String(url));
      return new Response('window.fromItms=1', { status: 200 });
    });
    try {
      const tool = createHtmlSetTool();
      const result = await runWithHtmlAgentTurn(
        {
          userId: '42',
          bind: null,
          html: '<p>old</p>',
          fileBaseHref: 'https://dsptest.csb.ccgo.hksarg',
        },
        () =>
          tool.execute('t1', {
            html: '<script src="/itms/files/a.js"></script><p>new</p>',
          }),
      );
      expect(result.details).toMatchObject({ ok: true });
      expect(calls).toEqual([
        'https://dsptest.csb.ccgo.hksarg/itms/files/a.js',
      ]);
    } finally {
      if (prevOrigin === undefined) delete process.env.ITMS_PUBLIC_ORIGIN;
      else process.env.ITMS_PUBLIC_ORIGIN = prevOrigin;
      if (prevSuffixes === undefined) delete process.env.ITMS_ASSET_HOST_SUFFIXES;
      else process.env.ITMS_ASSET_HOST_SUFFIXES = prevSuffixes;
      vi.unstubAllGlobals();
    }
  });
});
