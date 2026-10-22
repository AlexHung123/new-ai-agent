import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  defaultFetchAsset,
  inlineHtmlAssets,
  resolveSafeAssetUrl,
} from './inlineHtmlAssets';

const assets: Record<string, string> = {
  'https://itms.example/itms/files/page.css': 'h1{color:red}',
  'https://itms.example/itms/files/page.js': 'window.ready=1;',
};

const fetchAsset = async (href: string, baseHref?: string) => {
  const url = resolveSafeAssetUrl(href, baseHref);
  if (!url) return null;
  return assets[url] ?? null;
};

describe('resolveSafeAssetUrl', () => {
  it('resolves root-relative paths against the ITMS origin', () => {
    expect(
      resolveSafeAssetUrl('/itms/files/page.css', 'https://itms.example/'),
    ).toBe('https://itms.example/itms/files/page.css');
  });

  it('rejects a different origin', () => {
    expect(
      resolveSafeAssetUrl(
        'https://evil.example/x.js',
        'https://itms.example/',
      ),
    ).toBeNull();
  });
});

describe('inlineHtmlAssets', () => {
  it('replaces stylesheet links with style tags', async () => {
    const html = await inlineHtmlAssets(
      '<link rel="stylesheet" href="/itms/files/page.css"><h1>Hi</h1>',
      { fetchAsset, baseHref: 'https://itms.example/' },
    );
    expect(html).toContain('<style');
    expect(html).toContain('h1{color:red}');
    expect(html).not.toMatch(/<link\b[^>]*stylesheet/i);
  });

  it('replaces external scripts with inline scripts', async () => {
    const html = await inlineHtmlAssets(
      '<p>x</p><script src="/itms/files/page.js"></script>',
      { fetchAsset, baseHref: 'https://itms.example/' },
    );
    expect(html).toContain('window.ready=1;');
    expect(html).not.toMatch(/<script[^>]+src=/i);
  });

  it('keeps already-inline style and script blocks', async () => {
    const source =
      '<style>.a{color:blue}</style><script>ok()</script><p>n</p>';
    const html = await inlineHtmlAssets(source, {
      fetchAsset,
      baseHref: 'https://itms.example/',
    });
    expect(html).toBe(source);
  });

  it('escapes closing script tags in fetched JS', async () => {
    const html = await inlineHtmlAssets(
      '<script src="/itms/files/page.js"></script>',
      {
        fetchAsset: async () => 'x</script><p>injected</p>',
        baseHref: 'https://itms.example/',
      },
    );
    expect(html).toContain('<\\/script>');
    expect(html).not.toContain('</script><p>injected</p>');
  });

  it('escapes closing style tags in fetched CSS', async () => {
    const html = await inlineHtmlAssets(
      '<link rel="stylesheet" href="/itms/files/page.css">',
      {
        fetchAsset: async () => 'x</style><p>injected</p>',
        baseHref: 'https://itms.example/',
      },
    );
    expect(html).toContain('<\\/style>');
    expect(html).not.toContain('</style><p>injected</p>');
  });

  it('stops after 20 inlined assets', async () => {
    let calls = 0;
    const links = Array.from(
      { length: 25 },
      (_, i) => `<link rel="stylesheet" href="/itms/files/${i}.css">`,
    ).join('');
    const html = await inlineHtmlAssets(links, {
      fetchAsset: async () => {
        calls += 1;
        return 'a{}';
      },
      baseHref: 'https://itms.example/',
    });
    expect(calls).toBe(20);
    expect(html.match(/<link\b/gi)?.length).toBe(5);
  });
});

describe('defaultFetchAsset', () => {
  const prevOrigin = process.env.ITMS_PUBLIC_ORIGIN;
  const prevSuffixes = process.env.ITMS_ASSET_HOST_SUFFIXES;

  afterEach(() => {
    if (prevOrigin === undefined) delete process.env.ITMS_PUBLIC_ORIGIN;
    else process.env.ITMS_PUBLIC_ORIGIN = prevOrigin;
    if (prevSuffixes === undefined) delete process.env.ITMS_ASSET_HOST_SUFFIXES;
    else process.env.ITMS_ASSET_HOST_SUFFIXES = prevSuffixes;
    vi.unstubAllGlobals();
  });

  it('does not request a client-supplied loopback origin', async () => {
    delete process.env.ITMS_PUBLIC_ORIGIN;
    const calls: string[] = [];
    vi.stubGlobal('fetch', async (url: string) => {
      calls.push(String(url));
      return new Response('pwned', { status: 200 });
    });
    const text = await defaultFetchAsset(
      'http://127.0.0.1/x.js',
      'http://127.0.0.1/',
    );
    expect(text).toBeNull();
    expect(calls).toEqual([]);
  });

  it('fetches relative assets from ITMS_PUBLIC_ORIGIN when the client origin is not allowed', async () => {
    process.env.ITMS_PUBLIC_ORIGIN = 'https://itms.example';
    const calls: string[] = [];
    vi.stubGlobal('fetch', async (url: string) => {
      calls.push(String(url));
      return new Response('h1{}', { status: 200 });
    });
    const text = await defaultFetchAsset('/itms/files/a.css', 'http://127.0.0.1/');
    expect(text).toBe('h1{}');
    expect(calls).toEqual(['https://itms.example/itms/files/a.css']);
  });

  it('allows a configured host suffix', async () => {
    delete process.env.ITMS_PUBLIC_ORIGIN;
    process.env.ITMS_ASSET_HOST_SUFFIXES = 'csb.ccgo.hksarg';
    const calls: string[] = [];
    vi.stubGlobal('fetch', async (url: string) => {
      calls.push(String(url));
      return new Response('ok', { status: 200 });
    });
    const text = await defaultFetchAsset(
      '/a.css',
      'https://dsptest.csb.ccgo.hksarg/itms/',
    );
    expect(text).toBe('ok');
    expect(calls).toEqual(['https://dsptest.csb.ccgo.hksarg/a.css']);
  });

  it('does not follow redirects', async () => {
    process.env.ITMS_PUBLIC_ORIGIN = 'https://itms.example';
    const calls: Array<{ url: string; redirect?: RequestRedirect }> = [];
    vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
      calls.push({ url: String(url), redirect: init?.redirect });
      return new Response(null, {
        status: 302,
        headers: { location: 'http://127.0.0.1/secret' },
      });
    });
    const text = await defaultFetchAsset('/a.css', 'https://itms.example/');
    expect(text).toBeNull();
    expect(calls).toEqual([
      { url: 'https://itms.example/a.css', redirect: 'manual' },
    ]);
  });
});
