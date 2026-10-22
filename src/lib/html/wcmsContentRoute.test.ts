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

import { GET } from '@/app/api/wcms-content/[id]/route';
import { POST as INLINE } from '@/app/api/wcms-content/inline/route';
import { loadWcmsPage } from '@/lib/html/wcmsContent';

describe('GET /api/wcms-content/[id]', () => {
  afterEach(() => {
    vi.clearAllMocks();
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
    const res = await GET(request('15', { userId: '42', pageIndex: '1' }), {
      params: Promise.resolve({ id: '15' }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.html).toBe('<p>db-page-1</p>');
    expect(data.pageIndex).toBe(1);
    expect(data.titleEn).toBe('From DB');
  });

  it('returns 502 when itmsdb load throws', async () => {
    vi.mocked(loadWcmsPage).mockRejectedValueOnce(new Error('db down'));
    const get = await GET(request('15', { userId: '42', pageIndex: '0' }), {
      params: Promise.resolve({ id: '15' }),
    });
    expect(get.status).toBe(502);
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
