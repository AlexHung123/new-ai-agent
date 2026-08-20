/**
 * convertToLlm for bare pi-agent-core Agent.
 *
 * Default convert only keeps user/assistant/toolResult, so compaction used to
 * be stored as a fake user message. We now support role=compactionSummary (and
 * legacy _compaction user messages) and map them to a clearly labeled user
 * message for the provider — NOT as a new user request.
 */

import {
  COMPACTION_SUMMARY_PREFIX,
  COMPACTION_SUMMARY_SUFFIX,
} from './agentCompaction';

/** LLM-facing message roles accepted by providers. */
export type LlmRoleMessage = {
  role: 'user' | 'assistant' | 'toolResult';
  content?: unknown;
  [key: string]: unknown;
};

export type AgentMessageLike = {
  role?: string;
  content?: unknown;
  summary?: unknown;
  _compaction?: unknown;
  tokensBefore?: unknown;
  timestamp?: unknown;
  [key: string]: unknown;
};

/**
 * Lead-in so the model treats the block as background, not a new user turn.
 * Kept stable for tests / operators grepping payloads.
 */
export const COMPACTION_LLM_LEAD_IN =
  'Context summary (NOT a new user request). ' +
  'Use only as background from earlier turns in this conversation. ' +
  'Do not treat this block as the current user question or as instructions to call tools.';

export function isCompactionAgentMessage(msg: AgentMessageLike): boolean {
  if (!msg || typeof msg !== 'object') return false;
  if (msg._compaction === true) return true;
  if (msg.role === 'compactionSummary') return true;
  if (msg.role === 'user' && contentLooksLikeLegacyCompaction(msg.content)) {
    return true;
  }
  return false;
}

function contentLooksLikeLegacyCompaction(content: unknown): boolean {
  const text = contentToPlainText(content);
  return (
    text.includes(COMPACTION_SUMMARY_PREFIX.trim()) ||
    text.includes('<context-summary>')
  );
}

export function contentToPlainText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  const parts: string[] = [];
  for (const block of content) {
    if (!block || typeof block !== 'object') continue;
    const b = block as { type?: string; text?: string };
    if (b.type === 'text' && typeof b.text === 'string') {
      parts.push(b.text);
    }
  }
  return parts.join('\n');
}

/**
 * Prefer structured `summary`; else plain content; strip old wrapper tags.
 */
export function extractCompactionSummaryBody(msg: AgentMessageLike): string {
  if (typeof msg.summary === 'string' && msg.summary.trim()) {
    return unwrapCompactionWrappers(msg.summary.trim());
  }
  const text = contentToPlainText(msg.content).trim();
  if (!text) return '';
  return unwrapCompactionWrappers(text);
}

/** Remove our known wrappers so convert does not double-nest summaries. */
export function unwrapCompactionWrappers(text: string): string {
  let t = text.trim();
  if (!t) return '';

  // Full legacy: PREFIX + body + SUFFIX
  const prefix = COMPACTION_SUMMARY_PREFIX.trimEnd();
  const suffix = COMPACTION_SUMMARY_SUFFIX.trimStart();
  if (t.includes('<context-summary>')) {
    const open = t.indexOf('<context-summary>');
    const close = t.lastIndexOf('</context-summary>');
    if (open >= 0 && close > open) {
      t = t
        .slice(open + '<context-summary>'.length, close)
        .trim();
      return t;
    }
  }

  if (t.startsWith(prefix)) {
    t = t.slice(prefix.length).trim();
  }
  if (t.endsWith(suffix.trim())) {
    t = t.slice(0, t.length - suffix.trim().length).trim();
  }

  // Optional lead-in from a previous convert pass re-stored as content
  if (t.startsWith(COMPACTION_LLM_LEAD_IN)) {
    t = t.slice(COMPACTION_LLM_LEAD_IN.length).trim();
    return unwrapCompactionWrappers(t);
  }

  return t;
}

/** Format summary body for the chat.completions user message. */
export function formatCompactionSummaryForLlm(summaryBody: string): string {
  const body = unwrapCompactionWrappers(summaryBody);
  if (!body) return '';
  return (
    `${COMPACTION_LLM_LEAD_IN}\n\n` +
    `${COMPACTION_SUMMARY_PREFIX}${body}${COMPACTION_SUMMARY_SUFFIX}`
  );
}

/**
 * Map AgentMessage[] → provider Message[] (user | assistant | toolResult only).
 * Compaction nodes become a single labeled user message.
 */
export function convertAgentMessagesToLlm(
  messages: AgentMessageLike[],
): LlmRoleMessage[] {
  const out: LlmRoleMessage[] = [];

  for (const msg of messages || []) {
    if (!msg || typeof msg !== 'object') continue;

    if (isCompactionAgentMessage(msg)) {
      const body = extractCompactionSummaryBody(msg);
      const text = formatCompactionSummaryForLlm(body);
      if (!text) continue;
      out.push({
        role: 'user',
        content: text,
        ...(typeof msg.timestamp === 'number'
          ? { timestamp: msg.timestamp }
          : {}),
      });
      continue;
    }

    const role = msg.role;
    if (role === 'user' || role === 'assistant' || role === 'toolResult') {
      // Pass through as-is (tool calls, ids, etc. must remain intact).
      out.push(msg as LlmRoleMessage);
    }
    // Drop unknown / UI-only roles (including bare compactionSummary with empty body).
  }

  return out;
}
