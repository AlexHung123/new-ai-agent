import { describe, expect, it } from 'vitest';
import { KNOWLEDGE_TREE_API, knowledgeTreeUrl } from './useKnowledgeTree';

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
