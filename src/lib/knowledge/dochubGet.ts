import { getDocument, type DochubDeps, type DochubDocument } from './dochubClient';
import { DochubError } from './errors';
import { stripQmdMarkdownPath } from './search';
import type { KnowledgeTreeNode } from './types';
import { findFileByDochubPath } from './tree';
import { pathInsidePin, type WritingMentionedDocument } from './writingPin';
import {
  asPositiveInt,
  parseFsReadLocator,
} from '../search/shared/tools/fs/fsReadLocator';

const DEFAULT_PEEK_LINES = 80;
const MAX_BYTES = 200 * 1024;
const UNLIMITED_LINES = Number.MAX_SAFE_INTEGER;

export type DochubGetResult =
  | {
      ok: true;
      dochub_path: string;
      docid?: string;
      text: string;
      fromLine: number;
      lineCount: number;
    }
  | { ok: false; error: string; similar?: string[] };

export type DochubGetDeps = DochubDeps & {
  getDocument?: typeof getDocument;
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
  while (used > 0 && Buffer.byteLength(text, 'utf8') > MAX_BYTES) {
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

function allowedPath(
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
  const hasMax = argMax !== undefined || opts.locator.maxLines !== undefined;
  const hasFrom = argFrom !== undefined || opts.locator.fromLine !== undefined;
  const maxLines =
    argMax ??
    opts.locator.maxLines ??
    (hasFrom && !hasMax ? UNLIMITED_LINES : DEFAULT_PEEK_LINES);
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
  const locator = parseFsReadLocator(stripQmdMarkdownPath(opts.file || ''));
  const meta = opts.tree && !isDocid(locator.path)
    ? findFileByDochubPath(opts.tree, locator.path)
    : null;
  const targetPath = meta?.markdown_relpath || locator.path;

  if (
    !isDocid(locator.path) &&
    !allowedPath(targetPath, {
      pin: opts.pin,
      mentionedDocuments: opts.mentionedDocuments,
      id: meta?.id,
      inbox: meta?.inbox_relpath,
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
      : MAX_BYTES;

  try {
    const fetchDoc = opts.deps?.getDocument ?? getDocument;
    const { document } = await fetchDoc(
      opts.userId,
      {
        path: isDocid(locator.path) ? locator.path : targetPath,
        fromLine,
        maxLines: maxLines === UNLIMITED_LINES ? undefined : maxLines,
        maxBytes,
        lineNumbers: true,
      },
      opts.deps,
    );
    const resolved = document.path || targetPath;
    if (
      !allowedPath(resolved, {
        pin: opts.pin,
        mentionedDocuments: opts.mentionedDocuments,
        id: meta?.id,
        inbox: meta?.inbox_relpath,
      })
    ) {
      return { ok: false, error: 'path is outside the pinned folder' };
    }
    const text = formatDocumentText(document, document.from_line || fromLine);
    return {
      ok: true,
      dochub_path: resolved,
      ...(document.docid ? { docid: document.docid } : {}),
      text,
      fromLine: document.from_line || fromLine,
      lineCount:
        typeof document.max_lines === 'number'
          ? splitMarkdownLines(text).length
          : document.line_count ?? splitMarkdownLines(text).length,
    };
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
