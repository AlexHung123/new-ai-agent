import { describe, expect, it } from 'vitest';
import {
  createMemoryPiSessionStore,
  createPgPiSessionStore,
} from './piSessionStore';

function createFakePg() {
  const rows = new Map<
    string,
    { template_id: string; messages_json: unknown; updated_at: number }
  >();

  const query = async (sql: string, params: unknown[] = []) => {
    const normalized = sql.replace(/\s+/g, ' ').trim().toUpperCase();
    if (normalized.startsWith('CREATE TABLE')) {
      return { rows: [] };
    }
    if (normalized.startsWith('SELECT')) {
      const row = rows.get(String(params[0]));
      return { rows: row ? [row] : [] };
    }
    if (normalized.includes('INSERT INTO')) {
      const [agentId, templateId, messagesJson, updatedAt] = params;
      rows.set(String(agentId), {
        template_id: String(templateId),
        messages_json: messagesJson,
        updated_at: Number(updatedAt),
      });
      return { rows: [] };
    }
    throw new Error(`unexpected sql: ${sql}`);
  };

  return { query };
}

describe('createPgPiSessionStore', () => {
  it('returns null for a missing session', async () => {
    const store = createPgPiSessionStore(createFakePg());
    expect(await store.load('missing')).toBeNull();
    expect(await store.exists('missing')).toBe(false);
  });

  it('saves and loads messages plus template id', async () => {
    const store = createPgPiSessionStore(createFakePg());
    const messages = [
      { role: 'user', content: 'hi', timestamp: 1 },
      { role: 'assistant', content: 'hello', timestamp: 2 },
    ];

    await store.save('chat-1', { templateId: 'rag-base-template', messages });

    expect(await store.exists('chat-1')).toBe(true);
    expect(await store.load('chat-1')).toEqual({
      templateId: 'rag-base-template',
      messages,
    });
  });

  it('overwrites an existing session', async () => {
    const store = createPgPiSessionStore(createFakePg());
    await store.save('chat-1', {
      templateId: 'a',
      messages: [{ role: 'user', content: 'old' }],
    });
    await store.save('chat-1', {
      templateId: 'b',
      messages: [{ role: 'user', content: 'new' }],
    });

    expect(await store.load('chat-1')).toEqual({
      templateId: 'b',
      messages: [{ role: 'user', content: 'new' }],
    });
  });
});

describe('createMemoryPiSessionStore', () => {
  it('saves and loads independently of postgres', async () => {
    const store = createMemoryPiSessionStore();
    await store.save('chat-1', {
      templateId: 'rag-base-template',
      messages: [{ role: 'user', content: 'hi' }],
    });
    expect(await store.load('chat-1')).toEqual({
      templateId: 'rag-base-template',
      messages: [{ role: 'user', content: 'hi' }],
    });
  });
});
