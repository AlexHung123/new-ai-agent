import { AsyncLocalStorage } from 'node:async_hooks';
import type { ChatImageAttachment } from './attachedImages';

const globalForAls = globalThis as typeof globalThis & {
  __chatTurnImagesAls?: AsyncLocalStorage<ChatImageAttachment[]>;
};

const storage =
  globalForAls.__chatTurnImagesAls ??
  (globalForAls.__chatTurnImagesAls = new AsyncLocalStorage<
    ChatImageAttachment[]
  >());

export function getTurnImages(): ChatImageAttachment[] {
  return storage.getStore() ?? [];
}

export function runWithTurnImages<T>(
  images: ChatImageAttachment[],
  fn: () => T,
): T {
  if (images.length === 0) return fn();
  return storage.run(images, fn);
}
