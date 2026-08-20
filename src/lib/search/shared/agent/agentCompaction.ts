/**
 * Kode-style context compression for bare pi-agent-core Agent.
 *
 * Runs before every LLM call via `transformContext` (including mid-run after
 * tool results): estimate tokens → cap oversized tool results → drop older
 * messages with a local summary → keep recent tail (≥ minKeepRatio by count).
 *
 * Adapted from kode-agent-sdk ContextManager:
 * - maxTokens / compressToTokens thresholds
 * - keep ≥ 60% of messages (tail) by default
 * - local generateSummary (no extra LLM call)
 * - optional multimodal keepRecent
 *
 * Pi adaptations (not in kode):
 * - cap oversized toolResult bodies (RAG)
 * - snap cut so toolResult batches stay with their assistant
 * - summary is role=compactionSummary (+ _compaction); convertToLlm maps it to a
 *   labeled user background message (see agentConvertToLlm.ts)
 *
 * Postgres history is unchanged.
 */

import { clipTextToBudget } from '../runtime/clipTextToBudget';
import { getContextBudget } from './contextBudget';

export type CompactableMessage = {
  role: string;
  content?: unknown;
  summary?: string;
  tokensBefore?: number;
  timestamp?: number;
  [key: string]: unknown;
};

export type AgentCompactionSettings = {
  /** Master switch (default true). */
  enabled: boolean;
  /**
   * Compress when estimated tokens exceed this (kode maxTokens).
   * Default 50_000. Env: AGENT_COMPACTION_MAX_TOKENS or
   * AGENT_COMPACTION_THRESHOLD_TOKENS (compat).
   */
  maxTokens: number;
  /**
   * Target residual budget used to compute keep ratio
   * (kode compressToTokens). Default 30_000.
   */
  compressToTokens: number;
  /**
   * Minimum fraction of messages to retain by count (default 0.6).
   * Floor matches kode: keepCount = ceil(n * max(targetRatio, minKeepRatio)).
   */
  minKeepRatio: number;
  /**
   * Keep at least this many recent multimodal (image) messages when cutting.
   * Default 3 (kode multimodalRetention.keepRecent).
   */
  keepRecentMultimodal: number;
};

export type ContextUsage = {
  totalTokens: number;
  messageCount: number;
  shouldCompress: boolean;
};

export function getAgentCompactionSettings(
  env: NodeJS.ProcessEnv = process.env,
): AgentCompactionSettings {
  const enabledRaw = (env.AGENT_COMPACTION_ENABLED ?? 'true').trim().toLowerCase();
  const enabled = !(enabledRaw === '0' || enabledRaw === 'false' || enabledRaw === 'off');

  const budget = getContextBudget(env);

  return {
    enabled,
    maxTokens: budget.compactionMaxTokens,
    compressToTokens: budget.compactionCompressToTokens,
    minKeepRatio: envRatio(env.AGENT_COMPACTION_MIN_KEEP_RATIO, 0.6, 0.1, 0.95),
    keepRecentMultimodal: envPositiveInt(
      env.AGENT_COMPACTION_KEEP_RECENT_MULTIMODAL,
      3,
      0,
      50,
    ),
  };
}

/**
 * Hard cap on a single toolResult message body (chars) during mid-run
 * transformContext. Delegates to unified {@link getContextBudget}.
 * maxChars <= 0 means no mid-run toolResult clipping.
 */
export function getMaxToolResultChars(
  env: NodeJS.ProcessEnv = process.env,
): number {
  return getContextBudget(env).toolResultMaxChars;
}

