import { Type } from 'typebox';
import type { AgentTool } from '@earendil-works/pi-agent-core';
import {
  getHealth,
  getStatus,
  getTree,
  multiGetDocuments,
  search,
} from '@/lib/knowledge/dochubClient';
import { getDochubMarkdown, type DochubGetResult } from '@/lib/knowledge/dochubGet';
import { mapDochubQueryArgs } from '@/lib/knowledge/dochubQuery';
import { stripQmdMarkdownPath } from '@/lib/knowledge/search';
import { listKnowledgeFiles, nodeAtPath } from '@/lib/knowledge/tree';
import type { KnowledgeTreeNode } from '@/lib/knowledge/types';
import { parseKnowledgePin } from '@/lib/knowledge/library';
import {
  grepWikiRoot,
  hitsFromSearchResults,
  joinWikiHitPath,
} from '@/lib/knowledge/wikiGrep';
import {
  clampPathToPin,
  pathInsidePin,
  splitRetrievalLimit,
} from '@/lib/knowledge/writingPin';
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

export const DOCHUB_TOOL_NAMES = [
  'query',
  'get',
  'multi_get',
  'tree',
  'status',
  'grep',
] as const;

type DochubToolDeps = {
  search?: typeof search;
  getDochubMarkdown?: typeof getDochubMarkdown;
  getHealth?: typeof getHealth;
  getStatus?: typeof getStatus;
  getTree?: typeof getTree;
  multiGetDocuments?: typeof multiGetDocuments;
};

function asRecord(args: unknown): Record<string, unknown> {
  return args && typeof args === 'object'
    ? (args as Record<string, unknown>)
    : {};
}

const MAX_TREE_FILES = 2000;
const STOP_RETRY =
  ' Do not retry this call. If the user wants a file list, answer from the tree tool files array.';

function errorResult(error: string) {
  return jsonToolResult({ ok: false, error });
}

const NO_KNOWLEDGE_SCOPE =
  'No knowledge folder is pinned. Pin a folder from FILES or @mention one.';
const WIKI_ONLY_QUERY =
  'This turn includes structured folders only. Read wiki/index.md with get or fs_read first, or use grep for keywords; do not use query.';

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

const NO_WIKI_SCOPE =
  'This turn has no structured folders. Use query for ordinary folders.';

function wikiGrepTargets(
  ctx: WritingTurnContext,
  rawPath?: string,
): WritingKnowledgeScope[] | { error: string } {
  const scopes = writingWikiScopes(ctx);
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
    return { error: 'path is outside the pinned structured folders' };
  }
  return matches;
}

