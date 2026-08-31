import { describe, expect, it } from 'vitest';
import {
  findColumnGutter,
  layoutItemsFromTextContent,
  readingOrderText,
  stripRepeatedBands,
  type LayoutItem,
} from './readingOrder';

function item(
  str: string,
  x: number,
  y: number,
  width = str.length * 6,
): LayoutItem {
  return { str, x, y, width, height: 10 };
}

describe('layoutItemsFromTextContent', () => {
  it('flips PDF y so origin is top-left', () => {
    const items = layoutItemsFromTextContent(
      [{ str: 'Hi', transform: [1, 0, 0, 1, 10, 20], width: 12, height: 10 }],
      { width: 200, height: 800 },
    );
    expect(items[0]).toMatchObject({ str: 'Hi', x: 10, y: 780, width: 12 });
  });
});

describe('readingOrderText', () => {
  it('reads a single column top to bottom', () => {
    const text = readingOrderText(
      [item('B', 10, 40), item('A', 10, 10), item('line', 10, 10, 40)],
      200,
    );
    expect(text).toContain('A');
    expect(text.indexOf('A')).toBeLessThan(text.indexOf('B'));
  });

  it('reads left column then right when a gutter exists', () => {
    const left = [1, 2, 3, 4, 5, 6, 7, 8].map((n) =>
      item(`L${n}`, 10, n * 20),
    );
    const right = [1, 2, 3, 4, 5, 6, 7, 8].map((n) =>
      item(`R${n}`, 160, n * 20),
    );
    const pageWidth = 220;
    expect(findColumnGutter([...left, ...right], pageWidth)).not.toBeNull();
    const text = readingOrderText([...left, ...right], pageWidth);
    expect(text.indexOf('L8')).toBeLessThan(text.indexOf('R1'));
  });
});

describe('stripRepeatedBands', () => {
  it('drops repeating headers, footers, and page numbers', () => {
    const pages = [
      'CONFIDENTIAL\nHello body one\n3',
      'CONFIDENTIAL\nHello body two\n4',
      'CONFIDENTIAL\nHello body three\n5',
    ];
    const cleaned = stripRepeatedBands(pages);
    expect(cleaned[0]).toBe('Hello body one');
    expect(cleaned[1]).toBe('Hello body two');
    expect(cleaned.every((page) => !page.includes('CONFIDENTIAL'))).toBe(true);
  });

  it('does not strip unique first lines', () => {
    expect(stripRepeatedBands(['Title one\nBody', 'Other\nBody two'])[0]).toContain(
      'Title one',
    );
  });
});
