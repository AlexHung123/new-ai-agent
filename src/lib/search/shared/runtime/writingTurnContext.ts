import { AsyncLocalStorage } from 'node:async_hooks';
import type { KnowledgeTreeNode } from '@/lib/knowledge/types';
import type { WritingMentionedDocument } from '@/lib/knowledge/writingPin';

export type WritingCollectionContext = {
  path: string;
  text: string;
};

export type WritingIndexStatus = {
  keyword_search_ready?: boolean;
  semantic_search_ready?: boolean;
  hint?: string | null;
};

export type WritingKnowledgeScope = {
  path: string;
  library: 'private' | 'public';
};

export type WritingTurnContext = {
  userId: string;
  pin: string | null;
  pinLibrary?: 'private' | 'public';
  scopes?: WritingKnowledgeScope[];
  mentionedDocuments: WritingMentionedDocument[];
  tree: KnowledgeTreeNode | null;
  publicTree?: KnowledgeTreeNode | null;
  libraryAvailable?: boolean;
  libraryError?: string;
  contexts?: WritingCollectionContext[];
  index?: WritingIndexStatus;
};

export function writingTurnScopes(
  ctx: WritingTurnContext | undefined,
): WritingKnowledgeScope[] {
  if (!ctx) return [];
  if (ctx.scopes?.length) return ctx.scopes;
  if (!ctx.pin) return [];
  return [
    {
      path: ctx.pin,
      library: ctx.pinLibrary === 'public' ? 'public' : 'private',
    },
  ];
}

export function writingScopeLabel(scope: {
  library: 'private' | 'public';
  path: string;
}): string {
  return `${scope.library}:${scope.path}`;
}

const globalForAls = globalThis as typeof globalThis & {
  __writingTurnAls?: AsyncLocalStorage<WritingTurnContext>;
};

const storage =
  globalForAls.__writingTurnAls ??
  (globalForAls.__writingTurnAls =
    new AsyncLocalStorage<WritingTurnContext>());

export function getWritingTurnContext(): WritingTurnContext | undefined {
  return storage.getStore();
}

export function runWithWritingTurn<T>(
  ctx: WritingTurnContext,
  fn: () => T | Promise<T>,
): T | Promise<T> {
  return storage.run(ctx, fn);
}
