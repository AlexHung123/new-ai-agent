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
  it('exposes search, read, and list, with no user_id on schemas', () => {
    const tools = createDochubTools();
    expect(tools.map((tool) => tool.name)).toEqual(['search', 'read', 'list']);
    for (const tool of tools) {
      const params = JSON.stringify(tool.parameters);
      expect(params).not.toMatch(/user_id/);
    }
  });

  it('search schema treats every pin as ordinary Dochub search', () => {
    const search = createDochubTools().find((tool) => tool.name === 'search')!;
    expect(search.description).not.toMatch(/structured folders use keyword/i);
    expect(JSON.stringify(search.parameters)).not.toMatch(/Structured folders only/);
  });

  it('sends JWT user id and narrows a path inside the pinned folder', async () => {
    const searchFn = vi.fn(async () => ({
      user_id: '1',
      mode: 'search',
      query: 'plan',
      results: [{ file: 'qmd://markdown/contracts/2024/q1/plan.md', line: 12, snippet: 'plan text' }],
    }));
    const tools = createDochubTools({ search: searchFn });
    const search = tools.find((t) => t.name === 'search')!;
    const result = await runWithWritingTurn(ctx, () =>
      search.execute('id', {
        searches: [{ type: 'lex', query: 'plan' }],
        path: 'contracts/2024/q1',
        user_id: 'alice',
      }),
    );
    expect(searchFn).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({
        searches: [{ type: 'lex', query: 'plan' }],
        mode: 'search',
        path: 'contracts/2024/q1',
      }),
      { library: 'private' },
    );
    const details = result.details as {
      hits: Array<{ path: string; source: string; snippet: string }>;
    };
    expect(details.hits[0].path).toBe('contracts/2024/q1/plan.md');
    expect(details.hits[0].source).toBe('private:contracts/2024');
  });

  it('rejects a path outside a single pinned folder and names the pin', async () => {
    const searchFn = vi.fn(async () => ({ results: [] }));
    const tools = createDochubTools({ search: searchFn });
    const search = tools.find((t) => t.name === 'search')!;
    const result = await runWithWritingTurn(ctx, () =>
      search.execute('id', {
        searches: [{ type: 'lex', query: 'plan' }],
        path: 'invoices',
        user_id: 'alice',
      }),
    );
    expect(searchFn).not.toHaveBeenCalled();
    expect(result.details).toMatchObject({
      ok: false,
      error: 'path is outside the pinned folders. Currently pinned: private:contracts/2024',
    });
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

  it('asks Dochub for the advertised default of 20 on a single pin', async () => {
    const searchFn = vi.fn(async () => ({ results: [] }));
    const tools = createDochubTools({ search: searchFn });
    const search = tools.find((t) => t.name === 'search')!;
    const result = await runWithWritingTurn(ctx, () =>
      search.execute('id', { query: 'plan' }),
    );
    expect(searchFn).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ query: 'plan', limit: 20 }),
      { library: 'private' },
    );
    expect(result.details).toMatchObject({ ok: true, limitPerSource: 20 });
  });

  it('forwards a limit up to 50 and splits it across pins', async () => {
    const searchFn = vi.fn(async () => ({ results: [] }));
    const tools = createDochubTools({ search: searchFn });
    const search = tools.find((t) => t.name === 'search')!;
    const oversized = await runWithWritingTurn(ctx, () =>
      search.execute('id', { query: 'plan', limit: 99 }),
    );
    expect(searchFn).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ limit: 50 }),
      { library: 'private' },
    );
    expect(oversized.details).toMatchObject({ ok: true, limitPerSource: 50 });

    searchFn.mockClear();
    const multi = {
      ...ctx,
      pin: 'writing',
      pinLibrary: 'private' as const,
      scopes: [
        { path: 'writing', library: 'private' as const },
        { path: 'g3', library: 'public' as const },
        { path: 'spr', library: 'public' as const },
      ],
    };
    const split = await runWithWritingTurn(multi, () =>
      search.execute('id', { query: 'plan' }),
    );
    expect(searchFn).toHaveBeenCalledTimes(3);
    for (const call of searchFn.mock.calls) {
      expect(call[1]).toMatchObject({ limit: 7 });
    }
    expect(split.details).toMatchObject({ ok: true, limitPerSource: 7 });
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
    const multiGetDocuments = vi.fn(async () => ({
      documents: [
        { path: 'contracts/plan.md', text: '1: hi', from_line: 1, line_count: 1 },
      ],
      errors: [],
    }));
    const tools = createDochubTools({ multiGetDocuments });
    const read = tools.find((t) => t.name === 'read')!;
    await runWithWritingTurn(
      { ...ctx, pin: 'contracts', tree: globTree },
      () => read.execute('id', { files: 'contracts/*.md' }),
    );
    expect(multiGetDocuments).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ files: ['contracts/plan.md'] }),
      expect.objectContaining({ library: 'private' }),
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
    const multiGetDocuments = vi.fn(async () => ({
      documents: [
        { path: 'contracts/2024/spec.md', text: '1: hi', from_line: 1, line_count: 1 },
      ],
      errors: [],
    }));
    const tools = createDochubTools({ multiGetDocuments });
    const read = tools.find((t) => t.name === 'read')!;
    await runWithWritingTurn(ctx, () =>
      read.execute('id', {
        file: 'contracts/2024/spec.md',
        maxLines: '40',
      }),
    );
    expect(multiGetDocuments).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({
        files: ['contracts/2024/spec.md'],
        maxLines: 40,
        maxBytes: 200 * 1024,
      }),
      expect.objectContaining({ library: 'private' }),
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
        { path: 'writing', library: 'private' as const },
        { path: 'g3', library: 'public' as const },
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

  it('searches and reads a structured folder through Dochub even if a local wiki root is present', async () => {
    const { mkdtempSync, mkdirSync, writeFileSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const root = mkdtempSync(join(tmpdir(), 'wiki-local-'));
    mkdirSync(join(root, 'wiki'), { recursive: true });
    writeFileSync(join(root, 'wiki', 'index.md'), 'Password policy lives here.\n', 'utf8');
    const searchFn = vi.fn(async () => ({
      results: [
        {
          file: 'qmd://markdown/g3/wiki/index.md',
          snippet: 'from dochub search',
        },
      ],
    }));
    const getDochubMarkdown = vi.fn(async () => ({
      ok: true as const,
      dochub_path: 'g3/wiki/index.md',
      text: '1|from dochub',
      fromLine: 1,
      lineCount: 1,
      truncated: false,
    }));
    const multiGetDocuments = vi.fn(async () => ({
      documents: [
        { path: 'g3/wiki/index.md', text: '1: from dochub', from_line: 1, line_count: 1 },
      ],
      errors: [],
    }));
    const tools = createDochubTools({ search: searchFn, getDochubMarkdown, multiGetDocuments });
    const localCtx = {
      userId: '1',
      pin: 'g3',
      pinLibrary: 'public' as const,
      mentionedDocuments: [],
      tree,
      scopes: [
        {
          path: 'g3',
          library: 'public' as const,
        },
      ],
    };
    const search = tools.find((t) => t.name === 'search')!;
    const searched = await runWithWritingTurn(localCtx, () =>
      search.execute('id', { query: 'password' }),
    );
    expect(searchFn).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ query: 'password', path: 'g3' }),
      { library: 'public' },
    );
    const searchDetails = searched.details as {
      hits: Array<{ source: string; path: string; snippet: string }>;
    };
    expect(searchDetails.hits[0]).toMatchObject({
      source: 'public:g3',
      path: 'g3/wiki/index.md',
      snippet: 'from dochub search',
    });
    expect(searchDetails.hits[0].snippet).not.toMatch(/Password policy lives here/);

    const read = tools.find((t) => t.name === 'read')!;
    const readOut = await runWithWritingTurn(localCtx, () =>
      read.execute('id', { path: 'g3/wiki/index.md' }),
    );
    expect(multiGetDocuments).toHaveBeenCalled();
    const readDetails = readOut.details as {
      dochub_path: string;
      text: string;
      source: string;
      truncated: boolean;
    };
    expect(readDetails.dochub_path).toBe('g3/wiki/index.md');
    expect(readDetails.source).toBe('public:g3');
    expect(readDetails.text).toBe('1|from dochub');
    expect(readDetails.truncated).toBe(false);
  });

  it('searches mixed ordinary and structured pins and merges labeled hits', async () => {
    const searchFn = vi.fn(async (_userId: string, body: { path?: string; mode?: string }) => ({
      user_id: '1',
      mode: body.mode || 'query',
      query: 'password',
      results: [
        {
          file: `qmd://markdown/${body.path === 'spr' ? 'spr/wiki/index.md' : `${body.path}/plan.md`}`,
          snippet: 'password in dochub',
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
          { path: 'writing', library: 'private' },
          { path: 'testing1', library: 'public' },
          {
            path: 'spr',
            library: 'public',
          },
        ],
      },
      () => search.execute('id', { query: 'password' }),
    );
    expect(searchFn).toHaveBeenCalledTimes(3);
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
    expect(searchFn).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ path: 'spr' }),
      { library: 'public' },
    );
    const modes = searchFn.mock.calls.map((call) => (call[1] as { mode?: string }).mode);
    expect(modes).toEqual(['search', 'search', 'search']);
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
      'testing1/plan.md',
      'spr/wiki/index.md',
    ]);
  });

  it('uses path-scoped Dochub search for remote structured folders', async () => {
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
        mentionedDocuments: [],
        tree,
        scopes: [
          { path: 'g3', library: 'public' },
          { path: 's17', library: 'public' },
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
        query: 'password',
      },
      {
        source: 'public:s17',
        path: 's17/wiki/chapters/07.md',
        snippet: 'S17 password',
        query: 'password',
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
    const multiGetDocuments = vi.fn(async (_userId: string, body: { files: string[] }) => ({
      documents: body.files.map((file) => ({
        path: file,
        text: `1: dochub:${file}`,
        from_line: 1,
        line_count: 1,
      })),
      errors: [],
    }));
    const tools = createDochubTools({ multiGetDocuments });
    const read = tools.find((t) => t.name === 'read')!;
    const result = await runWithWritingTurn(
      {
        userId: '1',
        pin: 'g3',
        pinLibrary: 'public',
        mentionedDocuments: [],
        tree,
        scopes: [
          {
            path: 'g3',
            library: 'public',
          },
          { path: 's17', library: 'public' },
        ],
      },
      () =>
        read.execute('id', {
          files: ['g3/wiki/index.md', 's17/wiki/index.md'],
        }),
    );
    expect(multiGetDocuments).toHaveBeenCalledTimes(1);
    expect(multiGetDocuments).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({
        files: ['g3/wiki/index.md', 's17/wiki/index.md'],
      }),
      expect.objectContaining({ library: 'public' }),
    );
    const details = result.details as {
      files: Array<{ dochub_path: string; text: string; truncated: boolean }>;
    };
    expect(details.files.map((file) => file.text)).toEqual([
      '1|dochub:g3/wiki/index.md',
      '1|dochub:s17/wiki/index.md',
    ]);
    expect(details.files.every((file) => file.truncated === false)).toBe(true);
  });

  it('drops ordinary search hits that sit outside the pin', async () => {
    const searchFn = vi.fn(async () => ({
      user_id: '1',
      mode: 'search',
      query: 'plan',
      results: [
        { file: 'qmd://markdown/notes/a.md', snippet: 'in pin' },
        { file: 'qmd://markdown/secrets/b.md', snippet: 'leak' },
        { file: 'qmd://markdown/sfc/wiki/index.md', snippet: 'hidden' },
      ],
    }));
    const tools = createDochubTools({ search: searchFn });
    const search = tools.find((t) => t.name === 'search')!;
    const result = await runWithWritingTurn(
      {
        userId: '1',
        pin: 'notes',
        pinLibrary: 'private',
        mentionedDocuments: [],
        tree,
        scopes: [
          {
            path: 'notes',
            library: 'private' as const,
          },
        ],
      },
      () => search.execute('id', { query: 'plan' }),
    );
    const details = result.details as { hits: Array<{ path: string }> };
    expect(details.hits.map((hit) => hit.path)).toEqual(['notes/a.md']);
  });

  it('expands recursive globs only under each pinned folder and library', async () => {
    const mdFile = (path: string, id: string) => ({
      type: 'file' as const,
      name: path.split('/').pop() || path,
      path,
      file: {
        id,
        original_filename: path.split('/').pop() || path,
        inbox_relpath: path,
        markdown_relpath: path,
        size_bytes: 1,
      },
    });
    const privateTree = {
      type: 'dir' as const,
      name: '',
      path: '',
      children: [
        {
          type: 'dir' as const,
          name: 'notes',
          path: 'notes',
          children: [mdFile('notes/a.md', 'a1')],
        },
        {
          type: 'dir' as const,
          name: 'secrets',
          path: 'secrets',
          children: [mdFile('secrets/b.md', 'b1')],
        },
      ],
    };
    const publicTree = {
      type: 'dir' as const,
      name: '',
      path: '',
      children: [
        {
          type: 'dir' as const,
          name: 'spr',
          path: 'spr',
          children: [mdFile('spr/c.md', 'c1')],
        },
      ],
    };
    const multiGetDocuments = vi.fn(
      async (
        _userId: string,
        body: { files: string[] },
        deps?: { library?: string },
      ) => ({
        documents: body.files.map((file) => ({
          path: file,
          text: '1: hi',
          from_line: 1,
          line_count: 1,
        })),
        errors: [],
        library: deps?.library,
      }),
    );
    const tools = createDochubTools({ multiGetDocuments });
    const read = tools.find((t) => t.name === 'read')!;
    await runWithWritingTurn(
      {
        userId: '1',
        pin: 'notes',
        pinLibrary: 'private' as const,
        mentionedDocuments: [],
        tree: privateTree,
        publicTree,
        scopes: [
          {
            path: 'notes',
            library: 'private' as const,
          },
          {
            path: 'spr',
            library: 'public' as const,
          },
        ],
      },
      () => read.execute('id', { files: '**/*.md' }),
    );
    expect(multiGetDocuments).toHaveBeenCalledTimes(2);
    const files = multiGetDocuments.mock.calls.flatMap(
      (call) => (call[1] as { files: string[] }).files,
    );
    expect(files.sort()).toEqual(['notes/a.md', 'spr/c.md']);
    const libraries = multiGetDocuments.mock.calls.map(
      (call) => (call[2] as { library?: string } | undefined)?.library,
    );
    expect(libraries.sort()).toEqual(['private', 'public']);
  });

  it('scopes unresolved globs to each pin library and path and drops leaked documents', async () => {
    const empty = { type: 'dir' as const, name: '', path: '', children: [] };
    const multiGetDocuments = vi.fn(
      async (
        _userId: string,
        body: { path?: string; files: string[] },
        _deps?: { library?: string },
      ) => ({
        documents: [
          {
            path: `${body.path}/hit.md`,
            text: '1: ok',
            from_line: 1,
            line_count: 1,
          },
          { path: 'other/leak.md', text: '1: leak', from_line: 1, line_count: 1 },
        ],
        errors: [],
      }),
    );
    const tools = createDochubTools({ multiGetDocuments });
    const read = tools.find((t) => t.name === 'read')!;
    const result = await runWithWritingTurn(
      {
        userId: '1',
        pin: 'notes',
        pinLibrary: 'private' as const,
        mentionedDocuments: [],
        tree: empty,
        publicTree: empty,
        scopes: [
          {
            path: 'notes',
            library: 'private' as const,
          },
          {
            path: 'spr',
            library: 'public' as const,
          },
        ],
      },
      () => read.execute('id', { files: '**/*.md' }),
    );
    expect(multiGetDocuments).toHaveBeenCalledTimes(2);
    expect(multiGetDocuments).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ files: ['**/*.md'], path: 'notes' }),
      { library: 'private' },
    );
    expect(multiGetDocuments).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ files: ['**/*.md'], path: 'spr' }),
      { library: 'public' },
    );
    const details = result.details as {
      files: Array<{ ok?: boolean; dochub_path?: string }>;
    };
    const paths = (details.files || [])
      .filter((file) => file.ok !== false && file.dochub_path)
      .map((file) => file.dochub_path);
    expect(paths.sort()).toEqual(['notes/hit.md', 'spr/hit.md']);
  });

  it('defaults a bare query to keyword search and keeps explicit hybrid mode', async () => {
    const searchFn = vi.fn(async () => ({ results: [] }));
    const tools = createDochubTools({ search: searchFn });
    const search = tools.find((t) => t.name === 'search')!;
    await runWithWritingTurn(ctx, () => search.execute('id', { query: 'plan' }));
    expect(searchFn).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ query: 'plan', mode: 'search' }),
      { library: 'private' },
    );
    searchFn.mockClear();
    await runWithWritingTurn(ctx, () =>
      search.execute('id', { query: 'plan', mode: 'query' }),
    );
    expect(searchFn).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ query: 'plan', mode: 'query' }),
      { library: 'private' },
    );
  });

  it('falls back to keyword search when embeddings are not ready', async () => {
    const searchFn = vi.fn(async () => ({ results: [] }));
    const tools = createDochubTools({ search: searchFn });
    const search = tools.find((t) => t.name === 'search')!;
    const result = await runWithWritingTurn(
      {
        ...ctx,
        index: { keyword_search_ready: true, semantic_search_ready: false },
      },
      () => search.execute('id', { query: 'plan', mode: 'query' }),
    );
    expect(searchFn).toHaveBeenCalledTimes(1);
    expect(searchFn).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ query: 'plan', mode: 'search' }),
      { library: 'private' },
    );
    expect(result.details).toMatchObject({
      ok: true,
      fallback: { reason: 'semantic_not_ready', from: 'query' },
    });
  });

  it('retries with keyword search when hybrid search times out', async () => {
    const searchFn = vi.fn(async (_userId: string, body: { mode?: string }) => {
      if (body.mode === 'query') {
        throw new Error('hybrid search timed out after 20s');
      }
      return { results: [{ file: 'qmd://markdown/contracts/2024/plan.md', snippet: 'plan' }] };
    });
    const tools = createDochubTools({ search: searchFn });
    const search = tools.find((t) => t.name === 'search')!;
    const result = await runWithWritingTurn(ctx, () =>
      search.execute('id', { query: 'plan', mode: 'query' }),
    );
    expect(searchFn).toHaveBeenCalledTimes(2);
    expect(searchFn.mock.calls[0][1]).toMatchObject({ mode: 'query' });
    expect(searchFn.mock.calls[1][1]).toMatchObject({ mode: 'search', query: 'plan' });
    expect(result.details).toMatchObject({
      ok: true,
      fallback: { reason: 'timeout', from: 'query' },
    });
  });

  it('searches independent query terms in parallel and round-robins labeled hits', async () => {
    const searchFn = vi.fn(async (_userId: string, body: { query?: string }) => ({
      results:
        body.query === 'OKR'
          ? [
              { file: 'qmd://markdown/contracts/2024/okr.md', line: 1, snippet: 'OKR one' },
              { file: 'qmd://markdown/contracts/2024/okr.md', line: 2, snippet: 'OKR two' },
              { file: 'qmd://markdown/contracts/2024/extra.md', line: 1, snippet: 'OKR three' },
            ]
          : [
              { file: 'qmd://markdown/contracts/2024/okr.md', line: 1, snippet: 'duplicate' },
              { file: 'qmd://markdown/contracts/2024/plan.md', line: 4, snippet: 'quarterly' },
            ],
    }));
    const tools = createDochubTools({ search: searchFn });
    const search = tools.find((t) => t.name === 'search')!;
    const result = await runWithWritingTurn(ctx, () =>
      search.execute('id', { query: ['OKR', 'quarterly plan'], limit: 3 }),
    );
    expect(searchFn).toHaveBeenCalledTimes(2);
    expect(searchFn).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ query: 'OKR', limit: 3, mode: 'search' }),
      { library: 'private' },
    );
    expect(searchFn).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ query: 'quarterly plan', limit: 3, mode: 'search' }),
      { library: 'private' },
    );
    const details = result.details as {
      query: string[];
      hits: Array<{ query?: string; path: string; line?: number }>;
    };
    expect(details.query).toEqual(['OKR', 'quarterly plan']);
    expect(
      details.hits.map((hit) => `${hit.query}:${hit.path}:${hit.line}`),
    ).toEqual([
      'OKR:contracts/2024/okr.md:1',
      'quarterly plan:contracts/2024/plan.md:4',
      'OKR:contracts/2024/okr.md:2',
    ]);
  });

  it('keeps searches as one intent and searches pins in parallel', async () => {
    const searchFn = vi.fn(async () => ({ results: [] }));
    const tools = createDochubTools({ search: searchFn });
    const search = tools.find((t) => t.name === 'search')!;
    const multi = {
      ...ctx,
      pin: 'writing',
      pinLibrary: 'private' as const,
      scopes: [
        { path: 'writing', library: 'private' as const },
        { path: 'g3', library: 'public' as const },
      ],
    };
    await runWithWritingTurn(multi, () =>
      search.execute('id', {
        searches: [
          { type: 'lex', query: 'OKR' },
          { type: 'vec', query: 'quarterly plan' },
        ],
      }),
    );
    expect(searchFn).toHaveBeenCalledTimes(2);
    for (const call of searchFn.mock.calls) {
      expect(call[1]).toMatchObject({
        mode: 'query',
        searches: [
          { type: 'lex', query: 'OKR' },
          { type: 'vec', query: 'quarterly plan' },
        ],
      });
      expect(call[1]).not.toHaveProperty('query');
    }
  });

  it('lists files in a pinned folder and caps results', async () => {
    const listingTree = {
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
              type: 'dir' as const,
              name: '2024',
              path: 'contracts/2024',
              children: [
                {
                  type: 'file' as const,
                  name: 'plan.pdf',
                  path: 'contracts/2024/plan.pdf',
                  file: {
                    id: 'f1',
                    original_filename: 'plan.pdf',
                    inbox_relpath: 'contracts/2024/plan.pdf',
                    markdown_relpath: 'contracts/2024/plan.md',
                    size_bytes: 10,
                  },
                },
                {
                  type: 'file' as const,
                  name: 'note.md',
                  path: 'contracts/2024/note.md',
                  file: {
                    id: 'f2',
                    original_filename: 'note.md',
                    inbox_relpath: 'contracts/2024/note.md',
                    markdown_relpath: 'contracts/2024/note.md',
                    size_bytes: 4,
                  },
                },
              ],
            },
          ],
        },
      ],
    };
    const tools = createDochubTools();
    const list = tools.find((tool) => tool.name === 'list')!;
    const listed = await runWithWritingTurn(
      {
        userId: '1',
        pin: 'contracts',
        mentionedDocuments: [],
        tree: listingTree,
        scopes: [{ path: 'contracts', library: 'private' }],
      },
      () => list.execute('id', {}),
    );
    expect(listed.details).toMatchObject({
      ok: true,
      truncated: false,
      limit: 50,
      totalFiles: 2,
    });
    expect(listed.details.files).toEqual([
      { path: 'contracts/2024/plan.md', name: 'plan.pdf', source: 'private:contracts' },
      { path: 'contracts/2024/note.md', name: 'note.md', source: 'private:contracts' },
    ]);
    expect(listed.details.folders).toEqual([
      { path: 'contracts/2024', name: '2024', source: 'private:contracts', fileCount: 2 },
    ]);

    const capped = await runWithWritingTurn(
      {
        userId: '1',
        pin: 'contracts',
        mentionedDocuments: [],
        tree: listingTree,
        scopes: [{ path: 'contracts', library: 'private' }],
      },
      () => list.execute('id', { limit: 1 }),
    );
    expect(capped.details).toMatchObject({
      ok: true,
      truncated: true,
      limit: 1,
      totalFiles: 2,
    });
    expect(capped.details.files).toHaveLength(1);

    const outside = await runWithWritingTurn(
      {
        userId: '1',
        pin: 'contracts',
        mentionedDocuments: [],
        tree: listingTree,
        scopes: [{ path: 'contracts', library: 'private' }],
      },
      () => list.execute('id', { path: 'invoices' }),
    );
    expect(outside.details).toMatchObject({
      ok: false,
      error: expect.stringMatching(/path is outside the pinned folders/),
    });
  });

  it('lists mentioned documents when nothing is pinned', async () => {
    const tools = createDochubTools();
    const list = tools.find((tool) => tool.name === 'list')!;
    const listed = await runWithWritingTurn(
      {
        userId: '1',
        pin: null,
        mentionedDocuments: [
          {
            fileId: 'p1',
            path: 'contracts/2024/plan.docx',
            name: 'plan.docx',
            markdownRelpath: 'contracts/2024/plan.md',
            library: 'private' as const,
          },
        ],
        tree: { type: 'dir' as const, name: '', path: '', children: [] },
      },
      () => list.execute('id', {}),
    );
    expect(listed.details).toMatchObject({
      ok: true,
      files: [
        {
          path: 'contracts/2024/plan.md',
          name: 'plan.docx',
          source: 'private:contracts/2024/plan.md',
        },
      ],
    });
  });

});
