/** Minimal AgentMessage-like shape we persist / rehydrate. */
export type TranscriptAgentMessage = {
  role: string;
  content?: unknown;
  timestamp?: number;
  toolCallId?: string;
  toolName?: string;
  isError?: boolean;
  details?: unknown;
  stopReason?: string;
  api?: string;
  provider?: string;
  model?: string;
  usage?: unknown;
  _compaction?: boolean;
  [key: string]: unknown;
};

export type TranscriptKind = 'user' | 'assistant' | 'toolResult' | 'compaction';

export function classifyKind(msg: TranscriptAgentMessage): TranscriptKind {
  if (msg._compaction === true) {
    return 'compaction';
  }
  const role = String(msg.role || '');
  if (role === 'compactionSummary') return 'compaction';
  if (role === 'toolResult' || role === 'tool') return 'toolResult';
  if (role === 'assistant') return 'assistant';
  return 'user';
}

function truncateText(text: string, maxChars: number): string {
  if (maxChars <= 0 || text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '\n…[truncated for transcript storage]';
}

/** Cap toolResult (and oversized text) for durable storage. */
export function capAgentMessageForStorage(
  msg: TranscriptAgentMessage,
  maxToolResultChars: number,
): TranscriptAgentMessage {
  const kind = classifyKind(msg);
  if (kind !== 'toolResult' || maxToolResultChars <= 0) {
    return { ...msg };
  }

  const out: TranscriptAgentMessage = { ...msg };
  const content = msg.content;

  if (typeof content === 'string') {
    out.content = truncateText(content, maxToolResultChars);
  } else if (Array.isArray(content)) {
    let remaining = maxToolResultChars;
    out.content = content.map((block) => {
      if (!block || typeof block !== 'object') return block;
      const b = block as { type?: string; text?: string };
      if (b.type === 'text' && typeof b.text === 'string') {
        const t = truncateText(b.text, remaining);
        remaining = Math.max(0, remaining - t.length);
        return { ...b, text: t };
      }
      return block;
    });
  }

  // Keep details but drop huge non-sources blobs if present
  if (out.details && typeof out.details === 'object') {
    const d = { ...(out.details as Record<string, unknown>) };
    if (typeof d.raw === 'string' && d.raw.length > 2000) {
      d.raw = truncateText(d.raw, 2000);
    }
    out.details = d;
  }

  return out;
}

/**
 * Normalize to a JSON-safe payload for Prisma Json.
 * Strips undefined; keeps fields needed for rehydrate.
 */
export function serializeAgentMessage(
  msg: TranscriptAgentMessage,
): Record<string, unknown> {
  const kind = classifyKind(msg);
  const base: Record<string, unknown> = {
    role: msg.role,
    timestamp: typeof msg.timestamp === 'number' ? msg.timestamp : Date.now(),
  };

  if (kind === 'toolResult') {
    base.role = 'toolResult';
    base.toolCallId = msg.toolCallId ?? '';
    base.toolName = msg.toolName ?? 'tool';
    base.isError = Boolean(msg.isError);
    base.content = msg.content ?? [{ type: 'text', text: '' }];
    if (msg.details !== undefined) base.details = msg.details;
    return base;
  }

  if (kind === 'compaction') {
    base.role = 'compactionSummary';
    base._compaction = true;
    if (typeof msg.summary === 'string') {
      base.summary = msg.summary;
    }
    base.content =
      msg.content ??
      (typeof msg.summary === 'string' ? msg.summary : '');
    if (typeof msg.tokensBefore === 'number') {
      base.tokensBefore = msg.tokensBefore;
    }
    if (typeof msg.firstKeptTimestamp === 'number') {
      base.firstKeptTimestamp = msg.firstKeptTimestamp;
    }
    if (typeof msg.firstKeptSeq === 'number') {
      base.firstKeptSeq = msg.firstKeptSeq;
    }
    return base;
  }

  base.content = msg.content;

  if (kind === 'assistant' || msg.role === 'assistant') {
    base.stopReason = msg.stopReason ?? 'stop';
    base.api = msg.api ?? 'openai-completions';
    base.provider = msg.provider ?? 'local-openai';
    base.model = msg.model ?? '';
    base.usage = msg.usage ?? {
      input: 0,
      output: 0,
      cacheRead: 0,
      cacheWrite: 0,
      totalTokens: 0,
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
    };
  }

  return base;
}

export function deserializeAgentMessage(
  payload: unknown,
  defaults?: { modelId?: string },
): TranscriptAgentMessage {
  if (!payload || typeof payload !== 'object') {
    return { role: 'user', content: '', timestamp: Date.now() };
  }
  const p = payload as Record<string, unknown>;
  const role = String(p.role || 'user');

  if (role === 'toolResult' || role === 'tool') {
    return {
      role: 'toolResult',
      toolCallId: String(p.toolCallId ?? ''),
      toolName: String(p.toolName ?? 'tool'),
      isError: Boolean(p.isError),
      content: p.content ?? [{ type: 'text', text: '' }],
      details: p.details,
      timestamp: typeof p.timestamp === 'number' ? p.timestamp : Date.now(),
    };
  }

  if (role === 'assistant') {
    return {
      role: 'assistant',
      content: p.content ?? [{ type: 'text', text: '' }],
      timestamp: typeof p.timestamp === 'number' ? p.timestamp : Date.now(),
      stopReason: String(p.stopReason ?? 'stop'),
      api: (p.api as string) || 'openai-completions',
      provider: (p.provider as string) || 'local-openai',
      model: (p.model as string) || defaults?.modelId || '',
      usage: p.usage ?? {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0,
        totalTokens: 0,
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
      },
    };
  }

  // Compaction: new role or legacy user + _compaction flag.
  if (role === 'compactionSummary' || p._compaction === true) {
    const summary =
      typeof p.summary === 'string'
        ? p.summary
        : typeof p.content === 'string'
          ? p.content
          : '';
    return {
      role: 'compactionSummary',
      summary,
      content: p.content ?? summary,
      _compaction: true,
      timestamp: typeof p.timestamp === 'number' ? p.timestamp : Date.now(),
      ...(typeof p.tokensBefore === 'number'
        ? { tokensBefore: p.tokensBefore }
        : {}),
      ...(typeof p.firstKeptTimestamp === 'number'
        ? { firstKeptTimestamp: p.firstKeptTimestamp }
        : {}),
      ...(typeof p.firstKeptSeq === 'number'
        ? { firstKeptSeq: p.firstKeptSeq }
        : {}),
    };
  }

  return {
    role: 'user',
    content: p.content ?? '',
    timestamp: typeof p.timestamp === 'number' ? p.timestamp : Date.now(),
  };
}

/** Structural equality good enough for append detection (JSON stable-ish). */
export function messageFingerprint(msg: TranscriptAgentMessage): string {
  try {
    return JSON.stringify(serializeAgentMessage(msg));
  } catch {
    return `${msg.role}:${String(msg.timestamp)}`;
  }
}

/**
 * True if `next` starts with the same sequence as `prev` (by fingerprint)
 * and is at least as long.
 */
export function isPureAppend(
  prev: TranscriptAgentMessage[],
  next: TranscriptAgentMessage[],
): boolean {
  if (next.length < prev.length) return false;
  for (let i = 0; i < prev.length; i++) {
    if (messageFingerprint(prev[i]) !== messageFingerprint(next[i])) {
      return false;
    }
  }
  return true;
}

/**
 * Index of first message to keep when retaining the last `keepCount` messages,
 * snapped so we never start mid toolCall/toolResult turn.
 * Prefer snapping back to a `user` (or compaction user) boundary.
 */
export function findPruneStartIndex(
  messages: TranscriptAgentMessage[],
  keepCount: number,
): number {
  if (keepCount <= 0) return messages.length;
  if (keepCount >= messages.length) return 0;

  let start = messages.length - keepCount;

  // Walk back while current message is toolResult (orphan risk)
  while (start > 0 && classifyKind(messages[start]) === 'toolResult') {
    start -= 1;
  }

  // Prefer user/compaction boundary for the retained window
  if (start > 0) {
    const kind = classifyKind(messages[start]);
    if (kind !== 'user' && kind !== 'compaction') {
      let j = start;
      while (
        j > 0 &&
        classifyKind(messages[j]) !== 'user' &&
        classifyKind(messages[j]) !== 'compaction'
      ) {
        j -= 1;
      }
      if (
        classifyKind(messages[j]) === 'user' ||
        classifyKind(messages[j]) === 'compaction'
      ) {
        start = j;
      }
    }
  }

  return start;
}

export function estimatePayloadChars(payload: Record<string, unknown>): number {
  try {
    return JSON.stringify(payload).length;
  } catch {
    return 0;
  }
}
