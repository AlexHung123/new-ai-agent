import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { AgentFsConfig } from './fsConfig';
import { createAgentFsTools } from './fsTools';

function makeCfg(root: string, overrides: Partial<AgentFsConfig> = {}): AgentFsConfig {
  return {
    enabled: true,
    root,
    adminOnly: false,
    maxReadBytes: 50_000,
    maxLsEntries: 100,
    maxLsDepth: 3,
    maxGrepHits: 20,
    maxGrepFileBytes: 100_000,
    maxFindResults: 50,
    ignoreDirNames: new Set(['node_modules', '.git']),
    ...overrides,
  };
}

describe('createAgentFsTools', () => {
  let root: string;

  afterEach(() => {
    if (root) {
      try {
        rmSync(root, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
    }
  });

  function setupTree() {
    root = mkdtempSync(join(tmpdir(), 'doc-fstools-'));
    mkdirSync(join(root, 'src'));
    mkdirSync(join(root, 'node_modules', 'pkg'), { recursive: true });
    writeFileSync(join(root, 'src', 'a.ts'), 'export const answer = 42;\n', 'utf8');
    writeFileSync(join(root, 'readme.md'), '# Project\nfindme\n', 'utf8');
    writeFileSync(
      join(root, 'node_modules', 'pkg', 'index.js'),
      'secret in node_modules\n',
      'utf8',
    );
    writeFileSync(join(root, 'binary.bin'), Buffer.from([0, 1, 2, 3, 0, 255]));
    return root;
  }

  it('returns empty when disabled or non-admin under adminOnly (global root)', () => {
    setupTree();
    expect(
      createAgentFsTools({
        isAdmin: true,
        config: makeCfg(root, { enabled: false }),
      }),
    ).toEqual([]);
    expect(
      createAgentFsTools({
        isAdmin: false,
        config: makeCfg(root, { adminOnly: true }),
      }),
    ).toEqual([]);
  });

  it('registers when projectRootAbs is set even if global disabled', () => {
    setupTree();
    const tools = createAgentFsTools({
      isAdmin: false,
      config: makeCfg(root, { enabled: false, adminOnly: true }),
      projectRootAbs: root,
    });
    expect(tools.map((t) => t.name)).toEqual([
      'fs_ls',
      'fs_read',
      'fs_grep',
      'fs_find',
    ]);
  });

  it('returns a skipped result when no document root is bound', async () => {
    const tools = createAgentFsTools({
      isAdmin: true,
      config: makeCfg('/tmp/unused', { enabled: false }),
      getProjectRootAbs: () => undefined,
    });
    const ls = tools.find((t) => t.name === 'fs_ls')!;
    const out = await ls.execute('1', { path: '.' });
    expect(out.content[0]!.text).toMatch(/No folder bound/);
    expect(out.details.skipped).toBe(true);
  });

  it('fs_ls lists files and skips node_modules content walk', async () => {
    setupTree();
    const tools = createAgentFsTools({
      isAdmin: true,
      config: makeCfg(root),
      projectRootAbs: root,
    });
    const ls = tools.find((t) => t.name === 'fs_ls')!;
    const out = await ls.execute('1', { path: '.', depth: 2 });
    const text = out.content[0]!.text;
    expect(text).toMatch(/readme\.md/);
    expect(text).toMatch(/src\//);
    expect(text).toMatch(/node_modules/);
    expect(text).not.toMatch(/secret in node_modules/);
  });

  it('fs_read returns file body and blocks escape', async () => {
    setupTree();
    const tools = createAgentFsTools({
      isAdmin: true,
      config: makeCfg(root),
      projectRootAbs: root,
    });
    const read = tools.find((t) => t.name === 'fs_read')!;
    const ok = await read.execute('1', { path: 'src/a.ts' });
    expect(ok.content[0]!.text).toMatch(/answer = 42/);
    expect(ok.details.ok).toBe(true);

    const outside = join(tmpdir(), 'doc-secret-read.txt');
    writeFileSync(outside, 'topsecret', 'utf8');
    try {
      const bad = await read.execute('1', { path: outside });
      expect(bad.details.ok).toBe(false);
      expect(bad.content[0]!.text).toMatch(/escapes|not found/i);
    } finally {
      rmSync(outside, { force: true });
    }
  });

  it('fs_read refuses binary files', async () => {
    setupTree();
    const tools = createAgentFsTools({
      isAdmin: true,
      config: makeCfg(root),
      projectRootAbs: root,
    });
    const read = tools.find((t) => t.name === 'fs_read')!;
    const bad = await read.execute('1', { path: 'binary.bin' });
    expect(bad.details.ok).toBe(false);
    expect(bad.content[0]!.text).toMatch(/binary/i);
  });

  it('fs_grep finds lines and skips ignored dirs', async () => {
    setupTree();
    const tools = createAgentFsTools({
      isAdmin: true,
      config: makeCfg(root),
      projectRootAbs: root,
    });
    const grep = tools.find((t) => t.name === 'fs_grep')!;
    const hit = await grep.execute('1', { query: 'findme' });
    expect(hit.details.hitCount).toBeGreaterThanOrEqual(1);
    expect(hit.content[0]!.text).toMatch(/readme\.md/);

    const nm = await grep.execute('1', { query: 'secret in node_modules' });
    expect(nm.details.hitCount).toBe(0);
  });

  it('fs_find matches basename globs', async () => {
    setupTree();
    const tools = createAgentFsTools({
      isAdmin: true,
      config: makeCfg(root),
      projectRootAbs: root,
    });
    const find = tools.find((t) => t.name === 'fs_find')!;
    const out = await find.execute('1', { pattern: '*.ts' });
    expect(out.details.resultCount).toBeGreaterThanOrEqual(1);
    expect(out.content[0]!.text).toMatch(/a\.ts/);
  });
});
