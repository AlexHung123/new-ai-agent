import { AsyncLocalStorage } from 'node:async_hooks';
import type { PptDeckState } from './types';

export type PptSsePayload = {
  deck: PptDeckState;
};

export type PptTurnContext = {
  chatId: string;
  userId: string;
  emit?: (payload: PptSsePayload) => void;
};

const globalForAls = globalThis as typeof globalThis & {
  __pptTurnAls?: AsyncLocalStorage<PptTurnContext>;
};

const storage =
  globalForAls.__pptTurnAls ??
  (globalForAls.__pptTurnAls = new AsyncLocalStorage<PptTurnContext>());

export function getPptTurnContext(): PptTurnContext | undefined {
  return storage.getStore();
}

export function runWithPptTurn<T>(
  ctx: PptTurnContext,
  fn: () => T | Promise<T>,
): T | Promise<T> {
  return storage.run(ctx, fn);
}
