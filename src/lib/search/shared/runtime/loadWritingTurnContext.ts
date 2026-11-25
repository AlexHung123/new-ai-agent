import { getStatus, getTree } from '@/lib/knowledge/dochubClient';
import { isHiddenPublicFolder } from '@/lib/knowledge/library';
import type { KnowledgeTreeNode } from '@/lib/knowledge/types';
import { filterTree } from '@/lib/knowledge/tree';
import { resolveWritingKnowledgePin } from '@/lib/knowledge/writingPin';
import type { WritingTurnContext } from './writingTurnContext';

const LIBRARY_UNAVAILABLE =
  'Knowledge service is unavailable. Knowledge tools will fail; do not retry search or read. Tell the user the knowledge library is unreachable.';

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
    if (scope.library === 'public' && isHiddenPublicFolder(scope.path)) continue;
    scopes.push({
      path: scope.path,
      library: scope.library,
    });
  }

  const first = scopes[0];
  const pinLibrary = first?.library || pin.pinLibrary || 'private';

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
