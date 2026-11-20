import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  getWritingTurnContext,
  type WritingTurnContext,
} from '../runtime/writingTurnContext';

const MAX_INDEX_CHARS = 6_000;

export const WRITING_FS_TOOLS = ['fs_ls', 'fs_read', 'fs_grep', 'fs_find'];
export const READ_SKILL_TOOL = 'read_skill';
export const AM_RENDER_TOOL = 'am_render';

export function writingToolsForTurn(
  _userMessage?: string,
  _ctx: WritingTurnContext | undefined = getWritingTurnContext(),
): string[] {
  const fsTools = writingFsToolsForTurn();
  return [...fsTools, READ_SKILL_TOOL, AM_RENDER_TOOL];
}

export function writingFsToolsForTurn(
  _userMessage?: string,
  _ctx?: WritingTurnContext,
): string[] {
  return [];
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
  _ctx: WritingTurnContext | undefined = getWritingTurnContext(),
): string {
  return `[User request]\n${userMessage}`;
}
