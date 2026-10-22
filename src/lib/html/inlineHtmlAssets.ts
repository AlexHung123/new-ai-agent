import { allowedAssetOrigin } from './allowedAssetOrigin';

const MAX_ASSET_CHARS = 1_000_000;
const MAX_INLINED_ASSETS = 20;

export type FetchHtmlAsset = (
  href: string,
  baseHref?: string,
) => Promise<string | null>;

function withTrailingSlash(href: string): string {
  return href.endsWith('/') ? href : `${href}/`;
}

function getAttr(tag: string, name: string): string | undefined {
  const re = new RegExp(
    `\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    'i',
  );
  const m = tag.match(re);
  return m?.[1] ?? m?.[2] ?? m?.[3];
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function escapeScriptText(js: string): string {
  return js.replace(/<\/script/gi, '<\\/script');
}

function escapeStyleText(css: string): string {
  return css.replace(/<\/style/gi, '<\\/style');
}

function isStylesheetLink(tag: string): boolean {
  const rel = (getAttr(tag, 'rel') || '').toLowerCase();
  return rel.split(/\s+/).includes('stylesheet') && Boolean(getAttr(tag, 'href'));
}

export function resolveSafeAssetUrl(
  href: string,
  baseHref?: string,
  allowedOriginHref?: string,
): string | null {
  const raw = (href || '').trim();
  if (!raw || /^(data|javascript|blob):/i.test(raw)) return null;
  const resolveBase = (baseHref || allowedOriginHref || '').trim();
  const allowBase = (allowedOriginHref || baseHref || '').trim();
  if (!resolveBase || !allowBase) return null;
  let url: URL;
  let allowed: URL;
  try {
    url = new URL(raw, withTrailingSlash(resolveBase));
    allowed = new URL(allowBase);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  if (url.origin !== allowed.origin) return null;
  return url.href;
}

export async function defaultFetchAsset(
  href: string,
  baseHref?: string,
  allowedOrigin?: string,
): Promise<string | null> {
  const origin = allowedAssetOrigin(allowedOrigin || baseHref);
  const url = resolveSafeAssetUrl(href, origin, origin);
  if (!url) return null;
  try {
    const res = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(8000),
    });
    if (res.status >= 300 && res.status < 400) return null;
    if (!res.ok) return null;
    if (res.url && !resolveSafeAssetUrl(res.url, origin, origin)) return null;
    const text = await res.text();
    return text.length > MAX_ASSET_CHARS ? text.slice(0, MAX_ASSET_CHARS) : text;
  } catch {
    return null;
  }
}

export async function inlineHtmlAssets(
  html: string,
  opts?: {
    fetchAsset?: FetchHtmlAsset;
    baseHref?: string;
    allowedOrigin?: string;
  },
): Promise<string> {
  const baseHref =
    allowedAssetOrigin(opts?.allowedOrigin || opts?.baseHref) ||
    opts?.baseHref ||
    opts?.allowedOrigin;
  const allowedOrigin = allowedAssetOrigin(opts?.allowedOrigin || opts?.baseHref) || baseHref;
  let fetched = 0;
  const fetchOne: FetchHtmlAsset =
    opts?.fetchAsset ??
    ((href, hrefBase) => defaultFetchAsset(href, hrefBase, allowedOrigin));
  const fetchAsset: FetchHtmlAsset = async (href, hrefBase) => {
    if (fetched >= MAX_INLINED_ASSETS) return null;
    fetched += 1;
    return fetchOne(href, hrefBase);
  };
  let out = html || '';

  const replaceAll = async (
    pattern: RegExp,
    replacer: (tag: string) => Promise<string | null>,
  ) => {
    const matches = [...out.matchAll(pattern)];
    for (let i = matches.length - 1; i >= 0; i--) {
      const match = matches[i];
      const tag = match[0];
      const start = match.index ?? 0;
      const next = await replacer(tag);
      if (next == null) continue;
      out = out.slice(0, start) + next + out.slice(start + tag.length);
    }
  };

  await replaceAll(/<link\b[^>]*\/?>/gi, async (tag) => {
    if (!isStylesheetLink(tag)) return null;
    const href = getAttr(tag, 'href');
    if (!href) return null;
    const css = await fetchAsset(href, baseHref);
    if (css == null) return null;
    const media = getAttr(tag, 'media');
    const mediaAttr =
      media && media !== 'all' ? ` media="${escapeAttr(media)}"` : '';
    return `<style data-inlined-from="${escapeAttr(href)}"${mediaAttr}>\n${escapeStyleText(css)}\n</style>`;
  });

  await replaceAll(
    /<script\b[^>]*\bsrc\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)[^>]*>\s*<\/script>/gi,
    async (tag) => {
      const href = getAttr(tag, 'src');
      if (!href) return null;
      const js = await fetchAsset(href, baseHref);
      if (js == null) return null;
      return `<script data-inlined-from="${escapeAttr(href)}">${escapeScriptText(js)}</script>`;
    },
  );

  return out;
}
