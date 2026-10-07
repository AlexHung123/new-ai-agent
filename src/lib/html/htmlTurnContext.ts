import { AsyncLocalStorage } from 'node:async_hooks';

export type HtmlTurnContext = {
  userId: string;
  htmlMode: boolean;
};

const globalForAls = globalThis as typeof globalThis & {
  __htmlTurnAls?: AsyncLocalStorage<HtmlTurnContext>;
};

const storage =
  globalForAls.__htmlTurnAls ??
  (globalForAls.__htmlTurnAls = new AsyncLocalStorage<HtmlTurnContext>());

export function getHtmlTurnContext(): HtmlTurnContext | undefined {
  return storage.getStore();
}

export function runWithHtmlTurn<T>(
  ctx: HtmlTurnContext,
  fn: () => T | Promise<T>,
): T | Promise<T> {
  return storage.run(ctx, fn);
}
