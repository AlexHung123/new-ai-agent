import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const {
  getTree,
  createFolder,
  uploadFile,
  getTask,
  getFileContent,
  search,
  canWritePublicLibrary,
} = vi.hoisted(() => ({
  getTree: vi.fn(),
  createFolder: vi.fn(),
  uploadFile: vi.fn(),
  getTask: vi.fn(),
  getFileContent: vi.fn(),
  search: vi.fn(),
  canWritePublicLibrary: vi.fn(() => false),
}));

vi.mock('@/lib/knowledge/dochubClient', () => ({
  getTree,
  createFolder,
  uploadFile,
  getTask,
  getFileContent,
  search,
}));

vi.mock('@/lib/knowledge/publicAccess', () => ({
  canWritePublicLibrary,
}));

import { GET as GET_TREE } from '@/app/api/knowledge/tree/route';
import { POST as POST_FOLDER } from '@/app/api/knowledge/folders/route';
import { POST as POST_FILE } from '@/app/api/knowledge/files/route';
import { GET as GET_CONTENT } from '@/app/api/knowledge/files/[id]/content/route';
import { GET as GET_TASK } from '@/app/api/knowledge/tasks/[id]/route';
import { POST as POST_SEARCH } from '@/app/api/knowledge/search/route';

beforeEach(() => {
  getTree.mockReset();
  createFolder.mockReset();
  uploadFile.mockReset();
  getTask.mockReset();
  getFileContent.mockReset();
  search.mockReset();
  canWritePublicLibrary.mockReset();
  canWritePublicLibrary.mockReturnValue(false);
});

function req(
  url: string,
  init?: RequestInit & { userId?: string | null },
): Request {
  const headers = new Headers(init?.headers);
  if (init?.userId) headers.set('x-user-id', init.userId);
  const { userId: _userId, ...rest } = init || {};
  return new Request(url, { ...rest, headers });
}

