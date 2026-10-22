import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readDocumentFile } from './readDocumentFile';

describe('readDocumentFile', () => {
  let root: string;
  const prev = process.env.DOCUMENT_FILES_ROOT;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'doc-file-'));
    process.env.DOCUMENT_FILES_ROOT = root;
    mkdirSync(join(root, 'spr'));
    writeFileSync(
      join(root, 'spr', 'AGENTS.md'),
      '# SPR wiki\n\nYou are the maintainer.\n',
    );
    mkdirSync(join(root, 'spr', 'wiki'));
    writeFileSync(join(root, 'spr', 'wiki', 'index.md'), '# Index\n');
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.DOCUMENT_FILES_ROOT;
    else process.env.DOCUMENT_FILES_ROOT = prev;
    rmSync(root, { recursive: true, force: true });
  });

  it('reads AGENTS.md by default', () => {
    const result = readDocumentFile('spr');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.path).toBe('AGENTS.md');
    expect(result.language).toBe('markdown');
    expect(result.content).toContain('SPR wiki');
  });

  it('reads a nested wiki page', () => {
    const result = readDocumentFile('spr', 'wiki/index.md');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.path).toBe('wiki/index.md');
    expect(result.content).toContain('# Index');
  });

  it('rejects unknown documents and path escape', () => {
    expect(readDocumentFile('nope').ok).toBe(false);
    const escaped = readDocumentFile('spr', '../secret.md');
    expect(escaped.ok).toBe(false);
  });
});
