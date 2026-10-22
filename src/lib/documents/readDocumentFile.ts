import { readFileSync } from 'node:fs';
import { extname } from 'node:path';
import { documentRootAbs, resolveDocument } from './catalog';
import { resolveFsPath } from '@/lib/search/shared/tools/fs/fsPath';

const MAX_CHARS = 200_000;

const LANGUAGE_BY_EXT: Record<string, string> = {
  '.md': 'markdown',
  '.markdown': 'markdown',
  '.html': 'html',
  '.htm': 'html',
  '.json': 'json',
  '.css': 'css',
  '.js': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'tsx',
  '.jsx': 'jsx',
  '.yml': 'yaml',
  '.yaml': 'yaml',
  '.xml': 'xml',
  '.svg': 'xml',
  '.csv': 'text',
  '.txt': 'text',
};

const TEXT_EXT = new Set(Object.keys(LANGUAGE_BY_EXT));

export type ReadDocumentFileResult =
  | {
      ok: true;
      path: string;
      content: string;
      language: string;
    }
  | { ok: false; status: number; message: string };

export function readDocumentFile(
  documentId: string,
  relPath?: string | null,
): ReadDocumentFileResult {
  const slot = resolveDocument(documentId);
  if (!slot) {
    return { ok: false, status: 404, message: 'Document not found' };
  }

  const requested = (relPath || '').trim() || 'AGENTS.md';
  const resolved = resolveFsPath(documentRootAbs(slot), requested);
  if (!resolved.ok) {
    return { ok: false, status: 404, message: resolved.message };
  }
  if (!resolved.isFile) {
    return { ok: false, status: 404, message: `Not a file: ${resolved.rel}` };
  }

  const ext = extname(resolved.rel).toLowerCase();
  if (!TEXT_EXT.has(ext)) {
    return {
      ok: false,
      status: 415,
      message: `Unsupported file type: ${resolved.rel}`,
    };
  }

  let raw: string;
  try {
    raw = readFileSync(resolved.abs, 'utf8');
  } catch {
    return { ok: false, status: 404, message: `Path not accessible: ${resolved.rel}` };
  }

  const text = raw.replace(/^\uFEFF/, '');
  const content =
    text.length > MAX_CHARS ? `${text.slice(0, MAX_CHARS)}\n\n…(truncated)` : text;

  return {
    ok: true,
    path: resolved.rel.replace(/\\/g, '/'),
    content,
    language: LANGUAGE_BY_EXT[ext] || 'text',
  };
}