describe('knowledge routes', () => {
  it('returns 401 without x-user-id', async () => {
    const res = await GET_TREE(req('http://localhost/itms/ai/api/knowledge/tree'));
    expect(res.status).toBe(401);
    expect(getTree).not.toHaveBeenCalled();
  });

  it('GET tree forwards the middleware user id', async () => {
    getTree.mockResolvedValue({
      user_id: '1',
      tree: { type: 'dir', name: '', path: '', children: [] },
    });
    const res = await GET_TREE(
      req('http://localhost/itms/ai/api/knowledge/tree', { userId: '1' }),
    );
    expect(res.status).toBe(200);
    expect(getTree).toHaveBeenCalledWith('1', { library: 'private' });
    expect(getTree).toHaveBeenCalledWith('1', { library: 'public' });
    const body = await res.json();
    expect(body.private.tree).toBeTruthy();
    expect(body.public.tree).toBeTruthy();
    expect(body.canWritePublic).toBe(false);
    expect(body.storage).toMatchObject({
      usedBytes: 0,
      quotaBytes: expect.any(Number),
      remainingBytes: expect.any(Number),
    });
    expect(body.public.storage).toMatchObject({
      usedBytes: 0,
      quotaBytes: expect.any(Number),
      remainingBytes: expect.any(Number),
    });
  });

  it('POST folders uses x-user-id and ignores body.userId', async () => {
    createFolder.mockResolvedValue({ path: 'docs' });
    const res = await POST_FOLDER(
      req('http://localhost/itms/ai/api/knowledge/folders', {
        method: 'POST',
        userId: '1',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ path: 'docs', userId: 'alice' }),
      }),
    );
    expect(res.status).toBe(200);
    expect(createFolder).toHaveBeenCalledWith('1', 'docs', { library: 'private' });
    expect(getTree).not.toHaveBeenCalled();
  });

  it('POST folders rejects public writes for non-curators', async () => {
    const res = await POST_FOLDER(
      req('http://localhost/itms/ai/api/knowledge/folders', {
        method: 'POST',
        userId: '1',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ path: 'spr', library: 'public' }),
      }),
    );
    expect(res.status).toBe(403);
    expect(createFolder).not.toHaveBeenCalled();
  });

  it('POST folders allows public writes for curators', async () => {
    canWritePublicLibrary.mockReturnValue(true);
    createFolder.mockResolvedValue({ path: 'spr' });
    const res = await POST_FOLDER(
      req('http://localhost/itms/ai/api/knowledge/folders', {
        method: 'POST',
        userId: 'admin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ path: 'spr', library: 'public' }),
      }),
    );
    expect(res.status).toBe(200);
    expect(createFolder).toHaveBeenCalledWith('admin', 'spr', { library: 'public' });
    expect(getTree).not.toHaveBeenCalled();
  });

  it('GET tree hides the reserved public sfc folder', async () => {
    getTree.mockImplementation(async (_userId: string, deps?: { library?: string }) => {
      if (deps?.library === 'public') {
        return {
          user_id: '1',
          tree: {
            type: 'dir',
            name: '',
            path: '',
            children: [
              { type: 'dir', name: 'spr', path: 'spr', children: [] },
              { type: 'dir', name: 'sfc', path: 'sfc', children: [] },
            ],
          },
        };
      }
      return {
        user_id: '1',
        tree: { type: 'dir', name: '', path: '', children: [] },
      };
    });
    const res = await GET_TREE(
      req('http://localhost/itms/ai/api/knowledge/tree', { userId: '1' }),
    );
    const body = await res.json();
    const names = (body.public.tree.children || []).map((n: { name: string }) => n.name);
    expect(names).toEqual(['spr']);
    expect(names).not.toContain('sfc');
  });

  it('POST folders rejects traversal paths', async () => {
    const res = await POST_FOLDER(
      req('http://localhost/itms/ai/api/knowledge/folders', {
        method: 'POST',
        userId: '1',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ path: 'docs/../../etc' }),
      }),
    );
    expect(res.status).toBe(400);
    expect(createFolder).not.toHaveBeenCalled();
  });

  function folderTree(children: Array<Record<string, unknown>>) {
    return {
      user_id: '1',
      tree: { type: 'dir', name: '', path: '', children },
    };
  }

  it('POST folders rejects a nested path that does not match the parent library', async () => {
    canWritePublicLibrary.mockReturnValue(true);
    getTree.mockImplementation(async (_userId: string, deps?: { library?: string }) => {
      if (deps?.library === 'private') {
        return folderTree([
          {
            type: 'dir',
            name: 'sfc',
            path: 'sfc',
            children: [
              { type: 'dir', name: 'testing2', path: 'sfc/testing2', children: [] },
            ],
          },
        ]);
      }
      return folderTree([]);
    });
    const res = await POST_FOLDER(
      req('http://localhost/itms/ai/api/knowledge/folders', {
        method: 'POST',
        userId: 'admin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ path: 'sfc/testing2/child', library: 'public' }),
      }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      message: 'A child folder must be Private because its parent is Private.',
    });
    expect(createFolder).not.toHaveBeenCalled();
  });

  it('POST folders inherits the parent library for a nested path', async () => {
    getTree.mockImplementation(async (_userId: string, deps?: { library?: string }) => {
      if (deps?.library === 'private') {
        return folderTree([
          {
            type: 'dir',
            name: 'sfc',
            path: 'sfc',
            children: [
              { type: 'dir', name: 'testing2', path: 'sfc/testing2', children: [] },
            ],
          },
        ]);
      }
      return folderTree([]);
    });
    createFolder.mockResolvedValue({ path: 'sfc/testing2/child' });
    const res = await POST_FOLDER(
      req('http://localhost/itms/ai/api/knowledge/folders', {
        method: 'POST',
        userId: '1',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ path: 'sfc/testing2/child', library: 'private' }),
      }),
    );
    expect(res.status).toBe(200);
    expect(createFolder).toHaveBeenCalledWith('1', 'sfc/testing2/child', {
      library: 'private',
    });
  });

  it('POST folders rejects a nested path when the parent is missing', async () => {
    getTree.mockResolvedValue(folderTree([]));
    const res = await POST_FOLDER(
      req('http://localhost/itms/ai/api/knowledge/folders', {
        method: 'POST',
        userId: '1',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ path: 'missing/child', library: 'private' }),
      }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      message: 'Parent folder "missing" was not found.',
    });
    expect(createFolder).not.toHaveBeenCalled();
  });

  it('POST files converts markdown and uploads with relative_path', async () => {
    getTree.mockResolvedValue({
      user_id: '1',
      tree: { type: 'dir', name: '', path: '', children: [] },
    });
    uploadFile.mockResolvedValue({
      file: { id: 'f1' },
      task: { id: 't1', status: 'pending' },
    });
    const form = new FormData();
    form.set(
      'file',
      new Blob(['# Hello\n'], { type: 'text/markdown' }),
      'notes.md',
    );
    form.set('relative_path', 'docs/notes.md');
    const res = await POST_FILE(
      req('http://localhost/itms/ai/api/knowledge/files', {
        method: 'POST',
        userId: '1',
        body: form,
      }),
    );
    expect(res.status).toBe(202);
    expect(uploadFile).toHaveBeenCalledTimes(1);
    const arg = uploadFile.mock.calls[0][1];
    expect(uploadFile.mock.calls[0][0]).toBe('1');
    expect(arg.relativePath).toBe('docs/notes.md');
    expect(arg.markdown).toContain('# Hello');
  });

  it('POST files rejects an upload that would exceed the user storage quota', async () => {
    getTree.mockResolvedValue({
      user_id: '1',
      tree: {
        type: 'dir',
        name: '',
        path: '',
        children: [
          {
            type: 'file',
            name: 'big.md',
            path: 'big.md',
            file: {
              id: 'big',
              original_filename: 'big.md',
              inbox_relpath: 'big.md',
              markdown_relpath: 'big.md',
              size_bytes: 6 * 1024 * 1024 * 1024,
            },
          },
        ],
      },
    });
    const form = new FormData();
    form.set(
      'file',
      new Blob(['# Hello\n'], { type: 'text/markdown' }),
      'notes.md',
    );
    form.set('relative_path', 'notes.md');
    const res = await POST_FILE(
      req('http://localhost/itms/ai/api/knowledge/files', {
        method: 'POST',
        userId: '1',
        body: form,
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toMatch(/Storage quota exceeded/);
    expect(uploadFile).not.toHaveBeenCalled();
  });

  it('POST files counts original plus markdown against the quota', async () => {
    const { DEFAULT_MAX_USER_BYTES } = await import('@/lib/knowledge/storage');
    uploadFile.mockResolvedValue({
      file: { id: 'f1' },
      task: { id: 't1', status: 'pending' },
    });
    getTree.mockResolvedValue({
      user_id: '1',
      tree: {
        type: 'dir',
        name: '',
        path: '',
        children: [
          {
            type: 'file',
            name: 'kept.md',
            path: 'kept.md',
            file: {
              id: 'kept',
              original_filename: 'kept.md',
              inbox_relpath: 'kept.md',
              markdown_relpath: '',
              size_bytes: DEFAULT_MAX_USER_BYTES - 10,
            },
          },
        ],
      },
    });
    const form = new FormData();
    form.set(
      'file',
      new Blob(['# Hello\n'], { type: 'text/markdown' }),
      'notes.md',
    );
    form.set('relative_path', 'notes.md');
    const res = await POST_FILE(
      req('http://localhost/itms/ai/api/knowledge/files', {
        method: 'POST',
        userId: '1',
        body: form,
      }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      message: expect.stringMatching(/Storage quota exceeded/),
    });
    expect(uploadFile).not.toHaveBeenCalled();
  });

  it('POST files applies the public library quota for curator uploads', async () => {
    canWritePublicLibrary.mockReturnValue(true);
    uploadFile.mockResolvedValue({
      file: { id: 'f1' },
      task: { id: 't1', status: 'pending' },
    });
    getTree.mockImplementation(async (_userId: string, deps?: { library?: string }) => ({
      user_id: 'admin',
      tree: {
        type: 'dir',
        name: '',
        path: '',
        children:
          deps?.library === 'public'
            ? [
                {
                  type: 'file',
                  name: 'big.md',
                  path: 'big.md',
                  file: {
                    id: 'big',
                    original_filename: 'big.md',
                    inbox_relpath: 'big.md',
                    markdown_relpath: 'big.md',
                    size_bytes: 6 * 1024 * 1024 * 1024,
                  },
                },
              ]
            : [],
      },
    }));
    const form = new FormData();
    form.set(
      'file',
      new Blob(['# Hello\n'], { type: 'text/markdown' }),
      'notes.md',
    );
    form.set('relative_path', 'notes.md');
    form.set('library', 'public');
    const res = await POST_FILE(
      req('http://localhost/itms/ai/api/knowledge/files', {
        method: 'POST',
        userId: 'admin',
        body: form,
      }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      message: expect.stringMatching(/Storage quota exceeded/),
    });
    expect(getTree).toHaveBeenCalledWith('admin', { library: 'public' });
    expect(uploadFile).not.toHaveBeenCalled();
  });

  it('POST files rejects unsafe relative_path before Dochub', async () => {
    const form = new FormData();
    form.set('file', new Blob(['# Hello\n']), 'notes.md');
    form.set('relative_path', '../evil.md');
    const res = await POST_FILE(
      req('http://localhost/itms/ai/api/knowledge/files', {
        method: 'POST',
        userId: '1',
        body: form,
      }),
    );
    expect(res.status).toBe(400);
    expect(uploadFile).not.toHaveBeenCalled();
  });

  it('POST search defaults mode and limit', async () => {
    search.mockResolvedValue({
      user_id: '1',
      mode: 'search',
      query: 'q',
      results: [],
    });
    const res = await POST_SEARCH(
      req('http://localhost/itms/ai/api/knowledge/search', {
        method: 'POST',
        userId: '1',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: 'q' }),
      }),
    );
    expect(res.status).toBe(200);
    expect(search).toHaveBeenCalledWith(
      '1',
      {
        query: 'q',
        mode: 'search',
        limit: 10,
        path: undefined,
      },
      { library: 'private' },
    );
  });

  it('POST search with library=public stays on the public index', async () => {
    search.mockResolvedValue({
      user_id: '1',
      mode: 'search',
      query: 'q',
      results: [{ path: 'spr/wiki/index.md', text: 'SPR' }],
    });
    const res = await POST_SEARCH(
      req('http://localhost/itms/ai/api/knowledge/search', {
        method: 'POST',
        userId: '1',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: 'q', library: 'public' }),
      }),
    );
    expect(res.status).toBe(200);
    expect(search).toHaveBeenCalledWith(
      '1',
      {
        query: 'q',
        mode: 'search',
        limit: 10,
        path: undefined,
      },
      { library: 'public' },
    );
    const body = await res.json();
    expect(body.library).toBe('public');
    expect(body.results[0].library).toBe('public');
  });

  it('POST search drops hidden public sfc hits', async () => {
    search.mockResolvedValue({
      user_id: '1',
      mode: 'search',
      query: 'q',
      results: [
        { file: 'qmd://markdown/spr/wiki/index.md', snippet: 'SPR' },
        { file: 'qmd://markdown/sfc/wiki/index.md', snippet: 'SFC' },
      ],
    });
    const res = await POST_SEARCH(
      req('http://localhost/itms/ai/api/knowledge/search', {
        method: 'POST',
        userId: '1',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: 'q', library: 'public' }),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results).toHaveLength(1);
    expect(body.results[0].file).toBe('qmd://markdown/spr/wiki/index.md');
  });

  it('POST search rejects a hidden public sfc path', async () => {
    const res = await POST_SEARCH(
      req('http://localhost/itms/ai/api/knowledge/search', {
        method: 'POST',
        userId: '1',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: 'q', library: 'public', path: 'sfc' }),
      }),
    );
    expect(res.status).toBe(400);
    expect(search).not.toHaveBeenCalled();
  });

  it('GET content defaults to markdown', async () => {
    getFileContent.mockResolvedValue({
      bytes: new TextEncoder().encode('# hi'),
      contentType: 'text/markdown',
    });
    const res = await GET_CONTENT(
      req('http://localhost/itms/ai/api/knowledge/files/abc/content', {
        userId: '1',
      }),
      { params: Promise.resolve({ id: 'abc' }) },
    );
    expect(res.status).toBe(200);
    expect(getFileContent).toHaveBeenCalledWith('1', 'abc', 'markdown');
    expect(await res.text()).toContain('# hi');
  });

  it('GET task forwards the id', async () => {
    getTask.mockResolvedValue({
      task: { id: 't1', status: 'succeeded', stage: 'qmd_embed' },
    });
    const res = await GET_TASK(
      req('http://localhost/itms/ai/api/knowledge/tasks/t1', { userId: '1' }),
      { params: Promise.resolve({ id: 't1' }) },
    );
    expect(res.status).toBe(200);
    expect(getTask).toHaveBeenCalledWith('1', 't1');
  });

  it('POST files rejects public uploads for non-curators', async () => {
    const form = new FormData();
    form.set('file', new Blob(['# Hello\n'], { type: 'text/markdown' }), 'notes.md');
    form.set('relative_path', 'spr/notes.md');
    form.set('library', 'public');
    const res = await POST_FILE(
      req('http://localhost/itms/ai/api/knowledge/files', {
        method: 'POST',
        userId: '1',
        body: form,
      }),
    );
    expect(res.status).toBe(403);
    expect(uploadFile).not.toHaveBeenCalled();
  });

  it('does not add GET /api/knowledge/files', () => {
    const src = readFileSync(
      path.join(__dirname, '../../app/api/knowledge/files/route.ts'),
      'utf8',
    );
    expect(src).not.toMatch(/export async function GET/);
  });
});

describe('middleware matcher', () => {
  it('protects /api/knowledge', () => {
    const src = readFileSync(
      path.join(__dirname, '../../middleware.ts'),
      'utf8',
    );
    expect(src).toMatch(/'\/api\/knowledge'/);
    expect(src).toMatch(/\/api\/knowledge\/:path\*/);
  });
});
