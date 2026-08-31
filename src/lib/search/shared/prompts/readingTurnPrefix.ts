import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  getReadingTurnContext,
  type ReadingTurnContext,
} from '../runtime/readingTurnContext';

const MAX_INDEX_CHARS = 6_000;

export function loadReadingIndexMd(
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

export function buildReadingUserPrompt(
  userMessage: string,
  ctx: ReadingTurnContext | undefined = getReadingTurnContext(),
): string {
  const question = `[User question]\n${userMessage}`;
  if (!ctx) {
    return `[No PDF bound]\n\n${question}`;
  }
  const index = loadReadingIndexMd(ctx.rootAbs);
  const statusLine =
    ctx.status === 'failed'
      ? `Text extraction failed${ctx.error ? `: ${ctx.error}` : '.'} You may still use a quoted selection from the user. Do not invent the PDF content.\n`
      : 'Answer from the extracted Markdown below (and any quoted selection in the user question).\n';
  return (
    `[PDF]\n` +
    `Title: ${ctx.title}\n` +
    statusLine +
    `Do not fs_read INDEX.md just to reload it.\n` +
    `Prefer fs_grep, then fs_read around the hit.\n` +
    `If you see \`<!-- page: N -->\`, cite that hit as p. N.\n` +
    `If outline.md exists, use it to jump to a section before grepping every page.\n\n` +
    (index
      ? index.content + (index.truncated ? '\n…(truncated)\n' : '\n')
      : '') +
    `\n${question}`
  );
}
