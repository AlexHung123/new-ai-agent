import { writingScopeLabel, writingTurnScopes, type WritingTurnContext } from '../runtime/writingTurnContext';
import { pathInsidePin } from '@/lib/knowledge/writingPin';
import type { WritingMentionedDocument } from '@/lib/knowledge/writingPin';

export const KNOWLEDGE_OUT_OF_SCOPE_MARKER =
  '[Out of scope — this Knowledge result is not in the current pinned folders. Do not quote or rely on it.]';

const KNOWLEDGE_TOOL_NAMES = new Set(['search', 'read', 'list']);

export function currentPinnedLabels(ctx: WritingTurnContext | undefined): string[] {
  if (!ctx) return [];
  return writingTurnScopes(ctx).map((scope) => writingScopeLabel(scope));
}

export function parsePinnedLabelsFromPrompt(text: string): string[] | null {
  if (!text) return null;
  const multi = text.match(/\[Pinned folders\]\n((?:- [^\n]+\n?)+)/);
  if (multi) {
    const labels = multi[1]
      .split('\n')
      .map((line) => line.replace(/^- /, '').replace(/\s*\(ordinary\)\s*$/, '').trim())
      .filter(Boolean);
    return labels.length ? labels : null;
  }
  const single = text.match(/\[Pinned folder\]\n([^\n]+)/);
  if (single) {
    const label = single[1].replace(/\s*\(ordinary\)\s*$/, '').trim();
    return label ? [label] : null;
  }
  return null;
}

function contentToText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .map((block) => {
      if (typeof block === 'string') return block;
      if (!block || typeof block !== 'object') return '';
      const rec = block as { type?: unknown; text?: unknown };
      return typeof rec.text === 'string' ? rec.text : '';
    })
    .filter(Boolean)
    .join('\n');
}

export function previousPinnedLabelsFromMessages(messages: unknown[]): string[] | null {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const raw = messages[i];
    if (!raw || typeof raw !== 'object') continue;
    const msg = raw as { role?: unknown; content?: unknown };
    if (String(msg.role || '') !== 'user') continue;
    const labels = parsePinnedLabelsFromPrompt(contentToText(msg.content));
    if (labels) return labels;
  }
  return null;
}

export function pinsChanged(
  previous: string[] | null | undefined,
  current: string[],
): boolean {
  if (!previous || previous.length === 0) return false;
  if (previous.length !== current.length) return true;
  const next = new Set(current);
  return previous.some((label) => !next.has(label));
}

export function pinChangeWarning(
  previous: string[] | null | undefined,
  current: string[],
): string | null {
  if (!pinsChanged(previous, current)) return null;
  const now = current.length ? current.join(', ') : '(none)';
  const was = (previous || []).join(', ');
  return (
    `[Pinned folders changed]\nPreviously pinned: ${was}\nCurrently pinned: ${now}\n` +
    'Earlier search, read, or list results from folders that are no longer pinned are out of scope. Do not quote or rely on them unless you search, list, or read them again under the current pins.'
  );
}

export function stripKnowledgeOutOfScopePrefix(text: string): string {
  const prefix = `${KNOWLEDGE_OUT_OF_SCOPE_MARKER}\n`;
  if (text.startsWith(prefix)) return text.slice(prefix.length);
  if (text.startsWith(KNOWLEDGE_OUT_OF_SCOPE_MARKER)) {
    return text.slice(KNOWLEDGE_OUT_OF_SCOPE_MARKER.length).replace(/^\n/, '');
  }
  return text;
}

function parseJsonPayload(text: string): unknown | null {
  const raw = stripKnowledgeOutOfScopePrefix(text).trim();
  if (!raw.startsWith('{') && !raw.startsWith('[')) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function collectSources(payload: unknown, into: string[]): void {
  if (!payload || typeof payload !== 'object') return;
  if (Array.isArray(payload)) {
    for (const item of payload) collectSources(item, into);
    return;
  }
  const rec = payload as Record<string, unknown>;
  if (typeof rec.source === 'string' && rec.source.trim()) into.push(rec.source.trim());
  if (Array.isArray(rec.sources)) {
    for (const item of rec.sources) {
      if (typeof item === 'string' && item.trim()) into.push(item.trim());
    }
  }
  for (const key of ['hits', 'files', 'folders', 'documents', 'results']) {
    collectSources(rec[key], into);
  }
}

function sourceInScope(
  source: string,
  current: Set<string>,
  mentions: WritingMentionedDocument[],
): boolean {
  if (current.has(source)) return true;
  for (const pin of current) {
    if (source.startsWith(`${pin}/`)) return true;
  }
  const path = source.includes(':') ? source.slice(source.indexOf(':') + 1) : source;
  return mentionCoversPath(path, mentions);
}

function mentionCoversPath(path: string, mentions: WritingMentionedDocument[]): boolean {
  if (!path || !mentions.length) return false;
  return mentions.some((doc) => {
    const candidates = [doc.markdownRelpath, doc.path].filter(Boolean) as string[];
    return candidates.some(
      (candidate) =>
        candidate === path ||
        pathInsidePin(path, candidate) ||
        pathInsidePin(candidate, path),
    );
  });
}

function payloadOutOfScope(
  payload: unknown,
  current: Set<string>,
  mentions: WritingMentionedDocument[],
): boolean {
  const sources: string[] = [];
  collectSources(payload, sources);
  if (!sources.length) return false;
  return sources.some((source) => !sourceInScope(source, current, mentions));
}

function annotateContent(content: unknown, outOfScope: boolean): unknown {
  if (typeof content === 'string') {
    const stripped = stripKnowledgeOutOfScopePrefix(content);
    return outOfScope ? `${KNOWLEDGE_OUT_OF_SCOPE_MARKER}\n${stripped}` : stripped;
  }
  if (!Array.isArray(content)) return content;
  let done = false;
  return content.map((block) => {
    if (done || !block || typeof block !== 'object') return block;
    const rec = block as { type?: unknown; text?: unknown };
    if (typeof rec.text !== 'string') return block;
    done = true;
    const stripped = stripKnowledgeOutOfScopePrefix(rec.text);
    return {
      ...rec,
      text: outOfScope ? `${KNOWLEDGE_OUT_OF_SCOPE_MARKER}\n${stripped}` : stripped,
    };
  });
}

/** Mark prior search/read/list results that sit outside the current pins. Does not drop history. */
export function markOutOfScopeKnowledgeToolResults(
  messages: unknown[],
  currentPins: string[],
  mentions: WritingMentionedDocument[] = [],
): unknown[] {
  const current = new Set(currentPins);
  return messages.map((raw) => {
    if (!raw || typeof raw !== 'object') return raw;
    const msg = raw as {
      role?: unknown;
      toolName?: unknown;
      content?: unknown;
    };
    const role = String(msg.role || '');
    if (role !== 'toolResult' && role !== 'tool') return raw;
    const toolName = String(msg.toolName || '');
    if (!KNOWLEDGE_TOOL_NAMES.has(toolName)) return raw;
    const text = contentToText(msg.content);
    const payload = parseJsonPayload(text);
    if (!payload) return raw;
    const outOfScope = payloadOutOfScope(payload, current, mentions);
    const nextContent = annotateContent(msg.content, outOfScope);
    if (nextContent === msg.content) return raw;
    return { ...msg, content: nextContent };
  });
}
