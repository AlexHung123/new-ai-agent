import {
  getWritingTurnContext,
  type WritingTurnContext,
} from '../runtime/writingTurnContext';

export const WRITING_DOCHUB_TOOLS = [
  'query',
  'get',
  'multi_get',
  'tree',
  'status',
];
export const READ_SKILL_TOOL = 'read_skill';
export const AM_RENDER_TOOL = 'am_render';

export function writingToolsForTurn(): string[] {
  return [...WRITING_DOCHUB_TOOLS, READ_SKILL_TOOL, AM_RENDER_TOOL];
}

export function buildWritingUserPrompt(
  userMessage: string,
  ctx: WritingTurnContext | undefined = getWritingTurnContext(),
): string {
  const question = `[User request]\n${userMessage}`;
  if (!ctx) return question;
  const blocks: string[] = [];
  if (ctx.pin) blocks.push(`[Pinned folder]\n${ctx.pin}\n`);
  if (ctx.mentionedDocuments.length) {
    const lines = ctx.mentionedDocuments
      .map((doc) => `- \`${doc.markdownRelpath || doc.path}\` — ${doc.name}`)
      .join('\n');
    blocks.push(
      `[Mentioned documents]\nThe user @-mentioned these files. After query, get them (and the search hits). Do not invent quotes from snippets.\n${lines}\n`,
    );
  }
  return blocks.length ? `${blocks.join('\n')}\n${question}` : question;
}