function envPositiveInt(
  raw: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  const n = Number(raw ?? fallback);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function envRatio(
  raw: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  const n = Number(raw ?? fallback);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/**
 * Conservative token estimate (≈ chars/4), aligned with kode + pi heuristics.
 * Multimodal image blocks use a flat 500-token estimate (kode).
 */
export function estimateMessageTokens(message: CompactableMessage): number {
  let tokens = 0;
  const role = message.role;

  if (role === 'compactionSummary' && typeof message.summary === 'string') {
    return Math.max(1, Math.ceil((message.summary.length + 80) / 4));
  }

  if (role === 'user' || role === 'toolResult' || role === 'tool') {
    tokens += estimateContentTokens(message.content);
    if (typeof message.toolName === 'string') {
      tokens += Math.ceil(message.toolName.length / 4);
    }
  } else if (role === 'assistant') {
    tokens += estimateContentTokens(message.content);
  } else {
    tokens += estimateContentTokens(message.content);
    if (typeof message.summary === 'string') {
      tokens += Math.ceil(message.summary.length / 4);
    }
  }

  return Math.max(1, tokens);
}

export function estimateMessagesTokens(messages: CompactableMessage[]): number {
  let total = 0;
  for (const m of messages) total += estimateMessageTokens(m);
  return total;
}

function estimateContentTokens(content: unknown): number {
  if (typeof content === 'string') return Math.ceil(content.length / 4);
  if (!Array.isArray(content)) {
    if (content && typeof content === 'object') {
      try {
        return Math.ceil(JSON.stringify(content).length / 4);
      } catch {
        return Math.ceil(String(content).length / 4);
      }
    }
    return content == null ? 0 : Math.ceil(String(content).length / 4);
  }

  let tokens = 0;
  for (const block of content) {
    if (!block || typeof block !== 'object') continue;
    const b = block as Record<string, unknown>;
    if (b.type === 'text' && typeof b.text === 'string') {
      tokens += Math.ceil(b.text.length / 4);
    } else if (b.type === 'thinking' && typeof b.thinking === 'string') {
      tokens += Math.ceil(b.thinking.length / 4);
    } else if (b.type === 'image' || b.type === 'audio' || b.type === 'file') {
      tokens += 500; // kode flat estimate — avoid base64 inflation
    } else if (b.type === 'toolCall') {
      const name = String(b.name || '');
      let args = '';
      try {
        args = JSON.stringify(b.arguments ?? {});
      } catch {
        /* ignore */
      }
      tokens += Math.ceil((name.length + args.length) / 4);
    } else if (typeof b.text === 'string') {
      tokens += Math.ceil(b.text.length / 4);
    } else {
      try {
        tokens += Math.ceil(JSON.stringify(b).length / 4);
      } catch {
        /* ignore */
      }
    }
  }
  return tokens;
}

function textFromContent(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) {
    if (content && typeof content === 'object') {
      try {
        return JSON.stringify(content);
      } catch {
        return String(content);
      }
    }
    return content == null ? '' : String(content);
  }

  let out = '';
  for (const block of content) {
    if (!block || typeof block !== 'object') continue;
    const b = block as Record<string, unknown>;
    if (b.type === 'text' && typeof b.text === 'string') out += b.text;
    else if (b.type === 'thinking' && typeof b.thinking === 'string') out += b.thinking;
    else if (b.type === 'toolCall') {
      out += String(b.name || '');
      try {
        out += JSON.stringify(b.arguments ?? {});
      } catch {
        /* ignore */
      }
    } else if (typeof b.text === 'string') {
      out += b.text;
    }
  }
  return out;
}

function isUser(m: CompactableMessage): boolean {
  return m.role === 'user';
}

export function isCompactionMessage(m: CompactableMessage): boolean {
  return m.role === 'compactionSummary' || m._compaction === true;
}

function extractCompactionBody(msg: CompactableMessage): string {
  if (typeof msg.summary === 'string' && msg.summary.trim()) {
    return msg.summary.trim();
  }
  return textFromContent(msg.content).trim();
}

function isAssistant(m: CompactableMessage): boolean {
  return m.role === 'assistant';
}

function isToolResult(m: CompactableMessage): boolean {
  return m.role === 'toolResult' || m.role === 'tool';
}

function messageHasMultimodal(m: CompactableMessage): boolean {
  const content = m.content;
  if (!Array.isArray(content)) return false;
  for (const block of content) {
    if (!block || typeof block !== 'object') continue;
    const t = (block as { type?: string }).type;
    if (t === 'image' || t === 'audio' || t === 'file') return true;
  }
  return false;
}

/**
 * Analyze context usage (kode ContextManager.analyze).
 */
export function analyzeContext(
  messages: CompactableMessage[],
  settings: AgentCompactionSettings,
): ContextUsage {
  const totalTokens = estimateMessagesTokens(messages);
  return {
    totalTokens,
    messageCount: messages.length,
    shouldCompress: settings.enabled && totalTokens > settings.maxTokens,
  };
}

export function shouldCompact(
  contextTokens: number,
  settings: AgentCompactionSettings,
): boolean {
  if (!settings.enabled) return false;
  return contextTokens > settings.maxTokens;
}

/**
 * Kode keep-from index: targetRatio = compressToTokens / totalTokens,
 * keepCount = ceil(n * max(targetRatio, minKeepRatio)), retain tail.
 * Then pull earlier if needed for multimodal keepRecent, and snap for
 * toolResult integrity (pi adaptation).
 */
export function findKeepFromIndex(
  messages: CompactableMessage[],
  settings: AgentCompactionSettings,
  totalTokens: number,
): number {
  if (messages.length === 0) return 0;

  const safeTotal = Math.max(1, totalTokens);
  const targetRatio = settings.compressToTokens / safeTotal;
  let keepCount = Math.ceil(
    messages.length * Math.max(targetRatio, settings.minKeepRatio),
  );
  keepCount = Math.min(messages.length, Math.max(1, keepCount));

  let keepFromIndex = messages.length - keepCount;

  const multimodalFrom = findKeepFromIndexForMultimodal(
    messages,
    settings.keepRecentMultimodal,
  );
  keepFromIndex = Math.min(keepFromIndex, multimodalFrom);

  return snapKeepFromForToolIntegrity(messages, keepFromIndex);
}

/**
 * Kode multimodalRetention: walk from end, keep at least N multimodal msgs.
 * Returns the earliest index that must be retained (or messages.length if none).
 */
export function findKeepFromIndexForMultimodal(
  messages: CompactableMessage[],
  keepRecent: number,
): number {
  if (keepRecent <= 0) return messages.length;
  let remaining = keepRecent;
  let earliestIndex = messages.length;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (!messageHasMultimodal(messages[i])) continue;
    remaining -= 1;
    earliestIndex = i;
    if (remaining <= 0) return i;
  }
  return earliestIndex;
}

