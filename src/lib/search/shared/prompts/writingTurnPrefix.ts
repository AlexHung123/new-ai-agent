import {
  getWritingTurnContext,
  writingTurnScopes,
  writingWikiScopes,
  writingScopeLabel,
  type WritingTurnContext,
} from '../runtime/writingTurnContext';

export const WRITING_KNOWLEDGE_TOOLS = ['search', 'read'] as const;

export function writingToolsForTurn(
  ctx: WritingTurnContext | undefined = getWritingTurnContext(),
): string[] {
  if (!ctx) return [];
  const scopes = writingTurnScopes(ctx);
  if (scopes.length === 0 && !ctx.mentionedDocuments.length) {
    return [];
  }
  return [...WRITING_KNOWLEDGE_TOOLS];
}

function kindLabel(mode: string | undefined): string {
  return mode === 'wiki' ? 'structured' : 'ordinary';
}

const KNOWLEDGE_TOOL_GUIDE =
  'Use search then read. One search covers all pinned folders. Prefer reading several paths in one read. Do not repeat the same keyword search.';

export function buildWritingUserPrompt(
  userMessage: string,
  ctx: WritingTurnContext | undefined = getWritingTurnContext(),
): string {
  const question = `[User request]\n${userMessage}`;
  if (!ctx) return question;
  const blocks: string[] = [];
  const scopes = writingTurnScopes(ctx);
  if (ctx.libraryAvailable === false) {
    blocks.push(
      `[Knowledge library]\n${ctx.libraryError || 'Knowledge service is unavailable. Knowledge tools will fail; do not retry search or read. Tell the user the knowledge library is unreachable.'}\n`,
    );
  }
  if (scopes.length === 1) {
    const scope = scopes[0];
    blocks.push(
      `[Pinned folder]\n${writingScopeLabel(scope)} (${kindLabel(scope.retrievalMode)})\n`,
    );
  } else if (scopes.length > 1) {
    const lines = scopes
      .map(
        (scope) =>
          `- ${writingScopeLabel(scope)} (${kindLabel(scope.retrievalMode)})`,
      )
      .join('\n');
    blocks.push(
      `[Pinned folders]\n${lines}\n${KNOWLEDGE_TOOL_GUIDE} Ordinary folders are searched with semantic or keyword query; structured folders with keyword search. Each hit is labeled with its source folder.\n`,
    );
  }
  if (scopes.length > 0 || ctx.mentionedDocuments.length > 0) {
    if (scopes.length <= 1) {
      blocks.push(`[Knowledge tools]\n${KNOWLEDGE_TOOL_GUIDE}\n`);
    }
  }
  const wikiScopes = writingWikiScopes(ctx);
  for (const scope of wikiScopes) {
    const title = scope.wikiTitle || scope.path || 'bound folder';
    const source = writingScopeLabel(scope);
    const sourceLine =
      wikiScopes.length > 1 || scopes.length > 1 ? `Source: ${source}\n` : '';
    blocks.push(
      `[Structured folder]\nTitle: ${title}\n${sourceLine}This is a structured policy folder. Use search for keywords, then read the cited pages. You may read wiki/index.md first when you need the table of contents. Prefer reading several paths in one read. Do not repeat the same keyword search. Never use the word "wiki" or 「維基」 in the user-visible answer; call this the bound document.\n`,
    );
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
      `[Index status]\n${ctx.index.hint || 'Embeddings are not ready. Use keyword search (lex or mode=search) instead of vsearch, vec, hyde, or mode=query.'}\n`,
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
      `[Mentioned documents]\nThe user @-mentioned these files. After search, read them (and the search hits) in one read when possible. Do not invent quotes from snippets.\n${lines}\n`,
    );
  }
  return blocks.length ? `${blocks.join('\n')}\n${question}` : question;
}
