import { isHtmlPageId } from './htmlPageId';

export const HTML_PAGE_HREF_PREFIX = '/itms/ai/api/html-pages/';

export function htmlPageHref(pageId: string): string {
  return `${HTML_PAGE_HREF_PREFIX}${pageId}`;
}

export function parseHtmlPageIds(content: string): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  const re = /\/itms\/ai\/api\/html-pages\/([A-Za-z0-9_-]+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(content || ''))) {
    const id = match[1] ?? '';
    if (!isHtmlPageId(id) || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}
