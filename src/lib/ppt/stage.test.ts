import { describe, expect, it } from 'vitest';
import { assignOutlineIds, parseOutline } from './outline';
import { structuralPlans } from './plan';
import {
  advanceBlockReason,
  toolAllowedInStage,
} from './stage';
import { emptyPptDeck } from './types';

describe('stage gates', () => {
  it('rejects outline tools during discover', () => {
    expect(toolAllowedInStage('commit_outline', 'discover')).toBe(false);
    expect(toolAllowedInStage('ask_user', 'discover')).toBe(true);
    expect(toolAllowedInStage('commit_page_plan', 'plan')).toBe(true);
    expect(toolAllowedInStage('set_theme', 'plan')).toBe(false);
  });

  it('blocks skipping to design without page plans', () => {
    const outline = assignOutlineIds(
      parseOutline({
        cover: { title: 'T', sub_title: '' },
        parts: [{ part_title: 'A', pages: [{ title: 'One' }] }],
        end_page: { title: 'End' },
      }),
    );
    const deck = {
      ...emptyPptDeck(),
      stage: 'plan' as const,
      brief: {
        audience: 'a',
        purpose: 'p',
        pages: 8,
        style: 'navy',
        defaultsApplied: true,
      },
      outline,
      pages: structuralPlans(outline),
    };
    expect(advanceBlockReason(deck, 'design')).toMatch(/missing p-01/);
    deck.pages['p-01'] = {
      page_id: 'p-01',
      title: 'One',
      intent: 'hero',
      layout: 'hero',
      kind: 'content',
      cards: [{ id: 'c1', role: 'hero', span: 'full', title: 'One', body: '' }],
    };
    expect(advanceBlockReason(deck, 'design')).toBeNull();
  });
});