/**
 * Never start the kept tail on a toolResult (orphan without assistant).
 * Walk back to the assistant that owns the batch; include opening user if present.
 */
export function snapKeepFromForToolIntegrity(
  messages: CompactableMessage[],
  keepFrom: number,
): number {
  if (keepFrom <= 0 || keepFrom >= messages.length) {
    return Math.max(0, Math.min(keepFrom, messages.length));
  }

  let cut = keepFrom;
  if (isToolResult(messages[cut])) {
    while (cut > 0 && isToolResult(messages[cut])) {
      cut -= 1;
    }
    if (cut > 0 && isAssistant(messages[cut]) && isUser(messages[cut - 1])) {
      cut -= 1;
    }
  }
  return cut;
}

export const COMPACTION_SUMMARY_PREFIX =
  'The conversation history before this point was compacted into the following summary:\n\n<context-summary>\n';
export const COMPACTION_SUMMARY_SUFFIX = '\n</context-summary>';

/**
 * Compaction node stored on agent.state.messages.
 * convertToLlm turns this into a clearly labeled user background message.
 * `summary` is the raw body; `content` mirrors it for tooling that only reads content.
 */
export function buildSummaryUserMessage(
  summary: string,
  tokensBefore: number,
  timestamp = Date.now(),
): CompactableMessage {
  const body = summary.trim();
  return {
    role: 'compactionSummary',
    summary: body,
    content: body,
    timestamp,
    _compaction: true,
    tokensBefore,
  };
}

