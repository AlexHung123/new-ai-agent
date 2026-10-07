import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readSrc(...parts: string[]): string {
  return readFileSync(path.join(__dirname, ...parts), 'utf8');
}

function cssRule(css: string, selector: string): string {
  const start = css.indexOf(`${selector} {`);
  expect(start).toBeGreaterThanOrEqual(0);
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  return css.slice(open + 1, close);
}

describe('chat column layout', () => {
  const css = readSrc('../../app/globals.css');

  it('keeps the composer in document flow so it cannot cover messages', () => {
    const dock = cssRule(css, '.wiki-chat-composer-dock');
    expect(dock).not.toMatch(/position:\s*fixed/);
  });

  it('scrolls the full-width message list so the scrollbar sits on the pane edge', () => {
    const list = cssRule(css, '.message-list');
    expect(list).toMatch(/width:\s*100%/);
    expect(list).toMatch(/overflow-y:\s*auto/);
    expect(list).toMatch(/min-height:\s*0/);
  });

  it('lets chat pages fill the pane instead of max-w-screen-lg', () => {
    const sidebar = readSrc('../../components/Sidebar.tsx');
    const layout = readSrc('../../components/Layout.tsx');
    expect(sidebar).toMatch(/flush=\{/);
    expect(layout).toMatch(/flush/);
    expect(layout).toMatch(/max-w-none/);
  });

  it('gives the FILES rail leftover height by filling the viewport column', () => {
    expect(readSrc('../../components/ChatWindow.tsx')).toMatch(/h-\[100dvh\]/);
    expect(readSrc('../../components/Chat.tsx')).toMatch(/isScrollAtTail/);
  });
});
