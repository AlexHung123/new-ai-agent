import { describe, expect, it } from 'vitest';
import {
  KNOWLEDGE_TREE_API,
  knowledgeTreeUrl,
  normalizeUseKnowledgeTreeArg,
  treesFromKnowledgeResponse,
} from './useKnowledgeTree';

const privateNode = {
  type: 'dir' as const,
  name: '',
  path: '',
  children: [{ type: 'dir' as const, name: 'notes', path: 'notes', children: [] }],
};
const publicNode = {
  type: 'dir' as const,
  name: '',
  path: '',
  children: [{ type: 'dir' as const, name: 'spr', path: 'spr', children: [] }],
};

describe('knowledgeTreeUrl', () => {
  it('scopes the tree endpoint when a library is given', () => {
    expect(knowledgeTreeUrl()).toBe(KNOWLEDGE_TREE_API);
    expect(knowledgeTreeUrl('private')).toBe(
      `${KNOWLEDGE_TREE_API}?library=private`,
    );
    expect(knowledgeTreeUrl('public')).toBe(
      `${KNOWLEDGE_TREE_API}?library=public`,
    );
  });
});

describe('normalizeUseKnowledgeTreeArg', () => {
  it('keeps a string argument as an unscoped URL', () => {
    expect(normalizeUseKnowledgeTreeArg()).toEqual({
      treeUrl: KNOWLEDGE_TREE_API,
      library: undefined,
      enabled: true,
    });
    expect(normalizeUseKnowledgeTreeArg(KNOWLEDGE_TREE_API)).toEqual({
      treeUrl: KNOWLEDGE_TREE_API,
      enabled: true,
    });
  });

  it('scopes the URL when a library is set and can defer the fetch', () => {
    expect(normalizeUseKnowledgeTreeArg({ library: 'public' })).toEqual({
      treeUrl: `${KNOWLEDGE_TREE_API}?library=public`,
      library: 'public',
      enabled: true,
    });
    expect(normalizeUseKnowledgeTreeArg({ enabled: false })).toEqual({
      treeUrl: KNOWLEDGE_TREE_API,
      library: undefined,
      enabled: false,
    });
  });
});

describe('treesFromKnowledgeResponse', () => {
  const both = {
    canWritePublic: true,
    tree: privateNode,
    private: { tree: privateNode },
    public: { tree: publicNode },
  };

  it('returns both trees from an unscoped body', () => {
    const parsed = treesFromKnowledgeResponse(both);
    expect(parsed.privateTree).toEqual(privateNode);
    expect(parsed.publicTree).toEqual(publicNode);
    expect(parsed.canWritePublic).toBe(true);
  });

  it('returns only the requested library so the other tree is left unset', () => {
    const privateOnly = treesFromKnowledgeResponse(
      { canWritePublic: false, private: { tree: privateNode }, tree: privateNode },
      'private',
    );
    expect(privateOnly.privateTree).toEqual(privateNode);
    expect(privateOnly.publicTree).toBeUndefined();
    expect(privateOnly.canWritePublic).toBe(false);

    const publicOnly = treesFromKnowledgeResponse(
      { canWritePublic: true, public: { tree: publicNode }, tree: publicNode },
      'public',
    );
    expect(publicOnly.publicTree).toEqual(publicNode);
    expect(publicOnly.privateTree).toBeUndefined();
    expect(publicOnly.canWritePublic).toBe(true);
  });

  it('falls back to body.tree and uses an empty tree when a branch is missing', () => {
    const parsed = treesFromKnowledgeResponse({ tree: privateNode });
    expect(parsed.privateTree).toEqual(privateNode);
    expect(parsed.publicTree).toEqual({
      type: 'dir',
      name: '',
      path: '',
      children: [],
    });
    expect(parsed.canWritePublic).toBe(false);
  });
});
