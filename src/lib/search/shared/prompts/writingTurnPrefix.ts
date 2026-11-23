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
  if (ctx.libraryAvailable === false) {
    blocks.push(
      `[Knowledge library]\n${ctx.libraryError || 'Knowledge service is unavailable. Knowledge tools will fail; do not retry query, get, multi_get, or tree. Tell the user the knowledge library is unreachable.'}\n`,
    );
  }
  if (ctx.pin) blocks.push(`[Pinned folder]\n${ctx.pin}\n`);
  if (ctx.contexts?.length) {
    const lines = ctx.contexts
      .map((item) => `- ${item.path || '/'}: ${item.text}`)
      .join('\n');
    blocks.push(
      `[Collection context]\nUse these folder descriptions when choosing files to search or read.\n${lines}\n`,
    );
  }
  if (ctx.index && ctx.index.semantic_search_ready === false) {
    blocks.push(
      `[Index status]\n${ctx.index.hint || 'Embeddings are not ready. Use keyword search (mode=search or lex-only) instead of vsearch, vec, hyde, or mode=query.'}\n`,
    );
  }
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
