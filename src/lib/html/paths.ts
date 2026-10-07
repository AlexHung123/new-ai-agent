import { isAbsolute, join, resolve } from 'node:path';
import { writingOwnerDir } from '@/lib/writing/types';
import { isHtmlPageId } from './htmlPageId';

export { isHtmlPageId };

export function htmlPagesRoot(): string {
  const raw = (process.env.HTML_PAGES_ROOT || '').trim();
  if (!raw) return resolve(process.cwd(), 'data', 'html-pages');
  return isAbsolute(raw) ? resolve(raw) : resolve(process.cwd(), raw);
}

export function htmlOwnerRoot(userId: string): string {
  const dir = writingOwnerDir(userId);
  if (!dir) throw new Error('Missing user id for HTML pages');
  return join(htmlPagesRoot(), dir);
}

export function htmlPageAbs(userId: string, pageId: string): string {
  if (!isHtmlPageId(pageId)) {
    throw new Error('Invalid HTML page id');
  }
  return join(htmlOwnerRoot(userId), `${pageId}.html`);
}
