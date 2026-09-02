import { describe, expect, it } from 'vitest';
import { parsePagePlan } from './plan';

describe('parsePagePlan', () => {
  it('rejects an invented layout', () => {
    expect(() =>
      parsePagePlan({
        layout: 'mixed',
        cards: [{ title: 'x', body: 'y' }],
      }),
    ).toThrow(/layout/);
  });

  it('clips copy and fills card ids from the layout slots', () => {
    const plan = parsePagePlan({
      page_id: 'p-04',
      title: '竞争格局',
      layout: 'three_col',
      cards: [
        { title: 'A'.repeat(50), body: 'B'.repeat(90) },
        { title: '二', body: '说明' },
        { title: '三', body: '说明' },
      ],
    });
    expect(plan.cards).toHaveLength(3);
    expect(plan.cards[0]?.id).toBe('c1');
    expect(plan.cards[0]?.title).toHaveLength(40);
    expect(plan.cards[0]?.body).toHaveLength(80);
  });

  it('requires three cards for three_col', () => {
    expect(() =>
      parsePagePlan({
        layout: 'three_col',
        cards: [{ title: 'only one' }],
      }),
    ).toThrow(/3/);
  });
});
