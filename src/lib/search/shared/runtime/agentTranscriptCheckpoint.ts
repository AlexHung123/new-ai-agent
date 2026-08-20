/**
 * Reconstruct the agent view from an append-only transcript + compaction
 * checkpoints (Pi firstKeptEntryId analogue).
 *
 * Full history stays in AgentTranscriptEntry rows. Reload uses:
 *   [latest compaction summary] + messages with timestamp >= firstKeptTimestamp
 */

import {
  classifyKind,
  type TranscriptAgentMessage,
} from './agentTranscriptCodec';

export type CompactionCheckpoint = {
  summary: string;
  firstKeptTimestamp: number;
  tokensBefore?: number;
  timestamp?: number;
};

export function checkpointFromMessage(
  msg: TranscriptAgentMessage,
): CompactionCheckpoint | null {
  if (classifyKind(msg) !== 'compaction') return null;
  const summary =
    typeof msg.summary === 'string' && msg.summary.trim()
      ? msg.summary.trim()
      : typeof msg.content === 'string'
        ? msg.content.trim()
        : '';
  if (!summary) return null;
  const firstKeptTimestamp =
    typeof msg.firstKeptTimestamp === 'number' &&
    Number.isFinite(msg.firstKeptTimestamp)
      ? msg.firstKeptTimestamp
      : 0;
  return {
    summary,
    firstKeptTimestamp,
    tokensBefore:
      typeof msg.tokensBefore === 'number' ? msg.tokensBefore : undefined,
    timestamp: typeof msg.timestamp === 'number' ? msg.timestamp : undefined,
  };
}

export function findLatestCheckpoint(
  messages: TranscriptAgentMessage[],
): CompactionCheckpoint | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const cp = checkpointFromMessage(messages[i]);
    if (cp) return cp;
  }
  return null;
}

function asCompactionViewMessage(
  cp: CompactionCheckpoint,
): TranscriptAgentMessage {
  return {
    role: 'compactionSummary',
    summary: cp.summary,
    content: cp.summary,
    _compaction: true,
    firstKeptTimestamp: cp.firstKeptTimestamp,
    timestamp: cp.timestamp ?? Date.now(),
    ...(typeof cp.tokensBefore === 'number'
      ? { tokensBefore: cp.tokensBefore }
      : {}),
  };
}

/**
 * Apply the latest compaction checkpoint: drop pre-cut turns, keep summary + tail.
 * Messages without a timestamp stay in the tail (safer than dropping).
 */
export function applyTranscriptCheckpoints(
  messages: TranscriptAgentMessage[],
): TranscriptAgentMessage[] {
  const cp = findLatestCheckpoint(messages);
  if (!cp) {
    return messages.filter((m) => classifyKind(m) !== 'compaction');
  }

  const tail = messages.filter((m) => {
    if (classifyKind(m) === 'compaction') return false;
    if (typeof m.timestamp !== 'number') return true;
    return m.timestamp >= cp.firstKeptTimestamp;
  });

  return [asCompactionViewMessage(cp), ...tail];
}

export function checkpointToAgentMessage(
  cp: CompactionCheckpoint,
): TranscriptAgentMessage {
  return asCompactionViewMessage(cp);
}

export function compactionCheckpointFromGuard(result: {
  compacted: boolean;
  hardDrop: boolean;
  firstKeptTimestamp: number;
  tokensBefore: number;
  messages: TranscriptAgentMessage[];
}): CompactionCheckpoint | null {
  if (!result.compacted) return null;
  const first = result.messages[0];
  const summary = result.hardDrop
    ? '(earlier turns dropped)'
    : first && classifyKind(first) === 'compaction'
      ? String(first.summary || first.content || '').trim()
      : '';
  if (!summary) return null;
  return {
    summary,
    firstKeptTimestamp: result.firstKeptTimestamp || Date.now(),
    tokensBefore: result.tokensBefore,
    timestamp: Date.now(),
  };
}
