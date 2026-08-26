import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  DOCUMENT_SLOTS,
  listAvailableDocuments,
  resolveDocument,
} from './catalog';

describe('document catalog', () => {
  let root: string;
  const prev = process.env.DOCUMENT_FILES_ROOT;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'doc-catalog-'));
    process.env.DOCUMENT_FILES_ROOT = root;
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.DOCUMENT_FILES_ROOT;
    else process.env.DOCUMENT_FILES_ROOT = prev;
    rmSync(root, { recursive: true, force: true });
  });

  it('lists only slots whose directory has AGENTS.md or wiki/', () => {
    mkdirSync(join(root, 'spr'));
    writeFileSync(join(root, 'spr', 'AGENTS.md'), '# spr\n');
    mkdirSync(join(root, 'csr'));
    expect(listAvailableDocuments().map((s) => s.id)).toEqual(['spr']);
  });

  it('includes csr when wiki/ exists', () => {
    mkdirSync(join(root, 'csr', 'wiki'), { recursive: true });
    expect(resolveDocument('csr')?.title).toBe(
      'Civil Service Regulations (CSR)',
    );
  });

  it('returns null for unknown or missing slots', () => {
    expect(resolveDocument('spr')).toBeNull();
    expect(resolveDocument('nope')).toBeNull();
  });

  it('registers every shipped document slot', () => {
    expect(DOCUMENT_SLOTS.map((s) => s.id)).toEqual([
      'spr',
      'csr',
      'acqn',
      'department-it-security',
      'g3',
      'rm-manual',
      's17',
      'sfc',
      'training-guide',
    ]);
  });

  it('keeps titles and descriptions free of Chinese characters', () => {
    const cjk = /[\u3000-\u9fff\uf900-\ufaff]/;
    for (const slot of DOCUMENT_SLOTS) {
      expect(slot.title).not.toMatch(cjk);
      expect(slot.description).not.toMatch(cjk);
    }
  });
});
