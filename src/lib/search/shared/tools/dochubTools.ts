import { Type } from 'typebox';
import type { AgentTool } from '@earendil-works/pi-agent-core';
import { multiGetDocuments, search } from '@/lib/knowledge/dochubClient';
import { getDochubMarkdown, type DochubGetResult } from '@/lib/knowledge/dochubGet';
import { mapDochubQueryArgs } from '@/lib/knowledge/dochubQuery';
import { parseKnowledgePin } from '@/lib/knowledge/library';
import { listKnowledgeFiles, nodeAtPath } from '@/lib/knowledge/tree';
import type { KnowledgeTreeNode } from '@/lib/knowledge/types';
import {
  grepWikiRoot,
  hitsFromSearchResults,
  joinWikiHitPath,
  readWikiRootFile,
} from '@/lib/knowledge/wikiGrep';
import {
  clampPathToPin,
  pathInsidePin,
  splitRetrievalLimit,
} from '@/lib/knowledge/writingPin';
import { parseFsReadLocator } from '@/lib/search/shared/tools/fs/fsReadLocator';
import { jsonToolResult } from '../runtime/piToolResult';
import {
  getWritingTurnContext,
  writingScopeLabel,
  writingSearchScopes,
  writingTurnScopes,
  writingWikiScopes,
  type WritingKnowledgeScope,
  type WritingTurnContext,
} from '../runtime/writingTurnContext';

export const DOCHUB_TOOL_NAMES = ['search', 'read'] as const;

type DochubToolDeps = {
  search?: typeof search;
  getDochubMarkdown?: typeof getDochubMarkdown;
  multiGetDocuments?: typeof multiGetDocuments;
};

function asRecord(args: unknown): Record<string, unknown> {
  return args && typeof args === 'object'
    ? (args as Record<string, unknown>)
    : {};
}

const STOP_RETRY =
  ' Do not retry this call. If the user wants a file list, answer from the evidence you already have.';

function errorResult(error: string) {
  return jsonToolResult({ ok: false, error });
}

const NO_KNOWLEDGE_SCOPE =
  'No knowledge folder is pinned. Pin a folder from FILES or @mention one.';

function turnScope(ctx: NonNullable<ReturnType<typeof getWritingTurnContext>>): {
  library: 'private' | 'public';
  tree: KnowledgeTreeNode | null;
} {
  const scopes = writingTurnScopes(ctx);
  const library =
    scopes[0]?.library ||
    (ctx.pinLibrary === 'public' ? 'public' : 'private');
  const tree =
    library === 'public' ? (ctx.publicTree ?? ctx.tree) : ctx.tree;
  return { library, tree };
}

function treeForLibrary(
  ctx: WritingTurnContext,
  library: 'private' | 'public',
): KnowledgeTreeNode | null {
  return library === 'public' ? (ctx.publicTree ?? ctx.tree) : ctx.tree;
}

function hasKnowledgeScope(ctx: WritingTurnContext): boolean {
  return (
    writingTurnScopes(ctx).length > 0 || ctx.mentionedDocuments.length > 0
  );
}

function pinPaths(ctx: WritingTurnContext): string[] {
  const scopes = writingTurnScopes(ctx);
  if (scopes.length) return scopes.map((scope) => scope.path);
  return ctx.pin ? [ctx.pin] : [];
}

function searchTargets(ctx: WritingTurnContext): WritingKnowledgeScope[] {
  const scopes = writingSearchScopes(ctx);
  if (scopes.length) return scopes;
  if (ctx.pin && ctx.retrievalMode !== 'wiki') {
    return [
      {
        path: ctx.pin,
        library: ctx.pinLibrary === 'public' ? 'public' : 'private',
        retrievalMode: 'search',
      },
    ];
  }
  return [];
}