/**
 * Local summary of dropped messages (kode generateSummary) — no LLM call.
 *
 * Prior compaction checkpoints are kept whole. Only newly dropped turns are
 * clipped to a short preview so stacked compacts do not eat the last summary.
 */
export function generateLocalSummary(messages: CompactableMessage[]): string {
  const priorBodies: string[] = [];
  const newlyDropped: CompactableMessage[] = [];
  for (const msg of messages) {
    if (isCompactionMessage(msg)) {
      const body = extractCompactionBody(msg);
      if (body) priorBodies.push(body);
    } else {
      newlyDropped.push(msg);
    }
  }

  const newPreview = newlyDropped
    .map((msg, idx) => {
      const header = `${idx + 1}. [${msg.role}]`;
      const body = summarizeMessageBody(msg);
      return body ? `${header}\n${body}` : header;
    })
    .join('\n\n');

  return [...priorBodies, newPreview].filter(Boolean).join('\n\n');
}

function summarizeMessageBody(msg: CompactableMessage): string {
  const content = msg.content;
  if (typeof content === 'string') {
    return content.slice(0, 200);
  }

  if (!Array.isArray(content)) {
    const text = textFromContent(content);
    return text.slice(0, 200);
  }

  const parts: string[] = [];
  for (const block of content) {
    if (!block || typeof block !== 'object') continue;
    const b = block as Record<string, unknown>;
    if (b.type === 'text' && typeof b.text === 'string') {
      parts.push(b.text.slice(0, 200));
    } else if (b.type === 'thinking' && typeof b.thinking === 'string') {
      parts.push(`[thinking] ${b.thinking.slice(0, 200)}`);
    } else if (b.type === 'image') {
      parts.push('[image-summary]');
    } else if (b.type === 'audio') {
      parts.push('[audio-summary]');
    } else if (b.type === 'file') {
      parts.push('[file-summary]');
    } else if (b.type === 'toolCall') {
      parts.push(`[tool] ${String(b.name || 'unknown')}(...)`);
    } else if (typeof b.text === 'string') {
      parts.push(b.text.slice(0, 200));
    }
  }

  if (isToolResult(msg)) {
    const name = typeof msg.toolName === 'string' ? msg.toolName : 'tool';
    const preview = textFromContent(msg.content).slice(0, 100);
    return `[result ${name}] ${preview}`;
  }

  return parts.join('\n');
}

export type CompactResult = {
  messages: CompactableMessage[];
  compacted: boolean;
  tokensBefore: number;
  tokensAfter: number;
  firstKeptIndex: number;
  /**
   * Timestamp of the first kept message (Pi firstKeptEntryId analogue).
   * 0 when nothing was compacted.
   */
  firstKeptTimestamp: number;
  ratio: number;
  /** True when local summary failed and the prefix was hard-dropped. */
  hardDrop: boolean;
};

/** Per-toolResult body clip detail (for mid-run context logs). */
export type ToolResultCapDetail = {
  index: number;
  toolName: string;
  charsBefore: number;
  charsAfter: number;
};

export type MidRunGuardDiagnostics = {
  settings: AgentCompactionSettings;
  maxToolResultChars: number;
  messageCountBefore: number;
  messageCountAfter: number;
  rolesBefore: Record<string, number>;
  rolesAfter: Record<string, number>;
  /** Estimated tokens after tool-result cap, before compaction decision */
  tokensAfterToolCap: number;
  shouldCompress: boolean;
  toolCapDetails: ToolResultCapDetail[];
  /** Messages dropped into local summary (0 if not compacted) */
  droppedMessageCount: number;
};

export type MidRunGuardResult = CompactResult & {
  /** true when one or more toolResult bodies were head/tail clipped */
  toolResultsCapped: boolean;
  /** true when messages array content changed (cap and/or compact) */
  changed: boolean;
  /** Whether token budget exceeded maxTokens (compaction considered) */
  shouldCompress: boolean;
  diagnostics: MidRunGuardDiagnostics;
};

