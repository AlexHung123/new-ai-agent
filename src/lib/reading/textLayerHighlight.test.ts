import { describe, expect, it } from 'vitest';
import { quoteRectsInSpans, type TextSpanBox } from './textLayerHighlight';

function span(
  text: string,
  left: number,
  top = 10,
  width = text.length * 8,
): TextSpanBox {
  return { text, left, top, width, height: 12 };
}

describe('quoteRectsInSpans', () => {
  it('returns nothing for an empty quote', () => {
    expect(quoteRectsInSpans([span('Hello world', 0)], '')).toEqual([]);
  });

  it('matches across spans and collapsed whitespace', () => {
    const rects = quoteRectsInSpans(
      [span('Hello ', 0), span('world', 48)],
      'hello   world',
    );
    expect(rects.length).toBeGreaterThan(0);
    expect(rects[0]!.left).toBe(0);
    expect(rects[rects.length - 1]!.left + rects[rects.length - 1]!.width).toBe(
      48 + 5 * 8,
    );
  });

  it('ignores quotes that are not on the page', () => {
    expect(quoteRectsInSpans([span('Hello world', 0)], 'missing')).toEqual([]);
  });
});