function scopesMatchingPath(
  scopes: WritingKnowledgeScope[],
  rawPath: string | undefined,
): WritingKnowledgeScope[] | { error: string } {
  if (!rawPath) return scopes;
  const { path: requested, library } = stripLibraryPrefix(rawPath);
  const matches = scopes.filter(
    (scope) =>
      (!library || scope.library === library) &&
      (requested === scope.path ||
        requested.startsWith(`${scope.path}/`) ||
        scope.path.startsWith(`${requested}/`) ||
        pathInsidePin(requested, scope.path)),
  );
  if (matches.length === 0) {
    return { error: 'path is outside the pinned folders' };
  }
  return matches;
}

function wikiGrepSubpath(
  scope: WritingKnowledgeScope,
  rawPath?: string,
): string | undefined {
  if (!rawPath) return undefined;
  const { path: requested } = stripLibraryPrefix(rawPath);
  if (!requested || requested === scope.path) return undefined;
  if (requested.startsWith(`${scope.path}/`)) {
    return requested.slice(scope.path.length + 1);
  }
  return undefined;
}

function stripLibraryPrefix(raw: string): {
  path: string;
  library?: 'private' | 'public';
} {
  const parsed = parseKnowledgePin(raw);
  if (
    parsed &&
    (raw.startsWith('private:') ||
      raw.startsWith('public:') ||
      raw.startsWith('private/') ||
      raw.startsWith('public/') ||
      raw.startsWith('shared:') ||
      raw.startsWith('shared/'))
  ) {
    return { path: parsed.path, library: parsed.library };
  }
  return { path: raw };
}

function scopeForPath(
  ctx: WritingTurnContext,
  rawPath: string | undefined,
): WritingKnowledgeScope | undefined {
  const scopes = writingTurnScopes(ctx);
  if (!rawPath) return scopes[0];
  const { path, library } = stripLibraryPrefix(rawPath);
  return scopes.find(
    (scope) =>
      (!library || scope.library === library) &&
      (path === scope.path ||
        path.startsWith(`${scope.path}/`) ||
        scope.path.startsWith(`${path}/`) ||
        pathInsidePin(path, scope.path)),
  );
}

function presentError(error: string): string {
  if (
    error === 'Knowledge service is unavailable.' ||
    error === 'Knowledge library is unavailable.' ||
    error === 'file not found'
  ) {
    return `${error}${STOP_RETRY}`;
  }
  return error;
}

function rawFilesArg(rec: Record<string, unknown>): unknown {
  const files = rec.files;
  const hasFiles =
    (typeof files === 'string' && files.trim().length > 0) ||
    (Array.isArray(files) && files.length > 0);
  if (hasFiles) return files;
  if (typeof rec.file === 'string' && rec.file.trim()) return rec.file;
  if (typeof rec.path === 'string' && rec.path.trim()) return rec.path;
  return undefined;
}

function matchGlob(name: string, pattern: string): boolean {
  const esc = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  try {
    return new RegExp(`^${esc}$`, 'i').test(name);
  } catch {
    return false;
  }
}

function basename(path: string): string {
  const i = path.lastIndexOf('/');
  return i >= 0 ? path.slice(i + 1) : path;
}

function fileMatchesGlob(child: KnowledgeTreeNode, pattern: string): boolean {
  if (child.type !== 'file') return false;
  const names = new Set<string>();
  if (child.name) names.add(child.name);
  if (child.path) names.add(basename(child.path));
  if (child.file?.original_filename) names.add(child.file.original_filename);
  if (child.file?.markdown_relpath) {
    names.add(basename(child.file.markdown_relpath));
  }
  for (const name of names) {
    if (matchGlob(name, pattern)) return true;
  }
  return false;
}

function lastSegmentGlob(
  path: string,
): { folder: string; pattern: string } | null {
  const i = path.lastIndexOf('/');
  const name = i >= 0 ? path.slice(i + 1) : path;
  const folder = i >= 0 ? path.slice(0, i) : '';
  if (!/[*?]/.test(name)) return null;
  return { folder, pattern: name };
}

