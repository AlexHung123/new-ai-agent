import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readSrc(...parts: string[]): string {
  return readFileSync(path.join(__dirname, ...parts), 'utf8');
}

function cssRule(css: string, selector: string): string {
  const normalized = css.replace(/\r\n/g, '\n');
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`${escaped}\\s*(?:,[\\s\\S]*?)?\\{`).exec(
    normalized,
  );
  expect(match, `missing ${selector}`).toBeTruthy();
  const open = normalized.indexOf('{', match!.index);
  const close = normalized.indexOf('}', open);
  return normalized.slice(open + 1, close);
}

describe('agent picker layout', () => {
  it('stacks cards in rows of at most five and scrolls vertically', () => {
    const page = readSrc('../../app/agents/page.tsx');
    const css = readSrc('../../app/globals.css');

    expect(page).toMatch(/agents-picker/);
    expect(page).toMatch(/agents-picker-scroll/);
    expect(page).toMatch(/agents-picker-grid/);
    expect(page).not.toMatch(/overflow-x-auto/);
    expect(page).not.toMatch(/flex-nowrap/);
    expect(page).not.toMatch(/w-\[18rem\]/);

    const frame = cssRule(css, '.app-main > div:has(.agents-picker)');
    expect(frame).toMatch(/width:\s*100%/);

    const scroll = cssRule(css, '.agents-picker-scroll');
    expect(scroll).toMatch(/overflow-x:\s*hidden/);
    expect(scroll).toMatch(/overflow-y:\s*auto/);
    expect(scroll).toMatch(/min-height:\s*0/);
    expect(scroll).not.toMatch(/container-type/);

    const grid = cssRule(css, '.agents-picker-grid');
    expect(grid).toMatch(/display:\s*grid/);

    expect(css).not.toMatch(/container-type:\s*inline-size/);
    expect(css).toMatch(
      /@media \(min-width: 90rem\) \{\s*\.agents-picker-grid \{\s*grid-template-columns:\s*repeat\(5,\s*minmax\(0,\s*1fr\)\)/,
    );
    expect(css).not.toMatch(/repeat\(6,/);
  });
});
