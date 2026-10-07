import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { GET } from '@/app/api/html-pages/[id]/route';
import { saveHtmlPage } from './store';

describe('GET /api/html-pages/[id]', () => {
  const prev = process.env.HTML_PAGES_ROOT;
  let root: string | undefined;

  afterEach(() => {
    if (prev === undefined) delete process.env.HTML_PAGES_ROOT;
    else process.env.HTML_PAGES_ROOT = prev;
    if (root) rmSync(root, { recursive: true, force: true });
  });

  function request(id: string, userId?: string) {
    const headers = new Headers();
    if (userId) headers.set('x-user-id', userId);
    return new Request(`http://localhost/itms/ai/api/html-pages/${id}`, {
      headers,
    });
  }

  it('returns 401 without x-user-id', async () => {
    const res = await GET(request('abc123de'), {
      params: Promise.resolve({ id: 'abc123de' }),
    });
    expect(res.status).toBe(401);
  });

  it('returns 404 for an invalid page id', async () => {
    const res = await GET(request('ab', '42'), {
      params: Promise.resolve({ id: 'ab' }),
    });
    expect(res.status).toBe(404);
  });

  it('returns 404 for another user\'s page', async () => {
    root = mkdtempSync(join(tmpdir(), 'hpage-'));
    process.env.HTML_PAGES_ROOT = root;
    saveHtmlPage({
      userId: '42',
      pageId: 'ownpage1',
      html: '<html><body>secret</body></html>',
    });
    const res = await GET(request('ownpage1', '99'), {
      params: Promise.resolve({ id: 'ownpage1' }),
    });
    expect(res.status).toBe(404);
  });

  it('returns the owner HTML with nosniff and a tight CSP', async () => {
    root = mkdtempSync(join(tmpdir(), 'hpage-'));
    process.env.HTML_PAGES_ROOT = root;
    saveHtmlPage({
      userId: '42',
      pageId: 'ownpage1',
      html: '<html><body>hello-page</body></html>',
    });
    const res = await GET(request('ownpage1', '42'), {
      params: Promise.resolve({ id: 'ownpage1' }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toMatch(/text\/html/);
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('Content-Security-Policy')).toMatch(
      /frame-ancestors 'self'/,
    );
    expect(await res.text()).toContain('hello-page');
  });
});
