import {
  getDocument,
  multiGetDocuments,
  type DochubDeps,
  type DochubDocument,
} from './dochubClient';
import { DochubError } from './errors';
import { stripQmdMarkdownPath } from './search';
import type { KnowledgeTreeNode } from './types';
import { findFileByDochubPath } from './tree';
import { pathInsidePin, type WritingMentionedDocument } from './writingPin';
import {
  asPositiveInt,
  parseFsReadLocator,
} from '../search/shared/tools/fs/fsReadLocator';

export const DOCHUB_MAX_BYTES = 200 * 1024;
export const DOCHUB_READ_CHAR_BUDGET = 100_000;
const UNLIMITED_LINES = Number.MAX_SAFE_INTEGER;

export type DochubGetResult =
  | {
      ok: true;
      dochub_path: string;
      docid?: string;
      text: string;
      fromLine: number;
      lineCount: number;
      totalLines?: number;
      truncated: boolean;
    }
  | { ok: false; error: string; similar?: string[] };

export type DochubGetDeps = DochubDeps & {
  getDocument?: typeof getDocument;
  multiGetDocuments?: typeof multiGetDocuments;
};

function splitMarkdownLines(markdown: string): string[] {
  const normalized = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  if (normalized === '') return [];
  const lines = normalized.split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  return lines;
}

function numberLines(lines: string[], fromLine: number): string {
  return lines.map((line, i) => `${fromLine + i}|${line}`).join('\n');
}

export function sliceMarkdownLines(
  markdown: string,
  fromLine: number,
  maxLines: number,
): { text: string; fromLine: number; lineCount: number } {
  const start = Math.max(1, Math.floor(fromLine) || 1);
  const count = Math.max(0, Math.floor(maxLines) || 0);
  const lines = splitMarkdownLines(markdown).slice(start - 1, start - 1 + count);
  let used = lines.length;
  let text = numberLines(lines.slice(0, used), start);
  while (used > 0 && Buffer.byteLength(text, 'utf8') > DOCHUB_MAX_BYTES) {
    used -= 1;
    text = numberLines(lines.slice(0, used), start);
  }
  return { text, fromLine: start, lineCount: used };
}

function isMentioned(
  file: { id?: string; markdown_relpath?: string; inbox_relpath?: string; path?: string },
  mentioned: WritingMentionedDocument[],
): boolean {
  return mentioned.some(
    (doc) =>
      (file.id && doc.fileId === file.id) ||
      doc.markdownRelpath === file.markdown_relpath ||
      doc.path === file.inbox_relpath ||
      doc.path === file.markdown_relpath ||
      doc.markdownRelpath === file.path ||
      doc.path === file.path,
  );
}

function pinList(pin: string | string[] | null | undefined): string[] {
  if (Array.isArray(pin)) return pin.filter((item) => typeof item === 'string' && item.length > 0);
  return typeof pin === 'string' && pin ? [pin] : [];
}

export function isAllowedDochubPath(
  path: string | undefined,
  opts: {
    pin: string | string[] | null;
    mentionedDocuments: WritingMentionedDocument[];
    id?: string;
    inbox?: string;
  },
): boolean {
  const pins = pinList(opts.pin);
  if (pins.length === 0) {
    if (opts.pin == null) {
      return pathInsidePin(path || '', null) || pathInsidePin(opts.inbox || '', null);
    }
  } else if (
    pins.some(
      (pin) => pathInsidePin(path || '', pin) || pathInsidePin(opts.inbox || '', pin),
    )
  ) {
    return true;
  }
  return isMentioned(
    { id: opts.id, markdown_relpath: path, inbox_relpath: opts.inbox, path },
    opts.mentionedDocuments,
  );
}

function resolveRange(opts: {
  locator: { fromLine?: number; maxLines?: number };
  fromLine?: unknown;
  maxLines?: unknown;
}): { fromLine: number; maxLines: number } {
  const argFrom = asPositiveInt(opts.fromLine);
  const argMax = asPositiveInt(opts.maxLines);
  const fromLine = argFrom ?? opts.locator.fromLine ?? 1;
  const maxLines = argMax ?? opts.locator.maxLines ?? UNLIMITED_LINES;
  return { fromLine, maxLines };
}

