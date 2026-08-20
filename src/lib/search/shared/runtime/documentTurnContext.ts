import { AsyncLocalStorage } from 'node:async_hooks';

export type DocumentTurnContext = {
  id: string;
  title: string;
  rootAbs: string;
};

const storage = new AsyncLocalStorage<DocumentTurnContext>();

export function getDocumentTurnContext(): DocumentTurnContext | undefined {
  return storage.getStore();
}

export function runWithDocumentTurn<T>(
  ctx: DocumentTurnContext,
  fn: () => T | Promise<T>,
): T | Promise<T> {
  return storage.run(ctx, fn);
}
