import { describe, expect, it } from 'vitest';
import { initialChatQuery, isNewChatPath } from './initialChatQuery';

describe('initialChatQuery', () => {
  it('returns the trimmed q on the home chat route', () => {
    expect(initialChatQuery('/', '  alex  ')).toBe('alex');
  });

  it('returns the q on an existing chat route', () => {
    expect(initialChatQuery('/c/abc123', 'hello')).toBe('hello');
  });

  it('treats /itms/ai chat routes as chat pages', () => {
    expect(initialChatQuery('/itms/ai', 'alex')).toBe('alex');
    expect(initialChatQuery('/itms/ai/', 'alex')).toBe('alex');
    expect(initialChatQuery('/itms/ai/c/abc123', 'hello')).toBe('hello');
  });

  it('does not treat admin search q as a new chat message', () => {
    expect(initialChatQuery('/admin', 'alex')).toBeNull();
    expect(initialChatQuery('/itms/ai/admin', 'alex')).toBeNull();
  });

  it('does not send q from other app pages', () => {
    expect(initialChatQuery('/library', 'alex')).toBeNull();
    expect(initialChatQuery('/agents', 'alex')).toBeNull();
    expect(initialChatQuery('/voice', 'alex')).toBeNull();
  });

  it('returns null when q is empty', () => {
    expect(initialChatQuery('/', '')).toBeNull();
    expect(initialChatQuery('/', '   ')).toBeNull();
    expect(initialChatQuery('/', null)).toBeNull();
  });
});

describe('isNewChatPath', () => {
  it('treats home chat routes as a new chat', () => {
    expect(isNewChatPath('/')).toBe(true);
    expect(isNewChatPath('/itms/ai')).toBe(true);
    expect(isNewChatPath('/itms/ai/')).toBe(true);
  });

  it('rejects existing chats and other pages', () => {
    expect(isNewChatPath('/c/abc123')).toBe(false);
    expect(isNewChatPath('/itms/ai/c/abc123')).toBe(false);
    expect(isNewChatPath('/voice')).toBe(false);
  });
});
