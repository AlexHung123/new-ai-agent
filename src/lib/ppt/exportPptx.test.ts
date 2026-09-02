import { describe, expect, it } from 'vitest';
import { exportPptxBuffer } from './exportPptx';
import { emptyPptDeck, type PptDeckState, type PptPagePlan } from './types';

function sampleDeck(): PptDeckState {
  const cover: PptPagePlan = {
    page_id: 'p-cover',
    title: '封面',
    intent: '封面',
    layout: 'cover',
    kind: 'cover',
    cards: [
      {
        id: 'c1',
        role: 'hero',
        span: 'full',
        title: '内网 PPT Agent',
        body: '顾问到设计',
      },
    ],
  };
  const three: PptPagePlan = {
    page_id: 'p-01',
    title: '三个原则',
    intent: '并列',
    layout: 'three_col',
    kind: 'content',
    cards: [
      { id: 'c1', role: 'body', span: '1/3', title: '先问清', body: '最多五问' },
      { id: 'c2', role: 'body', span: '1/3', title: '先可贴', body: '可撕可拖' },
      { id: 'c3', role: 'body', span: '1/3', title: '先锁格', body: '禁止增删卡' },
    ],
    notes: '演讲者备注',
  };
  return {
    ...emptyPptDeck(),
    stage: 'export',
    outline: {
      cover: { title: '内网 PPT Agent', sub_title: '顾问到设计' },
      table_of_contents: { title: '目录', content: ['原则'] },
      parts: [
        {
          part_id: 'part-01',
          part_title: '原则',
          pages: [{ page_id: 'p-01', title: '三个原则' }],
        },
      ],
      end_page: { title: '谢谢' },
    },
    pages: {
      'p-cover': cover,
      'p-01': three,
    },
    themeId: 'navy-bento',
  };
}

describe('exportPptxBuffer', () => {
  it('writes a zip-based pptx with one slide per planned page', async () => {
    const buf = await exportPptxBuffer(sampleDeck());
    expect(buf.subarray(0, 2).toString()).toBe('PK');
    expect(buf.length).toBeGreaterThan(2000);
    const names = buf.toString('binary');
    expect(names).toContain('ppt/slides/slide1.xml');
    expect(names).toContain('ppt/slides/slide2.xml');
    expect(names).not.toContain('ppt/slides/slide3.xml');
  });

  it('rejects an empty deck', async () => {
    await expect(exportPptxBuffer(emptyPptDeck())).rejects.toThrow(
      /No planned pages/,
    );
  });
});
