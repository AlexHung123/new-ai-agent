import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { resolveFsPath, shouldIgnoreDirName } from './fsPath';

describe('resolveFsPath', () => {
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

  function setup() {
    root = mkdtempSync(join(tmpdir(), 'doc-fs-'));
    mkdirSync(join(root, 'src'));
    mkdirSync(join(root, 'wiki'));
    writeFileSync(join(root, 'src', 'hello.txt'), 'hello world\n', 'utf8');
    writeFileSync(join(root, 'readme.md'), '# hi\n', 'utf8');
    writeFileSync(join(root, 'wiki', 'index.md'), '# index\n', 'utf8');
    return root;
  }

  it('resolves relative paths under root', () => {
    setup();
    const r = resolveFsPath(root, 'src/hello.txt');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.rel.replace(/\\/g, '/')).toBe('src/hello.txt');
    expect(r.isFile).toBe(true);
  });

  it('resolves wiki/index.md', () => {
    setup();
    const r = resolveFsPath(root, 'wiki/index.md');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.isFile).toBe(true);
    expect(r.rel.replace(/\\/g, '/')).toBe('wiki/index.md');
  });

  it('resolves . as root directory', () => {
    setup();
    const r = resolveFsPath(root, '.');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.isDirectory).toBe(true);
    expect(r.rel).toBe('.');
  });

  it('blocks path escape with ..', () => {
    setup();
    const r = resolveFsPath(root, '../../etc/passwd');
    if (r.ok) {
      expect(r.abs.toLowerCase().startsWith(root.toLowerCase())).toBe(true);
    } else {
      expect(r.message).toMatch(/not found|escapes/i);
    }
  });

  it('blocks absolute path outside root', () => {
    setup();
    const outside = join(tmpdir(), 'doc-fs-outside-secret.txt');
    writeFileSync(outside, 'secret', 'utf8');
    try {
      const r = resolveFsPath(root, outside);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.message).toMatch(/escapes/i);
    } finally {
      try {
        rmSync(outside, { force: true });
      } catch {
        /* ignore */
      }
    }
  });

  it('blocks symlink that points outside root when possible', () => {
    setup();
    const outsideDir = mkdtempSync(join(tmpdir(), 'doc-fs-out-'));
    writeFileSync(join(outsideDir, 'secret.txt'), 'nope', 'utf8');
    const linkPath = join(root, 'escape-link');
    try {
      symlinkSync(outsideDir, linkPath, 'junction');
    } catch {
      rmSync(outsideDir, { recursive: true, force: true });
      return;
    }
    try {
      const r = resolveFsPath(root, 'escape-link/secret.txt');
      if (r.ok) {
        expect(r.abs.toLowerCase().startsWith(root.toLowerCase())).toBe(true);
      } else {
        expect(r.message.length).toBeGreaterThan(0);
      }
    } finally {
      try {
        rmSync(linkPath, { force: true, recursive: true });
      } catch {
        /* ignore */
      }
      rmSync(outsideDir, { recursive: true, force: true });
    }
  });

  it('shouldIgnoreDirName', () => {
    const ignore = new Set(['node_modules', '.git']);
    expect(shouldIgnoreDirName('node_modules', ignore)).toBe(true);
    expect(shouldIgnoreDirName('src', ignore)).toBe(false);
  });
});
