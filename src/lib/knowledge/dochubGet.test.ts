import { describe, expect, it, vi } from 'vitest';
import { getDochubMarkdown, sliceMarkdownLines } from './dochubGet';
import type { KnowledgeTreeNode } from './types';

const tree: KnowledgeTreeNode = {
  type: 'dir',
  name: '',
  path: '',
  children: [
    {
      type: 'dir',
      name: 'contracts',
      path: 'contracts',
      children: [
        {
          type: 'file',
          name: 'plan.docx',
          path: 'contracts/plan.docx',
          file: {
            id: 'p1',
            original_filename: 'plan.docx',
            inbox_relpath: 'contracts/plan.docx',
            markdown_relpath: 'contracts/plan.md',
            size_bytes: 10,
          },
        },
      ],
    },
    {
      type: 'file',
      name: 'other.md',
      path: 'other.md',
      file: {
        id: 'o1',
        original_filename: 'other.md',
        inbox_relpath: 'other.md',
        markdown_relpath: 'other.md',
        size_bytes: 10,
      },
    },
  ],
};

describe('sliceMarkdownLines', () => {
  it('numbers a peek starting at fromLine', () => {
    const md = ['a', 'b', 'c', 'd'].join('\n');
    const sliced = sliceMarkdownLines(md, 2, 2);
    expect(sliced.text).toBe('2|b\n3|c');
    expect(sliced.fromLine).toBe(2);
    expect(sliced.lineCount).toBe(2);
  });
});

describe('getDochubMarkdown', () => {
  it('resolves path, slices, and allows a mentioned file outside the pin', async () => {
    const getDocument = vi.fn(async () => ({
      user_id: '1',
      document: {
        path: 'other.md',
        text: '2: two\n3: three',
        from_line: 2,
        line_count: 2,
      },
    }));
    const mentioned = [
      {
        fileId: 'o1',
        path: 'other.md',
        name: 'other.md',
        markdownRelpath: 'other.md',
      },
    ];
    const hit = await getDochubMarkdown({
      userId: '1',
      tree,
      pin: 'contracts',
      mentionedDocuments: mentioned,
      file: 'other.md:2:2',
      deps: { getDocument },
    });
    expect(hit).toMatchObject({
      ok: true,
      dochub_path: 'other.md',
      text: '2|two\n3|three',
    });
    expect(getDocument).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ path: 'other.md', fromLine: 2, maxLines: 2 }),
      expect.anything(),
    );
  });

  it('rejects a path outside the pin when it was not mentioned', async () => {
    const result = await getDochubMarkdown({
      userId: '1',
      tree,
      pin: 'contracts',
      mentionedDocuments: [],
      file: 'other.md',
      deps: { getDocument: vi.fn() },
    });
    expect(result.ok).toBe(false);
  });

  it('reads by docid and returns similar path hints when missing', async () => {
    const { DochubError } = await import('./errors');
    const getDocument = vi.fn(async () => {
      throw new DochubError(404, 'document not found', 'not_found', ['docs/note.md']);
    });
    const result = await getDochubMarkdown({
      userId: '1',
      tree,
      pin: null,
      mentionedDocuments: [],
      file: '#abc123',
      deps: { getDocument },
    });
    expect(result).toMatchObject({
      ok: false,
      similar: ['docs/note.md'],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('docs/note.md');
  });
});
