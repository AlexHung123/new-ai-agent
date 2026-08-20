import { describe, expect, it } from 'vitest';
import {
  resolveAndGuardHydrateMessages,
  resolveHydrateMessages,
} from './agentTranscriptHydrate';
import type { AgentCompactionSettings } from '../agent/agentCompaction';

describe('resolveHydrateMessages', () => {
  it('prefers transcript when non-empty', () => {
    const r = resolveHydrateMessages({
      transcript: [{ role: 'user', content: 'from-tx', timestamp: 1 }],
      uiHistory: [{ role: 'user', content: 'from-ui' }],
      modelId: 'm',
    });
    expect(r).toHaveLength(1);
    expect(r[0].content).toBe('from-tx');
  });

  it('falls back to ui history', () => {
    const r = resolveHydrateMessages({
      transcript: [],
      uiHistory: [
        { role: 'user', content: 'q' },
        { role: 'assistant', content: 'a' },
      ],
      modelId: 'm',
    });
    expect(r).toHaveLength(2);
    expect(r[0].role).toBe('user');
    expect(r[1].role).toBe('assistant');
  });
});

function padTokens(approxTokens: number): string {
  return 'x'.repeat(Math.max(1, approxTokens * 4));
}

function tightSettings(
  overrides: Partial<AgentCompactionSettings> = {},
): AgentCompactionSettings {
  return {
    enabled: true,
    maxTokens: 100,
    compressToTokens: 50,
    minKeepRatio: 0.5,
    keepRecentMultimodal: 3,
    ...overrides,
  };
}

describe('resolveHydrateMessages checkpoints', () => {
  it('rebuilds summary + tail from a persisted compaction entry', () => {
    const r = resolveHydrateMessages({
      transcript: [
        { role: 'user', content: 'old', timestamp: 1 },
        { role: 'assistant', content: [{ type: 'text', text: 'old-a' }], timestamp: 2 },
        { role: 'user', content: 'kept', timestamp: 10 },
        {
          role: 'compactionSummary',
          summary: 'old turns',
          content: 'old turns',
          _compaction: true,
          firstKeptTimestamp: 10,
          timestamp: 11,
        },
      ],
      uiHistory: [],
      modelId: 'm',
    });
    expect(r[0].role).toBe('compactionSummary');
    expect(r.some((m) => m.content === 'old')).toBe(false);
    expect(r.some((m) => m.content === 'kept')).toBe(true);
  });
});

describe('resolveAndGuardHydrateMessages', () => {
  it('leaves a short transcript unchanged', async () => {
    const r = await resolveAndGuardHydrateMessages({
      transcript: [{ role: 'user', content: 'hi', timestamp: 1 }],
      uiHistory: [],
      modelId: 'm',
      settings: tightSettings({ maxTokens: 1_000_000 }),
    });
    expect(r.guard.changed).toBe(false);
    expect(r.messages).toHaveLength(1);
    expect(r.messages[0].content).toBe('hi');
  });

  it('compacts an oversized hydrated transcript before the agent is built', async () => {
    const transcript = [
      { role: 'user', content: padTokens(8_000), timestamp: 1 },
      {
        role: 'assistant',
        content: [{ type: 'text', text: padTokens(8_000) }],
        timestamp: 2,
      },
      { role: 'user', content: padTokens(8_000), timestamp: 3 },
      {
        role: 'assistant',
        content: [{ type: 'text', text: padTokens(8_000) }],
        timestamp: 4,
      },
      { role: 'user', content: 'latest question', timestamp: 5 },
      {
        role: 'assistant',
        content: [{ type: 'text', text: 'latest answer' }],
        timestamp: 6,
      },
    ];
    const r = await resolveAndGuardHydrateMessages({
      transcript,
      uiHistory: [{ role: 'user', content: 'ignored' }],
      modelId: 'm',
      settings: tightSettings(),
      maxToolResultChars: 50_000,
    });
    expect(r.guard.compacted).toBe(true);
    expect(r.messages[0].role).toBe('compactionSummary');
    expect(
      r.messages.some(
        (m) =>
          m.role === 'user' && String(m.content).includes('latest question'),
      ),
    ).toBe(true);
    expect(r.messages.length).toBeLessThan(transcript.length);
  });
});
