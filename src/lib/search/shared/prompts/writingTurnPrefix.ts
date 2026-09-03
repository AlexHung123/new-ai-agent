import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolveMentionedFiles } from '@/lib/writing/mentions';
import {
  getWritingTurnContext,
  type WritingTurnContext,
} from '../runtime/writingTurnContext';

const MAX_INDEX_CHARS = 6_000;

export const WRITING_FS_TOOLS = ['fs_ls', 'fs_read', 'fs_grep', 'fs_find'];

export function writingFsToolsForTurn(
  userMessage: string,
  ctx: WritingTurnContext | undefined = getWritingTurnContext(),
): string[] {
  if (!ctx) return [];
  const mentioned = resolveMentionedFiles(userMessage, ctx.files || []);
  return mentioned.length > 0 ? [...WRITING_FS_TOOLS] : [];
}

export function loadWritingIndexMd(
  rootAbs: string,
  maxChars = MAX_INDEX_CHARS,
): { content: string; truncated: boolean } | null {
  const abs = join(rootAbs, 'INDEX.md');
  if (!existsSync(abs)) return null;
  let raw: string;
  try {
    raw = readFileSync(abs, 'utf8').replace(/^\uFEFF/, '');
  } catch {
    return null;
  }
  if (!raw.trim()) return null;
  const truncated = raw.length > maxChars;
  return {
    content: truncated ? raw.slice(0, maxChars) : raw,
    truncated,
  };
}

export function buildWritingUserPrompt(
  userMessage: string,
  ctx: WritingTurnContext | undefined = getWritingTurnContext(),
): string {
  const question = `[User request]\n${userMessage}`;
  if (!ctx) return question;
  const mentioned = resolveMentionedFiles(userMessage, ctx.files || []);
  if (mentioned.length === 0) return question;
  const index = loadWritingIndexMd(ctx.rootAbs);
  const mentionBlock =
    `[Mentioned files]\nThe user @-mentioned these files. Search inside them with fs_grep, then fs_read only the matching line range (fromLine/maxLines or path:from:count). Do not read a whole part:\n` +
    mentioned
      .map(
        (file) =>
          `- \`${file.relDir}/INDEX.md\` — ${file.name} (${file.parts} part${file.parts === 1 ? '' : 's'})`,
      )
      .join('\n') +
    '\n\n';
  return (
    `[Attachments]\n` +
    `These files belong to this user. INDEX.md is already below when present.\n` +
    `Do not fs_read INDEX.md just to reload it.\n` +
    `Grep the @-mentioned files first, then peek with fs_read around the hits. Do not load a whole part-*.md.\n\n` +
    mentionBlock +
    (index
      ? index.content + (index.truncated ? '\n…(truncated)\n' : '\n')
      : '') +
    `\n${question}`
  );
}
