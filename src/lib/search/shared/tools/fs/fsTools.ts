/**
 * Read-only chrooted project FS tools for agent workspace mode:
 * fs_ls, fs_read, fs_grep, fs_find.
 */

import {
  readdirSync,
  readFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { Type } from 'typebox';
import {
  getAgentFsConfig,
  type AgentFsConfig,
} from './fsConfig';
import {
  lstatKind,
  resolveFsPath,
  shouldIgnoreDirName,
} from './fsPath';
import { getWritingTurnContext } from '../../runtime/writingTurnContext';
import { getReadingTurnContext } from '../../runtime/readingTurnContext';
import {
  mergeFsReadRange,
  parseFsReadLocator,
} from './fsReadLocator';

/** Minimal tool shape matching agent.tools AppAgentTool. */
export type FsAgentTool = {
  name: string;
  label: string;
  description: string;
  parameters: unknown;
  execute: (
    toolCallId: string,
    params: Record<string, unknown>,
  ) => Promise<{
    content: Array<{ type: 'text'; text: string }>;
    details: Record<string, unknown>;
  }>;
};

function textResult(
  text: string,
  details: Record<string, unknown>,
): {
  content: Array<{ type: 'text'; text: string }>;
  details: Record<string, unknown>;
} {
  return {
    content: [{ type: 'text' as const, text }],
    details,
  };
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function looksLikeTextBuffer(buf: Buffer): boolean {
  if (buf.length === 0) return true;
  const sample = buf.subarray(0, Math.min(buf.length, 8192));
  if (sample.includes(0)) return false;
  let printable = 0;
  for (let i = 0; i < sample.length; i++) {
    const b = sample[i]!;
    if (b === 9 || b === 10 || b === 13 || (b >= 32 && b !== 127) || b >= 0x80) {
      printable++;
    }
  }
  return printable / sample.length >= 0.85;
}

function bufferToUtf8(buf: Buffer): string {
  if (
    buf.length >= 3 &&
    buf[0] === 0xef &&
    buf[1] === 0xbb &&
    buf[2] === 0xbf
  ) {
    return buf.subarray(3).toString('utf8');
  }
  return buf.toString('utf8');
}

function matchGlob(name: string, pattern: string): boolean {
  // Simple glob: * and ? only, case-insensitive on Windows-ish paths
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

function splitTextLines(text: string): string[] {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  if (normalized === '') return [];
  const lines = normalized.split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  return lines;
}

function numberLines(lines: string[], startLine: number, width: number): string {
  return lines
    .map((line, i) => `${String(startLine + i).padStart(width, ' ')}|${line}`)
    .join('\n');
}

function fitNumberedLines(
  lines: string[],
  startLine: number,
  width: number,
  maxBytes: number,
): { body: string; used: number; byteTruncated: boolean } {
  if (lines.length === 0) {
    return { body: '', used: 0, byteTruncated: false };
  }
  let used = lines.length;
  let body = numberLines(lines.slice(0, used), startLine, width);
  while (used > 1 && Buffer.byteLength(body, 'utf8') > maxBytes) {
    used -= 1;
    body = numberLines(lines.slice(0, used), startLine, width);
  }
  if (Buffer.byteLength(body, 'utf8') <= maxBytes) {
    return { body, used, byteTruncated: used < lines.length };
  }
  const slice = Buffer.from(body, 'utf8').subarray(0, maxBytes).toString('utf8');
  return { body: slice, used: 1, byteTruncated: true };
}

export function writingFsReadOverlay(cfg?: AgentFsConfig): {
  description: string;
  parameters: unknown;
} {
  const c = cfg ?? getAgentFsConfig();
  const unlimited = c.maxReadLines <= 0;
  const lineGuide = unlimited
    ? 'Default is the whole file. Optional fromLine (1-based) and maxLines, or path:fromLine:maxLines (e.g. "dir/part-01.md:142:40").'
    : `Pass fromLine (1-based) and maxLines, or a path suffix path:fromLine:maxLines (e.g. "dir/part-01.md:142:40"). Lines are numbered. Defaults to the first ${c.maxReadLines} lines — do not load a whole large file; fs_grep first, then peek around the hit.`;
  return {
    description:
      `Read a text file (read-only). Path is relative to project root. ${lineGuide} ` +
      `Binary files are rejected. Also capped by byte size.`,
    parameters: Type.Object({
      path: Type.String({
        description:
          'Relative file path under project root. Optional suffix :fromLine or :fromLine:maxLines',
      }),
      fromLine: Type.Optional(
        Type.Number({
          description: '1-based start line (overrides a path suffix). Default 1',
        }),
      ),
      maxLines: Type.Optional(
        Type.Number({
          description: unlimited
            ? 'Lines to return (omit to read the rest of the file)'
            : `Lines to return (default/hard max ${c.maxReadLines})`,
        }),
      ),
      maxBytes: Type.Optional(
        Type.Number({
          description: `Max bytes to return (default/hard max ${c.maxReadBytes})`,
        }),
      ),
    }),
  };
}

function noRootResult(tool: string) {
  const message =
    'No folder bound for this turn.';
  return {
    content: [{ type: 'text' as const, text: message }],
    details: { ok: false, path: tool, message, skipped: true },
  };
}

export function createAgentFsTools(opts: {
  /** When adminOnly and user is not admin, return empty list for global root. */
  isAdmin: boolean;
  config?: AgentFsConfig;
  /**
   * Lazy project root (preferred). Called on each execute so pooled agents
   * pick up the conversation's project chroot.
   */
  getProjectRootAbs?: () => string | undefined;
  /** Static project root (tests). */
  projectRootAbs?: string;
}): FsAgentTool[] {
  const base = opts.config ?? getAgentFsConfig();
  const hasProjectGetter =
    typeof opts.getProjectRootAbs === 'function' ||
    Boolean((opts.projectRootAbs || '').trim());

  // Always register when project getter is provided (Workspace product).
  // Legacy global root: only if AGENT_FS_ENABLED + root + admin gate.
  if (!hasProjectGetter) {
    if (!base.enabled || !base.root) return [];
    if (base.adminOnly && !opts.isAdmin) return [];
  }

  const resolveRoot = (): string | null => {
    const fromGetter = opts.getProjectRootAbs?.()?.trim();
    if (fromGetter) return fromGetter;
    const staticRoot = (opts.projectRootAbs || '').trim();
    if (staticRoot) return staticRoot;
    if (base.enabled && base.root) return base.root;
    return null;
  };

  const cfg = base;

  const fsLs: FsAgentTool = {
    name: 'fs_ls',
    label: 'List directory',
    description:
      'List files and directories under the chrooted project FS root (read-only). Path is relative to the project root (use "." for root). Skips node_modules/.git/dist by default. Prefer this before fs_read/fs_grep when exploring structure.',
    parameters: Type.Object({
      path: Type.Optional(
        Type.String({
          description: 'Relative path under project root (default ".")',
        }),
      ),
      depth: Type.Optional(
        Type.Number({
          description: `Recursion depth (0=this dir only). Default 1, max ${cfg.maxLsDepth}`,
        }),
      ),
    }),
    execute: async (_id, params) => {
      const root = resolveRoot();
      if (!root) return noRootResult('fs_ls');
      const pathArg =
        typeof params.path === 'string' ? params.path : '.';
      const depthRaw =
        typeof params.depth === 'number' && Number.isFinite(params.depth)
          ? Math.floor(params.depth)
          : 1;
      const depth = Math.min(cfg.maxLsDepth, Math.max(0, depthRaw));

      const resolved = resolveFsPath(root, pathArg);
      if (!resolved.ok) {
        return textResult(resolved.message, {
          ok: false,
          path: 'fs_ls',
          message: resolved.message,
        });
      }
      if (!resolved.isDirectory) {
        const msg = `Not a directory: ${resolved.rel}`;
        return textResult(msg, {
          ok: false,
          path: 'fs_ls',
          message: msg,
          rel: resolved.rel,
        });
      }

      type Entry = { rel: string; kind: string; size?: number };
      const entries: Entry[] = [];
      let truncated = false;

      const walk = (absDir: string, relDir: string, d: number) => {
        if (entries.length >= cfg.maxLsEntries) {
          truncated = true;
          return;
        }
        let names: string[];
        try {
          names = readdirSync(absDir);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          entries.push({ rel: relDir || '.', kind: `error:${message}` });
          return;
        }
        names.sort((a, b) => a.localeCompare(b));
        for (const name of names) {
          if (entries.length >= cfg.maxLsEntries) {
            truncated = true;
            return;
          }
          const abs = join(absDir, name);
          const rel =
            !relDir || relDir === '.'
              ? name
              : `${relDir.replace(/\\/g, '/')}/${name}`;
          const kind = lstatKind(abs);
          if (kind === 'dir') {
            if (shouldIgnoreDirName(name, cfg.ignoreDirNames)) {
              entries.push({ rel: rel + '/', kind: 'dir(skipped)' });
              continue;
            }
            entries.push({ rel: rel + '/', kind: 'dir' });
            if (d > 0) walk(abs, rel, d - 1);
          } else if (kind === 'file') {
            try {
              const st = resolveFsPath(root, rel);
              entries.push({
                rel,
                kind: 'file',
                size: st.ok ? st.size : undefined,
              });
            } catch {
              entries.push({ rel, kind: 'file' });
            }
          } else if (kind === 'symlink') {
            entries.push({ rel, kind: 'symlink' });
          }
        }
      };

      walk(resolved.abs, resolved.rel === '.' ? '' : resolved.rel, depth);

      const lines = [
        `fs_ls root=${root}`,
        `path=${resolved.rel} depth=${depth}`,
        `entries=${entries.length}${truncated ? ' (truncated)' : ''}`,
        '',
        ...entries.map((e) => {
          const size =
            e.kind === 'file' && typeof e.size === 'number'
              ? ` ${e.size}b`
              : '';
          return `${e.kind.padEnd(14)} ${e.rel}${size}`;
        }),
      ];
      return textResult(lines.join('\n'), {
        ok: true,
        path: 'fs_ls',
        rel: resolved.rel,
        entryCount: entries.length,
        truncated,
        entries: entries.slice(0, 100),
      });
    },
  };

  const fsRead: FsAgentTool = {
    name: 'fs_read',
    label: 'Read file',
    description:
      'Read a text file under the chrooted project FS root (read-only). Path is relative to project root. Binary files are rejected. Output is hard-capped by size.',
    parameters: Type.Object({
      path: Type.String({
        description: 'Relative file path under project root',
      }),
      maxBytes: Type.Optional(
        Type.Number({
          description: `Max bytes to return (default/hard max ${cfg.maxReadBytes})`,
        }),
      ),
    }),
    execute: async (_id, params) => {
      const root = resolveRoot();
      if (!root) return noRootResult('fs_read');
      const pathArg = String(params.path || '').trim();
      if (!pathArg) {
        return textResult('fs_read requires path', {
          ok: false,
          path: 'fs_read',
          message: 'path required',
        });
      }
      const writingPeek = Boolean(
        getWritingTurnContext() || getReadingTurnContext(),
      );
      const locator = writingPeek
        ? parseFsReadLocator(pathArg)
        : { path: pathArg };
      if (!locator.path) {
        return textResult('fs_read requires path', {
          ok: false,
          path: 'fs_read',
          message: 'path required',
        });
      }
      const maxBytes =
        typeof params.maxBytes === 'number' && Number.isFinite(params.maxBytes)
          ? Math.min(cfg.maxReadBytes, Math.max(1, Math.floor(params.maxBytes)))
          : cfg.maxReadBytes;

      const resolved = resolveFsPath(root, locator.path);
      if (!resolved.ok) {
        return textResult(resolved.message, {
          ok: false,
          path: 'fs_read',
          message: resolved.message,
        });
      }
      if (!resolved.isFile) {
        const msg = `Not a file: ${resolved.rel}`;
        return textResult(msg, {
          ok: false,
          path: 'fs_read',
          message: msg,
          rel: resolved.rel,
        });
      }

      let buf: Buffer;
      try {
        buf = readFileSync(resolved.abs);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return textResult(`Failed to read ${resolved.rel}: ${message}`, {
          ok: false,
          path: 'fs_read',
          message,
          rel: resolved.rel,
        });
      }

      if (!looksLikeTextBuffer(buf)) {
        const msg = `Refusing binary file: ${resolved.rel} (${buf.length} bytes)`;
        return textResult(msg, {
          ok: false,
          path: 'fs_read',
          message: msg,
          rel: resolved.rel,
          binary: true,
          size: buf.length,
        });
      }

      if (!writingPeek) {
        const truncated = buf.length > maxBytes;
        const slice = truncated ? buf.subarray(0, maxBytes) : buf;
        const body = bufferToUtf8(slice);
        const header = [
          `fs_read path=${resolved.rel}`,
          `size=${buf.length} returned=${slice.length}${truncated ? ' (truncated)' : ''}`,
          '',
        ].join('\n');
        return textResult(header + body, {
          ok: true,
          path: 'fs_read',
          rel: resolved.rel,
          size: buf.length,
          returnedBytes: slice.length,
          truncated,
        });
      }

      const { fromLine, maxLines } = mergeFsReadRange({
        locator,
        fromLine: params.fromLine,
        maxLines: params.maxLines,
        maxReadLines: cfg.maxReadLines,
      });
      const allLines = splitTextLines(bufferToUtf8(buf));
      const totalLines = allLines.length;
      if (fromLine > totalLines) {
        const msg =
          totalLines === 0
            ? `File is empty: ${resolved.rel}`
            : `fromLine ${fromLine} is past end of file (${totalLines} lines). Use fromLine 1–${totalLines}.`;
        return textResult(msg, {
          ok: false,
          path: 'fs_read',
          rel: resolved.rel,
          message: msg,
          fromLine,
          totalLines,
        });
      }

      const startIdx = fromLine - 1;
      const ranged = allLines.slice(startIdx, startIdx + maxLines);
      const width = String(totalLines).length;
      const fitted = fitNumberedLines(ranged, fromLine, width, maxBytes);
      const toLine = fromLine + fitted.used - 1;
      const lineTruncated = startIdx + fitted.used < totalLines;
      const truncated = lineTruncated || fitted.byteTruncated;
      const nextFromLine = truncated ? toLine + 1 : undefined;
      const rangeLabel = `lines=${fromLine}-${toLine}/${totalLines}`;
      const header = [`fs_read path=${resolved.rel} ${rangeLabel}`, ''].join('\n');
      const body = fitted.body;
      return textResult(header + body, {
        ok: true,
        path: 'fs_read',
        rel: resolved.rel,
        size: buf.length,
        returnedBytes: Buffer.byteLength(body, 'utf8'),
        truncated,
        fromLine,
        toLine,
        totalLines,
        ...(nextFromLine !== undefined ? { nextFromLine } : {}),
      });
    },
  };

  const fsGrep: FsAgentTool = {
    name: 'fs_grep',
    label: 'Grep project files',
    description:
      'Search text files under the chrooted project FS for a literal substring or regex (read-only). Skips ignored dirs and large/binary files. Prefer fs_ls/fs_find to narrow path first on large trees.',
    parameters: Type.Object({
      query: Type.String({
        description: 'Literal substring (default) or regex if useRegex=true',
      }),
      path: Type.Optional(
        Type.String({
          description: 'Subdirectory or file under project root (default ".")',
        }),
      ),
      useRegex: Type.Optional(
        Type.Boolean({
          description: 'Treat query as JavaScript RegExp. Default false.',
        }),
      ),
      caseInsensitive: Type.Optional(
        Type.Boolean({
          description: 'Case-insensitive match. Default true.',
        }),
      ),
      maxHits: Type.Optional(
        Type.Number({
          description: `Max matches (default ${cfg.maxGrepHits})`,
        }),
      ),
    }),
    execute: async (_id, params) => {
      const root = resolveRoot();
      if (!root) return noRootResult('fs_grep');
      const query = String(params.query || '').trim();
      if (!query) {
        return textResult('fs_grep requires query', {
          ok: false,
          path: 'fs_grep',
          message: 'query required',
        });
      }
      const pathArg =
        typeof params.path === 'string' ? params.path : '.';
      const useRegex = params.useRegex === true;
      const caseInsensitive =
        params.caseInsensitive === undefined
          ? true
          : params.caseInsensitive === true;
      const maxHits =
        typeof params.maxHits === 'number' && Number.isFinite(params.maxHits)
          ? Math.min(cfg.maxGrepHits, Math.max(1, Math.floor(params.maxHits)))
          : cfg.maxGrepHits;

      let re: RegExp;
      try {
        const source = useRegex ? query : escapeRegExp(query);
        re = new RegExp(source, caseInsensitive ? 'i' : '');
      } catch {
        return textResult(`Invalid regular expression: ${query}`, {
          ok: false,
          path: 'fs_grep',
          message: 'invalid regex',
        });
      }

      const resolved = resolveFsPath(root, pathArg);
      if (!resolved.ok) {
        return textResult(resolved.message, {
          ok: false,
          path: 'fs_grep',
          message: resolved.message,
        });
      }

      type Hit = { rel: string; line: number; text: string };
      const hits: Hit[] = [];
      let truncated = false;
      let filesScanned = 0;

      const scanFile = (abs: string, rel: string) => {
        if (hits.length >= maxHits) {
          truncated = true;
          return;
        }
        let buf: Buffer;
        try {
          buf = readFileSync(abs);
        } catch {
          return;
        }
        if (buf.length > cfg.maxGrepFileBytes) return;
        if (!looksLikeTextBuffer(buf)) return;
        filesScanned++;
        const text = bufferToUtf8(buf);
        const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
        for (let i = 0; i < lines.length; i++) {
          const lineText = lines[i] ?? '';
          if (!re.test(lineText)) continue;
          re.lastIndex = 0;
          hits.push({
            rel,
            line: i + 1,
            text: lineText.length > 400 ? `${lineText.slice(0, 400)}…` : lineText,
          });
          if (hits.length >= maxHits) {
            truncated = true;
            return;
          }
        }
      };

      const walk = (absDir: string, relDir: string) => {
        if (hits.length >= maxHits) {
          truncated = true;
          return;
        }
        let names: string[];
        try {
          names = readdirSync(absDir);
        } catch {
          return;
        }
        for (const name of names) {
          if (hits.length >= maxHits) {
            truncated = true;
            return;
          }
          const abs = join(absDir, name);
          const rel =
            !relDir || relDir === '.'
              ? name
              : `${relDir.replace(/\\/g, '/')}/${name}`;
          const kind = lstatKind(abs);
          if (kind === 'dir') {
            if (shouldIgnoreDirName(name, cfg.ignoreDirNames)) continue;
            // Stay inside root via resolve on each step
            const child = resolveFsPath(root, rel);
            if (child.ok && child.isDirectory) walk(child.abs, child.rel);
          } else if (kind === 'file') {
            const child = resolveFsPath(root, rel);
            if (child.ok && child.isFile) scanFile(child.abs, child.rel);
          }
        }
      };

      if (resolved.isFile) {
        scanFile(resolved.abs, resolved.rel);
      } else if (resolved.isDirectory) {
        walk(resolved.abs, resolved.rel === '.' ? '' : resolved.rel);
      }

      const header = [
        `fs_grep path=${resolved.rel}`,
        `query=${JSON.stringify(query)}${useRegex ? ' (regex)' : ' (literal)'}${caseInsensitive ? ' i' : ''}`,
        `hits=${hits.length}${truncated ? ' (truncated)' : ''} filesScanned=${filesScanned}`,
        '',
      ].join('\n');
      const body =
        hits.length === 0
          ? 'No matches.'
          : hits.map((h) => `${h.rel}:${h.line}: ${h.text}`).join('\n');

      return textResult(header + body, {
        ok: true,
        path: 'fs_grep',
        rel: resolved.rel,
        query,
        hitCount: hits.length,
        truncated,
        filesScanned,
        hits: hits.slice(0, 50),
      });
    },
  };

  const fsFind: FsAgentTool = {
    name: 'fs_find',
    label: 'Find paths',
    description:
      'Find files/directories under the chrooted project FS by name glob (e.g. "*.ts", "package.json"). Read-only. Skips ignored dirs.',
    parameters: Type.Object({
      pattern: Type.String({
        description: 'Basename glob (* and ?). Example: "*.tsx", "README*"',
      }),
      path: Type.Optional(
        Type.String({
          description: 'Subdirectory under project root (default ".")',
        }),
      ),
      maxResults: Type.Optional(
        Type.Number({
          description: `Max results (default ${cfg.maxFindResults})`,
        }),
      ),
    }),
    execute: async (_id, params) => {
      const root = resolveRoot();
      if (!root) return noRootResult('fs_find');
      const pattern = String(params.pattern || '').trim();
      if (!pattern) {
        return textResult('fs_find requires pattern', {
          ok: false,
          path: 'fs_find',
          message: 'pattern required',
        });
      }
      const pathArg =
        typeof params.path === 'string' ? params.path : '.';
      const maxResults =
        typeof params.maxResults === 'number' &&
        Number.isFinite(params.maxResults)
          ? Math.min(
              cfg.maxFindResults,
              Math.max(1, Math.floor(params.maxResults)),
            )
          : cfg.maxFindResults;

      const resolved = resolveFsPath(root, pathArg);
      if (!resolved.ok) {
        return textResult(resolved.message, {
          ok: false,
          path: 'fs_find',
          message: resolved.message,
        });
      }
      if (!resolved.isDirectory && !resolved.isFile) {
        return textResult(`Path not found: ${pathArg}`, {
          ok: false,
          path: 'fs_find',
          message: 'not found',
        });
      }

      const found: Array<{ rel: string; kind: string }> = [];
      let truncated = false;

      const consider = (rel: string, kind: string, base: string) => {
        if (matchGlob(base, pattern)) {
          found.push({ rel, kind });
          if (found.length >= maxResults) truncated = true;
        }
      };

      if (resolved.isFile) {
        const base = resolved.rel.split('/').pop() || resolved.rel;
        consider(resolved.rel, 'file', base);
      } else {
        const walk = (absDir: string, relDir: string) => {
          if (found.length >= maxResults) {
            truncated = true;
            return;
          }
          let names: string[];
          try {
            names = readdirSync(absDir);
          } catch {
            return;
          }
          for (const name of names) {
            if (found.length >= maxResults) {
              truncated = true;
              return;
            }
            const abs = join(absDir, name);
            const rel =
              !relDir || relDir === '.'
                ? name
                : `${relDir.replace(/\\/g, '/')}/${name}`;
            const kind = lstatKind(abs);
            if (kind === 'dir') {
              if (shouldIgnoreDirName(name, cfg.ignoreDirNames)) continue;
              consider(rel + '/', 'dir', name);
              if (found.length >= maxResults) {
                truncated = true;
                return;
              }
              const child = resolveFsPath(root, rel);
              if (child.ok && child.isDirectory) walk(child.abs, child.rel);
            } else if (kind === 'file') {
              consider(rel, 'file', name);
            }
          }
        };
        walk(resolved.abs, resolved.rel === '.' ? '' : resolved.rel);
      }

      const header = [
        `fs_find path=${resolved.rel} pattern=${JSON.stringify(pattern)}`,
        `results=${found.length}${truncated ? ' (truncated)' : ''}`,
        '',
      ].join('\n');
      const body =
        found.length === 0
          ? 'No matches.'
          : found.map((f) => `${f.kind.padEnd(6)} ${f.rel}`).join('\n');

      return textResult(header + body, {
        ok: true,
        path: 'fs_find',
        rel: resolved.rel,
        pattern,
        resultCount: found.length,
        truncated,
        results: found.slice(0, 100),
      });
    },
  };

  return [fsLs, fsRead, fsGrep, fsFind];
}
