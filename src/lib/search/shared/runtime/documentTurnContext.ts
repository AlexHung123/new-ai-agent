import { AsyncLocalStorage } from 'node:async_hooks';

export type DocumentTurnContext = {
  id: string;
  title: string;
  rootAbs: string;
};

const globalForAls = globalThis as typeof globalThis & {
  __documentTurnAls?: AsyncLocalStorage<DocumentTurnContext>;
};

const storage =
  globalForAls.__documentTurnAls ??
  (globalForAls.__documentTurnAls =
    new AsyncLocalStorage<DocumentTurnContext>());

export function getDocumentTurnContext(): DocumentTurnContext | undefined {
  return storage.getStore();
}

export function runWithDocumentTurn<T>(
  ctx: DocumentTurnContext,
  fn: () => T | Promise<T>,
): T | Promise<T> {
  return storage.run(ctx, fn);
}
