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

export const WIKI_FS_TOOLS = ['fs_ls', 'fs_read', 'fs_grep', 'fs_find'];

export function writingToolsForTurn(
  ctx: WritingTurnContext | undefined = getWritingTurnContext(),
): string[] {
  if (ctx?.retrievalMode === 'wiki' && ctx.wikiRootAbs) {
    return [...WIKI_FS_TOOLS];
  }
  return [...WRITING_DOCHUB_TOOLS];
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
  if (ctx.pin) {
    const scope = ctx.pinLibrary === 'public' ? 'public' : 'private';
    const kind = ctx.retrievalMode === 'wiki' ? 'structured' : 'ordinary';
    blocks.push(`[Pinned folder]\n${scope}:${ctx.pin} (${kind})\n`);
  }
  if (ctx.retrievalMode === 'wiki') {
    const title = ctx.wikiTitle || ctx.pin || 'bound folder';
    if (ctx.wikiRootAbs) {
      blocks.push(
        `[Structured folder]\nTitle: ${title}\nCall fs_read on wiki/index.md first. From the index, open the cited concept or chapter pages, then read only those chunks. Do not start with query or a root dump. Never use the word "wiki" or 「維基」 in the user-visible answer; call this the bound document.\n`,
      );
    } else {
      blocks.push(
        `[Structured folder]\nTitle: ${title}\nThis is a structured policy folder. Call get on wiki/index.md first, then follow citations with get or multi_get. Do not start with query. Never use the word "wiki" or 「維基」 in the user-visible answer; call this the bound document.\n`,
      );
    }
  }
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
      .map((doc) => {
        const lib = doc.library === 'public' ? 'public' : 'private';
        return `- \`${lib}:${doc.markdownRelpath || doc.path}\` — ${doc.name}`;
      })
      .join('\n');
    blocks.push(
      `[Mentioned documents]\nThe user @-mentioned these files. After query, get them (and the search hits). Do not invent quotes from snippets.\n${lines}\n`,
    );
  }
  return blocks.length ? `${blocks.join('\n')}\n${question}` : question;
}