/**
 * Clip individual toolResult / tool message bodies that exceed maxChars.
 */
export function capOversizedToolResults(
  messages: CompactableMessage[],
  maxChars: number,
): {
  messages: CompactableMessage[];
  capped: boolean;
  details: ToolResultCapDetail[];
} {
  if (maxChars <= 0 || messages.length === 0) {
    return { messages, capped: false, details: [] };
  }

  let capped = false;
  const details: ToolResultCapDetail[] = [];
  const next = messages.map((m, index) => {
    if (!isToolResult(m)) return m;
    const text = textFromContent(m.content);
    if (text.length <= maxChars) return m;
    capped = true;
    const clipped = clipTextToBudget(text, maxChars);
    details.push({
      index,
      toolName: typeof m.toolName === 'string' ? m.toolName : 'tool',
      charsBefore: text.length,
      charsAfter: clipped.length,
    });
    return {
      ...m,
      content: [{ type: 'text', text: clipped }],
    };
  });

  return { messages: capped ? next : messages, capped, details };
}

/** Role histogram for context-manage logs. */
export function countMessagesByRole(
  messages: CompactableMessage[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const m of messages) {
    const role = m.role || '?';
    counts[role] = (counts[role] || 0) + 1;
  }
  return counts;
}

function formatRoleCounts(counts: Record<string, number>): string {
  const keys = Object.keys(counts).sort();
  if (!keys.length) return '(empty)';
  return keys.map((k) => `${k}=${counts[k]}`).join(' ');
}

/**
 * One-line summary of mid-run context guard for Nest logs.
 * Always useful — including when nothing changed.
 */
export function formatContextManageLog(
  result: MidRunGuardResult,
  opts?: { conversationId?: string; label?: string },
): string {
  const d = result.diagnostics;
  const conv = opts?.conversationId ? ` conv=${opts.conversationId}` : '';
  const label = opts?.label ? ` ${opts.label}` : '';
  const roles = formatRoleCounts(d.rolesBefore);
  const rolesAfter =
    d.messageCountBefore === d.messageCountAfter
      ? ''
      : ` → ${formatRoleCounts(d.rolesAfter)}`;

  const capPart =
    d.toolCapDetails.length === 0
      ? 'none'
      : d.toolCapDetails
          .map(
            (t) =>
              `${t.toolName}#${t.index}:${t.charsBefore}→${t.charsAfter}c`,
          )
          .join(', ');

  const compactPart = result.compacted
    ? `yes dropped=${d.droppedMessageCount} firstKept=${result.firstKeptIndex}` +
      ` keepRatio=${result.ratio.toFixed(2)}` +
      ` msgs ${d.messageCountBefore}→${d.messageCountAfter}`
    : result.shouldCompress
      ? 'skipped (cut would keep all)'
      : d.settings.enabled
        ? 'no (under maxTokens)'
        : 'disabled';

  return (
    `context-manage${conv}${label}` +
    ` enabled=${d.settings.enabled}` +
    ` maxTokens=${d.settings.maxTokens}` +
    ` compressTo=${d.settings.compressToTokens}` +
    ` minKeep=${d.settings.minKeepRatio}` +
    ` toolCapChars=${d.maxToolResultChars}` +
    ` | msgs=${d.messageCountBefore}→${d.messageCountAfter} [${roles}${rolesAfter}]` +
    ` | tokens ${result.tokensBefore}→${result.tokensAfter}` +
    ` shouldCompress=${result.shouldCompress}` +
    ` | toolResultCap=${capPart}` +
    ` | compaction=${compactPart}` +
    ` | changed=${result.changed} compacted=${result.compacted}` +
    ` toolCap=${result.toolResultsCapped}`
  );
}

/**
 * Mid-run / pre-LLM guard used by transformContext:
 * 1) cap oversized tool results
 * 2) kode-style compress when over maxTokens
 */
