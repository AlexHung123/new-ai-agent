import { describe, expect, it } from 'vitest';
import { loadWritingTurnContext } from './loadWritingTurnContext';
import type { KnowledgeTreeNode } from '@/lib/knowledge/types';

const tree: KnowledgeTreeNode = {
  type: 'dir',
  name: '',
  path: '',
  children: [
    {
      type: 'dir',
      name: 'writing',
      path: 'writing',
      children: [],
    },
  ],
};

describe('loadWritingTurnContext', () => {
  it('resolves pin from a loaded tree', async () => {
    const ctx = await loadWritingTurnContext({
      userId: '1',
      text: 'hello',
      selectedFolder: 'writing',
      loadTree: async () => ({ user_id: '1', tree }),
      loadStatus: async () => ({ ok: true }),
    });
    expect(ctx).toMatchObject({ userId: '1', pin: 'writing', tree, libraryAvailable: true });
  });

  it('still returns a turn when getTree throws', async () => {
    const ctx = await loadWritingTurnContext({
      userId: '1',
      text: '@writing hello',
      selectedFolder: 'writing',
      loadTree: async () => {
        throw new Error('ECONNREFUSED');
      },
    });
    expect(ctx.userId).toBe('1');
    expect(ctx.pin).toBe(null);
    expect(ctx.mentionedDocuments).toEqual([]);
    expect(ctx.tree).toBeNull();
    expect(ctx.libraryAvailable).toBe(false);
    expect(ctx.libraryError).toMatch(/Knowledge service is unavailable/);
  });

  it('loads collection context and index readiness', async () => {
    const ctx = await loadWritingTurnContext({
      userId: '1',
      text: 'hello',
      loadTree: async () => ({ user_id: '1', tree }),
      loadStatus: async () => ({
        ok: true,
        keyword_search_ready: true,
        semantic_search_ready: false,
        hint: 'Use keyword search',
        contexts: [{ path: '/', text: 'User markdown documents' }],
      }),
    });
    expect(ctx.contexts).toEqual([{ path: '/', text: 'User markdown documents' }]);
    expect(ctx.index).toMatchObject({
      keyword_search_ready: true,
      semantic_search_ready: false,
      hint: 'Use keyword search',
    });
  });

  it('pins a structured public folder as ordinary Dochub search', async () => {
    const publicTree: KnowledgeTreeNode = {
      type: 'dir',
      name: '',
      path: '',
      children: [
        {
          type: 'dir',
          name: 'spr',
          path: 'spr',
          wiki: true,
          children: [
            {
              type: 'dir',
              name: 'wiki',
              path: 'spr/wiki',
              children: [
                { type: 'file', name: 'index.md', path: 'spr/wiki/index.md' },
              ],
            },
          ],
        },
      ],
    };
    const ctx = await loadWritingTurnContext({
      userId: '1',
      text: 'hello',
      selectedFolder: 'public:spr',
      loadTree: async (_userId, deps) => {
        if (deps?.library === 'public') {
          return { user_id: '1', tree: publicTree };
        }
        return {
          user_id: '1',
          tree: { type: 'dir', name: '', path: '', children: [] },
        };
      },
      loadStatus: async () => ({ ok: true }),
    });
    expect(ctx.pin).toBe('spr');
    expect(ctx.pinLibrary).toBe('public');
    expect(ctx.retrievalMode).toBe('search');
    expect(ctx.wikiRootAbs).toBeUndefined();
    expect(ctx.scopes).toEqual([
      { path: 'spr', library: 'public', retrievalMode: 'search' },
    ]);
  });

  it('keeps ordinary private folders on search retrieval', async () => {
    const ctx = await loadWritingTurnContext({
      userId: '1',
      text: 'hello',
      selectedFolder: 'writing',
      loadTree: async (_userId, deps) => ({
        user_id: '1',
        tree: deps?.library === 'private' ? tree : { type: 'dir', name: '', path: '', children: [] },
      }),
      loadStatus: async () => ({ ok: true }),
    });
    expect(ctx.pin).toBe('writing');
    expect(ctx.pinLibrary).toBe('private');
    expect(ctx.retrievalMode).toBe('search');
  });

  it('omits the hidden public sfc folder and still pins a private folder without @', async () => {
    const privateTree: KnowledgeTreeNode = {
      type: 'dir',
      name: '',
      path: '',
      children: [
        {
          type: 'dir',
          name: 'testing2',
          path: 'testing2',
          children: [
            {
              type: 'file',
              name: 'note.md',
              path: 'testing2/note.md',
              file: {
                id: 'n1',
                original_filename: null as unknown as string,
                inbox_relpath: null as unknown as string,
                markdown_relpath: 'testing2/note.md',
                size_bytes: 1,
              },
            },
          ],
        },
      ],
    };
    const publicTree: KnowledgeTreeNode = {
      type: 'dir',
      name: '',
      path: '',
      children: [
        {
          type: 'dir',
          name: 'sfc',
          path: 'sfc',
          children: [
            {
              type: 'file',
              name: 'hidden.md',
              path: 'sfc/hidden.md',
              file: {
                id: 'h1',
                original_filename: null as unknown as string,
                inbox_relpath: null as unknown as string,
                markdown_relpath: null as unknown as string,
                size_bytes: 1,
              },
            },
          ],
        },
        {
          type: 'dir',
          name: 'spr',
          path: 'spr',
          wiki: true,
          children: [],
        },
      ],
    };
    const ctx = await loadWritingTurnContext({
      userId: '1',
      text: 'list out all the documents',
      selectedFolder: 'testing2',
      loadTree: async (_userId, deps) => ({
        user_id: '1',
        tree: deps?.library === 'public' ? publicTree : privateTree,
      }),
      loadStatus: async () => ({ ok: true }),
    });
    expect(ctx.pin).toBe('testing2');
    expect(ctx.pinLibrary).toBe('private');
    expect(ctx.publicTree?.children?.map((child) => child.name)).toEqual(['spr']);
  });

  it('does not bind hidden public sfc from a legacy documentId', async () => {
    const publicTree: KnowledgeTreeNode = {
      type: 'dir',
      name: '',
      path: '',
      children: [
        {
          type: 'dir',
          name: 'sfc',
          path: 'sfc',
          children: [],
        },
        {
          type: 'dir',
          name: 'spr',
          path: 'spr',
          wiki: true,
          children: [],
        },
      ],
    };
    const ctx = await loadWritingTurnContext({
      userId: '1',
      text: 'hello',
      documentId: 'sfc',
      loadTree: async (_userId, deps) => ({
        user_id: '1',
        tree:
          deps?.library === 'public'
            ? publicTree
            : { type: 'dir', name: '', path: '', children: [] },
      }),
      loadStatus: async () => ({ ok: true }),
    });
    expect(ctx.pin).toBeNull();
    expect(ctx.scopes).toEqual([]);
    expect(ctx.wikiRootAbs).toBeUndefined();
    expect(ctx.publicTree?.children?.map((child) => child.name)).toEqual(['spr']);
  });

  it('routes mixed private, public, and structured scopes separately', async () => {
    const privateTree: KnowledgeTreeNode = {
      type: 'dir',
      name: '',
      path: '',
      children: [
        { type: 'dir', name: 'writing', path: 'writing', children: [] },
      ],
    };
    const publicTree: KnowledgeTreeNode = {
      type: 'dir',
      name: '',
      path: '',
      children: [
        {
          type: 'dir',
          name: 'testing1',
          path: 'testing1',
          children: [],
        },
        {
          type: 'dir',
          name: 'spr',
          path: 'spr',
          wiki: true,
          children: [],
        },
      ],
    };
    const ctx = await loadWritingTurnContext({
      userId: '1',
      text: 'hello',
      selectedFolder: 'private:writing,public:testing1,public:spr',
      loadTree: async (_userId, deps) => ({
        user_id: '1',
        tree: deps?.library === 'public' ? publicTree : privateTree,
      }),
      loadStatus: async () => ({ ok: true }),
    });
    expect(ctx.pin).toBe('writing');
    expect(ctx.pinLibrary).toBe('private');
    expect(ctx.retrievalMode).toBe('search');
    expect(ctx.scopes).toEqual([
      { path: 'writing', library: 'private', retrievalMode: 'search' },
      { path: 'testing1', library: 'public', retrievalMode: 'search' },
      { path: 'spr', library: 'public', retrievalMode: 'search' },
    ]);
    expect(ctx.wikiRootAbs).toBeUndefined();
  });

  it('keeps knowledge unbound when there is no pin and no @', async () => {
    const ctx = await loadWritingTurnContext({
      userId: '1',
      text: 'hello',
      loadTree: async () => ({ user_id: '1', tree }),
      loadStatus: async () => ({ ok: true }),
    });
    expect(ctx.pin).toBeNull();
    expect(ctx.scopes).toEqual([]);
    expect(ctx.mentionedDocuments).toEqual([]);
  });
});
