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
});
