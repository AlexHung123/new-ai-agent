import { describe, expect, it } from 'vitest';
import {
  stashPendingInitialChatMessage,
  takePendingInitialChatMessage,
  type PendingMessageStore,
} from './pendingInitialMessage';

function memoryStore(): PendingMessageStore {
  const data = new Map<string, string>();
  return {
    getItem(key) {
      return data.has(key) ? data.get(key)! : null;
    },
    setItem(key, value) {
      data.set(key, value);
    },
    removeItem(key) {
      data.delete(key);
    },
  };
}

describe('pendingInitialChatMessage', () => {
  it('returns the stashed message on the home chat route and consumes it', () => {
    const store = memoryStore();
    stashPendingInitialChatMessage('fix typos\n\nhello', store);

    expect(takePendingInitialChatMessage('/', store)).toBe(
      'fix typos\n\nhello',
    );
    expect(takePendingInitialChatMessage('/', store)).toBeNull();
  });

  it('returns the stashed message on /itms/ai chat routes', () => {
    const store = memoryStore();
    stashPendingInitialChatMessage('summarize this', store);

    expect(takePendingInitialChatMessage('/itms/ai', store)).toBe(
      'summarize this',
    );
  });

  it('does not consume the message on non-chat pages or existing chats', () => {
    const store = memoryStore();
    stashPendingInitialChatMessage('keep me', store);

    expect(takePendingInitialChatMessage('/voice', store)).toBeNull();
    expect(takePendingInitialChatMessage('/agents', store)).toBeNull();
    expect(takePendingInitialChatMessage('/c/abc123', store)).toBeNull();
    expect(takePendingInitialChatMessage('/', store)).toBe('keep me');
  });

  it('returns null when nothing was stashed', () => {
    expect(takePendingInitialChatMessage('/', memoryStore())).toBeNull();
  });
});
