import { getStatus, getTree } from '@/lib/knowledge/dochubClient';
import type { KnowledgeTreeNode } from '@/lib/knowledge/types';
import { resolveWritingKnowledgePin } from '@/lib/knowledge/writingPin';
import type { WritingTurnContext } from './writingTurnContext';

const LIBRARY_UNAVAILABLE =
  'Knowledge service is unavailable. Knowledge tools will fail; do not retry query, get, multi_get, or tree. Tell the user the knowledge library is unreachable.';

export async function loadWritingTurnContext(opts: {
  userId: string;
  text: string;
  selectedFolder?: string;
  loadTree?: typeof getTree;
  loadStatus?: typeof getStatus;
}): Promise<WritingTurnContext> {
  let tree: KnowledgeTreeNode | null = null;
  let libraryAvailable = false;
  let libraryError: string | undefined;
  try {
    const load = opts.loadTree ?? getTree;
    const result = await load(opts.userId);
    tree = result?.tree ?? null;
    libraryAvailable = tree != null || result != null;
  } catch (error) {
    tree = null;
    libraryAvailable = false;
    libraryError =
      error instanceof Error && error.message
        ? `${LIBRARY_UNAVAILABLE} (${error.message})`
        : LIBRARY_UNAVAILABLE;
  }

  const pin = resolveWritingKnowledgePin({
    text: opts.text,
    tree,
    selectedFolder: opts.selectedFolder,
  });

  let contexts: WritingTurnContext['contexts'];
  let index: WritingTurnContext['index'];
  if (libraryAvailable) {
    try {
      const status = await (opts.loadStatus ?? getStatus)(opts.userId);
      contexts = status.contexts ?? status.index?.contexts;
      index = {
        keyword_search_ready: status.keyword_search_ready ?? status.index?.keyword_search_ready,
        semantic_search_ready: status.semantic_search_ready ?? status.index?.semantic_search_ready,
        hint: status.hint ?? status.index?.hint,
      };
    } catch {
      /* status is optional once the tree loaded */
    }
  }

  return {
    userId: opts.userId,
    pin: pin.pin,
    mentionedDocuments: pin.mentionedDocuments,
    tree,
    libraryAvailable,
    libraryError,
    contexts,
    index,
  };
}
