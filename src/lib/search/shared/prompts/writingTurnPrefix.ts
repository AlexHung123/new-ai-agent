import {
  getWritingTurnContext,
  writingSearchScopes,
  writingTurnScopes,
  writingWikiScopes,
  writingScopeLabel,
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
  if (!ctx) return [...WRITING_DOCHUB_TOOLS];
  const scopes = writingTurnScopes(ctx);
  if (scopes.length === 0 && !ctx.mentionedDocuments.length) {
    return [];
  }
  const localWikis = writingWikiScopes(ctx).filter((scope) => scope.wikiRootAbs);
  const onlyLocalWiki =
    localWikis.length === 1 &&
    writingSearchScopes(ctx).length === 0 &&
    writingWikiScopes(ctx).every((scope) => scope.wikiRootAbs);
  if (onlyLocalWiki || (ctx.retrievalMode === 'wiki' && ctx.wikiRootAbs && writingTurnScopes(ctx).length <= 1 && writingSearchScopes(ctx).length === 0)) {
    return [...WIKI_FS_TOOLS];
  }
  const needsDochub =
    writingSearchScopes(ctx).length > 0 ||
    writingWikiScopes(ctx).some((scope) => !scope.wikiRootAbs) ||
    ctx.mentionedDocuments.length > 0 ||
    localWikis.length !== 1;
  const tools: string[] = [];
  if (needsDochub) tools.push(...WRITING_DOCHUB_TOOLS);
  if (localWikis.length === 1) tools.push(...WIKI_FS_TOOLS);
  return tools;
}

function kindLabel(mode: string | undefined): string {
  return mode === 'wiki' ? 'structured' : 'ordinary';
}

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
      `[Knowledge library]\n${ctx.libraryError || 'Knowledge service is unavailable. Knowledge tools will fail; do not retry query, get, multi_get, or tree. Tell the user the knowledge library is unreachable.'}\n`,
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
      `[Pinned folders]\n${lines}\nOrdinary folders use query, get, and multi_get; each hit is labeled with its source folder. Structured folders use their own index-first path. Never mix those modes in one query. Retrieval is split across the pinned folders.\n`,
    );
  }
  const wikiScopes = writingWikiScopes(ctx);
  const useLegacyWikiPrompt = wikiScopes.length === 1 && scopes.length === 1;
  for (const scope of wikiScopes) {
    const title = scope.wikiTitle || scope.path || 'bound folder';
    const source = writingScopeLabel(scope);
    const localFs =
      Boolean(scope.wikiRootAbs) &&
      wikiScopes.filter((item) => item.wikiRootAbs).length === 1;
    if (useLegacyWikiPrompt) {
      if (localFs) {
        blocks.push(
          `[Structured folder]\nTitle: ${title}\nCall fs_read on wiki/index.md first. From the index, open the cited concept or chapter pages, then read only those chunks. Do not start with query or a root dump. Never use the word "wiki" or 「維基」 in the user-visible answer; call this the bound document.\n`,
        );
      } else {
        blocks.push(
          `[Structured folder]\nTitle: ${title}\nThis is a structured policy folder. Call get on wiki/index.md first, then follow citations with get or multi_get. Do not start with query. Never use the word "wiki" or 「維基」 in the user-visible answer; call this the bound document.\n`,
        );
      }
    } else if (localFs) {
      blocks.push(
        `[Structured folder]\nTitle: ${title}\nSource: ${source}\nCall fs_read on wiki/index.md first. From the index, open the cited concept or chapter pages, then read only those chunks. Do not start with query or a root dump. Never use the word "wiki" or 「維基」 in the user-visible answer; call this the bound document.\n`,
      );
    } else {
      blocks.push(
        `[Structured folder]\nTitle: ${title}\nSource: ${source}\nThis is a structured policy folder. Call get on wiki/index.md first, then follow citations with get or multi_get. Do not start with query. Never use the word "wiki" or 「維基」 in the user-visible answer; call this the bound document.\n`,
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
