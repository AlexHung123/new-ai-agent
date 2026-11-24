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
  it('exposes only search and read, with no user_id on schemas', () => {
    const tools = createDochubTools();
    expect(tools.map((tool) => tool.name)).toEqual(['search', 'read']);
    for (const tool of tools) {
      const params = JSON.stringify(tool.parameters);
      expect(params).not.toMatch(/user_id/);
    }
  });

  it('sends JWT user id and clamped path on ordinary-folder search', async () => {
    const searchFn = vi.fn(async () => ({
      user_id: '1',
      mode: 'search',
      query: 'plan',
      results: [{ file: 'qmd://markdown/contracts/2024/plan.md', line: 12, snippet: 'plan text' }],
    }));
    const tools = createDochubTools({ search: searchFn });
    const search = tools.find((t) => t.name === 'search')!;
    const result = await runWithWritingTurn(ctx, () =>
      search.execute('id', {
        searches: [{ type: 'lex', query: 'plan' }],
        path: 'invoices',
        user_id: 'alice',
      }),
    );
    expect(searchFn).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({
        searches: [{ type: 'lex', query: 'plan' }],
        mode: 'search',
        path: 'contracts/2024',
      }),
      { library: 'private' },
    );
    const details = result.details as {
      hits: Array<{ path: string; source: string; snippet: string }>;
    };
    expect(details.hits[0].path).toBe('contracts/2024/plan.md');
    expect(details.hits[0].source).toBe('private:contracts/2024');
  });

  it('does not return user_id to the model', async () => {
    const searchFn = vi.fn(async () => ({
      user_id: '1',
      mode: 'search',
      query: 'plan',
      results: [],
    }));
    const tools = createDochubTools({ search: searchFn });
    const search = tools.find((t) => t.name === 'search')!;
    const result = await runWithWritingTurn(ctx, () =>
      search.execute('id', { query: 'plan' }),
    );
    const details = result.details as Record<string, unknown>;
    expect(details).not.toHaveProperty('user_id');
    expect(result.content[0].text).not.toMatch(/user_id/);
  });

  it('ordinary qmd search uses query, not wiki keyword mode, when lex/vec are provided', async () => {
    const searchFn = vi.fn(async () => ({
      user_id: '1',
      mode: 'query',
      results: [],
    }));
    const tools = createDochubTools({ search: searchFn });
    const search = tools.find((t) => t.name === 'search')!;
    await runWithWritingTurn(ctx, () =>
      search.execute('id', {
        searches: [
          { type: 'lex', query: 'plan' },
          { type: 'vec', query: 'planning memo' },
        ],
      }),
    );
    expect(searchFn).toHaveBeenCalledTimes(1);
    expect(searchFn).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({
        mode: 'query',
        searches: [
          { type: 'lex', query: 'plan' },
          { type: 'vec', query: 'planning memo' },
        ],
      }),
      { library: 'private' },
    );
    const mode = (searchFn.mock.calls[0] as unknown as [string, { mode?: string }])[1].mode;
    expect(mode).not.toBeUndefined();
  });

  it('expands last-segment *.md against markdown_relpath on read', async () => {
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
    const read = tools.find((t) => t.name === 'read')!;
    await runWithWritingTurn(
      { ...ctx, pin: 'contracts', tree: globTree },
      () => read.execute('id', { files: 'contracts/*.md' }),
    );
    expect(getDochubMarkdown).toHaveBeenCalledWith(
      expect.objectContaining({ file: 'contracts/plan.docx' }),
    );
  });

  it('does not search when the turn has no pin and no @', async () => {
    const searchFn = vi.fn(async () => ({
      user_id: '1',
      mode: 'query',
      query: 'hi',
      results: [],
    }));
    const tools = createDochubTools({ search: searchFn });
    const search = tools.find((t) => t.name === 'search')!;
    const result = await runWithWritingTurn({ ...ctx, pin: null, scopes: [] }, () =>
      search.execute('id', { query: 'hi' }),
    );
    expect(searchFn).not.toHaveBeenCalled();
    expect(result.details).toMatchObject({
      ok: false,
      error: expect.stringMatching(/No knowledge folder is pinned/),
    });
  });

  it('accepts get-shaped args on read', async () => {
    const getDochubMarkdown = vi.fn(async (opts: { file: string }) => ({
      ok: true as const,
      dochub_path: opts.file,
      text: '1|hi',
      fromLine: 1,
      lineCount: 1,
    }));
    const tools = createDochubTools({ getDochubMarkdown });
    const read = tools.find((t) => t.name === 'read')!;
    await runWithWritingTurn(ctx, () =>
      read.execute('id', {
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
    const search = createDochubTools()[0];
    const result = await search.execute('id', { query: 'hi' });
    expect(result.details).toMatchObject({
      ok: false,
      error: 'No user bound',
    });
  });

  it('rejects a path outside the pinned folders on search and read', async () => {
    const searchFn = vi.fn(async () => ({ results: [] }));
    const getDochubMarkdown = vi.fn(async () => ({
      ok: false as const,
      error: 'path is outside the pinned folder',
    }));
    const tools = createDochubTools({ search: searchFn, getDochubMarkdown });
    const search = tools.find((t) => t.name === 'search')!;
    const read = tools.find((t) => t.name === 'read')!;
    const multi = {
      ...ctx,
      pin: 'writing',
      pinLibrary: 'private' as const,
      scopes: [
        { path: 'writing', library: 'private' as const, retrievalMode: 'search' as const },
        { path: 'g3', library: 'public' as const, retrievalMode: 'wiki' as const },
      ],
    };
    const searched = await runWithWritingTurn(multi, () =>
      search.execute('id', { query: 'plan', path: 'secrets' }),
    );
    expect(searchFn).not.toHaveBeenCalled();
    expect(searched.details).toMatchObject({
      ok: false,
      error: expect.stringMatching(/path is outside the pinned/),
    });
    const readOut = await runWithWritingTurn(ctx, () =>
      read.execute('id', { file: 'secrets/passwords.md' }),
    );
    expect(readOut.details).toMatchObject({
      ok: false,
      error: expect.stringMatching(/path is outside the pinned/),
    });
  });

  it('uses filesystem grep and read for a single local structured folder', async () => {
    const { mkdtempSync, mkdirSync, writeFileSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const root = mkdtempSync(join(tmpdir(), 'wiki-local-'));
    mkdirSync(join(root, 'wiki'), { recursive: true });
    writeFileSync(join(root, 'wiki', 'index.md'), 'Password policy lives here.\n', 'utf8');
    const searchFn = vi.fn(async () => ({ results: [] }));
    const getDochubMarkdown = vi.fn(async () => ({
      ok: true as const,
      dochub_path: 'g3/wiki/index.md',
      text: '1|from dochub',
      fromLine: 1,
      lineCount: 1,
    }));
    const tools = createDochubTools({ search: searchFn, getDochubMarkdown });
    const localCtx = {
      userId: '1',
      pin: 'g3',
      pinLibrary: 'public' as const,
      retrievalMode: 'wiki' as const,
      mentionedDocuments: [],
      tree,
      wikiRootAbs: root,
      scopes: [
        {
          path: 'g3',
          library: 'public' as const,
          retrievalMode: 'wiki' as const,
          wikiRootAbs: root,
        },
      ],
    };
    const search = tools.find((t) => t.name === 'search')!;
    const searched = await runWithWritingTurn(localCtx, () =>
      search.execute('id', { query: 'password' }),
    );
    expect(searchFn).not.toHaveBeenCalled();
    const searchDetails = searched.details as {
      hits: Array<{ source: string; path: string; snippet: string }>;
    };
    expect(searchDetails.hits[0]).toMatchObject({
      source: 'public:g3',
      path: 'g3/wiki/index.md',
    });
    expect(searchDetails.hits[0].snippet).toMatch(/Password policy/i);

    const read = tools.find((t) => t.name === 'read')!;
    const readOut = await runWithWritingTurn(localCtx, () =>
      read.execute('id', { path: 'wiki/index.md' }),
    );
    expect(getDochubMarkdown).not.toHaveBeenCalled();
    const readDetails = readOut.details as {
      dochub_path: string;
      text: string;
      source: string;
    };
    expect(readDetails.dochub_path).toBe('g3/wiki/index.md');
    expect(readDetails.source).toBe('public:g3');
    expect(readDetails.text).toMatch(/Password policy lives here/);
  });

  it('searches mixed ordinary and structured pins and merges labeled hits', async () => {
    const { mkdtempSync, mkdirSync, writeFileSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const spr = mkdtempSync(join(tmpdir(), 'wiki-spr-'));
    mkdirSync(join(spr, 'wiki'), { recursive: true });
    writeFileSync(join(spr, 'wiki', 'index.md'), 'SPR password rules.\n', 'utf8');
    const searchFn = vi.fn(async (_userId: string, body: { path?: string; mode?: string }, deps?: { library?: string }) => ({
      user_id: '1',
      mode: body.mode || 'query',
      query: 'password',
      results: [
        {
          file:
            deps?.library === 'public'
              ? 'qmd://markdown/testing1/note.md'
              : 'qmd://markdown/writing/plan.md',
          snippet: 'password in ordinary folder',
        },
      ],
    }));
    const tools = createDochubTools({ search: searchFn });
    const search = tools.find((t) => t.name === 'search')!;
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
          {
            path: 'spr',
            library: 'public',
            retrievalMode: 'wiki',
            wikiRootAbs: spr,
          },
        ],
      },
      () => search.execute('id', { query: 'password' }),
    );
    expect(searchFn).toHaveBeenCalledTimes(2);
    expect(searchFn).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ path: 'writing' }),
      { library: 'private' },
    );
    expect(searchFn).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ path: 'testing1' }),
      { library: 'public' },
    );
    const modes = searchFn.mock.calls.map((call) => (call[1] as { mode?: string }).mode);
    expect(modes).not.toContain('search');
    const details = result.details as {
      hits: Array<{ file?: string; path: string; source: string }>;
      sources: string[];
    };
    expect(details.sources).toEqual(['private:writing', 'public:testing1', 'public:spr']);
    expect(details.hits.map((hit) => hit.source)).toEqual([
      'private:writing',
      'public:testing1',
      'public:spr',
    ]);
    expect(details.hits.map((hit) => hit.path)).toEqual([
      'writing/plan.md',
      'testing1/note.md',
      'spr/wiki/index.md',
    ]);
  });

  it('uses path-scoped keyword search for remote structured folders', async () => {
    const searchFn = vi.fn(async (_userId: string, body: { path?: string; mode?: string }) => ({
      user_id: '1',
      mode: 'search',
      query: 'password',
      results:
        body.path === 'g3'
          ? [{ file: 'qmd://markdown/g3/wiki/index.md', line: 2, snippet: 'G3 password' }]
          : [{ path: 's17/wiki/chapters/07.md', text: 'S17 password' }],
    }));
    const tools = createDochubTools({ search: searchFn });
    const search = tools.find((t) => t.name === 'search')!;
    const result = await runWithWritingTurn(
      {
        userId: '1',
        pin: 'g3',
        pinLibrary: 'public',
        retrievalMode: 'wiki',
        mentionedDocuments: [],
        tree,
        scopes: [
          { path: 'g3', library: 'public', retrievalMode: 'wiki' },
          { path: 's17', library: 'public', retrievalMode: 'wiki' },
        ],
      },
      () => search.execute('id', { query: 'password' }),
    );
    expect(searchFn).toHaveBeenCalledTimes(2);
    expect(searchFn).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ mode: 'search', query: 'password', path: 'g3' }),
      { library: 'public' },
    );
    expect(searchFn).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ mode: 'search', query: 'password', path: 's17' }),
      { library: 'public' },
    );
    const details = result.details as {
      hits: Array<{ source: string; path: string; snippet: string }>;
    };
    expect(details.hits).toEqual([
      {
        source: 'public:g3',
        path: 'g3/wiki/index.md',
        line: 2,
        snippet: 'G3 password',
      },
      {
        source: 'public:s17',
        path: 's17/wiki/chapters/07.md',
        snippet: 'S17 password',
      },
    ]);
  });

  it('reads multiple structured pins through get/multi_get, not the filesystem', async () => {
    const { mkdtempSync, mkdirSync, writeFileSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const g3 = mkdtempSync(join(tmpdir(), 'wiki-g3-read-'));
    mkdirSync(join(g3, 'wiki'), { recursive: true });
    writeFileSync(join(g3, 'wiki', 'index.md'), 'local g3 text\n', 'utf8');
    const getDochubMarkdown = vi.fn(async (opts: { file: string }) => ({
      ok: true as const,
      dochub_path: opts.file,
      text: `1|dochub:${opts.file}`,
      fromLine: 1,
      lineCount: 1,
    }));
    const tools = createDochubTools({ getDochubMarkdown });
    const read = tools.find((t) => t.name === 'read')!;
    const result = await runWithWritingTurn(
      {
        userId: '1',
        pin: 'g3',
        pinLibrary: 'public',
        retrievalMode: 'wiki',
        mentionedDocuments: [],
        tree,
        scopes: [
          {
            path: 'g3',
            library: 'public',
            retrievalMode: 'wiki',
            wikiRootAbs: g3,
          },
          { path: 's17', library: 'public', retrievalMode: 'wiki' },
        ],
      },
      () =>
        read.execute('id', {
          files: ['g3/wiki/index.md', 's17/wiki/index.md'],
        }),
    );
    expect(getDochubMarkdown).toHaveBeenCalledTimes(2);
    expect(getDochubMarkdown).toHaveBeenCalledWith(
      expect.objectContaining({ file: 'g3/wiki/index.md' }),
    );
    expect(getDochubMarkdown).toHaveBeenCalledWith(
      expect.objectContaining({ file: 's17/wiki/index.md' }),
    );
    const details = result.details as {
      files: Array<{ dochub_path: string; text: string }>;
    };
    expect(details.files.map((file) => file.text)).toEqual([
      '1|dochub:g3/wiki/index.md',
      '1|dochub:s17/wiki/index.md',
    ]);
  });
});
