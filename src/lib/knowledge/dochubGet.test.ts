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

  it('reads a short file in full without a default 80-line peek', async () => {
    const getDocument = vi.fn(async () => ({
      user_id: '1',
      document: {
        path: 'contracts/plan.md',
        text: '1: one\n2: two\n3: three',
        from_line: 1,
        line_count: 3,
      },
    }));
    const hit = await getDochubMarkdown({
      userId: '1',
      tree,
      pin: 'contracts',
      mentionedDocuments: [],
      file: 'contracts/plan.md',
      deps: { getDocument },
    });
    expect(getDocument).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({
        path: 'contracts/plan.md',
        fromLine: 1,
        maxBytes: 200 * 1024,
      }),
      expect.anything(),
    );
    expect(getDocument.mock.calls[0][1]).not.toHaveProperty('maxLines');
    expect(hit).toMatchObject({
      ok: true,
      text: '1|one\n2|two\n3|three',
      fromLine: 1,
      lineCount: 3,
      totalLines: 3,
      truncated: false,
    });
    if (hit.ok) expect(hit.text).not.toMatch(/truncated/i);
  });

  it('marks a long file as truncated and hints the next range', async () => {
    const getDocument = vi.fn(async () => ({
      user_id: '1',
      document: {
        path: 'contracts/plan.md',
        text: '1: one\n2: two',
        from_line: 1,
        line_count: 10,
      },
    }));
    const hit = await getDochubMarkdown({
      userId: '1',
      tree,
      pin: 'contracts',
      mentionedDocuments: [],
      file: 'contracts/plan.md',
      deps: { getDocument },
    });
    expect(hit).toMatchObject({
      ok: true,
      fromLine: 1,
      lineCount: 2,
      totalLines: 10,
      truncated: true,
    });
    if (hit.ok) {
      expect(hit.text).toContain('1|one\n2|two');
      expect(hit.text).toContain('[truncated]');
      expect(hit.text).toContain('contracts/plan.md:3:40');
    }
  });
});

describe('getDochubDocuments', () => {
  it('batches concrete paths in one multi-get and honors a path range', async () => {
    const { getDochubDocuments } = await import('./dochubGet');
    const multiGetDocuments = vi.fn(async () => ({
      user_id: '1',
      documents: [
        {
          path: 'contracts/plan.md',
          text: '120: a\n121: b',
          from_line: 120,
          line_count: 200,
        },
        {
          path: 'contracts/other.md',
          text: '1: short',
          from_line: 1,
          line_count: 1,
        },
      ],
      errors: [],
    }));
    const results = await getDochubDocuments({
      userId: '1',
      pin: 'contracts',
      mentionedDocuments: [],
      requests: [
        {
          file: 'contracts/plan.md:120:40',
          library: 'private',
          tree,
        },
        {
          file: 'contracts/other.md',
          library: 'private',
          tree,
          source: 'private:contracts',
        },
      ],
      deps: { multiGetDocuments },
    });
    expect(multiGetDocuments).toHaveBeenCalledTimes(1);
    expect(multiGetDocuments).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({
        files: ['contracts/plan.md:120:40', 'contracts/other.md'],
        maxBytes: 200 * 1024,
      }),
      expect.objectContaining({ library: 'private' }),
    );
    const body = multiGetDocuments.mock.calls[0][1] as Record<string, unknown>;
    expect(body.fromLine).toBeUndefined();
    expect(body.maxLines).toBeUndefined();
    expect(results[0]).toMatchObject({
      ok: true,
      dochub_path: 'contracts/plan.md',
      fromLine: 120,
      lineCount: 2,
      totalLines: 200,
      truncated: true,
    });
    expect(results[1]).toMatchObject({
      ok: true,
      dochub_path: 'contracts/other.md',
      truncated: false,
      source: 'private:contracts',
    });
  });

  it('applies a total character budget and flags overflow', async () => {
    const { getDochubDocuments, applyReadCharBudget } = await import('./dochubGet');
    const long = Array.from({ length: 80 }, (_, i) => `${i + 1}|${'x'.repeat(800)}`).join('\n');
    const capped = applyReadCharBudget(
      [
        {
          ok: true as const,
          dochub_path: 'contracts/a.md',
          text: long,
          fromLine: 1,
          lineCount: 80,
          totalLines: 80,
          truncated: false,
        },
        {
          ok: true as const,
          dochub_path: 'contracts/b.md',
          text: long,
          fromLine: 1,
          lineCount: 80,
          totalLines: 80,
          truncated: false,
        },
      ],
      40_000,
    );
    expect(capped[0]?.ok).toBe(true);
    expect(capped[1]).toMatchObject({ ok: true, truncated: true });
    if (capped[1] && capped[1].ok) {
      expect(capped[1].text).toMatch(/truncated/i);
      expect(capped[1].text.length).toBeLessThanOrEqual(40_000);
    }

    const multiGetDocuments = vi.fn(async () => ({
      user_id: '1',
      documents: [],
      errors: [],
    }));
    await getDochubDocuments({
      userId: '1',
      pin: 'contracts',
      mentionedDocuments: [],
      requests: [
        { file: 'secrets/x.md', library: 'private', tree },
      ],
      deps: { multiGetDocuments },
    }).then((results) => {
      expect(multiGetDocuments).not.toHaveBeenCalled();
      expect(results[0]).toMatchObject({
        ok: false,
        error: 'path is outside the pinned folder',
      });
    });
  });
});