function isDocid(raw: string): boolean {
  return raw.trim().startsWith('#');
}

function formatDocumentText(doc: DochubDocument, fromLine: number): string {
  const text = doc.text || '';
  if (/^\d+: /m.test(text)) {
    return text.replace(/^(\d+): /gm, '$1|');
  }
  return text.includes('|') ? text : numberLines(splitMarkdownLines(text), fromLine);
}

export function truncationHint(path: string, nextLine: number): string {
  return `\n\n[truncated] More text remains. Call read with ${path}:${nextLine}:40 to continue.`;
}

function stripTruncationHint(text: string): string {
  return text.replace(/\n\n\[truncated\][\s\S]*$/, '');
}

export function finalizeReadText(opts: {
  path: string;
  text: string;
  fromLine: number;
  totalLines?: number;
}): { text: string; lineCount: number; truncated: boolean } {
  const text = stripTruncationHint(opts.text);
  const lineCount = splitMarkdownLines(text).length;
  const last = lineCount > 0 ? opts.fromLine + lineCount - 1 : opts.fromLine - 1;
  const truncated = opts.totalLines != null ? last < opts.totalLines : false;
  if (!truncated) return { text, lineCount, truncated: false };
  const next = last + 1;
  return {
    text: `${text}${truncationHint(opts.path, next)}`,
    lineCount,
    truncated: true,
  };
}

export function formatDochubDocument(
  doc: DochubDocument,
  fallbackPath: string,
  fallbackFromLine = 1,
): Extract<DochubGetResult, { ok: true }> {
  const fromLine = doc.from_line || fallbackFromLine;
  const path = doc.path || fallbackPath;
  const totalLines =
    typeof doc.line_count === 'number' ? doc.line_count : undefined;
  const finalized = finalizeReadText({
    path,
    text: formatDocumentText(doc, fromLine),
    fromLine,
    totalLines,
  });
  return {
    ok: true,
    dochub_path: path,
    ...(doc.docid ? { docid: doc.docid } : {}),
    text: finalized.text,
    fromLine,
    lineCount: finalized.lineCount,
    ...(totalLines != null ? { totalLines } : {}),
    truncated: finalized.truncated,
  };
}

export function applyReadCharBudget<T extends DochubGetResult>(
  results: T[],
  budget = DOCHUB_READ_CHAR_BUDGET,
): T[] {
  let used = 0;
  return results.map((result) => {
    if (!result.ok) return result;
    const remaining = budget - used;
    if (remaining <= 0) {
      const stub = `[truncated] Skipped to stay within the read budget. Call read with ${result.dochub_path}:${result.fromLine}:40 to continue.`;
      used += stub.length;
      return { ...result, text: stub, lineCount: 0, truncated: true };
    }
    if (result.text.length <= remaining) {
      used += result.text.length;
      return result;
    }
    const lines = splitMarkdownLines(stripTruncationHint(result.text));
    let kept = lines.length;
    while (kept > 0) {
      const body = lines.slice(0, kept).join('\n');
      const next = result.fromLine + kept;
      const text = `${body}${truncationHint(result.dochub_path, next)}`;
      if (text.length <= remaining) {
        used += text.length;
        return { ...result, text, lineCount: kept, truncated: true };
      }
      kept -= 1;
    }
    const stub = `[truncated] Skipped to stay within the read budget. Call read with ${result.dochub_path}:${result.fromLine}:40 to continue.`;
    used += stub.length;
    return { ...result, text: stub, lineCount: 0, truncated: true };
  });
}

function resolveReadTarget(
  tree: KnowledgeTreeNode | null,
  file: string,
): { locator: ReturnType<typeof parseFsReadLocator>; targetPath: string; metaId?: string; inbox?: string } {
  const locator = parseFsReadLocator(stripQmdMarkdownPath(file || ''));
  const meta =
    tree && !isDocid(locator.path)
      ? findFileByDochubPath(tree, locator.path)
      : null;
  return {
    locator,
    targetPath: meta?.markdown_relpath || locator.path,
    metaId: meta?.id,
    inbox: meta?.inbox_relpath,
  };
}

