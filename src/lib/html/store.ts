import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { htmlPageAbs } from './paths';

export function saveHtmlPage(opts: {
  userId: string;
  pageId: string;
  html: string;
}): void {
  const abs = htmlPageAbs(opts.userId, opts.pageId);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, opts.html, 'utf8');
}

export function readHtmlPage(opts: {
  userId: string;
  pageId: string;
}): string | null {
  try {
    return readFileSync(htmlPageAbs(opts.userId, opts.pageId), 'utf8');
  } catch {
    return null;
  }
}
