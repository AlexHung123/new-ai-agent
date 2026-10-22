function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function withTrailingSlash(href: string): string {
  return href.endsWith('/') ? href : `${href}/`;
}

const PREVIEW_CSP =
  "default-src 'none'; img-src * data: blob:; media-src *; font-src * data:; script-src 'unsafe-inline'; style-src 'unsafe-inline';";

function previewHeadTags(baseHref?: string): string {
  const baseTag =
    typeof baseHref === 'string' && baseHref.trim()
      ? `<base href="${escapeAttr(withTrailingSlash(baseHref.trim()))}">`
      : '';
  return (
    `${baseTag}<meta http-equiv="Content-Security-Policy" content="${PREVIEW_CSP}">` +
    `<meta charset="utf-8">`
  );
}

export function wrapHtmlPreview(html: string, baseHref?: string): string {
  const inject = previewHeadTags(baseHref);
  const source = html || '';
  if (/<html[\s>]/i.test(source)) {
    if (/<head[\s>]/i.test(source)) {
      return source.replace(/<head([^>]*)>/i, `<head$1>${inject}`);
    }
    return source.replace(/<html([^>]*)>/i, `<html$1><head>${inject}</head>`);
  }
  return (
    `<!DOCTYPE html><html><head>${inject}</head>` +
    `<body>${source}</body></html>`
  );
}

export function itmsPublicOrigin(): string {
  return (process.env.ITMS_PUBLIC_ORIGIN || '').trim();
}
