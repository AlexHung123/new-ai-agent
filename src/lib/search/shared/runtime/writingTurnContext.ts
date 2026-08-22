import { AsyncLocalStorage } from 'node:async_hooks';
import type { WritingAttachment } from '@/lib/writing/types';

export type WritingTurnContext = {
  userId: string;
  rootAbs: string;
  files: WritingAttachment[];
};

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
