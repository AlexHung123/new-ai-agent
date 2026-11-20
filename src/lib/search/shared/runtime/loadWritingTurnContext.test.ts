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
    });
    expect(ctx).toMatchObject({ userId: '1', pin: 'writing', tree });
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
    expect(ctx).toEqual({
      userId: '1',
      pin: null,
      mentionedDocuments: [],
      tree: null,
    });
  });
});
