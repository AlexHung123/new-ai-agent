import { Type } from 'typebox';
import type { AgentTool } from '@earendil-works/pi-agent-core';
import { multiGetDocuments, search } from '@/lib/knowledge/dochubClient';
import {
  applyReadCharBudget,
  DOCHUB_MAX_BYTES,
  formatDochubDocument,
  getDochubDocuments,
  type DochubGetResult,
} from '@/lib/knowledge/dochubGet';
import {
  keywordFallbackArgs,
  mapDochubQueryArgs,
  semanticSearchFallbackReason,
  usesSemanticSearch,
} from '@/lib/knowledge/dochubQuery';
import { isHiddenPublicFolder, parseKnowledgePin } from '@/lib/knowledge/library';
import { fileCountInNode, listKnowledgeFiles, nodeAtPath } from '@/lib/knowledge/tree';
import type { KnowledgeTreeNode } from '@/lib/knowledge/types';
import { hitsFromSearchResults, mergeSearchHits } from '@/lib/knowledge/search';
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
  writingTurnScopes,
  type WritingKnowledgeScope,
  type WritingTurnContext,
} from '../runtime/writingTurnContext';

export const DOCHUB_TOOL_NAMES = ['search', 'read', 'list'] as const;

type DochubToolDeps = {
  search?: typeof search;
  getDochubDocuments?: typeof getDochubDocuments;
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
  const scopes = writingTurnScopes(ctx);
  if (scopes.length) return scopes;
  if (ctx.pin) {
    return [
      {
        path: ctx.pin,
        library: ctx.pinLibrary === 'public' ? 'public' : 'private',
      },
    ];
  }
  return [];
}

function pathOutsidePinsError(scopes: WritingKnowledgeScope[]): string {
  const labels = scopes.map((scope) => writingScopeLabel(scope));
  if (!labels.length) return 'path is outside the pinned folders';
  return `path is outside the pinned folders. Currently pinned: ${labels.join(', ')}`;
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
        pathInsidePin(requested, scope.path)),
  );
  if (matches.length === 0) {
    return { error: pathOutsidePinsError(scopes) };
  }
  return matches;
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

