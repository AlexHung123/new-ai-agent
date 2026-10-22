import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/html/wcmsContent', async () => {
  const actual = await vi.importActual<typeof import('./wcmsContent')>(
    './wcmsContent',
  );
  const loadWcmsPage = vi.fn(async ({ pageIndex }: { pageIndex: number }) => ({
    ok: true as const,
    wcmsContentId: 15,
    html: `<p>db-page-${pageIndex}</p>`,
    pageIndex,
    pageCount: 2,
    lang: 'en' as const,
    titleEn: 'From DB',
  }));
  return {
    ...actual,
    loadWcmsPage,
    loadWcmsEnglishPage: loadWcmsPage,
  };
});

import { GET, PUT } from '@/app/api/wcms-content/[id]/route';
import { POST as INLINE } from '@/app/api/wcms-content/inline/route';
import { loadWcmsPage } from '@/lib/html/wcmsContent';
import { readWcmsWorkingHtml } from './wcmsHtmlStore';

describe('GET/PUT /api/wcms-content/[id]', () => {
  const prev = process.env.HTML_PAGES_ROOT;
  let root: string | undefined;

  afterEach(() => {
    if (prev === undefined) delete process.env.HTML_PAGES_ROOT;
    else process.env.HTML_PAGES_ROOT = prev;
    if (root) rmSync(root, { recursive: true, force: true });
  });

  function request(
    id: string,
    opts?: { userId?: string; pageIndex?: string; method?: string; body?: unknown },
  ) {
    const headers = new Headers();
    if (opts?.userId) headers.set('x-user-id', opts.userId);
    const qs = opts?.pageIndex ? `?pageIndex=${opts.pageIndex}` : '';
    if (opts?.body != null) {
      headers.set('Content-Type', 'application/json');
    }
    return new Request(`http://localhost/itms/ai/api/wcms-content/${id}${qs}`, {
      method: opts?.method ?? 'GET',
      headers,
      body: opts?.body != null ? JSON.stringify(opts.body) : undefined,
    });
  }

  it('returns 401 without x-user-id', async () => {
    const res = await GET(request('15'), {
      params: Promise.resolve({ id: '15' }),
    });
    expect(res.status).toBe(401);
  });

  it('returns TinyMCE HTML from itmsdb', async () => {
    root = mkdtempSync(join(tmpdir(), 'wcms-api-'));
    process.env.HTML_PAGES_ROOT = root;
    const res = await GET(request('15', { userId: '42', pageIndex: '1' }), {
      params: Promise.resolve({ id: '15' }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.html).toBe('<p>db-page-1</p>');
    expect(data.pageIndex).toBe(1);
    expect(data.titleEn).toBe('From DB');
  });

  it('saves a working copy on PUT and prefers it on GET', async () => {
    root = mkdtempSync(join(tmpdir(), 'wcms-api-put-'));
    process.env.HTML_PAGES_ROOT = root;
    const put = await PUT(
      request('15', {
        userId: '42',
        method: 'PUT',
        body: { html: '<p>edited</p>', pageIndex: 1 },
      }),
      { params: Promise.resolve({ id: '15' }) },
    );
    expect(put.status).toBe(200);
    expect(
      readWcmsWorkingHtml('42', { wcmsContentId: 15, pageIndex: 1, lang: 'en' }),
    ).toBe(
      '<p>edited</p>',
    );
    const get = await GET(request('15', { userId: '42', pageIndex: '1' }), {
      params: Promise.resolve({ id: '15' }),
    });
    const data = await get.json();
    expect(data.html).toBe('<p>edited</p>');
  });

  it('rejects a PUT whose revision is older than the working copy', async () => {
    root = mkdtempSync(join(tmpdir(), 'wcms-api-rev-'));
    process.env.HTML_PAGES_ROOT = root;
    const first = await PUT(
      request('15', {
        userId: '42',
        method: 'PUT',
        body: { html: '<p>first</p>', pageIndex: 0, revision: 0 },
      }),
      { params: Promise.resolve({ id: '15' }) },
    );
    expect(first.status).toBe(200);
    const stale = await PUT(
      request('15', {
        userId: '42',
        method: 'PUT',
        body: { html: '<p>stale</p>', pageIndex: 0, revision: 0 },
      }),
      { params: Promise.resolve({ id: '15' }) },
    );
    expect(stale.status).toBe(409);
    expect(
      readWcmsWorkingHtml('42', { wcmsContentId: 15, pageIndex: 0, lang: 'en' }),
    ).toBe('<p>first</p>');
  });

  it('returns the working copy when itmsdb load throws', async () => {
    root = mkdtempSync(join(tmpdir(), 'wcms-api-dbdown-'));
    process.env.HTML_PAGES_ROOT = root;
    await PUT(
      request('15', {
        userId: '42',
        method: 'PUT',
        body: { html: '<p>offline</p>', pageIndex: 0 },
      }),
      { params: Promise.resolve({ id: '15' }) },
    );
    vi.mocked(loadWcmsPage).mockRejectedValueOnce(new Error('db down'));
    const get = await GET(request('15', { userId: '42', pageIndex: '0' }), {
      params: Promise.resolve({ id: '15' }),
    });
    expect(get.status).toBe(200);
    const data = await get.json();
    expect(data.html).toBe('<p>offline</p>');
  });

  it('inlines CSS and JS on POST /api/wcms-content/inline', async () => {
    const res = await INLINE(
      new Request('http://localhost/itms/ai/api/wcms-content/inline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': '42' },
        body: JSON.stringify({
          html: '<style>.x{color:red}</style><script>ok()</script><p>n</p>',
        }),
      }),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.html).toContain('<style>');
    expect(data.html).toContain('<script>ok()</script>');
  });
});
