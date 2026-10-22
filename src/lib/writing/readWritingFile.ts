import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { writingWorkspaceAbs } from './paths';
import { listWritingAttachments } from './store';

const MAX_CHARS = 200_000;
const PART_HEADER = /^<!-- .* part \d+\/\d+ -->\s*/;

export type ReadWritingFileResult =
  | {
      ok: true;
      path: string;
      name: string;
      content: string;
      language: string;
    }
  | { ok: false; status: number; message: string };

export function readWritingFile(
  userId: string,
  fileId: string,
): ReadWritingFileResult {
  const owner = (userId || '').trim();
  const id = (fileId || '').trim();
  if (!owner) {
    return { ok: false, status: 401, message: 'Missing user id' };
  }
  if (!id) {
    return { ok: false, status: 400, message: 'fileId is required' };
  }

  const item = listWritingAttachments(owner).find((file) => file.fileId === id);
  if (!item) {
    return { ok: false, status: 404, message: 'File not found' };
  }
  if (item.status !== 'ready' || !item.relDir) {
    return {
      ok: false,
      status: 409,
      message: item.error || 'This file is not ready to preview.',
    };
  }

  const dir = join(writingWorkspaceAbs(owner), item.relDir);
  if (!existsSync(dir)) {
    return { ok: false, status: 404, message: 'File content is missing' };
  }

  const parts = readdirSync(dir)
    .filter((name) => /^part-\d+\.md$/i.test(name))
    .sort();
  if (parts.length === 0) {
    return { ok: false, status: 404, message: 'File content is missing' };
  }

  const bodies = parts.map((name) => {
    const raw = readFileSync(join(dir, name), 'utf8').replace(/^\uFEFF/, '');
    return raw.replace(PART_HEADER, '');
  });
  const text = bodies.join('\n\n');
  const content =
    text.length > MAX_CHARS ? `${text.slice(0, MAX_CHARS)}\n\n…(truncated)` : text;

  return {
    ok: true,
    path: `${item.relDir.replace(/\\/g, '/')}/${parts[0]}`,
    name: item.name,
    content,
    language: 'markdown',
  };
}