function parseFilesArg(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function isRecursiveGlob(path: string): boolean {
  return path.includes('**');
}

function expandFiles(
  raw: unknown,
  tree: KnowledgeTreeNode | null,
): string[] {
  const out: string[] = [];
  for (const item of parseFilesArg(raw)) {
    if (out.length >= 20) break;
    if (isRecursiveGlob(item)) {
      if (!tree) {
        out.push(item);
        continue;
      }
      const listed = listKnowledgeFiles(
        item.includes('/') && !item.startsWith('**')
          ? nodeAtPath(
              tree,
              item
                .replace(/\/\*\*.*$/, '')
                .replace(/\/[^/]*[\*?].*$/, ''),
            ) || tree
          : tree,
      );
      const matches = listed
        .map((file) => file.path)
        .filter((path) => path && matchPathGlob(path, item));
      if (matches.length) {
        for (const path of matches) {
          if (out.length >= 20) break;
          out.push(path);
        }
        continue;
      }
      // Keep the glob so Dochub can expand it server-side.
      out.push(item);
      continue;
    }
    const glob = lastSegmentGlob(item);
    if (!glob || !tree) {
      out.push(item);
      continue;
    }
    const node = nodeAtPath(tree, glob.folder);
    const children = node?.children || [];
    let matched = false;
    for (const child of children) {
      if (out.length >= 20) break;
      if (fileMatchesGlob(child, glob.pattern)) {
        out.push(child.path || `${glob.folder}/${child.name}`);
        matched = true;
      }
    }
    if (!matched) out.push(item);
  }
  return out.slice(0, 20);
}

function matchPathGlob(path: string, pattern: string): boolean {
  const pat = pattern.replace(/^markdown\//, '');
  const esc = pat
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '::GLOBSTAR::')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '[^/]')
    .replace(/::GLOBSTAR::/g, '.*');
  try {
    return new RegExp(`^${esc}$`).test(path);
  } catch {
    return false;
  }
}

function singleLocalWikiScope(
  ctx: WritingTurnContext,
): WritingKnowledgeScope | undefined {
  const wikis = writingWikiScopes(ctx);
  if (wikis.length !== 1 || !wikis[0]?.wikiRootAbs) return undefined;
  return wikis[0];
}

function fsReadTarget(
  ctx: WritingTurnContext,
  rawPath: string,
): { scope: WritingKnowledgeScope; rel: string } | undefined {
  const scope = singleLocalWikiScope(ctx);
  if (!scope?.wikiRootAbs) return undefined;
  const locator = parseFsReadLocator(rawPath);
  const { path: requested, library } = stripLibraryPrefix(locator.path);
  if (!requested) return undefined;
  if (library && library !== scope.library) return undefined;
  const other = writingTurnScopes(ctx).find(
    (item) =>
      item.path !== scope.path &&
      (requested === item.path || requested.startsWith(`${item.path}/`)),
  );
  if (other) return undefined;
  const prefixed =
    requested === scope.path || requested.startsWith(`${scope.path}/`);
  const wikiRel = requested === 'wiki' || requested.startsWith('wiki/');
  if (!prefixed && !wikiRel) return undefined;
  if (requested === scope.path) return undefined;
  const rel = prefixed ? requested.slice(scope.path.length + 1) : requested;
  if (!rel) return undefined;
  const suffix =
    locator.fromLine != null
      ? locator.maxLines != null
        ? `:${locator.fromLine}:${locator.maxLines}`
        : `:${locator.fromLine}`
      : '';
  return { scope, rel: `${rel}${suffix}` };
}

