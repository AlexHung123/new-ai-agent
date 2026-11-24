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
  selectedFolder?: string;
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

  const pinLibrary = pin.pinLibrary || 'private';
  const treeForPin = pinLibrary === 'public' ? publicTree : privateTree;
  const pinnedNode = pin.pin && treeForPin ? nodeAtPath(treeForPin, pin.pin) : null;
  const local = pinLibrary === 'public' ? localWikiSlot(pin.pin) : null;
  const isWiki = isStructuredKnowledgeNode(pinnedNode) || Boolean(local && !local.scoped);
  const retrievalMode: WritingTurnContext['retrievalMode'] = isWiki ? 'wiki' : 'search';

  let contexts: WritingTurnContext['contexts'];
  let index: WritingTurnContext['index'];
  if (libraryAvailable) {
    try {
      const status = await (opts.loadStatus ?? getStatus)(opts.userId, {
        library: pinLibrary,
      });
      contexts = status.contexts ?? status.index?.contexts;
      index = {
        keyword_search_ready: status.keyword_search_ready ?? status.index?.keyword_search_ready,
        semantic_search_ready: status.semantic_search_ready ?? status.index?.semantic_search_ready,
        hint: status.hint ?? status.index?.hint,
      };
    } catch {
      /* status is optional once a tree loaded */
    }
  }

  return {
    userId: opts.userId,
    pin: pin.pin,
    pinLibrary,
    retrievalMode,
    wikiTitle: local?.slot.title || pinnedNode?.name || undefined,
    wikiRootAbs: local && !local.scoped ? local.root : undefined,
    mentionedDocuments: pin.mentionedDocuments,
    tree: privateTree,
    publicTree,
    libraryAvailable,
    libraryError,
    contexts,
    index,
  };
}