function locatorWithRange(
  path: string,
  fromLine: number,
  maxLines: number,
  hasTopLevelRange: boolean,
): string {
  if (hasTopLevelRange) return path;
  if (maxLines !== UNLIMITED_LINES) return `${path}:${fromLine}:${maxLines}`;
  if (fromLine > 1) return `${path}:${fromLine}`;
  return path;
}

export async function getDochubMarkdown(opts: {
  userId: string;
  tree: KnowledgeTreeNode | null;
  pin: string | string[] | null;
  mentionedDocuments: WritingMentionedDocument[];
  file: string;
  fromLine?: unknown;
  maxLines?: unknown;
  maxBytes?: unknown;
  deps?: DochubGetDeps;
}): Promise<DochubGetResult> {
  const { locator, targetPath, metaId, inbox } = resolveReadTarget(
    opts.tree,
    opts.file,
  );

  if (
    !isDocid(locator.path) &&
    !isAllowedDochubPath(targetPath, {
      pin: opts.pin,
      mentionedDocuments: opts.mentionedDocuments,
      id: metaId,
      inbox,
    })
  ) {
    return { ok: false, error: 'path is outside the pinned folder' };
  }

  const { fromLine, maxLines } = resolveRange({
    locator,
    fromLine: opts.fromLine,
    maxLines: opts.maxLines,
  });
  const maxBytes =
    typeof opts.maxBytes === 'number' && Number.isInteger(opts.maxBytes) && opts.maxBytes > 0
      ? opts.maxBytes
      : DOCHUB_MAX_BYTES;

  try {
    const fetchDoc = opts.deps?.getDocument ?? getDocument;
    const { document } = await fetchDoc(
      opts.userId,
      {
        path: isDocid(locator.path) ? locator.path : targetPath,
        fromLine,
        ...(maxLines === UNLIMITED_LINES ? {} : { maxLines }),
        maxBytes,
        lineNumbers: true,
      },
      opts.deps,
    );
    const resolved = document.path || targetPath;
    if (
      !isAllowedDochubPath(resolved, {
        pin: opts.pin,
        mentionedDocuments: opts.mentionedDocuments,
        id: metaId,
        inbox,
      })
    ) {
      return { ok: false, error: 'path is outside the pinned folder' };
    }
    return formatDochubDocument(document, resolved, document.from_line || fromLine);
  } catch (error) {
    if (error instanceof DochubError && error.similar?.length) {
      return {
        ok: false,
        error: `file not found. Similar: ${error.similar.join(', ')}`,
        similar: error.similar,
      };
    }
    const message = error instanceof Error ? error.message : 'file not found';
    return { ok: false, error: message };
  }
}

export type DochubBatchReadRequest = {
  file: string;
  library: 'private' | 'public';
  tree: KnowledgeTreeNode | null;
  source?: string;
};

