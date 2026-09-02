import { describe, expect, it } from 'vitest';
import { renderPageHtml } from './render';
import type { PptPagePlan } from './types';

describe('renderPageHtml', () => {
  it('emits one card per plan card and no script tags', () => {
    const plan: PptPagePlan = {
      page_id: 'p-04',
      title: '竞争格局',
      intent: '并列',
      layout: 'three_col',
      kind: 'content',
      cards: [
        { id: 'c1', role: 'body', span: '1/3', title: '甲', body: '一' },
        { id: 'c2', role: 'body', span: '1/3', title: '乙', body: '二' },
        { id: 'c3', role: 'body', span: '1/3', title: '丙', body: '三' },
      ],
    };
    const html = renderPageHtml(plan, 'navy-bento');
    expect(html).toContain('ppt-card');
    expect(html.match(/ppt-card /g)?.length).toBe(3);
    expect(html).not.toContain('<script');
    expect(html).toContain('竞争格局');
  });
});
