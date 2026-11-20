import { getFileContent, type DochubDeps } from './dochubClient';
import { stripQmdMarkdownPath } from './search';
import type { KnowledgeFileMeta, KnowledgeTreeNode } from './types';
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
      text: string;
      fromLine: number;
      lineCount: number;
    }
  | { ok: false; error: string };

export type DochubGetDeps = DochubDeps & {
  getFileContent?: typeof getFileContent;
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
  file: KnowledgeFileMeta,
  mentioned: WritingMentionedDocument[],
): boolean {
  return mentioned.some(
    (doc) =>
      doc.fileId === file.id ||
      doc.markdownRelpath === file.markdown_relpath ||
      doc.path === file.inbox_relpath ||
      doc.path === file.markdown_relpath,
  );
}

function insidePin(file: KnowledgeFileMeta, pin: string | null): boolean {
  return (
    pathInsidePin(file.markdown_relpath || file.inbox_relpath, pin) ||
    pathInsidePin(file.inbox_relpath, pin)
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

export async function getDochubMarkdown(opts: {
  userId: string;
  tree: KnowledgeTreeNode | null;
  pin: string | null;
  mentionedDocuments: WritingMentionedDocument[];
  file: string;
  fromLine?: unknown;
  maxLines?: unknown;
  deps?: DochubGetDeps;
}): Promise<DochubGetResult> {
  if (!opts.tree) {
    return { ok: false, error: 'Knowledge library is unavailable.' };
  }

  const locator = parseFsReadLocator(stripQmdMarkdownPath(opts.file || ''));
  const meta = findFileByDochubPath(opts.tree, locator.path);
  if (!meta) {
    return { ok: false, error: 'file not found' };
  }

  if (
    !insidePin(meta, opts.pin) &&
    !isMentioned(meta, opts.mentionedDocuments)
  ) {
    return { ok: false, error: 'path is outside the pinned folder' };
  }

  const { fromLine, maxLines } = resolveRange({
    locator,
    fromLine: opts.fromLine,
    maxLines: opts.maxLines,
  });

  try {
    const { bytes } = opts.deps?.getFileContent
      ? await opts.deps.getFileContent(opts.userId, meta.id, 'markdown')
      : await getFileContent(opts.userId, meta.id, 'markdown', opts.deps);
    const markdown = new TextDecoder('utf8').decode(bytes);
    const sliced = sliceMarkdownLines(markdown, fromLine, maxLines);
    return {
      ok: true,
      dochub_path: meta.markdown_relpath || locator.path,
      text: sliced.text,
      fromLine: sliced.fromLine,
      lineCount: sliced.lineCount,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'file not found';
    return { ok: false, error: message };
  }
}
