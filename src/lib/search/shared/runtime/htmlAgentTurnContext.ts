import { AsyncLocalStorage } from 'node:async_hooks';
import type { WcmsBind } from '@/lib/html/wcmsQuery';

export type HtmlAgentTurnContext = {
  userId: string;
  bind: WcmsBind | null;
  html: string;
  titleEn?: string;
  fileBaseHref?: string;
  userMessage?: string;
  emitHtml?: (html: string, revision?: number) => void;
};

const globalForAls = globalThis as typeof globalThis & {
  __htmlAgentTurnAls?: AsyncLocalStorage<HtmlAgentTurnContext>;
};

const storage =
  globalForAls.__htmlAgentTurnAls ??
  (globalForAls.__htmlAgentTurnAls =
    new AsyncLocalStorage<HtmlAgentTurnContext>());

export function getHtmlAgentTurnContext(): HtmlAgentTurnContext | undefined {
  return storage.getStore();
}

export function runWithHtmlAgentTurn<T>(
  ctx: HtmlAgentTurnContext,
  fn: () => T | Promise<T>,
): T | Promise<T> {
  return storage.run(ctx, fn);
}