export function createDochubTools(deps?: DochubToolDeps): AgentTool[] {
  const doSearch = deps?.search ?? search;
  const doGet = deps?.getDochubMarkdown ?? getDochubMarkdown;

  const searchTool: AgentTool = {
    name: 'search',
    label: 'Search knowledge',
    description:
      "Search all pinned Knowledge folders in one call. Ordinary folders use semantic or keyword query; structured folders use keyword search. Hits are labeled with source (for example public:g3), path, and a short snippet. Prefer one search, then read. Do not repeat the same keyword search. Never pass user_id.",
    parameters: Type.Object({
      query: Type.Optional(
        Type.String({
          description: 'Search string or keyword. Required unless searches is set.',
        }),
      ),
      mode: Type.Optional(
        Type.String({
          description:
            'Ordinary folders only: search | vsearch | query. Ignored for structured folders.',
        }),
      ),
      searches: Type.Optional(
        Type.Array(
          Type.Object({
            type: Type.String({ description: 'lex | vec | hyde (ordinary folders only)' }),
            query: Type.String(),
          }),
        ),
      ),
      intent: Type.Optional(
        Type.String({ description: 'Ordinary folders only: what to find and avoid' }),
      ),
      limit: Type.Optional(Type.Number({ description: '1–50, default 20' })),
      path: Type.Optional(
        Type.String({
          description:
            'Optional folder or subpath; clamped to the pinned folders (for example public:g3)',
        }),
      ),
      rerank: Type.Optional(
        Type.Boolean({
          description: 'Ordinary folders only: cross-encoder rerank; default false',
        }),
      ),
      minScore: Type.Optional(Type.Number({ description: 'Ordinary folders only: minimum score 0–1' })),
      candidateLimit: Type.Optional(
        Type.Number({ description: 'Ordinary folders only: max candidates to rerank' }),
      ),
      caseInsensitive: Type.Optional(
        Type.Boolean({
          description: 'Structured folders only: case-insensitive keyword match. Default true.',
        }),
      ),
    }),
    execute: async (_id, args) => {
      const ctx = getWritingTurnContext();
      if (!ctx?.userId) return errorResult('No user bound');
      if (!hasKnowledgeScope(ctx)) return errorResult(NO_KNOWLEDGE_SCOPE);
      const rec = asRecord(args);
      const rawPath = typeof rec.path === 'string' ? rec.path.trim() : '';
      let qmdTargets = searchTargets(ctx);
      let wikiTargets = writingWikiScopes(ctx);
      if (rawPath) {
        const qmdSelected = scopesMatchingPath(qmdTargets, rawPath);
        const wikiSelected = scopesMatchingPath(wikiTargets, rawPath);
        const qmdOk = !('error' in qmdSelected) && qmdSelected.length > 0;
        const wikiOk = !('error' in wikiSelected) && wikiSelected.length > 0;
        if (qmdOk || wikiOk) {
          qmdTargets = qmdOk ? qmdSelected : [];
          wikiTargets = wikiOk ? wikiSelected : [];
        } else if (qmdTargets.length === 1 && wikiTargets.length === 0) {
          // Single ordinary pin: clamp the extra path into that folder.
        } else {
          return errorResult('path is outside the pinned folders');
        }
      } else if (qmdTargets.length === 0 && wikiTargets.length === 0) {
        if (ctx.mentionedDocuments.length) {
          return errorResult(
            'No knowledge folder is pinned. Read the mentioned documents directly.',
          );
        }
        return errorResult(NO_KNOWLEDGE_SCOPE);
      }
      const mapped = mapDochubQueryArgs(args);
      const recQuery = typeof rec.query === 'string' ? rec.query.trim() : '';
      const keyword =
        recQuery ||
        (mapped.ok && mapped.query) ||
        (mapped.ok && mapped.searches?.[0]?.query) ||
        '';
      if (qmdTargets.length > 0 && !mapped.ok) return errorResult(mapped.error);
      if (qmdTargets.length === 0 && wikiTargets.length > 0 && !keyword) {
        return errorResult('query is required');
      }
      const limitRaw =
        typeof rec.limit === 'number' && Number.isFinite(rec.limit)
          ? Math.floor(rec.limit)
          : 20;
      const limit = Math.min(50, Math.max(1, limitRaw));
      const selectedCount = qmdTargets.length + wikiTargets.length;
      const perLimit = splitRetrievalLimit(limit, selectedCount);
      const caseInsensitive =
        rec.caseInsensitive === undefined ? true : rec.caseInsensitive === true;
      const hits: ReturnType<typeof hitsFromSearchResults> = [];
      const sources: string[] = [];
      try {
        for (const target of qmdTargets) {
          if (!mapped.ok) break;
          const source = writingScopeLabel(target);
          sources.push(source);
          const path =
            qmdTargets.length === 1
              ? clampPathToPin(
                  rawPath ? stripLibraryPrefix(rawPath).path : undefined,
                  target.path,
                )
              : target.path;
          const raw = await doSearch(
            ctx.userId,
            {
              mode: mapped.mode,
              limit: Math.min(10, perLimit),
              ...(mapped.query ? { query: mapped.query } : {}),
              ...(mapped.searches ? { searches: mapped.searches } : {}),
              ...(mapped.intent ? { intent: mapped.intent } : {}),
              ...(typeof mapped.rerank === 'boolean'
                ? { rerank: mapped.rerank }
                : {}),
              ...(mapped.minScore != null ? { minScore: mapped.minScore } : {}),
              ...(mapped.candidateLimit != null
                ? { candidateLimit: mapped.candidateLimit }
                : {}),
              ...(path ? { path } : {}),
            },
            { library: target.library },
          );
          hits.push(
            ...hitsFromSearchResults(
              Array.isArray(raw.results) ? raw.results : [],
              source,
              Math.min(10, perLimit),
            ),
          );
        }
        for (const target of wikiTargets) {
          const source = writingScopeLabel(target);
          sources.push(source);
          const subpath = wikiGrepSubpath(target, rawPath || undefined);
          if (target.wikiRootAbs) {
            const local = grepWikiRoot({
              rootAbs: target.wikiRootAbs,
              query: keyword,
              ...(subpath ? { subpath } : {}),
              limit: perLimit,
              caseInsensitive,
            });
            if (!('error' in local)) {
              for (const hit of local) {
                hits.push({
                  ...hit,
                  source,
                  path: joinWikiHitPath(target.path, hit.path),
                });
              }
              continue;
            }
          }
          const raw = await doSearch(
            ctx.userId,
            {
              mode: 'search',
              query: keyword,
              limit: perLimit,
              path: subpath ? `${target.path}/${subpath}` : target.path,
            },
            { library: target.library },
          );
          hits.push(
            ...hitsFromSearchResults(
              Array.isArray(raw.results) ? raw.results : [],
              source,
              perLimit,
            ),
          );
        }
        return jsonToolResult({
          ok: true,
          ...(keyword ? { query: keyword } : {}),
          hits,
          sources,
          limitPerSource: perLimit,
        });
      } catch (error) {
        return errorResult(
          presentError(error instanceof Error ? error.message : String(error)),
        );
      }
    },
  };

  async function readOne(
    ctx: WritingTurnContext,
    file: string,
    rec: Record<string, unknown>,
  ): Promise<(DochubGetResult & { source?: string }) | { ok: false; error: string }> {
    const fsTarget = fsReadTarget(ctx, file);
    if (fsTarget?.scope.wikiRootAbs) {
      const local = readWikiRootFile({
        rootAbs: fsTarget.scope.wikiRootAbs,
        rel: fsTarget.rel,
        fromLine: rec.fromLine,
        maxLines: rec.maxLines,
      });
      if (local.ok) {
        return {
          ok: true,
          dochub_path: joinWikiHitPath(fsTarget.scope.path, local.rel),
          text: local.text,
          fromLine: local.fromLine,
          lineCount: local.lineCount,
          source: writingScopeLabel(fsTarget.scope),
        };
      }
      // Fall through to Dochub when the local file is missing.
      if (/not a file|no such file|ENOENT|file is required/i.test(local.error)) {
        // continue to Dochub below
      } else if (local.error.startsWith('File too large') || local.error.startsWith('Refusing binary')) {
        return { ok: false, error: presentError(local.error) };
      } else if (local.error.includes('outside') || local.error.includes('escapes')) {
        return { ok: false, error: presentError(local.error) };
      }
    }
    try {
      const stripped = stripLibraryPrefix(parseFsReadLocator(file).path || file);
      const scope = scopeForPath(ctx, file) || scopeForPath(ctx, stripped.path);
      const library =
        scope?.library || stripped.library || turnScope(ctx).library;
      const tree = treeForLibrary(ctx, library);
      const result = await doGet({
        userId: ctx.userId,
        tree,
        pin: pinPaths(ctx),
        mentionedDocuments: ctx.mentionedDocuments,
        file: stripped.path || file,
        fromLine: rec.fromLine,
        maxLines: rec.maxLines,
        maxBytes: rec.maxBytes,
        deps: { library },
      });
      if (!result.ok) return { ok: false, error: presentError(result.error) };
      return {
        ...result,
        source: scope ? writingScopeLabel(scope) : library,
      };
    } catch (error) {
      return {
        ok: false,
        error: presentError(error instanceof Error ? error.message : String(error)),
      };
    }
  }

  const readTool: AgentTool = {
    name: 'read',
    label: 'Read knowledge file',
    description:
      'Read markdown for one or more Knowledge paths. Prefer several paths in one call (files may be an array or a comma-separated string). Path may include :from:count. Mentioned documents may sit outside the pin.',
    parameters: Type.Object({
      files: Type.Optional(
        Type.Union([Type.String(), Type.Array(Type.String())]),
      ),
      file: Type.Optional(
        Type.String({ description: 'One path when files is omitted' }),
      ),
      path: Type.Optional(
        Type.String({ description: 'Alias for file' }),
      ),
      fromLine: Type.Optional(Type.Number({ description: '1-based start line' })),
      maxLines: Type.Optional(Type.Number({ description: 'Lines to return' })),
      maxBytes: Type.Optional(
        Type.Number({ description: 'Skip or truncate files over this many bytes' }),
      ),
    }),
    execute: async (_id, args) => {
      const ctx = getWritingTurnContext();
      if (!ctx?.userId) return errorResult('No user bound');
      if (!hasKnowledgeScope(ctx)) return errorResult(NO_KNOWLEDGE_SCOPE);
      const rec = asRecord(args);
      const raw = rawFilesArg(rec);
      if (raw === undefined) return errorResult('file is required');
      const { library, tree } = turnScope(ctx);
      const files = expandFiles(raw, tree);
      if (files.length === 0) return errorResult('file is required');
      const results: Array<DochubGetResult & { source?: string }> = [];
      const globs = files.filter((file) => /[*?]/.test(file));
      const concrete = files.filter((file) => !/[*?]/.test(file));
      const maxBytes =
        typeof rec.maxBytes === 'number' && rec.maxBytes > 0
          ? rec.maxBytes
          : undefined;
      if (globs.length) {
        try {
          const loadMulti = deps?.multiGetDocuments ?? multiGetDocuments;
          const payload = await loadMulti(
            ctx.userId,
            {
              files: globs,
              fromLine: typeof rec.fromLine === 'number' ? rec.fromLine : undefined,
              maxLines: typeof rec.maxLines === 'number' ? rec.maxLines : undefined,
              maxBytes,
              path: pinPaths(ctx).length === 1 ? pinPaths(ctx)[0] : undefined,
            },
            { library },
          );
          for (const doc of payload.documents || []) {
            results.push({
              ok: true,
              dochub_path: doc.path,
              ...(doc.docid ? { docid: doc.docid } : {}),
              text: (doc.text || '').replace(/^(\d+): /gm, '$1|'),
              fromLine: doc.from_line || 1,
              lineCount: doc.line_count ?? 0,
            });
          }
          for (const err of payload.errors || []) {
            const similar = err.similar?.length
              ? ` Similar: ${err.similar.join(', ')}`
              : '';
            results.push({
              ok: false,
              error: presentError(
                `${err.message || err.error || 'file not found'}${similar}`,
              ),
              ...(err.similar?.length ? { similar: err.similar } : {}),
            });
          }
        } catch (error) {
          results.push({
            ok: false,
            error: presentError(
              error instanceof Error ? error.message : String(error),
            ),
          });
        }
      }
      for (const file of concrete) {
        results.push(await readOne(ctx, file, rec));
      }
      if (files.length === 1 && concrete.length === 1 && results.length === 1) {
        const only = results[0]!;
        if (!only.ok) return errorResult(presentError(only.error));
        return jsonToolResult(only);
      }
      return jsonToolResult({ ok: true, files: results });
    },
  };

  return [searchTool, readTool];
}
