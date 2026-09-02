import { describe, expect, it } from 'vitest';
import { cardBoxesForPlan, parseCssGrid, pxToInch } from './exportLayout';
import type { PptPagePlan } from './types';

function plan(
  layout: PptPagePlan['layout'],
  n: number,
  kind: PptPagePlan['kind'] = 'content',
): PptPagePlan {
  return {
    page_id: 'p-01',
    title: 'Title',
    intent: 'test',
    layout,
    kind,
    cards: Array.from({ length: n }, (_, i) => ({
      id: `c${i + 1}`,
      role: 'body',
      span: '1/3',
      title: `Card ${i + 1}`,
      body: 'Body',
    })),
  };
}

describe('parseCssGrid', () => {
  it('parses fr tracks and repeat()', () => {
    expect(parseCssGrid('1fr / 2fr 1fr')).toEqual({
      rows: [1],
      cols: [2, 1],
    });
    expect(parseCssGrid('repeat(4, 1fr) / 1fr')).toEqual({
      rows: [1, 1, 1, 1],
      cols: [1],
    });
  });
});

describe('cardBoxesForPlan', () => {
  it('keeps three_col cards on one row with a 24px gap', () => {
    const boxes = cardBoxesForPlan(plan('three_col', 3));
    expect(boxes).toHaveLength(3);
    expect(boxes[0]!.y).toBeCloseTo(boxes[1]!.y, 5);
    expect(boxes[1]!.y).toBeCloseTo(boxes[2]!.y, 5);
    const gap = boxes[1]!.x - (boxes[0]!.x + boxes[0]!.w);
    expect(gap).toBeCloseTo(pxToInch(24), 5);
  });

  it('puts hero_plus_row hero across the full width', () => {
    const boxes = cardBoxesForPlan(plan('hero_plus_row', 4));
    expect(boxes).toHaveLength(4);
    const hero = boxes[0]!;
    const left = boxes[1]!;
    const right = boxes[3]!;
    expect(hero.w).toBeGreaterThan(left.w * 2);
    expect(hero.y).toBeLessThan(left.y);
    expect(left.x).toBeCloseTo(hero.x, 5);
    expect(right.x + right.w).toBeCloseTo(hero.x + hero.w, 4);
  });

  it('stacks toc cards vertically', () => {
    const boxes = cardBoxesForPlan(plan('toc', 4));
    expect(boxes[0]!.x).toBeCloseTo(boxes[1]!.x, 5);
    expect(boxes[1]!.y).toBeGreaterThan(boxes[0]!.y);
  });
});
