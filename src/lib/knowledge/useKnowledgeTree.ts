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
  privateTree: KnowledgeTreeNode;
  publicTree: KnowledgeTreeNode;
  canWritePublic: boolean;
  error: string | null;
  loading: boolean;
} {
  const [privateTree, setPrivateTree] = useState<KnowledgeTreeNode>(EMPTY_TREE);
  const [publicTree, setPublicTree] = useState<KnowledgeTreeNode>(EMPTY_TREE);
  const [canWritePublic, setCanWritePublic] = useState(false);
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
          setPrivateTree(EMPTY_TREE);
          setPublicTree(EMPTY_TREE);
          setCanWritePublic(false);
          return;
        }
        const privateNext =
          body?.private?.tree && typeof body.private.tree === 'object'
            ? (body.private.tree as KnowledgeTreeNode)
            : body?.tree && typeof body.tree === 'object'
              ? (body.tree as KnowledgeTreeNode)
              : EMPTY_TREE;
        const publicNext =
          body?.public?.tree && typeof body.public.tree === 'object'
            ? (body.public.tree as KnowledgeTreeNode)
            : EMPTY_TREE;
        setError(null);
        setPrivateTree(privateNext);
        setPublicTree(publicNext);
        setCanWritePublic(body?.canWritePublic === true);
      } catch {
        if (cancelled) return;
        setError('Knowledge service is unavailable.');
        setPrivateTree(EMPTY_TREE);
        setPublicTree(EMPTY_TREE);
        setCanWritePublic(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [treeUrl]);

  return {
    tree: privateTree,
    privateTree,
    publicTree,
    canWritePublic,
    error,
    loading,
  };
}