function wikiGrepSubpath(scope: WritingKnowledgeScope, rawPath?: string): string | undefined {
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
      (path === scope.path || path.startsWith(`${scope.path}/`) || scope.path.startsWith(`${path}/`) || pathInsidePin(path, scope.path)),
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
          ? nodeAtPath(tree, item.replace(/\/\*\*.*$/, '').replace(/\/[^/]*[\*?].*$/, '')) || tree
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

function stripHitFiles(results: unknown[]): unknown[] {
  return results.map((hit) => {
    if (!hit || typeof hit !== 'object') return hit;
    const rec = hit as Record<string, unknown>;
    if (typeof rec.file !== 'string') return hit;
    return { ...rec, file: stripQmdMarkdownPath(rec.file) };
  });
}

export function createDochubTools(deps?: DochubToolDeps): AgentTool[] {
  const doSearch = deps?.search ?? search;
  const doGet = deps?.getDochubMarkdown ?? getDochubMarkdown;
  const doHealth = deps?.getHealth ?? getHealth;

  const query: AgentTool = {
    name: 'query',
    label: 'Search knowledge',
    description:
      'Search inside this user\'s Knowledge documents. Do not use this to list every file; call tree for an inventory. Prefer structured searches (lex/vec/hyde). The host supplies identity and folder pin; never pass user_id.',
    parameters: Type.Object({
      query: Type.Optional(
        Type.String({ description: 'Bare search string when searches is omitted' }),
      ),
      mode: Type.Optional(
        Type.String({ description: 'search | vsearch | query' }),
      ),
      searches: Type.Optional(
        Type.Array(
          Type.Object({
            type: Type.String({ description: 'lex | vec | hyde' }),
            query: Type.String(),
          }),
        ),
      ),
      intent: Type.Optional(Type.String()),
      limit: Type.Optional(Type.Number({ description: '1–10, default 5' })),
      path: Type.Optional(
        Type.String({ description: 'Optional subfolder; clamped to the host pin' }),
      ),
      rerank: Type.Optional(Type.Boolean({ description: 'Cross-encoder rerank for query mode; default false, set true to enable' })),
      minScore: Type.Optional(Type.Number({ description: 'Minimum score 0–1' })),
      candidateLimit: Type.Optional(
        Type.Number({ description: 'Max candidates to rerank (qmd --candidate-limit)' }),
      ),
    }),
    execute: async (_id, args) => {
      const ctx = getWritingTurnContext();
      if (!ctx?.userId) return errorResult('No user bound');
      if (!hasKnowledgeScope(ctx)) return errorResult(NO_KNOWLEDGE_SCOPE);
      const mapped = mapDochubQueryArgs(args);
      if (!mapped.ok) return errorResult(mapped.error);
      const targets = searchTargets(ctx);
      if (targets.length === 0) return errorResult(WIKI_ONLY_QUERY);
      let selected = targets;
      if (mapped.path && targets.length > 1) {
        const { path: requested, library } = stripLibraryPrefix(mapped.path);
        const matches = targets.filter(
          (target) =>
            (!library || target.library === library) &&
            (requested === target.path ||
              requested.startsWith(`${target.path}/`) ||
              pathInsidePin(requested, target.path)),
        );
        if (matches.length === 0) {
          return errorResult('path is outside the pinned folders');
        }
        selected = matches;
      }
      const perLimit = splitRetrievalLimit(mapped.limit ?? 5, selected.length);
      try {
        const merged: unknown[] = [];
        let rest: Record<string, unknown> = {};
        for (const target of selected) {
          const path =
            selected.length === 1
              ? clampPathToPin(mapped.path ? stripLibraryPrefix(mapped.path).path : undefined, target.path)
              : target.path;
          const raw = await doSearch(ctx.userId, {
            mode: mapped.mode,
            limit: perLimit,
            ...(mapped.query ? { query: mapped.query } : {}),
            ...(mapped.searches ? { searches: mapped.searches } : {}),
            ...(mapped.intent ? { intent: mapped.intent } : {}),
            ...(typeof mapped.rerank === 'boolean' ? { rerank: mapped.rerank } : {}),
            ...(mapped.minScore != null ? { minScore: mapped.minScore } : {}),
            ...(mapped.candidateLimit != null
              ? { candidateLimit: mapped.candidateLimit }
              : {}),
            ...(path ? { path } : {}),
          }, { library: target.library });
          const { user_id: _userId, results: rawResults, ...rawRest } = raw;
          void _userId;
          rest = rawRest as Record<string, unknown>;
          const labeled = stripHitFiles(
            Array.isArray(rawResults) ? rawResults : [],
          ).map((hit) => {
            if (!hit || typeof hit !== 'object') {
              return { source: writingScopeLabel(target), hit };
            }
            return { ...hit, source: writingScopeLabel(target) };
          });
          merged.push(...labeled);
        }
        return jsonToolResult({
          ...rest,
          results: merged,
          ok: true,
          ...(selected.length > 1
            ? {
                sources: selected.map((target) => writingScopeLabel(target)),
                limitPerSource: perLimit,
              }
            : {}),
        });
      } catch (error) {
        return errorResult(
          presentError(error instanceof Error ? error.message : String(error)),
        );
      }
    },
  };

  const get: AgentTool = {
    name: 'get',
    label: 'Get knowledge file',
    description:
      'Read markdown for one Knowledge file. Path may include :from:count. Mentioned documents may sit outside the pin.',
    parameters: Type.Object({
      file: Type.String({
        description:
          'Library path or #docid, optional :fromLine or :fromLine:maxLines suffix',
      }),
      fromLine: Type.Optional(Type.Number({ description: '1-based start line' })),
      maxLines: Type.Optional(Type.Number({ description: 'Lines to return' })),
    }),
    execute: async (_id, args) => {
      const ctx = getWritingTurnContext();
      if (!ctx?.userId) return errorResult('No user bound');
      if (!hasKnowledgeScope(ctx)) return errorResult(NO_KNOWLEDGE_SCOPE);
      const rec = asRecord(args);
      const file = typeof rec.file === 'string' ? rec.file : '';
      if (!file) return errorResult('file is required');
      try {
        const stripped = stripLibraryPrefix(file);
        const scope = scopeForPath(ctx, file);
        const library = scope?.library || stripped.library || turnScope(ctx).library;
        const tree = treeForLibrary(ctx, library);
        const result = await doGet({
          userId: ctx.userId,
          tree,
          pin: pinPaths(ctx),
          mentionedDocuments: ctx.mentionedDocuments,
          file: stripped.path || file,
          fromLine: rec.fromLine,
          maxLines: rec.maxLines,
          deps: { library },
        });
        if (!result.ok) return errorResult(presentError(result.error));
        return jsonToolResult({
          ...result,
          source: scope ? writingScopeLabel(scope) : library,
        });
      } catch (error) {
        return errorResult(
          presentError(error instanceof Error ? error.message : String(error)),
        );
      }
    },
  };

  const multiGet: AgentTool = {
    name: 'multi_get',
    label: 'Get several knowledge files',
    description:
      'Read markdown for Knowledge paths, #docids, or globs including **/*.md. files may be a comma-separated string or an array. Optional maxBytes caps each file.',
    parameters: Type.Object({
      files: Type.Optional(
        Type.Union([Type.String(), Type.Array(Type.String())]),
      ),
      file: Type.Optional(
        Type.String({ description: 'One path when files is omitted' }),
      ),
      fromLine: Type.Optional(Type.Number()),
      maxLines: Type.Optional(Type.Number()),
      maxBytes: Type.Optional(Type.Number({ description: 'Skip or truncate files over this many bytes' })),
    }),
    execute: async (_id, args) => {
      const ctx = getWritingTurnContext();
      if (!ctx?.userId) return errorResult('No user bound');
      if (!hasKnowledgeScope(ctx)) return errorResult(NO_KNOWLEDGE_SCOPE);
      const rec = asRecord(args);
      const raw = rawFilesArg(rec);
      if (raw === undefined) return errorResult('files is required');
      const { library, tree } = turnScope(ctx);
      const files = expandFiles(raw, tree);
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
              error: presentError(`${err.message || err.error || 'file not found'}${similar}`),
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
        try {
          const stripped = stripLibraryPrefix(file);
          const scope = scopeForPath(ctx, file);
          const fileLibrary = scope?.library || stripped.library || library;
          const result = await doGet({
            userId: ctx.userId,
            tree: treeForLibrary(ctx, fileLibrary),
            pin: pinPaths(ctx),
            mentionedDocuments: ctx.mentionedDocuments,
            file: stripped.path || file,
            fromLine: rec.fromLine,
            maxLines: rec.maxLines,
            maxBytes,
            deps: { library: fileLibrary },
          });
          results.push(
            result.ok
              ? { ...result, source: scope ? writingScopeLabel(scope) : fileLibrary }
              : { ok: false, error: presentError(result.error) },
          );
        } catch (error) {
          results.push({
            ok: false,
            error: presentError(
              error instanceof Error ? error.message : String(error),
            ),
          });
        }
      }
      return jsonToolResult({ ok: true, files: results });
    },
  };

  const treeTool: AgentTool = {
    name: 'tree',
    label: 'Knowledge tree',
    description:
      'List this user\'s Knowledge files. files is the full inventory ({path, name}). Use this once when the user asks what files exist, then answer from files. Do not follow with query or get just to name files.',
    parameters: Type.Object({
      path: Type.Optional(
        Type.String({ description: 'Optional subfolder; clamped to the host pin' }),
      ),
      refresh: Type.Optional(
        Type.Boolean({ description: 'Fetch a live tree from Dochub instead of the turn snapshot' }),
      ),
    }),
    execute: async (_id, args) => {
      const ctx = getWritingTurnContext();
      if (!ctx?.userId) return errorResult('No user bound');
      if (!hasKnowledgeScope(ctx)) return errorResult(NO_KNOWLEDGE_SCOPE);
      const rec = asRecord(args);
      const requested =
        typeof rec.path === 'string' ? rec.path : undefined;
      const scopes = writingTurnScopes(ctx);
      const targets = requested
        ? scopes.filter((scope) => {
            const { path, library } = stripLibraryPrefix(requested);
            return (
              (!library || scope.library === library) &&
              (path === scope.path ||
                path.startsWith(`${scope.path}/`) ||
                pathInsidePin(path, scope.path))
            );
          })
        : scopes;
      if (requested && targets.length === 0) {
        return errorResult('path is outside the pinned folders');
      }
      const listed: Array<Record<string, unknown>> = [];
      for (const target of targets.length ? targets : scopes) {
        const path =
          targets.length === 1 && requested
            ? clampPathToPin(stripLibraryPrefix(requested).path, target.path) || target.path
            : target.path;
        let tree = treeForLibrary(ctx, target.library);
        if (rec.refresh === true || !tree) {
          try {
            const loaded = await (deps?.getTree ?? getTree)(ctx.userId, {
              path: path || undefined,
              library: target.library,
            });
            tree = loaded?.tree ?? tree;
          } catch (error) {
            if (!tree && targets.length <= 1) {
              return errorResult(
                presentError(error instanceof Error ? error.message : 'Knowledge library is unavailable.'),
              );
            }
          }
        }
        if (!tree) {
          if (targets.length <= 1) {
            return errorResult(presentError('Knowledge library is unavailable.'));
          }
          continue;
        }
        const node =
          nodeAtPath(tree, path) || {
            type: 'dir' as const,
            name: '',
            path: '',
            children: [],
          };
        listed.push(
          ...listKnowledgeFiles(node).map((file) => ({
            ...file,
            library: target.library,
            source: writingScopeLabel(target),
          })),
        );
      }
      const truncated = listed.length > MAX_TREE_FILES;
      const files = truncated ? listed.slice(0, MAX_TREE_FILES) : listed;
      const first = (targets.length ? targets : scopes)[0];
      return jsonToolResult({
        ok: true,
        path: requested ? stripLibraryPrefix(requested).path : first?.path || '',
        library: first?.library || turnScope(ctx).library,
        ...(scopes.length > 1
          ? { sources: scopes.map((scope) => writingScopeLabel(scope)) }
          : {}),
        fileCount: listed.length,
        truncated,
        files,
        note: truncated
          ? 'List truncated. Answer with these paths and say there are more. Do not open files to continue the list.'
          : 'This is the full file list. Answer with these names and paths. Do not call query, get, or multi_get just to list files.',
      });
    },
  };

  const status: AgentTool = {
    name: 'status',
    label: 'Knowledge status',
    description:
      'Report pin, index health, and whether keyword or semantic search is ready. Does not return the user id.',
    parameters: Type.Object({}),
    execute: async () => {
      const ctx = getWritingTurnContext();
      if (!ctx?.userId) return errorResult('No user bound');
      const loadStatus = deps?.getStatus ?? getStatus;
      try {
        const { library } = turnScope(ctx);
        const status = await loadStatus(ctx.userId, { library });
        const index = status.index || {};
        const hint =
          status.hint ||
          (status.semantic_search_ready === false
            ? 'Embeddings are not ready. Use keyword search (mode=search or lex-only).'
            : undefined);
        const scopes = writingTurnScopes(ctx);
        return jsonToolResult({
          ok: status.ok !== false,
          bound: true,
          pin: ctx.pin,
          pins: scopes.map((scope) => writingScopeLabel(scope)),
          library,
          keyword_search_ready: status.keyword_search_ready ?? index.keyword_search_ready,
          semantic_search_ready: status.semantic_search_ready ?? index.semantic_search_ready,
          hint,
          queue: status.queue ?? index.queue,
          ingest: index.ingest,
          embedding_model: index.embedding_model,
          collections: index.collections,
          contexts: status.contexts ?? index.contexts ?? ctx.contexts,
          ...(status.service ? { service: status.service } : {}),
        });
      } catch {
        try {
          const health = await doHealth();
          return jsonToolResult({
            ok: health.ok,
            bound: true,
            pin: ctx.pin,
            ...(health.service ? { service: health.service } : {}),
          });
        } catch {
          return jsonToolResult({
            ok: false,
            bound: true,
            pin: ctx.pin,
            error: 'Knowledge service is unavailable.',
          });
        }
      }
    },
  };

  const grep: AgentTool = {
    name: 'grep',
    label: 'Search structured documents',
    description:
      'Keyword search across pinned structured folders. Searches each structured folder separately and labels hits with their source (for example public:g3), path, and a short snippet. Do not use this for ordinary folders — use query instead. Never pass user_id.',
    parameters: Type.Object({
      query: Type.String({ description: 'Literal keyword or phrase to find' }),
      path: Type.Optional(
        Type.String({
          description:
            'Optional structured folder or subpath (for example public:g3 or g3/wiki/chapters)',
        }),
      ),
      limit: Type.Optional(Type.Number({ description: '1–50, default 20' })),
      caseInsensitive: Type.Optional(
        Type.Boolean({ description: 'Case-insensitive match. Default true.' }),
      ),
    }),
    execute: async (_id, args) => {
      const ctx = getWritingTurnContext();
      if (!ctx?.userId) return errorResult('No user bound');
      if (!hasKnowledgeScope(ctx)) return errorResult(NO_KNOWLEDGE_SCOPE);
      const rec = asRecord(args);
      const query = typeof rec.query === 'string' ? rec.query.trim() : '';
      if (!query) return errorResult('query is required');
      const rawPath = typeof rec.path === 'string' ? rec.path.trim() : '';
      const selected = wikiGrepTargets(ctx, rawPath || undefined);
      if ('error' in selected) return errorResult(selected.error);
      if (selected.length === 0) return errorResult(NO_WIKI_SCOPE);
      const limitRaw =
        typeof rec.limit === 'number' && Number.isFinite(rec.limit)
          ? Math.floor(rec.limit)
          : 20;
      const limit = Math.min(50, Math.max(1, limitRaw));
      const caseInsensitive =
        rec.caseInsensitive === undefined ? true : rec.caseInsensitive === true;
      const perLimit = splitRetrievalLimit(limit, selected.length);
      const hits: ReturnType<typeof hitsFromSearchResults> = [];
      const sources: string[] = [];
      try {
        for (const target of selected) {
          const source = writingScopeLabel(target);
          sources.push(source);
          const subpath = wikiGrepSubpath(target, rawPath || undefined);
          if (target.wikiRootAbs) {
            const local = grepWikiRoot({
              rootAbs: target.wikiRootAbs,
              query,
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
              query,
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
          query,
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

  return [query, get, multiGet, treeTool, status, grep];
}

