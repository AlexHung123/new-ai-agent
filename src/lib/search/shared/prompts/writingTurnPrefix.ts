import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolveMentionedFiles } from '@/lib/writing/mentions';
import { getWritingTurnContext } from '../runtime/writingTurnContext';

const MAX_INDEX_CHARS = 6_000;

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

export function buildWritingUserPrompt(userMessage: string): string {
  const ctx = getWritingTurnContext();
  const question = `[User request]\n${userMessage}`;
  if (!ctx) return question;
  const index = loadWritingIndexMd(ctx.rootAbs);
  const mentioned = resolveMentionedFiles(userMessage, ctx.files || []);
  const mentionBlock =
    mentioned.length > 0
      ? `[Mentioned files]\nThe user @-mentioned these files. Read them first:\n` +
        mentioned
          .map(
            (file) =>
              `- \`${file.relDir}/INDEX.md\` — ${file.name} (${file.parts} part${file.parts === 1 ? '' : 's'})`,
          )
          .join('\n') +
        '\n\n'
      : '';
  if (!index && !mentionBlock) return question;
  return (
    `[Attachments]\n` +
    `These files belong to this user. INDEX.md is already below when present.\n` +
    `Do not fs_read INDEX.md just to reload it.\n` +
    `If it lists no files, do not use fs_* tools; write from the user request only.\n` +
    `If the user @-mentioned files, read those first, then complete the writing task.\n\n` +
    mentionBlock +
    (index
      ? index.content + (index.truncated ? '\n…(truncated)\n' : '\n')
      : '') +
    `\n${question}`
  );
}
