import { describe, expect, it } from 'vitest';
import {
  assignOutlineIds,
  extractOutlinePayload,
  listOutlinePages,
  parseOutline,
} from './outline';

const SAMPLE = `[PPT_OUTLINE]
{
  "ppt_outline": {
    "cover": { "title": "内网 PPT Agent", "sub_title": "顾问到设计" },
    "table_of_contents": { "title": "目录", "content": ["背景", "方案"] },
    "parts": [
      {
        "part_title": "背景",
        "pages": [{ "title": "问题" }, { "title": "约束" }]
      },
      {
        "part_title": "方案",
        "pages": [{ "title": "流程" }]
      }
    ],
    "end_page": { "title": "谢谢" }
  }
}
[/PPT_OUTLINE]`;

describe('parseOutline', () => {
  it('reads wrapped JSON and assigns ids', () => {
    const outline = assignOutlineIds(parseOutline(SAMPLE));
    expect(outline.cover.title).toBe('内网 PPT Agent');
    expect(outline.parts).toHaveLength(2);
    expect(outline.parts[0]?.pages.map((p) => p.page_id)).toEqual(['p-01', 'p-02']);
    expect(outline.parts[1]?.pages[0]?.page_id).toBe('p-03');
  });

  it('lists structural pages around content', () => {
    const outline = assignOutlineIds(parseOutline(SAMPLE));
    const pages = listOutlinePages(outline);
    expect(pages.map((p) => p.page_id)).toEqual([
      'p-cover',
      'p-toc',
      'p-s-01',
      'p-01',
      'p-02',
      'p-s-02',
      'p-03',
      'p-end',
    ]);
  });

  it('extracts the inner payload', () => {
    expect(extractOutlinePayload(SAMPLE)).toMatchObject({
      ppt_outline: { cover: { title: '内网 PPT Agent' } },
    });
  });
});
