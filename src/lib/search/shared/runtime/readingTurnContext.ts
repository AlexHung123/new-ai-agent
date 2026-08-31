import { AsyncLocalStorage } from 'node:async_hooks';

export type ReadingTurnContext = {
  userId: string;
  fileId: string;
  title: string;
  rootAbs: string;
  status: 'ready' | 'failed';
  error?: string;
};

const globalForAls = globalThis as typeof globalThis & {
  __readingTurnAls?: AsyncLocalStorage<ReadingTurnContext>;
};

const storage =
  globalForAls.__readingTurnAls ??
  (globalForAls.__readingTurnAls =
    new AsyncLocalStorage<ReadingTurnContext>());

export function getReadingTurnContext(): ReadingTurnContext | undefined {
  return storage.getStore();
}

export function runWithReadingTurn<T>(
  ctx: ReadingTurnContext,
  fn: () => T | Promise<T>,
): T | Promise<T> {
  return storage.run(ctx, fn);
}
