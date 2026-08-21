import type { WritingAttachment } from './types';

export function atQueryAtCursor(
  text: string,
  cursor: number,
): { start: number; query: string } | null {
  const pos = Math.max(0, Math.min(cursor, text.length));
  const before = text.slice(0, pos);
  const match = /(?:^|[\s([{])@([^\s@]*)$/.exec(before);
  if (!match) return null;
  const query = match[1] ?? '';
  return { start: before.length - query.length - 1, query };
}

export function filterFilesByQuery<T extends { name: string }>(
  files: T[],
  query: string,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return files;
  return files.filter((file) => file.name.toLowerCase().includes(q));
}

export function insertMention(
  text: string,
  cursor: number,
  start: number,
  name: string,
): { text: string; cursor: number } {
  const inserted = `@${name} `;
  const next = text.slice(0, start) + inserted + text.slice(cursor);
  return { text: next, cursor: start + inserted.length };
}

export function resolveMentionedFiles(
  text: string,
  files: WritingAttachment[],
): WritingAttachment[] {
  const ready = files.filter((file) => file.status === 'ready');
  const sorted = [...ready].sort((a, b) => b.name.length - a.name.length);
  const found: WritingAttachment[] = [];
  const seen = new Set<string>();
  const re = /@([^\s@]+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    const token = match[1] || '';
    const hit = sorted.find(
      (file) =>
        file.name.toLowerCase() === token.toLowerCase() ||
        file.name.toLowerCase().startsWith(token.toLowerCase()) ||
        file.relDir === token,
    );
    if (hit && !seen.has(hit.fileId)) {
      seen.add(hit.fileId);
      found.push(hit);
    }
  }
  return found;
}
