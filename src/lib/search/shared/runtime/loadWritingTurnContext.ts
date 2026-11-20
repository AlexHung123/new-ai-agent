import { getTree } from '@/lib/knowledge/dochubClient';
import type { KnowledgeTreeNode } from '@/lib/knowledge/types';
import { resolveWritingKnowledgePin } from '@/lib/knowledge/writingPin';
import type { WritingTurnContext } from './writingTurnContext';

export async function loadWritingTurnContext(opts: {
  userId: string;
  text: string;
  selectedFolder?: string;
  loadTree?: typeof getTree;
}): Promise<WritingTurnContext> {
  let tree: KnowledgeTreeNode | null = null;
  try {
    const load = opts.loadTree ?? getTree;
    const result = await load(opts.userId);
    tree = result?.tree ?? null;
  } catch {
    tree = null;
  }

  const pin = resolveWritingKnowledgePin({
    text: opts.text,
    tree,
    selectedFolder: opts.selectedFolder,
  });

  return {
    userId: opts.userId,
    pin: pin.pin,
    mentionedDocuments: pin.mentionedDocuments,
    tree,
  };
}
