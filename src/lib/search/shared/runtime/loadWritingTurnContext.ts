import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  DOCUMENT_SLOTS,
  documentRootAbs,
} from '@/lib/documents/catalog';
import { getStatus, getTree } from '@/lib/knowledge/dochubClient';
import { isHiddenPublicFolder } from '@/lib/knowledge/library';
import type { KnowledgeTreeNode } from '@/lib/knowledge/types';
import {
  filterTree,
  isStructuredKnowledgeNode,
  nodeAtPath,
} from '@/lib/knowledge/tree';
import { resolveWritingKnowledgePin } from '@/lib/knowledge/writingPin';
import type { WritingTurnContext } from './writingTurnContext';

const LIBRARY_UNAVAILABLE =
  'Knowledge service is unavailable. Knowledge tools will fail; do not retry query, get, multi_get, or tree. Tell the user the knowledge library is unreachable.';

function localWikiSlot(path: string | null) {
  if (!path) return null;
  const id = path.split('/').filter(Boolean)[0];
  if (!id) return null;
  const slot = DOCUMENT_SLOTS.find((item) => item.id === id || item.dirName === id);
  if (!slot) return null;
  const root = documentRootAbs(slot);
  if (!existsSync(join(root, 'wiki', 'index.md'))) return null;
  // Only treat the slot root as a wiki bind, not an arbitrary subfolder.
  if (path !== slot.id && path !== slot.dirName) return { slot, root, scoped: true };
  return { slot, root, scoped: false };
}

export async function loadWritingTurnContext(opts: {
  userId: string;
  text: string;
  selectedFolder?: string | string[];
  documentId?: string | null;
  loadTree?: typeof getTree;
  loadStatus?: typeof getStatus;
}): Promise<WritingTurnContext> {
  const load = opts.loadTree ?? getTree;
  let privateTree: KnowledgeTreeNode | null = null;
  let publicTree: KnowledgeTreeNode | null = null;
  let libraryAvailable = false;
  let libraryError: string | undefined;
  const errors: string[] = [];

  const loadOne = async (library: 'private' | 'public') => {
    try {
      const result = await load(opts.userId, { library });
      libraryAvailable = true;
      return result?.tree ?? null;
    } catch (error) {
      errors.push(
        error instanceof Error && error.message
          ? error.message
          : 'unavailable',
      );
      return null;
    }
  };

  const [priv, pub] = await Promise.all([loadOne('private'), loadOne('public')]);
  privateTree = priv;
  publicTree = pub
    ? filterTree(pub, (node) => !isHiddenPublicFolder(node.path || ''))
    : null;
  if (!libraryAvailable) {
    libraryError =
      errors.length > 0
        ? `${LIBRARY_UNAVAILABLE} (${errors[0]})`
        : LIBRARY_UNAVAILABLE;
  }

  const pin = resolveWritingKnowledgePin({
    text: opts.text,
    tree: privateTree,
    publicTree,
    selectedFolder: opts.selectedFolder,
    documentId: opts.documentId,
  });

  const scopes: WritingTurnContext['scopes'] = [];
  for (const scope of pin.pins) {
    const treeForPin = scope.library === 'public' ? publicTree : privateTree;
    const pinnedNode =
      treeForPin ? nodeAtPath(treeForPin, scope.path) : null;
    const local = scope.library === 'public' ? localWikiSlot(scope.path) : null;
    const isWiki =
      isStructuredKnowledgeNode(pinnedNode) || Boolean(local && !local.scoped);
    scopes.push({
      path: scope.path,
      library: scope.library,
      retrievalMode: isWiki ? 'wiki' : 'search',
      ...(isWiki && (local?.slot.title || pinnedNode?.name)
        ? { wikiTitle: local?.slot.title || pinnedNode?.name }
        : {}),
      ...(local && !local.scoped ? { wikiRootAbs: local.root } : {}),
    });
  }

  const first = scopes[0];
  const pinLibrary = first?.library || pin.pinLibrary || 'private';
  const allWiki = scopes.length > 0 && scopes.every((scope) => scope.retrievalMode === 'wiki');
  const retrievalMode: WritingTurnContext['retrievalMode'] = allWiki ? 'wiki' : 'search';
  const localWiki = scopes.find((scope) => scope.wikiRootAbs);

  let contexts: WritingTurnContext['contexts'];
  let index: WritingTurnContext['index'];
  if (libraryAvailable) {
    const libraries: Array<'private' | 'public'> = scopes.length
      ? [...new Set(scopes.map((scope) => scope.library))]
      : ['private'];
    try {
      const statuses = await Promise.all(
        libraries.map((library) =>
          (opts.loadStatus ?? getStatus)(opts.userId, { library }),
        ),
      );
      const mergedContexts: NonNullable<WritingTurnContext['contexts']> = [];
      let keywordReady = true;
      let semanticReady = true;
      let hint: string | null | undefined;
      for (const status of statuses) {
        const items = status.contexts ?? status.index?.contexts;
        if (items?.length) mergedContexts.push(...items);
        if ((status.keyword_search_ready ?? status.index?.keyword_search_ready) === false) {
          keywordReady = false;
        }
        if ((status.semantic_search_ready ?? status.index?.semantic_search_ready) === false) {
          semanticReady = false;
        }
        hint = hint || status.hint || status.index?.hint;
      }
      if (mergedContexts.length) contexts = mergedContexts;
      index = {
        keyword_search_ready: keywordReady,
        semantic_search_ready: semanticReady,
        hint,
      };
    } catch {
      /* status is optional once a tree loaded */
    }
  }

  return {
    userId: opts.userId,
    pin: first?.path ?? pin.pin,
    pinLibrary,
    retrievalMode,
    wikiTitle: localWiki?.wikiTitle || first?.wikiTitle,
    wikiRootAbs: localWiki?.wikiRootAbs,
    scopes,
    mentionedDocuments: pin.mentionedDocuments,
    tree: privateTree,
    publicTree,
    libraryAvailable,
    libraryError,
    contexts,
    index,
  };
}
