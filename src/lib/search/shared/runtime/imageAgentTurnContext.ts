import { AsyncLocalStorage } from 'node:async_hooks';
import type { GeneratedImageEvent } from '@/lib/image/generatedImageEvent';

export type ImageAgentTurnContext = {
  userId: string;
  userMessage?: string;
  signal?: AbortSignal;
  emitImage?: (event: GeneratedImageEvent) => void;
};

const globalForAls = globalThis as typeof globalThis & {
  __imageAgentTurnAls?: AsyncLocalStorage<ImageAgentTurnContext>;
};

const storage =
  globalForAls.__imageAgentTurnAls ??
  (globalForAls.__imageAgentTurnAls =
    new AsyncLocalStorage<ImageAgentTurnContext>());

export function getImageAgentTurnContext(): ImageAgentTurnContext | undefined {
  return storage.getStore();
}

export function runWithImageAgentTurn<T>(
  ctx: ImageAgentTurnContext,
  fn: () => T | Promise<T>,
): T | Promise<T> {
  return storage.run(ctx, fn);
}
