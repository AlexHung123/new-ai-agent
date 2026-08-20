import { describe, expect, it } from 'vitest';
import { applyTranscriptCheckpoints } from './agentTranscriptCheckpoint';
import { createMemoryAgentTranscriptStore } from './agentTranscriptStore';
import type { TranscriptAgentMessage } from './agentTranscriptCodec';

function user(text: string, ts: number): TranscriptAgentMessage {
  return { role: 'user', content: text, timestamp: ts };
}

function assistant(text: string, ts: number): TranscriptAgentMessage {
  return {
    role: 'assistant',
    content: [{ type: 'text', text }],
    timestamp: ts,
  };
}

const env = {
  AGENT_TRANSCRIPT_ENABLED: 'true',
  AGENT_TRANSCRIPT_MAX_ENTRIES: '80',
  AGENT_TRANSCRIPT_PRUNE_TO_ENTRIES: '60',
};

describe('createMemoryAgentTranscriptStore', () => {
  it('returns empty when disabled', async () => {
    const store = createMemoryAgentTranscriptStore();
    const off = { AGENT_TRANSCRIPT_ENABLED: 'false' };
    expect(await store.loadMessages('a', off)).toEqual([]);
    const sync = await store.syncMessages({
      agentId: 'a',
      messages: [user('x', 1)],
      watermark: 0,
      env: off,
    });
    expect(sync.mode).toBe('skip');
    expect(await store.appendCheckpoint({
      agentId: 'a',
      checkpoint: { summary: 's', firstKeptTimestamp: 1 },
      env: off,
    })).toBeNull();
  });

  it('replaceAll on first sync then appends a suffix', async () => {
    const store = createMemoryAgentTranscriptStore();
    const first = [user('a', 1), assistant('b', 2)];
    const r1 = await store.syncMessages({
      agentId: 'c1',
      messages: first,
      watermark: 0,
      env,
    });
    expect(r1.mode).toBe('replace');
    expect(r1.newWatermark).toBe(2);

    const next = [...first, user('c', 3)];
    const r2 = await store.syncMessages({
      agentId: 'c1',
      messages: next,
      watermark: 2,
      previousMessages: first,
      env,
    });
    expect(r2.mode).toBe('append');
    const loaded = await store.loadMessages('c1', env);
    expect(loaded).toHaveLength(3);
    expect(loaded[0]).toMatchObject({ role: 'user', content: 'a' });
    expect(loaded[2]).toMatchObject({ role: 'user', content: 'c' });
  });

  it('appendCheckpoint does not delete older rows', async () => {
    const store = createMemoryAgentTranscriptStore();
    await store.syncMessages({
      agentId: 'c1',
      messages: [
        user('old', 10),
        assistant('old-a', 20),
        user('kept', 30),
        assistant('kept-a', 40),
      ],
      watermark: 0,
      env,
    });
    const appended = await store.appendCheckpoint({
      agentId: 'c1',
      checkpoint: {
        summary: 'prior turns',
        firstKeptTimestamp: 30,
        tokensBefore: 99,
        timestamp: 41,
      },
      env,
    });
    expect(appended?.seq).toBe(5);
    const raw = await store.loadMessages('c1', env);
    expect(raw.some((m) => m.content === 'old')).toBe(true);
    expect(raw.some((m) => m.role === 'compactionSummary')).toBe(true);
    const view = applyTranscriptCheckpoints(raw);
    expect(view[0].role).toBe('compactionSummary');
    expect(view[0].summary).toBe('prior turns');
    expect(view.some((m) => m.content === 'old')).toBe(false);
    expect(view.some((m) => m.content === 'kept')).toBe(true);
  });
});
