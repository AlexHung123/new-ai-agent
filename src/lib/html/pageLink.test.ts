import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { htmlPageHref, parseHtmlPageIds } from './pageLink';

describe('html page links', () => {
  it('builds the app API href', () => {
    expect(htmlPageHref('abc123def')).toBe('/itms/ai/api/html-pages/abc123def');
  });

  it('extracts page ids from markdown links in a reply', () => {
    const ids = parseHtmlPageIds(
      'See the page.\n[open](/itms/ai/api/html-pages/abc123def)\n',
    );
    expect(ids).toEqual(['abc123def']);
  });

  it('ignores malformed ids', () => {
    expect(
      parseHtmlPageIds('[x](/itms/ai/api/html-pages/../secret)'),
    ).toEqual([]);
  });

  it('stays importable from client components (no node builtins)', () => {
    const src = readFileSync(path.join(__dirname, 'pageLink.ts'), 'utf8');
    expect(src).not.toMatch(/node:/);
    expect(src).not.toMatch(/from ['"]\.\/paths['"]/);
  });
});
