import { Type } from 'typebox';
import type { AgentTool } from '@earendil-works/pi-agent-core';
import {
  getHealth,
  getTree,
  search,
} from '@/lib/knowledge/dochubClient';
import { getDochubMarkdown, type DochubGetResult } from '@/lib/knowledge/dochubGet';
import { mapDochubQueryArgs } from '@/lib/knowledge/dochubQuery';
import { stripQmdMarkdownPath } from '@/lib/knowledge/search';
import { nodeAtPath } from '@/lib/knowledge/tree';
import type { KnowledgeTreeNode } from '@/lib/knowledge/types';
import { clampPathToPin } from '@/lib/knowledge/writingPin';
import { jsonToolResult } from '../runtime/piToolResult';
import { getWritingTurnContext } from '../runtime/writingTurnContext';

export const DOCHUB_TOOL_NAMES = [
  'query',
  'get',
  'multi_get',
  'tree',
  'status',
] as const;

type DochubToolDeps = {
  search?: typeof search;
  getDochubMarkdown?: typeof getDochubMarkdown;
  getHealth?: typeof getHealth;
  getTree?: typeof getTree;
};

function asRecord(args: unknown): Record<string, unknown> {
  return args && typeof args === 'object'
    ? (args as Record<string, unknown>)
    : {};
}

function errorResult(error: string) {
  return jsonToolResult({ ok: false, error });
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

function expandFiles(
  raw: unknown,
  tree: KnowledgeTreeNode | null,
): string[] {
  const out: string[] = [];
  for (const item of parseFilesArg(raw)) {
    if (out.length >= 10) break;
    const glob = lastSegmentGlob(item);
    if (!glob || !tree) {
      out.push(item);
      continue;
    }
    const node = nodeAtPath(tree, glob.folder);
    const children = node?.children || [];
    for (const child of children) {
      if (out.length >= 10) break;
      if (fileMatchesGlob(child, glob.pattern)) {
        out.push(child.path || `${glob.folder}/${child.name}`);
      }
    }
  }
  return out.slice(0, 10);
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
      'Search this user\'s Knowledge library. Prefer structured searches (lex/vec/hyde). The host supplies identity and folder pin; never pass user_id.',
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
    }),
    execute: async (_id, args) => {
      const ctx = getWritingTurnContext();
      if (!ctx?.userId) return errorResult('No user bound');
      const mapped = mapDochubQueryArgs(args);
      if (!mapped.ok) return errorResult(mapped.error);
      const path = clampPathToPin(mapped.path, ctx.pin);
      try {
        const raw = await doSearch(ctx.userId, {
          query: mapped.query,
          mode: mapped.mode,
          limit: mapped.limit,
          ...(path ? { path } : {}),
        });
        const { user_id: _userId, results: rawResults, ...rest } = raw;
        void _userId;
        const results = stripHitFiles(
          Array.isArray(rawResults) ? rawResults : [],
        );
        return jsonToolResult({ ...rest, results, ok: true });
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : String(error),
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
          'Library path, optional :fromLine or :fromLine:maxLines suffix',
      }),
      fromLine: Type.Optional(Type.Number({ description: '1-based start line' })),
      maxLines: Type.Optional(Type.Number({ description: 'Lines to return' })),
    }),
    execute: async (_id, args) => {
      const ctx = getWritingTurnContext();
      if (!ctx?.userId) return errorResult('No user bound');
      const rec = asRecord(args);
      const file = typeof rec.file === 'string' ? rec.file : '';
      if (!file) return errorResult('file is required');
      try {
        return jsonToolResult(
          await doGet({
            userId: ctx.userId,
            tree: ctx.tree,
            pin: ctx.pin,
            mentionedDocuments: ctx.mentionedDocuments,
            file,
            fromLine: rec.fromLine,
            maxLines: rec.maxLines,
          }),
        );
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : String(error),
        );
      }
    },
  };

  const multiGet: AgentTool = {
    name: 'multi_get',
    label: 'Get several knowledge files',
    description:
      'Read markdown for up to 10 Knowledge paths. files may be a comma-separated string, an array, or a last-segment glob like folder/*.md.',
    parameters: Type.Object({
      files: Type.Union([Type.String(), Type.Array(Type.String())]),
    }),
    execute: async (_id, args) => {
      const ctx = getWritingTurnContext();
      if (!ctx?.userId) return errorResult('No user bound');
      const files = expandFiles(asRecord(args).files, ctx.tree);
      const results: DochubGetResult[] = [];
      for (const file of files) {
        try {
          results.push(
            await doGet({
              userId: ctx.userId,
              tree: ctx.tree,
              pin: ctx.pin,
              mentionedDocuments: ctx.mentionedDocuments,
              file,
            }),
          );
        } catch (error) {
          results.push({
            ok: false,
            error: error instanceof Error ? error.message : String(error),
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
      'Return this user\'s Knowledge folder tree, clamped to the host pin.',
    parameters: Type.Object({
      path: Type.Optional(
        Type.String({ description: 'Optional subfolder; clamped to the host pin' }),
      ),
    }),
    execute: async (_id, args) => {
      const ctx = getWritingTurnContext();
      if (!ctx?.userId) return errorResult('No user bound');
      if (!ctx.tree) {
        return errorResult('Knowledge library is unavailable.');
      }
      const rec = asRecord(args);
      const requested =
        typeof rec.path === 'string' ? rec.path : undefined;
      const path = clampPathToPin(requested, ctx.pin) || '';
      const node =
        nodeAtPath(ctx.tree, path) || {
          type: 'dir' as const,
          name: '',
          path: '',
          children: [],
        };
      return jsonToolResult({ ok: true, tree: node });
    },
  };

  const status: AgentTool = {
    name: 'status',
    label: 'Knowledge status',
    description: 'Report pin and Dochub health. Does not return the user id.',
    parameters: Type.Object({}),
    execute: async () => {
      const ctx = getWritingTurnContext();
      if (!ctx?.userId) return errorResult('No user bound');
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
        });
      }
    },
  };

  return [query, get, multiGet, treeTool, status];
}
