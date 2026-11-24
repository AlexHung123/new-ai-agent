import { describe, expect, it, vi } from 'vitest';
import { runWithWritingTurn } from '../runtime/writingTurnContext';
import { createDochubTools } from './dochubTools';

const tree = {
  type: 'dir' as const,
  name: '',
  path: '',
  children: [
    {
      type: 'dir' as const,
      name: 'contracts',
      path: 'contracts',
      children: [],
    },
  ],
};

const ctx = {
  userId: '1',
  pin: 'contracts/2024',
  mentionedDocuments: [] as const,
  tree,
};

describe('createDochubTools', () => {
  it('does not put user_id on any schema', () => {
    for (const tool of createDochubTools()) {
      const params = JSON.stringify(tool.parameters);
      expect(params).not.toMatch(/user_id/);
      expect(tool.name).toMatch(/^(query|get|multi_get|tree|status)$/);
    }
  });

  it('sends JWT user id and clamped path on query', async () => {
    const search = vi.fn(async () => ({
      user_id: '1',
      mode: 'search',
      query: 'plan',
      results: [{ file: 'qmd://markdown/contracts/2024/plan.md', line: 12 }],
    }));
    const tools = createDochubTools({ search });
    const query = tools.find((t) => t.name === 'query')!;
    const result = await runWithWritingTurn(ctx, () =>
      query.execute('id', {
        searches: [{ type: 'lex', query: 'plan' }],
        path: 'invoices',
        user_id: 'alice',
      }),
    );
    expect(search).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({
        searches: [{ type: 'lex', query: 'plan' }],
        mode: 'search',
        path: 'contracts/2024',
      }),
      { library: 'private' },
    );
    const details = result.details as { results: Array<{ file: string }> };
    expect(details.results[0].file).toBe('contracts/2024/plan.md');
  });

  it('does not return user_id to the model', async () => {
    const search = vi.fn(async () => ({
      user_id: '1',
      mode: 'search',
      query: 'plan',
      results: [],
    }));
    const tools = createDochubTools({ search });
    const query = tools.find((t) => t.name === 'query')!;
    const result = await runWithWritingTurn(ctx, () =>
      query.execute('id', { query: 'plan' }),
    );
    const details = result.details as Record<string, unknown>;
    expect(details).not.toHaveProperty('user_id');
    expect(result.content[0].text).not.toMatch(/user_id/);
  });

  it('expands last-segment *.md against markdown_relpath', async () => {
    const globTree = {
      type: 'dir' as const,
      name: '',
      path: '',
      children: [
        {
          type: 'dir' as const,
          name: 'contracts',
          path: 'contracts',
          children: [
            {
              type: 'file' as const,
              name: 'plan.docx',
              path: 'contracts/plan.docx',
              file: {
                id: 'p1',
                original_filename: 'plan.docx',
                inbox_relpath: 'contracts/plan.docx',
                markdown_relpath: 'contracts/plan.md',
                size_bytes: 1,
              },
            },
          ],
        },
      ],
    };
    const getDochubMarkdown = vi.fn(async (opts: { file: string }) => ({
      ok: true as const,
      dochub_path: 'contracts/plan.md',
      text: '1|hi',
      fromLine: 1,
      lineCount: 1,
    }));
    const tools = createDochubTools({ getDochubMarkdown });
    const multi = tools.find((t) => t.name === 'multi_get')!;
    await runWithWritingTurn(
      { ...ctx, pin: 'contracts', tree: globTree },
      () => multi.execute('id', { files: 'contracts/*.md' }),
    );
    expect(getDochubMarkdown).toHaveBeenCalledWith(
      expect.objectContaining({ file: 'contracts/plan.docx' }),
    );
  });

  it('does not search when the turn has no pin and no @', async () => {
    const search = vi.fn(async () => ({
      user_id: '1',
      mode: 'query',
      query: 'hi',
      results: [],
    }));
    const tools = createDochubTools({ search });
    const query = tools.find((t) => t.name === 'query')!;
    const result = await runWithWritingTurn({ ...ctx, pin: null, scopes: [] }, () =>
      query.execute('id', { query: 'hi' }),
    );
    expect(search).not.toHaveBeenCalled();
    expect(result.details).toMatchObject({
      ok: false,
      error: expect.stringMatching(/No knowledge folder is pinned/),
    });
  });

  it('lists files from the tree and does not include file ids', async () => {
    const library = {
      type: 'dir' as const,
      name: '',
      path: '',
      children: [
        {
          type: 'file' as const,
          name: 'spec.md',
          path: 'writing/spec.md',
          file: {
            id: 'secret-id',
            original_filename: 'Section 3.docx',
            inbox_relpath: 'writing/Section 3.docx',
            markdown_relpath: 'writing/spec.md',
            size_bytes: 10,
          },
        },
      ],
    };
    const tools = createDochubTools();
    const treeTool = tools.find((t) => t.name === 'tree')!;
    const result = await runWithWritingTurn(
      {
        ...ctx,
        pin: 'writing',
        tree: {
          type: 'dir' as const,
          name: '',
          path: '',
          children: [
            {
              type: 'dir' as const,
              name: 'writing',
              path: 'writing',
              children: library.children,
            },
          ],
        },
      },
      () => treeTool.execute('id', {}),
    );
    const details = result.details as {
      fileCount: number;
      files: Array<{ path: string; name: string; library: string; source?: string }>;
    };
    expect(details.fileCount).toBe(1);
    expect(details.files).toEqual([
      {
        path: 'writing/spec.md',
        name: 'Section 3.docx',
        library: 'private',
        source: 'private:writing',
      },
    ]);
    expect(JSON.stringify(details)).not.toMatch(/secret-id/);
  });

  it('accepts get-shaped args on multi_get', async () => {
    const getDochubMarkdown = vi.fn(async (opts: { file: string }) => ({
      ok: true as const,
      dochub_path: opts.file,
      text: '1|hi',
      fromLine: 1,
      lineCount: 1,
    }));
    const tools = createDochubTools({ getDochubMarkdown });
    const multi = tools.find((t) => t.name === 'multi_get')!;
    await runWithWritingTurn(ctx, () =>
      multi.execute('id', {
        file: 'writing/spec.md',
        maxLines: '40',
      }),
    );
    expect(getDochubMarkdown).toHaveBeenCalledWith(
      expect.objectContaining({
        file: 'writing/spec.md',
        maxLines: '40',
      }),
    );
  });

  it('returns No user bound outside a turn', async () => {
    const query = createDochubTools()[0];
    const result = await query.execute('id', { query: 'hi' });
    expect(result.details).toMatchObject({
      ok: false,
      error: 'No user bound',
    });
  });

  it('runs ordinary folders separately and labels mixed sources', async () => {
    const search = vi.fn(async (_userId: string, body: { path?: string }, deps?: { library?: string }) => ({
      user_id: '1',
      mode: 'search',
      query: 'plan',
      results: [
        {
          file:
            deps?.library === 'public'
              ? 'qmd://markdown/testing1/note.md'
              : 'qmd://markdown/writing/plan.md',
        },
      ],
    }));
    const tools = createDochubTools({ search });
    const query = tools.find((t) => t.name === 'query')!;
    const result = await runWithWritingTurn(
      {
        userId: '1',
        pin: 'writing',
        pinLibrary: 'private',
        retrievalMode: 'search',
        mentionedDocuments: [],
        tree,
        publicTree: {
          type: 'dir' as const,
          name: '',
          path: '',
          children: [
            {
              type: 'dir' as const,
              name: 'testing1',
              path: 'testing1',
              children: [],
            },
            {
              type: 'dir' as const,
              name: 'spr',
              path: 'spr',
              wiki: true,
              children: [],
            },
          ],
        },
        scopes: [
          { path: 'writing', library: 'private', retrievalMode: 'search' },
          { path: 'testing1', library: 'public', retrievalMode: 'search' },
          { path: 'spr', library: 'public', retrievalMode: 'wiki' },
        ],
      },
      () => query.execute('id', { query: 'plan' }),
    );
    expect(search).toHaveBeenCalledTimes(2);
    expect(search).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ path: 'writing', limit: 3 }),
      { library: 'private' },
    );
    expect(search).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ path: 'testing1', limit: 3 }),
      { library: 'public' },
    );
    const details = result.details as {
      results: Array<{ file: string; source: string }>;
      sources: string[];
    };
    expect(details.sources).toEqual(['private:writing', 'public:testing1']);
    expect(details.results.map((hit) => hit.source)).toEqual([
      'private:writing',
      'public:testing1',
    ]);
    expect(details.results.map((hit) => hit.file)).toEqual([
      'writing/plan.md',
      'testing1/note.md',
    ]);
  });
});
