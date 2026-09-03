import { isNewChatPath } from './initialChatQuery';

const PENDING_KEY = 'pendingInitialChatMessage';

export type PendingMessageStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

function defaultStore(): PendingMessageStore | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function stashPendingInitialChatMessage(
  message: string,
  store: PendingMessageStore | null = defaultStore(),
): void {
  const trimmed = message.trim();
  if (!store || !trimmed) return;
  store.setItem(PENDING_KEY, trimmed);
}

/** Consume a stashed first-chat message. Only on the new-chat home route, so
 * ChatProvider mounted on /voice, /admin, or /c/:id cannot send it early. */
export function takePendingInitialChatMessage(
  pathname: string,
  store: PendingMessageStore | null = defaultStore(),
): string | null {
  if (!isNewChatPath(pathname) || !store) return null;
  const value = (store.getItem(PENDING_KEY) || '').trim();
  store.removeItem(PENDING_KEY);
  return value || null;
}
