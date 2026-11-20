'use client';

import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/utils/auth';
import type { KnowledgeTreeNode } from './types';

const EMPTY_TREE: KnowledgeTreeNode = {
  type: 'dir',
  name: '',
  path: '',
  children: [],
};

export const KNOWLEDGE_TREE_API = '/itms/ai/api/knowledge/tree';

export function useKnowledgeTree(treeUrl = KNOWLEDGE_TREE_API): {
  tree: KnowledgeTreeNode;
  error: string | null;
  loading: boolean;
} {
  const [tree, setTree] = useState<KnowledgeTreeNode>(EMPTY_TREE);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const res = await fetch(treeUrl, { headers: getAuthHeaders() });
        const body = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok) {
          const message =
            body && typeof body.message === 'string' && body.message
              ? body.message
              : 'Knowledge service is unavailable.';
          setError(message);
          setTree(EMPTY_TREE);
          return;
        }
        const next =
          body && typeof body === 'object' && body.tree && typeof body.tree === 'object'
            ? (body.tree as KnowledgeTreeNode)
            : EMPTY_TREE;
        setError(null);
        setTree(next);
      } catch {
        if (cancelled) return;
        setError('Knowledge service is unavailable.');
        setTree(EMPTY_TREE);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [treeUrl]);

  return { tree, error, loading };
}
