/**
 * 读取文档根目录 AGENTS.md，供 Document Agent 每轮注入。
 * 只读；路径经 resolveFsPath 限制在文档 chroot 内。
 */

import { readFileSync } from 'node:fs';
import { resolveFsPath } from './fsPath';

const DEFAULT_MAX_CHARS = 8_000;
const CANDIDATES = ['AGENTS.md', 'agents.md'] as const;

export type LoadedAgentsMd = {
  rel: string;
  content: string;
  truncated: boolean;
};

export function loadDocumentAgentsMd(
  documentRootAbs: string,
  opts?: { maxChars?: number },
): LoadedAgentsMd | null {
  const root = (documentRootAbs || '').trim();
  if (!root) return null;
  const maxChars = Math.max(1, Math.floor(opts?.maxChars ?? DEFAULT_MAX_CHARS));

  for (const name of CANDIDATES) {
    const resolved = resolveFsPath(root, name);
    if (!resolved.ok || !resolved.isFile) continue;
    let raw: string;
    try {
      raw = readFileSync(resolved.abs, 'utf8');
    } catch {
      continue;
    }
    const text = raw.replace(/^\uFEFF/, '');
    if (!text.trim()) return null;
    const truncated = text.length > maxChars;
    return {
      rel: resolved.rel,
      content: truncated ? text.slice(0, maxChars) : text,
      truncated,
    };
  }
  return null;
}