export async function getDochubDocuments(opts: {
  userId: string;
  pin: string | string[] | null;
  mentionedDocuments: WritingMentionedDocument[];
  requests: DochubBatchReadRequest[];
  fromLine?: unknown;
  maxLines?: unknown;
  maxBytes?: unknown;
  deps?: DochubGetDeps;
}): Promise<Array<DochubGetResult & { source?: string }>> {
  const maxBytes =
    typeof opts.maxBytes === 'number' && Number.isInteger(opts.maxBytes) && opts.maxBytes > 0
      ? opts.maxBytes
      : DOCHUB_MAX_BYTES;
  const hasTopLevelRange =
    asPositiveInt(opts.fromLine) !== undefined ||
    asPositiveInt(opts.maxLines) !== undefined;
  const loadMulti = opts.deps?.multiGetDocuments ?? multiGetDocuments;

  type Prepared = {
    index: number;
    request: DochubBatchReadRequest;
    sendPath: string;
    resolvedPath: string;
    fromLine: number;
    source?: string;
    result?: DochubGetResult & { source?: string };
  };

  const prepared: Prepared[] = opts.requests.map((request, index) => {
    const { locator, targetPath, metaId, inbox } = resolveReadTarget(
      request.tree,
      request.file,
    );
    const { fromLine, maxLines } = resolveRange({
      locator,
      fromLine: opts.fromLine,
      maxLines: opts.maxLines,
    });
    const allowed =
      isDocid(locator.path) ||
      isAllowedDochubPath(targetPath, {
        pin: opts.pin,
        mentionedDocuments: opts.mentionedDocuments,
        id: metaId,
        inbox,
      });
    if (!allowed) {
      return {
        index,
        request,
        sendPath: targetPath,
        resolvedPath: targetPath,
        fromLine,
        source: request.source,
        result: { ok: false, error: 'path is outside the pinned folder' },
      };
    }
    const pathForSend = isDocid(locator.path) ? locator.path : targetPath;
    return {
      index,
      request,
      sendPath: locatorWithRange(pathForSend, fromLine, maxLines, hasTopLevelRange),
      resolvedPath: pathForSend,
      fromLine,
      source: request.source,
    };
  });

  const groups = new Map<'private' | 'public', Prepared[]>();
  for (const item of prepared) {
    if (item.result) continue;
    const list = groups.get(item.request.library) || [];
    list.push(item);
    groups.set(item.request.library, list);
  }

  for (const [library, group] of groups) {
    try {
      const payload = await loadMulti(
        opts.userId,
        {
          files: group.map((item) => item.sendPath),
          ...(asPositiveInt(opts.fromLine) != null
            ? { fromLine: asPositiveInt(opts.fromLine) }
            : {}),
          ...(asPositiveInt(opts.maxLines) != null
            ? { maxLines: asPositiveInt(opts.maxLines) }
            : {}),
          maxBytes,
        },
        { ...(opts.deps || {}), library },
      );
      const docs = [...(payload.documents || [])];
      const errors = [...(payload.errors || [])];
      for (const item of group) {
        const docIdx = docs.findIndex((doc) => {
          const path = stripQmdMarkdownPath(doc.path || '');
          const resolved = stripQmdMarkdownPath(item.resolvedPath);
          return (
            path === resolved ||
            path === item.request.file ||
            resolved === path
          );
        });
        if (docIdx >= 0) {
          const doc = docs.splice(docIdx, 1)[0]!;
          if (
            !isDocid(item.resolvedPath) &&
            !isAllowedDochubPath(doc.path || item.resolvedPath, {
              pin: opts.pin,
              mentionedDocuments: opts.mentionedDocuments,
            })
          ) {
            item.result = { ok: false, error: 'path is outside the pinned folder' };
            continue;
          }
          item.result = {
            ...formatDochubDocument(doc, item.resolvedPath, item.fromLine),
            ...(item.source ? { source: item.source } : {}),
          };
          continue;
        }
        const errIdx = errors.findIndex((err) => {
          const file = typeof err.file === 'string' ? err.file : '';
          return (
            !file ||
            file === item.sendPath ||
            file === item.resolvedPath ||
            file === item.request.file ||
            item.sendPath.startsWith(`${file}:`) ||
            file.startsWith(item.resolvedPath)
          );
        });
        if (errIdx >= 0) {
          const err = errors.splice(errIdx, 1)[0]!;
          const similar = err.similar?.length
            ? ` Similar: ${err.similar.join(', ')}`
            : '';
          item.result = {
            ok: false,
            error: `${err.message || err.error || 'file not found'}${similar}`,
            ...(err.similar?.length ? { similar: err.similar } : {}),
          };
          continue;
        }
        item.result = { ok: false, error: 'file not found' };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      for (const item of group) {
        item.result = { ok: false, error: message };
      }
    }
  }

  return applyReadCharBudget(
    prepared.map((item) => item.result || { ok: false, error: 'file not found' }),
  );
}
