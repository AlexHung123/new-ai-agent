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

describe('writing FILES explorer layout', () => {
  const css = readSrc('../../app/globals.css');

  it('gives each file row a fixed height so names cannot stack on each other', () => {
    const row = cssRule(css, '.writing-file-row');
    expect(row).toMatch(/height:\s*24px/);
    expect(row).toMatch(/overflow:\s*hidden/);
    expect(row).toMatch(/min-width:\s*0/);
  });

  it('keeps list items from shrinking inside the scroll pane', () => {
    const item = cssRule(css, '.writing-files-list li');
    expect(item).toMatch(/flex-shrink:\s*0/);
    expect(item).toMatch(/height:\s*24px/);
    expect(item).toMatch(/width:\s*100%/);
    expect(item).toMatch(/min-width:\s*0/);
  });

  it('scrolls the file list inside the remaining explorer height', () => {
    const list = cssRule(css, '.writing-files-list');
    expect(list).toMatch(/overflow-y:\s*auto/);
    expect(list).toMatch(/min-height:\s*0/);
    expect(list).toMatch(/flex:\s*1/);
  });

  it('overlays hover actions so @ mention cannot push rows into each other', () => {
    const mention = cssRule(css, '.writing-file-mention');
    expect(mention).toMatch(/position:\s*absolute/);
    const remove = cssRule(css, '.writing-file-remove');
    expect(remove).toMatch(/position:\s*absolute/);
  });

  it('truncates long file names instead of colliding with the size column', () => {
    const name = cssRule(css, '.writing-file-name');
    expect(name).toMatch(/text-overflow:\s*ellipsis/);
    expect(name).toMatch(/white-space:\s*nowrap/);
    expect(name).toMatch(/min-width:\s*0/);
  });

  it('stacks the explorer under the agent card in a leftover-height rail', () => {
    const rail = cssRule(css, '.writing-left-rail');
    expect(rail).toMatch(/flex-direction:\s*column/);
    const xl = readSrc('../../app/globals.css');
    expect(xl).toMatch(/\.writing-left-rail\s*\{[^}]*position:\s*fixed/s);
    expect(xl).toMatch(/\.writing-left-rail\s+\.writing-file-browser\s*\{[^}]*flex:\s*1/s);
  });

  it('keeps the writing agent card at the same art size as other agents', () => {
    const art = cssRule(css, '.agent-card-art');
    expect(art).toMatch(/aspect-ratio:\s*1/);
    expect(art).toMatch(/max-height:\s*16rem/);
    expect(css).not.toMatch(
      /\.writing-left-rail:has\([^)]*writing-file-browser[^)]*\)\s+\.agent-card-art/,
    );
    expect(css).toMatch(
      /\.writing-left-rail\s+\.agent-card\s*\{[^}]*flex:\s*0\s+0\s+auto/s,
    );
  });
});

describe('writing FILES explorer markup', () => {
  it('filters the list with a Search files field', () => {
    const src = readSrc('../../components/WritingFileBrowser.tsx');
    expect(src).toMatch(/filterFilesByQuery/);
    expect(src).toMatch(/Search files/);
  });

  it('places the explorer in the left rail instead of a short overlapping card', () => {
    expect(readSrc('../../components/ChatWindow.tsx')).toMatch(/WritingLeftRail/);
    expect(readSrc('../../components/EmptyChat.tsx')).toMatch(/WritingLeftRail/);
    expect(readSrc('../../components/Chat.tsx')).not.toMatch(/WritingFileBrowser/);
  });
});
