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
import { runWithWritingTurn } from '../../runtime/writingTurnContext';
import { createAgentFsTools } from './fsTools';

function makeCfg(root: string, overrides: Partial<AgentFsConfig> = {}): AgentFsConfig {
  return {
    enabled: true,
    root,
    adminOnly: false,
    maxReadBytes: 50_000,
    maxReadLines: 80,
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

  it('fs_read peeks by fromLine/maxLines only during a writing turn', async () => {
    setupTree();
    const lines = Array.from({ length: 40 }, (_, i) => `line-${i + 1}`).join('\n');
    writeFileSync(join(root, 'long.md'), `${lines}\n`, 'utf8');
    const tools = createAgentFsTools({
      isAdmin: true,
      config: makeCfg(root, { maxReadLines: 10 }),
      projectRootAbs: root,
    });
    const read = tools.find((t) => t.name === 'fs_read')!;
    const writing = { userId: 'u', rootAbs: root, files: [] };

    const outside = await read.execute('1', { path: 'long.md' });
    expect(outside.details.fromLine).toBeUndefined();
    expect(outside.content[0]!.text).toMatch(/line-40/);
    expect(outside.content[0]!.text).not.toMatch(/1\|line-1/);

    const def = await runWithWritingTurn(writing, () =>
      read.execute('1', { path: 'long.md' }),
    );
    expect(def.details.fromLine).toBe(1);
    expect(def.details.toLine).toBe(10);
    expect(def.details.totalLines).toBe(40);
    expect(def.details.truncated).toBe(true);
    expect(def.details.nextFromLine).toBe(11);
    expect(def.content[0]!.text).toMatch(/ 1\|line-1/);
    expect(def.content[0]!.text).not.toMatch(/line-11/);

    const ranged = await runWithWritingTurn(writing, () =>
      read.execute('1', {
        path: 'long.md',
        fromLine: 20,
        maxLines: 5,
      }),
    );
    expect(ranged.details.fromLine).toBe(20);
    expect(ranged.details.toLine).toBe(24);
    expect(ranged.content[0]!.text).toMatch(/20\|line-20/);
    expect(ranged.content[0]!.text).toMatch(/24\|line-24/);
    expect(ranged.content[0]!.text).not.toMatch(/line-25/);

    const suffix = await runWithWritingTurn(writing, () =>
      read.execute('1', { path: 'long.md:30:3' }),
    );
    expect(suffix.details.fromLine).toBe(30);
    expect(suffix.details.toLine).toBe(32);
    expect(suffix.content[0]!.text).toMatch(/30\|line-30/);
  });

  it('fs_read reads the whole file when writing maxReadLines is 0', async () => {
    setupTree();
    const lines = Array.from({ length: 40 }, (_, i) => `line-${i + 1}`).join('\n');
    writeFileSync(join(root, 'long.md'), `${lines}\n`, 'utf8');
    const tools = createAgentFsTools({
      isAdmin: true,
      config: makeCfg(root, { maxReadLines: 0 }),
      projectRootAbs: root,
    });
    const read = tools.find((t) => t.name === 'fs_read')!;
    const out = await runWithWritingTurn(
      { userId: 'u', rootAbs: root, files: [] },
      () => read.execute('1', { path: 'long.md' }),
    );
    expect(out.details.fromLine).toBe(1);
    expect(out.details.toLine).toBe(40);
    expect(out.details.truncated).toBe(false);
    expect(out.content[0]!.text).toMatch(/40\|line-40/);
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
