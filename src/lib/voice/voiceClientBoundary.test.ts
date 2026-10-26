import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = path.join(__dirname, '..', '..');

const NODE_FS_OR_PATH =
  /(?:from|import)\s+['"](?:node:)?(?:fs(?:\/promises)?|path)['"]|require\(\s*['"](?:node:)?(?:fs(?:\/promises)?|path)['"]/;

function isFile(candidate: string): boolean {
  return existsSync(candidate) && statSync(candidate).isFile();
}

function resolveFile(base: string): string | null {
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
  ];
  return candidates.find((candidate) => isFile(candidate)) ?? null;
}

function resolveSpecifier(fromFile: string, spec: string): string | null {
  if (spec.startsWith('@/')) {
    return resolveFile(path.join(SRC, spec.slice(2)));
  }
  if (spec.startsWith('.')) {
    return resolveFile(path.resolve(path.dirname(fromFile), spec));
  }
  return null;
}

function isTypeOnlyImport(clause: string): boolean {
  const trimmed = clause.trim();
  if (/^type\b/.test(trimmed)) return true;
  const brace = trimmed.match(/\{([\s\S]*)\}/);
  if (!brace) return false;
  const outside = trimmed.replace(/\{[\s\S]*\}/, '').replace(/,/g, '').trim();
  if (outside) return false;
  const names = brace[1]
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
  return names.length > 0 && names.every((name) => /^type\s/.test(name));
}

function valueSpecifiers(source: string): string[] {
  const specs: string[] = [];
  const fromRe =
    /(?:^|\n)\s*(?:import|export)\s+([\s\S]*?)\sfrom\s+['"]([^'"]+)['"]/g;
  for (const match of source.matchAll(fromRe)) {
    if (!isTypeOnlyImport(match[1])) specs.push(match[2]);
  }
  const sideRe = /(?:^|\n)\s*import\s+['"]([^'"]+)['"]/g;
  for (const match of source.matchAll(sideRe)) specs.push(match[1]);
  return specs;
}

function clientNodeBuiltins(entry: string): string[] {
  const found: string[] = [];
  const pending = [entry];
  const seen = new Set<string>();
  while (pending.length) {
    const file = pending.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    const source = readFileSync(file, 'utf8');
    if (NODE_FS_OR_PATH.test(source)) {
      found.push(path.relative(SRC, file).replaceAll('\\', '/'));
    }
    for (const spec of valueSpecifiers(source)) {
      const next = resolveSpecifier(file, spec);
      if (next) pending.push(next);
    }
  }
  return found.sort();
}

describe('voice page client bundle', () => {
  it('does not reach Node fs or path from the voice page', () => {
    const entry = path.join(SRC, 'app', 'voice', 'page.tsx');
    expect(clientNodeBuiltins(entry)).toEqual([]);
  });
});
