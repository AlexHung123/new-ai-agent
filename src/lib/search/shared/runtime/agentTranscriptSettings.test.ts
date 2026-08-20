import { describe, expect, it } from 'vitest';
import {
  getAgentTranscriptSettings,
  isAgentTranscriptEnabled,
} from './agentTranscriptSettings';

describe('getAgentTranscriptSettings', () => {
  it('defaults enabled with sensible caps', () => {
    const s = getAgentTranscriptSettings({});
    expect(s.enabled).toBe(true);
    expect(s.maxEntries).toBe(80);
    expect(s.pruneToEntries).toBe(60);
    expect(s.maxChars).toBe(400_000);
  });

  it('can disable via env', () => {
    expect(isAgentTranscriptEnabled({ AGENT_TRANSCRIPT_ENABLED: 'false' })).toBe(
      false,
    );
    expect(isAgentTranscriptEnabled({ AGENT_TRANSCRIPT_ENABLED: '0' })).toBe(
      false,
    );
    expect(isAgentTranscriptEnabled({ AGENT_TRANSCRIPT_ENABLED: 'off' })).toBe(
      false,
    );
  });

  it('parses positive ints and clamps pruneTo <= maxEntries', () => {
    const s = getAgentTranscriptSettings({
      AGENT_TRANSCRIPT_MAX_ENTRIES: '40',
      AGENT_TRANSCRIPT_PRUNE_TO_ENTRIES: '100',
      AGENT_TRANSCRIPT_MAX_CHARS: '10000',
    });
    expect(s.maxEntries).toBe(40);
    expect(s.pruneToEntries).toBe(40); // clamped
    expect(s.maxChars).toBe(10_000);
  });
});
