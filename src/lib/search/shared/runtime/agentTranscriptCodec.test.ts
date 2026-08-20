import { describe, expect, it } from 'vitest';
import {
  capAgentMessageForStorage,
  classifyKind,
  deserializeAgentMessage,
  findPruneStartIndex,
  isPureAppend,
  serializeAgentMessage,
  type TranscriptAgentMessage,
} from './agentTranscriptCodec';

function user(text: string, ts = 1): TranscriptAgentMessage {
  return { role: 'user', content: text, timestamp: ts };
}

function assistantText(text: string, ts = 1): TranscriptAgentMessage {
  return {
    role: 'assistant',
    content: [{ type: 'text', text }],
    timestamp: ts,
    stopReason: 'stop',
    api: 'openai-completions',
    provider: 'local-openai',
    model: 'm',
    usage: {
      input: 0,
      output: 0,
      cacheRead: 0,
      cacheWrite: 0,
      totalTokens: 0,
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
    },
  };
}

function assistantToolCall(
  id: string,
  name: string,
  args: unknown,
  ts = 1,
): TranscriptAgentMessage {
  return {
    role: 'assistant',
    content: [
      {
        type: 'toolCall',
        id,
        name,
        arguments: args,
      },
    ],
    timestamp: ts,
    stopReason: 'toolUse',
    api: 'openai-completions',
    provider: 'local-openai',
    model: 'm',
    usage: {
      input: 0,
      output: 0,
      cacheRead: 0,
      cacheWrite: 0,
      totalTokens: 0,
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
    },
  };
}

function toolResult(
  toolCallId: string,
  toolName: string,
  text: string,
  ts = 1,
): TranscriptAgentMessage {
  return {
    role: 'toolResult',
    toolCallId,
    toolName,
    isError: false,
    content: [{ type: 'text', text }],
    details: { sources: [{ index: 1, documentName: 'a.pdf' }] },
    timestamp: ts,
  };
}

describe('serialize/deserialize round-trip', () => {
  it('round-trips user, toolCall assistant, toolResult, compaction', () => {
    const messages: TranscriptAgentMessage[] = [
      user('hi'),
      assistantToolCall('c1', 'retrieve_chunks', { question: 'x' }),
      toolResult('c1', 'retrieve_chunks', 'evidence…'),
      {
        role: 'user',
        content: '<summary>old</summary>',
        timestamp: 9,
        _compaction: true,
      } as TranscriptAgentMessage,
      assistantText('answer'),
    ];
    for (const m of messages) {
      const payload = serializeAgentMessage(m);
      const back = deserializeAgentMessage(payload);
      // Legacy compaction (user + _compaction) rehydrates as compactionSummary.
      if (classifyKind(m) === 'compaction') {
        expect(back.role).toBe('compactionSummary');
        expect(back._compaction).toBe(true);
      } else {
        expect(back.role).toBe(m.role === 'tool' ? 'toolResult' : m.role);
      }
      expect(classifyKind(m)).toBe(classifyKind(back));
    }
  });

  it('round-trips firstKeptTimestamp on a compaction checkpoint', () => {
    const payload = serializeAgentMessage({
      role: 'compactionSummary',
      summary: 'prior',
      content: 'prior',
      _compaction: true,
      firstKeptTimestamp: 42,
      timestamp: 99,
    });
    const back = deserializeAgentMessage(payload);
    expect(back.firstKeptTimestamp).toBe(42);
    expect(classifyKind(back)).toBe('compaction');
  });
});

describe('capAgentMessageForStorage', () => {
  it('truncates long toolResult text and keeps details.sources when small', () => {
    const long = 'x'.repeat(5000);
    const capped = capAgentMessageForStorage(
      toolResult('c1', 'retrieve_chunks', long),
      100,
    );
    const text = (capped.content as Array<{ text?: string }>)[0]?.text || '';
    expect(text.length).toBeLessThanOrEqual(100 + 40); // + truncation suffix
    expect(
      (capped.details as { sources?: unknown[] })?.sources?.length,
    ).toBe(1);
  });
});

describe('isPureAppend', () => {
  it('true when new is old + suffix', () => {
    const a = [user('a'), assistantText('b')];
    const b = [...a, user('c')];
    expect(isPureAppend(a, b)).toBe(true);
  });

  it('false when prefix changes (compaction)', () => {
    const a = [user('a'), assistantText('b'), user('c')];
    const b = [
      {
        role: 'user',
        content: '<summary>',
        timestamp: 1,
        _compaction: true,
      } as TranscriptAgentMessage,
      user('c'),
    ];
    expect(isPureAppend(a, b)).toBe(false);
  });

  it('false when shorter', () => {
    expect(isPureAppend([user('a'), user('b')], [user('a')])).toBe(false);
  });
});

describe('findPruneStartIndex', () => {
  it('snaps to a user boundary so toolResult is not orphaned', () => {
    // indices: 0 user, 1 asst tool, 2 toolResult, 3 user, 4 asst
    const msgs = [
      user('u0', 1),
      assistantToolCall('c1', 'retrieve_chunks', {}, 2),
      toolResult('c1', 'retrieve_chunks', 'e', 3),
      user('u1', 4),
      assistantText('a', 5),
    ];
    // Keep last 2 messages → start=3 (user) — ok
    expect(findPruneStartIndex(msgs, 2)).toBe(3);
    // Keep last 3 → naive start=2 (toolResult) → snap to user at 0
    expect(findPruneStartIndex(msgs, 3)).toBe(0);
  });
});