function hitInsidePin(path: string, pin: string): boolean {
  const rel = path.replace(/^markdown\//, '');
  return pathInsidePin(rel, pin) || pathInsidePin(path, pin);
}

function filterHitsForPin(
  hits: ReturnType<typeof hitsFromSearchResults>,
  target: WritingKnowledgeScope,
): ReturnType<typeof hitsFromSearchResults> {
  return hits.filter((hit) => {
    if (target.library === 'public' && isHiddenPublicFolder(hit.path)) {
      return false;
    }
    return hitInsidePin(hit.path, target.path);
  });
}

function globAppliesToScope(pattern: string, pinPath: string): boolean {
  if (!pattern || pattern.startsWith('**')) return true;
  const folder = pattern.includes('/')
    ? pattern.replace(/\/\*\*.*$/, '').replace(/\/[^/]*[\*?].*$/, '')
    : '';
  if (!folder) return true;
  return (
    pathInsidePin(folder, pinPath) ||
    pathInsidePin(pinPath, folder) ||
    folder === pinPath
  );
}

function expandGlobOnPin(
  pattern: string,
  tree: KnowledgeTreeNode | null,
  pinPath: string,
): string[] {
  if (!tree) return [];
  const pinNode = pinPath ? nodeAtPath(tree, pinPath) : tree;
  if (!pinNode) return [];
  if (isRecursiveGlob(pattern)) {
    return listKnowledgeFiles(pinNode)
      .map((file) => file.path)
      .filter(
        (path) =>
          Boolean(path) &&
          matchPathGlob(path, pattern) &&
          (!pinPath || pathInsidePin(path, pinPath)),
      );
  }
  const glob = lastSegmentGlob(pattern);
  if (!glob) return [];
  const folder = glob.folder;
  if (
    folder &&
    pinPath &&
    !pathInsidePin(folder, pinPath) &&
    folder !== pinPath &&
    !pathInsidePin(pinPath, folder)
  ) {
    return [];
  }
  const node = folder ? nodeAtPath(tree, folder) : pinNode;
  if (!node) return [];
  const out: string[] = [];
  for (const child of node.children || []) {
    if (!fileMatchesGlob(child, glob.pattern)) continue;
    const path = child.path || `${glob.folder}/${child.name}`;
    if (pinPath && !pathInsidePin(path, pinPath)) continue;
    out.push(path);
  }
  return out;
}

function expandFiles(
  raw: unknown,
  ctx: WritingTurnContext,
): string[] {
  const scopes = writingTurnScopes(ctx).filter(
    (scope) =>
      !(scope.library === 'public' && isHiddenPublicFolder(scope.path)),
  );
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (path: string) => {
    if (!path || seen.has(path) || out.length >= 20) return;
    seen.add(path);
    out.push(path);
  };
  for (const item of parseFilesArg(raw)) {
    if (out.length >= 20) break;
    const { path: requested, library } = stripLibraryPrefix(item);
    const pattern = requested || item;
    if (isRecursiveGlob(pattern) || lastSegmentGlob(pattern)) {
      const targets = scopes.filter(
        (scope) =>
          (!library || scope.library === library) &&
          globAppliesToScope(pattern, scope.path),
      );
      const usable = targets.length ? targets : scopes;
      let matched = false;
      for (const scope of usable) {
        const expanded = expandGlobOnPin(
          pattern,
          treeForLibrary(ctx, scope.library),
          scope.path,
        );
        if (!expanded.length) continue;
        matched = true;
        for (const path of expanded) push(path);
      }
      if (!matched) push(item);
      continue;
    }
    push(item);
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


const DEFAULT_LIST_LIMIT = 50;
const MAX_LIST_LIMIT = 200;

function clampListLimit(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_LIST_LIMIT;
  }
  return Math.max(1, Math.min(MAX_LIST_LIMIT, Math.floor(value)));
}

export function createDochubTools(deps?: DochubToolDeps): AgentTool[] {
  const doSearch = deps?.search ?? search;
  const searchTool: AgentTool = {
    name: 'search',
    label: 'Search knowledge',
    description:
      'Search all pinned Knowledge folders in one call. Hits are labeled with source (for example public:g3), path, and a short snippet. query may be a string or an array of independent keywords. searches (lex/vec/hyde) is for one intent across channels, not unrelated keywords. Prefer one search, then read. Do not repeat the same keyword search. Never pass user_id.',
    parameters: Type.Object({
      query: Type.Optional(
        Type.Union([
          Type.String({
            description:
              'Search string or keyword. Required unless searches is set. Defaults to keyword search.',
          }),
          Type.Array(Type.String(), {
            description:
              'Independent keyword queries. Each is searched separately, then hits are merged, labeled with query and source, and capped by limit (round-robin). Not the same as searches (lex/vec/hyde), which fuse one intent.',
          }),
        ]),
      ),
      mode: Type.Optional(
        Type.String({
          description: 'search | vsearch | query',
        }),
      ),
      searches: Type.Optional(
        Type.Array(
          Type.Object({
            type: Type.String({ description: 'lex | vec | hyde' }),
            query: Type.String(),
          }),
        ),
      ),
      intent: Type.Optional(
        Type.String({ description: 'What to find and avoid' }),
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
          description: 'Cross-encoder rerank; default false',
        }),
      ),
      minScore: Type.Optional(Type.Number({ description: 'Minimum score 0–1' })),
      candidateLimit: Type.Optional(
        Type.Number({ description: 'Max candidates to rerank' }),
      ),
    }),
    execute: async (_id, args) => {
      const ctx = getWritingTurnContext();
      if (!ctx?.userId) return errorResult('No user bound');
      if (!hasKnowledgeScope(ctx)) return errorResult(NO_KNOWLEDGE_SCOPE);
      const rec = asRecord(args);
      const rawPath = typeof rec.path === 'string' ? rec.path.trim() : '';
      let targets = searchTargets(ctx);
      if (rawPath) {
        const selected = scopesMatchingPath(targets, rawPath);
        if ('error' in selected || selected.length === 0) {
          return errorResult(
            'error' in selected
              ? selected.error
              : pathOutsidePinsError(targets),
          );
        }
        targets = selected;
      } else if (targets.length === 0) {
        if (ctx.mentionedDocuments.length) {
          return errorResult(
            'No knowledge folder is pinned. Read the mentioned documents directly.',
          );
        }
        return errorResult(NO_KNOWLEDGE_SCOPE);
      }
      const mapped = mapDochubQueryArgs(args);
      if (!mapped.ok) return errorResult(mapped.error);
      const queryTerms =
        mapped.queries && mapped.queries.length > 0
          ? mapped.queries
          : mapped.query
            ? [mapped.query]
            : [];
      const keyword =
        queryTerms.length === 1
          ? queryTerms[0]
          : queryTerms.length > 1
            ? queryTerms
            : mapped.searches?.[0]?.query || '';
      const limit = mapped.limit;
      const perLimit = splitRetrievalLimit(limit, targets.length);
      const sources = targets.map((target) => writingScopeLabel(target));
      const requestedMode = mapped.mode;
      const baseArgs = {
        mode: mapped.mode,
        ...(mapped.searches ? { searches: mapped.searches } : {}),
        ...(mapped.intent ? { intent: mapped.intent } : {}),
        ...(typeof mapped.rerank === 'boolean' ? { rerank: mapped.rerank } : {}),
        ...(mapped.minScore != null ? { minScore: mapped.minScore } : {}),
        ...(mapped.candidateLimit != null
          ? { candidateLimit: mapped.candidateLimit }
          : {}),
      };
      const independentQueries =
        !mapped.searches?.length && queryTerms.length > 0
          ? queryTerms
          : [undefined];
      let fallback: { reason: string; from: string } | undefined;
      const applySemanticPrefallback = usesSemanticSearch(mapped) &&
        ctx.index?.semantic_search_ready === false;
      if (applySemanticPrefallback) {
        fallback = { reason: 'semantic_not_ready', from: requestedMode };
      }
      try {
        const jobs = independentQueries.flatMap((term) =>
          targets.map((target) => ({ term, target })),
        );
        const groups = await Promise.all(
          jobs.map(async ({ term, target }) => {
            const source = writingScopeLabel(target);
            const path =
              targets.length === 1
                ? clampPathToPin(
                    rawPath ? stripLibraryPrefix(rawPath).path : undefined,
                    target.path,
                  )
                : target.path;
            let searchArgs = {
              ...baseArgs,
              ...(term
                ? { query: term }
                : mapped.query
                  ? { query: mapped.query }
                  : {}),
            };
            if (applySemanticPrefallback) {
              searchArgs = {
                ...searchArgs,
                ...keywordFallbackArgs({
                  ...mapped,
                  ...(term ? { query: term } : {}),
                }),
              };
            }
            const request = {
              ...searchArgs,
              limit: perLimit,
              ...(path ? { path } : {}),
            };
            let raw;
            try {
              raw = await doSearch(ctx.userId, request, {
                library: target.library,
              });
            } catch (error) {
              const reason = semanticSearchFallbackReason(error);
              if (!reason || searchArgs.mode === 'search') throw error;
              fallback = { reason, from: requestedMode };
              searchArgs = {
                ...searchArgs,
                ...keywordFallbackArgs({
                  ...mapped,
                  ...(term ? { query: term } : {}),
                }),
              };
              raw = await doSearch(
                ctx.userId,
                { ...searchArgs, limit: perLimit, ...(path ? { path } : {}) },
                { library: target.library },
              );
            }
            if (!fallback && raw.fallback && typeof raw.fallback === 'object') {
              const recFallback = raw.fallback as { reason?: string };
              fallback = {
                reason: recFallback.reason || 'keyword_fallback',
                from: requestedMode,
              };
            }
            return filterHitsForPin(
              hitsFromSearchResults(
                Array.isArray(raw.results) ? raw.results : [],
                source,
                perLimit,
              ),
              target,
            ).map((hit) => (term ? { ...hit, query: term } : hit));
          }),
        );
        const queryCount = independentQueries.length;
        const byQuery: typeof groups = [];
        if (queryCount <= 1) {
          byQuery.push(groups.flat());
        } else {
          for (let q = 0; q < queryCount; q += 1) {
            const slice = groups.slice(q * targets.length, (q + 1) * targets.length);
            byQuery.push(slice.flat());
          }
        }
        const hits = mergeSearchHits(byQuery, {
          limit,
          limitPerSource: perLimit,
        });
        return jsonToolResult({
          ok: true,
          ...(keyword ? { query: keyword } : {}),
          hits,
          sources,
          limitPerSource: perLimit,
          ...(fallback ? { fallback } : {}),
        });
      } catch (error) {
        return errorResult(
          presentError(error instanceof Error ? error.message : String(error)),
        );
      }
    },
  };

  const readTool: AgentTool = {
    name: 'read',
    label: 'Read knowledge file',
    description:
      'Read markdown for one or more Knowledge paths. Prefer several paths in one call (files may be an array or a comma-separated string). With no range, returns as much of the file as fits (up to 200 KiB). Long files are flagged truncated and include a path:from:count hint. Path may include :from:count. Mentioned documents may sit outside the pin.',
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
      const files = expandFiles(raw, ctx);
      if (files.length === 0) return errorResult('file is required');
      const results: Array<DochubGetResult & { source?: string }> = [];
      const globs = files.filter((file) => /[*?]/.test(file));
      const concrete = files.filter((file) => !/[*?]/.test(file));
      const maxBytes =
        typeof rec.maxBytes === 'number' && rec.maxBytes > 0
          ? rec.maxBytes
          : DOCHUB_MAX_BYTES;
      if (globs.length) {
        const loadMulti = deps?.multiGetDocuments ?? multiGetDocuments;
        const scopes = writingTurnScopes(ctx).filter(
          (scope) =>
            !(scope.library === 'public' && isHiddenPublicFolder(scope.path)),
        );
        for (const glob of globs) {
          const { path: requested, library } = stripLibraryPrefix(glob);
          const pattern = requested || glob;
          const targets = scopes.filter(
            (scope) =>
              (!library || scope.library === library) &&
              globAppliesToScope(pattern, scope.path),
          );
          const usable = targets.length ? targets : scopes;
          for (const scope of usable) {
            try {
              const payload = await loadMulti(
                ctx.userId,
                {
                  files: [pattern],
                  fromLine:
                    typeof rec.fromLine === 'number' ? rec.fromLine : undefined,
                  maxLines:
                    typeof rec.maxLines === 'number' ? rec.maxLines : undefined,
                  maxBytes,
                  path: scope.path,
                },
                { library: scope.library },
              );
              for (const doc of payload.documents || []) {
                const docPath = doc.path || '';
                if (
                  scope.library === 'public' &&
                  isHiddenPublicFolder(docPath)
                ) {
                  continue;
                }
                if (scope.path && !hitInsidePin(docPath, scope.path)) continue;
                results.push({
                  ...formatDochubDocument(doc, docPath, doc.from_line || 1),
                  source: writingScopeLabel(scope),
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
        }
      }
      if (concrete.length) {
        const loadDocs = deps?.getDochubDocuments ?? getDochubDocuments;
        const batched = await loadDocs({
          userId: ctx.userId,
          pin: pinPaths(ctx),
          mentionedDocuments: ctx.mentionedDocuments,
          requests: concrete.map((file) => {
            const locator = parseFsReadLocator(file);
            const stripped = stripLibraryPrefix(locator.path || file);
            const path = stripped.path || locator.path || file;
            const ranged =
              locator.maxLines != null && locator.fromLine != null
                ? `${path}:${locator.fromLine}:${locator.maxLines}`
                : locator.fromLine != null
                  ? `${path}:${locator.fromLine}`
                  : path;
            const scope = scopeForPath(ctx, file) || scopeForPath(ctx, stripped.path);
            const library =
              scope?.library || stripped.library || turnScope(ctx).library;
            return {
              file: ranged,
              library,
              tree: treeForLibrary(ctx, library),
              source: scope ? writingScopeLabel(scope) : library,
            };
          }),
          fromLine: rec.fromLine,
          maxLines: rec.maxLines,
          maxBytes,
          deps: {
            ...(deps?.multiGetDocuments
              ? { multiGetDocuments: deps.multiGetDocuments }
              : {}),
          },
        });
        for (const item of batched) {
          if (!item.ok) {
            results.push({ ok: false, error: presentError(item.error), ...(item.similar ? { similar: item.similar } : {}) });
          } else {
            results.push(item);
          }
        }
      }
      const capped = applyReadCharBudget(results);
      if (files.length === 1 && concrete.length === 1 && capped.length === 1) {
        const only = capped[0]!;
        if (!only.ok) return errorResult(presentError(only.error));
        return jsonToolResult(only);
      }
      return jsonToolResult({ ok: true, files: capped });
    },
  };


  const listTool: AgentTool = {
    name: 'list',
    label: 'List knowledge files',
    description:
      'List files in the pinned or @-mentioned Knowledge folders. Optional path narrows to a subfolder or prefix. Results are capped; if truncated, pass a tighter path. Do not use search just to inventory a folder. Never pass user_id.',
    parameters: Type.Object({
      path: Type.Optional(
        Type.String({
          description:
            'Optional folder or prefix inside the pinned folders (for example public:g3 or contracts/2024)',
        }),
      ),
      limit: Type.Optional(
        Type.Number({
          description: 'Max files to return (default 50, max 200)',
        }),
      ),
    }),
    execute: async (_id, args) => {
      const ctx = getWritingTurnContext();
      if (!ctx?.userId) return errorResult('No user bound');
      if (!hasKnowledgeScope(ctx)) return errorResult(NO_KNOWLEDGE_SCOPE);
      const rec = asRecord(args);
      const rawPath =
        typeof rec.path === 'string' && rec.path.trim()
          ? rec.path.trim()
          : undefined;
      const limit = clampListLimit(rec.limit);
      let scopes = writingTurnScopes(ctx);
      if (rawPath) {
        if (scopes.length === 0) {
          return errorResult(pathOutsidePinsError(scopes));
        }
        const selected = scopesMatchingPath(scopes, rawPath);
        if ('error' in selected) return errorResult(selected.error);
        scopes = selected;
      }
      const files: Array<{ path: string; name: string; source: string }> = [];
      const folders: Array<{
        path: string;
        name: string;
        source: string;
        fileCount: number;
      }> = [];
      const seen = new Set<string>();
      const addFile = (path: string, name: string, source: string) => {
        const key = `${source}:${path}`;
        if (!path || seen.has(key)) return;
        seen.add(key);
        files.push({ path, name, source });
      };
      if (scopes.length) {
        const requested = rawPath
          ? stripLibraryPrefix(rawPath).path
          : undefined;
        for (const scope of scopes) {
          if (scope.library === 'public' && isHiddenPublicFolder(scope.path)) {
            continue;
          }
          const tree = treeForLibrary(ctx, scope.library);
          if (!tree) continue;
          const folderPath = requested || scope.path;
          const source = writingScopeLabel(scope);
          const node =
            (folderPath ? nodeAtPath(tree, folderPath) : tree) ||
            (scope.path ? nodeAtPath(tree, scope.path) : tree);
          if (!node) continue;
          if (node.type === 'file') {
            const listed = listKnowledgeFiles(node)[0];
            addFile(
              listed?.path || node.path || folderPath,
              listed?.name || node.name,
              source,
            );
            continue;
          }
          if (!requested || node.path === folderPath) {
            for (const child of node.children || []) {
              if (child.type !== 'dir') continue;
              folders.push({
                path: child.path,
                name: child.name,
                source,
                fileCount: fileCountInNode(child),
              });
            }
          }
          const listed = listKnowledgeFiles(node);
          const prefix = requested && node.path !== folderPath ? folderPath : '';
          for (const entry of listed) {
            if (
              prefix &&
              entry.path !== prefix &&
              !entry.path.startsWith(`${prefix}/`)
            ) {
              continue;
            }
            addFile(entry.path, entry.name, source);
          }
        }
      }
      if (!rawPath) {
        for (const doc of ctx.mentionedDocuments) {
          const library = doc.library === 'public' ? 'public' : 'private';
          const path = doc.markdownRelpath || doc.path;
          if (!path) continue;
          if (files.some((file) => file.path === path)) continue;
          const scope =
            scopeForPath(ctx, `${library}:${path}`) || scopeForPath(ctx, path);
          addFile(
            path,
            doc.name || path,
            scope ? writingScopeLabel(scope) : `${library}:${path}`,
          );
        }
      }
      const truncated = files.length > limit;
      return jsonToolResult({
        ok: true,
        files: files.slice(0, limit),
        ...(folders.length ? { folders } : {}),
        truncated,
        limit,
        totalFiles: files.length,
      });
    },
  };

  return [searchTool, readTool, listTool];
}
