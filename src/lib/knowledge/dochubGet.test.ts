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
    const getFileContent = vi.fn(async () => ({
      bytes: new TextEncoder().encode('one\ntwo\nthree\nfour'),
      contentType: 'text/markdown',
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
      deps: { getFileContent },
    });
    expect(hit).toMatchObject({
      ok: true,
      dochub_path: 'other.md',
      text: '2|two\n3|three',
    });
    expect(getFileContent).toHaveBeenCalledWith('1', 'o1', 'markdown');
  });

  it('rejects a path outside the pin when it was not mentioned', async () => {
    const result = await getDochubMarkdown({
      userId: '1',
      tree,
      pin: 'contracts',
      mentionedDocuments: [],
      file: 'other.md',
      deps: { getFileContent: vi.fn() },
    });
    expect(result.ok).toBe(false);
  });

  it('returns unavailable when tree is null', async () => {
    const result = await getDochubMarkdown({
      userId: '1',
      tree: null,
      pin: null,
      mentionedDocuments: [],
      file: 'other.md',
    });
    expect(result).toEqual({
      ok: false,
      error: 'Knowledge library is unavailable.',
    });
  });
});
