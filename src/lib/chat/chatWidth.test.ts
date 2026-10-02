import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readCss(): string {
  return readFileSync(path.join(__dirname, '../../app/globals.css'), 'utf8');
}

function cssRule(css: string, selector: string): string {
  const start = css.indexOf(`${selector} {`);
  expect(start).toBeGreaterThanOrEqual(0);
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  return css.slice(open + 1, close);
}

describe('chat column width', () => {
  it('matches pi-web chat content max width for messages and the empty composer', () => {
    const css = readCss();
    expect(css).toMatch(/--chat-content-max-width:\s*820px/);
    expect(cssRule(css, '.message-list')).toMatch(
      /width:\s*min\(100%,\s*var\(--chat-content-max-width/,
    );
    expect(cssRule(css, '.welcome-wiki')).toMatch(
      /width:\s*min\(100%,\s*var\(--chat-content-max-width/,
    );
  });
});
