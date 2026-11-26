'use client';

import { useEffect, useRef, useState } from 'react';
import { getAuthHeaders } from '@/lib/utils/auth';
import type { KnowledgeLibrary } from './library';
import type { KnowledgeTreeNode } from './types';

const EMPTY_TREE: KnowledgeTreeNode = {
  type: 'dir',
  name: '',
  path: '',
  children: [],
};

export const KNOWLEDGE_TREE_API = '/itms/ai/api/knowledge/tree';

/** Append ?library= when a single library is enough. Omit it to fetch both. */
export function knowledgeTreeUrl(library?: KnowledgeLibrary): string {
  if (!library) return KNOWLEDGE_TREE_API;
  return `${KNOWLEDGE_TREE_API}?library=${encodeURIComponent(library)}`;
}

export type UseKnowledgeTreeOptions = {
  /** Fetch only this library. Omit to fetch both (backward-compatible default). */
  library?: KnowledgeLibrary;
  /** When false, skip fetching. Default true. */
  enabled?: boolean;
};

export type KnowledgeTreeLoaded = Record<KnowledgeLibrary, boolean>;

export type KnowledgeTreeHookValue = {
  tree: KnowledgeTreeNode;
  privateTree: KnowledgeTreeNode;
  publicTree: KnowledgeTreeNode;
  canWritePublic: boolean;
  error: string | null;
  loading: boolean;
  loadedLibraries: KnowledgeTreeLoaded;
};

type ParsedTrees = {
  privateTree?: KnowledgeTreeNode;
  publicTree?: KnowledgeTreeNode;
  canWritePublic: boolean;
};

function asTree(value: unknown): KnowledgeTreeNode | null {
  return value && typeof value === 'object' ? (value as KnowledgeTreeNode) : null;
}

function branchTree(body: Record<string, unknown> | null, key: 'private' | 'public') {
  const branch = body?.[key];
  if (!branch || typeof branch !== 'object') return null;
  return asTree((branch as { tree?: unknown }).tree);
}

/** Parse a tree API body, optionally scoped to one library so the other is left unset. */
export function treesFromKnowledgeResponse(
  body: unknown,
  library?: KnowledgeLibrary,
): ParsedTrees {
  const rec =
    body && typeof body === 'object' ? (body as Record<string, unknown>) : null;
  const canWritePublic = rec?.canWritePublic === true;
  if (library === 'public') {
    return {
      publicTree: branchTree(rec, 'public') || asTree(rec?.tree) || EMPTY_TREE,
      canWritePublic,
    };
  }
  if (library === 'private') {
    return {
      privateTree: branchTree(rec, 'private') || asTree(rec?.tree) || EMPTY_TREE,
      canWritePublic,
    };
  }
  return {
    privateTree: branchTree(rec, 'private') || asTree(rec?.tree) || EMPTY_TREE,
    publicTree: branchTree(rec, 'public') || EMPTY_TREE,
    canWritePublic,
  };
}

export function normalizeUseKnowledgeTreeArg(
  treeUrlOrOptions?: string | UseKnowledgeTreeOptions,
): { treeUrl: string; library?: KnowledgeLibrary; enabled: boolean } {
  if (typeof treeUrlOrOptions === 'string') {
    return { treeUrl: treeUrlOrOptions, enabled: true };
  }
  const library = treeUrlOrOptions?.library;
  return {
    treeUrl: library
      ? knowledgeTreeUrl(library)
      : KNOWLEDGE_TREE_API,
    library,
    enabled: treeUrlOrOptions?.enabled !== false,
  };
}

// Callers pass `{ library }` to load one tab, or `{ enabled: false }` until a
// surface that needs both trees (the @ mention menu) actually opens. The
// default remains an unscoped fetch of Private and Public together.
export function useKnowledgeTree(
  treeUrlOrOptions?: string | UseKnowledgeTreeOptions,
): KnowledgeTreeHookValue {
  const { treeUrl, library, enabled } = normalizeUseKnowledgeTreeArg(
    treeUrlOrOptions,
  );
  const [privateTree, setPrivateTree] = useState<KnowledgeTreeNode>(EMPTY_TREE);
  const [publicTree, setPublicTree] = useState<KnowledgeTreeNode>(EMPTY_TREE);
  const [loadedLibraries, setLoadedLibraries] = useState<KnowledgeTreeLoaded>({
    private: false,
    public: false,
  });
  const [canWritePublic, setCanWritePublic] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(enabled);
  const loadedLibrariesRef = useRef(loadedLibraries);
  loadedLibrariesRef.current = loadedLibraries;

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const loaded = loadedLibrariesRef.current;
    const alreadyLoaded = library
      ? loaded[library]
      : loaded.private && loaded.public;
    if (alreadyLoaded) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void (async () => {
      try {
        const res = await fetch(treeUrl, { headers: getAuthHeaders() });
        const body = await res.json().catch(() => null);
        if (!res.ok) {
          if (cancelled) return;
          const message =
            body && typeof body.message === 'string' && body.message
              ? body.message
              : 'Knowledge service is unavailable.';
          setError(message);
          if (!library) {
            setPrivateTree(EMPTY_TREE);
            setPublicTree(EMPTY_TREE);
            setLoadedLibraries({ private: false, public: false });
          }
          setCanWritePublic(false);
          return;
        }
        const parsed = treesFromKnowledgeResponse(body, library);
        // Apply even if this effect was cleaned up, so a tab switch does not
        // throw away a request that already completed.
        if (parsed.privateTree !== undefined) {
          setPrivateTree(parsed.privateTree);
        }
        if (parsed.publicTree !== undefined) {
          setPublicTree(parsed.publicTree);
        }
        setLoadedLibraries((prev) => ({
          ...prev,
          ...(parsed.privateTree !== undefined ? { private: true } : {}),
          ...(parsed.publicTree !== undefined ? { public: true } : {}),
        }));
        setCanWritePublic(parsed.canWritePublic);
        if (!cancelled) setError(null);
      } catch {
        if (cancelled) return;
        setError('Knowledge service is unavailable.');
        if (!library) {
          setPrivateTree(EMPTY_TREE);
          setPublicTree(EMPTY_TREE);
          setLoadedLibraries({ private: false, public: false });
        }
        setCanWritePublic(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, library, treeUrl]);

  return {
    tree: privateTree,
    privateTree,
    publicTree,
    canWritePublic,
    error,
    loading,
    loadedLibraries,
  };
}