export async function applyMidRunContextGuard(args: {
  messages: CompactableMessage[];
  settings: AgentCompactionSettings;
  maxToolResultChars?: number;
  /** @deprecated ignored — kept so call sites can migrate without breakage */
  contextWindow?: number;
  /** @deprecated ignored — local summary only */
  summarize?: unknown;
  signal?: AbortSignal;
}): Promise<MidRunGuardResult> {
  const maxToolChars =
    args.maxToolResultChars ?? getMaxToolResultChars();
  const rolesBefore = countMessagesByRole(args.messages);
  const tokensBefore = estimateMessagesTokens(args.messages);

  const {
    messages: afterCap,
    capped,
    details: toolCapDetails,
  } = capOversizedToolResults(args.messages, maxToolChars);

  const tokensAfterToolCap = estimateMessagesTokens(afterCap);
  const usageAfterCap = analyzeContext(afterCap, args.settings);

  const compact = compactMessagesIfNeeded({
    messages: afterCap,
    settings: args.settings,
  });

  const rolesAfter = countMessagesByRole(compact.messages);
  const droppedMessageCount = compact.compacted
    ? Math.max(0, afterCap.length - (compact.messages.length - 1))
    : 0;

  return {
    ...compact,
    tokensBefore,
    tokensAfter: compact.tokensAfter,
    toolResultsCapped: capped,
    changed: capped || compact.compacted,
    shouldCompress: usageAfterCap.shouldCompress,
    diagnostics: {
      settings: args.settings,
      maxToolResultChars: maxToolChars,
      messageCountBefore: args.messages.length,
      messageCountAfter: compact.messages.length,
      rolesBefore,
      rolesAfter,
      tokensAfterToolCap,
      shouldCompress: usageAfterCap.shouldCompress,
      toolCapDetails,
      droppedMessageCount,
    },
  };
}

/**
 * Kode-style compress: if over maxTokens, keep tail (≥ minKeepRatio by count),
 * prepend local summary of removed messages.
 */
export function compactMessagesIfNeeded(args: {
  messages: CompactableMessage[];
  settings: AgentCompactionSettings;
}): CompactResult {
  const usage = analyzeContext(args.messages, args.settings);

  if (!usage.shouldCompress) {
    return {
      messages: args.messages,
      compacted: false,
      tokensBefore: usage.totalTokens,
      tokensAfter: usage.totalTokens,
      firstKeptIndex: 0,
      firstKeptTimestamp: 0,
      ratio: 1,
      hardDrop: false,
    };
  }

  const firstKept = findKeepFromIndex(
    args.messages,
    args.settings,
    usage.totalTokens,
  );

  if (firstKept <= 0) {
    return {
      messages: args.messages,
      compacted: false,
      tokensBefore: usage.totalTokens,
      tokensAfter: usage.totalTokens,
      firstKeptIndex: 0,
      firstKeptTimestamp: 0,
      ratio: 1,
      hardDrop: false,
    };
  }

  const toSummarize = args.messages.slice(0, firstKept);
  const kept = args.messages.slice(firstKept);
  const firstKeptTimestamp =
    typeof kept[0]?.timestamp === 'number' ? kept[0].timestamp : Date.now();
  const ratio = kept.length / Math.max(1, args.messages.length);

  let summaryText = '';
  try {
    summaryText = generateLocalSummary(toSummarize);
  } catch {
    return {
      messages: kept,
      compacted: true,
      tokensBefore: usage.totalTokens,
      tokensAfter: estimateMessagesTokens(kept),
      firstKeptIndex: firstKept,
      firstKeptTimestamp,
      ratio,
      hardDrop: true,
    };
  }

  const next: CompactableMessage[] = [
    buildSummaryUserMessage(summaryText, usage.totalTokens),
    ...kept,
  ];

  return {
    messages: next,
    compacted: true,
    tokensBefore: usage.totalTokens,
    tokensAfter: estimateMessagesTokens(next),
    firstKeptIndex: firstKept,
    firstKeptTimestamp,
    ratio,
    hardDrop: false,
  };
}
