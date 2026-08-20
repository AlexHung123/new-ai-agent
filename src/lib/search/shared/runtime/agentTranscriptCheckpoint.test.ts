import { describe, expect, it } from 'vitest';
import {
  applyTranscriptCheckpoints,
  compactionCheckpointFromGuard,
} from './agentTranscriptCheckpoint';
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

describe('applyTranscriptCheckpoints', () => {
  it('returns the raw transcript when there is no checkpoint', () => {
    const msgs = [user('a', 1), assistant('b', 2)];
    expect(applyTranscriptCheckpoints(msgs)).toEqual(msgs);
  });

  it('rebuilds summary + tail from firstKeptTimestamp (old rows stay unused)', () => {
    const msgs: TranscriptAgentMessage[] = [
      user('old-1', 10),
      assistant('old-2', 20),
      user('kept-user', 30),
      assistant('kept-asst', 40),
      {
        role: 'compactionSummary',
        summary: 'prior turns: old-1 / old-2',
        content: 'prior turns: old-1 / old-2',
        _compaction: true,
        firstKeptTimestamp: 30,
        timestamp: 41,
        tokensBefore: 999,
      },
      user('newer', 50),
    ];
    const view = applyTranscriptCheckpoints(msgs);
    expect(view[0].role).toBe('compactionSummary');
    expect(view[0].summary).toBe('prior turns: old-1 / old-2');
    expect(view.map((m) => (typeof m.content === 'string' ? m.content : ''))).toEqual(
      expect.arrayContaining(['prior turns: old-1 / old-2']),
    );
    expect(view.some((m) => m.content === 'old-1')).toBe(false);
    expect(view.some((m) => m.content === 'kept-user')).toBe(true);
    expect(view.some((m) => m.content === 'newer')).toBe(true);
    expect(view).toHaveLength(4);
  });

  it('uses the latest checkpoint when several are stacked', () => {
    const msgs: TranscriptAgentMessage[] = [
      user('a', 1),
      {
        role: 'compactionSummary',
        summary: 'first',
        _compaction: true,
        firstKeptTimestamp: 1,
        timestamp: 2,
      },
      user('b', 3),
      {
        role: 'compactionSummary',
        summary: 'second',
        _compaction: true,
        firstKeptTimestamp: 3,
        timestamp: 4,
      },
      assistant('c', 5),
    ];
    const view = applyTranscriptCheckpoints(msgs);
    expect(view[0].summary).toBe('second');
    expect(view).toHaveLength(3);
    expect(view.some((m) => m.content === 'a')).toBe(false);
    expect(view.some((m) => m.content === 'b')).toBe(true);
  });

  it('keeps messages that have no timestamp in the tail', () => {
    const msgs: TranscriptAgentMessage[] = [
      user('old', 1),
      {
        role: 'user',
        content: 'no-ts',
      },
      {
        role: 'compactionSummary',
        summary: 'cut',
        _compaction: true,
        firstKeptTimestamp: 10,
        timestamp: 11,
      },
      user('kept', 12),
    ];
    const view = applyTranscriptCheckpoints(msgs);
    expect(view.some((m) => m.content === 'old')).toBe(false);
    expect(view.some((m) => m.content === 'no-ts')).toBe(true);
    expect(view.some((m) => m.content === 'kept')).toBe(true);
  });
});

describe('compactionCheckpointFromGuard', () => {
  it('returns null when not compacted', () => {
    expect(
      compactionCheckpointFromGuard({
        compacted: false,
        hardDrop: false,
        firstKeptTimestamp: 1,
        tokensBefore: 10,
        messages: [user('a', 1)],
      }),
    ).toBeNull();
  });

  it('uses the compactionSummary body', () => {
    const cp = compactionCheckpointFromGuard({
      compacted: true,
      hardDrop: false,
      firstKeptTimestamp: 30,
      tokensBefore: 999,
      messages: [
        {
          role: 'compactionSummary',
          summary: 'prior turns',
          content: 'prior turns',
          _compaction: true,
          timestamp: 31,
        },
        user('kept', 30),
      ],
    });
    expect(cp?.summary).toBe('prior turns');
    expect(cp?.firstKeptTimestamp).toBe(30);
    expect(cp?.tokensBefore).toBe(999);
  });

  it('uses a placeholder when hardDrop', () => {
    const cp = compactionCheckpointFromGuard({
      compacted: true,
      hardDrop: true,
      firstKeptTimestamp: 5,
      tokensBefore: 1,
      messages: [user('tail', 5)],
    });
    expect(cp?.summary).toBe('(earlier turns dropped)');
  });
});
