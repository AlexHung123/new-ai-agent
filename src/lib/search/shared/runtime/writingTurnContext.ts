import { AsyncLocalStorage } from 'node:async_hooks';
import type { WritingAttachment } from '@/lib/writing/types';

export type WritingTurnContext = {
  userId: string;
  rootAbs: string;
  files: WritingAttachment[];
};

const storage = new AsyncLocalStorage<WritingTurnContext>();

export function getWritingTurnContext(): WritingTurnContext | undefined {
  return storage.getStore();
}

export function runWithWritingTurn<T>(
  ctx: WritingTurnContext,
  fn: () => T | Promise<T>,
): T | Promise<T> {
  return storage.run(ctx, fn);
}
