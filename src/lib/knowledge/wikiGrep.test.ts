import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  clipSnippet,
  grepWikiRoot,
  hitsFromSearchResults,
  joinWikiHitPath,
  readWikiRootFile,
} from './wikiGrep';

function writeWiki(root: string, rel: string, body: string) {
  const path = join(root, ...rel.split('/'));
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, body, 'utf8');
}

describe('wikiGrep helpers', () => {
  it('greps a local wiki root and ranks compiled pages before chunks', () => {
    const root = mkdtempSync(join(tmpdir(), 'wiki-grep-'));
    writeWiki(root, 'wiki/index.md', '# Index\nSee password policy.\n');
    writeWiki(root, 'wiki/chunks/note.md', 'password appears in a chunk too\n');
    writeWiki(root, 'wiki/chapters/07-access.md', 'Password controls are required.\n');
    writeWiki(root, '.qmd/skip.md', 'password should be ignored\n');

    const hits = grepWikiRoot({
      rootAbs: root,
      query: 'password',
      limit: 10,
    });
    expect('error' in hits).toBe(false);
    if ('error' in hits) return;
    expect(hits.map((hit) => hit.path)).toEqual([
      'wiki/chapters/07-access.md',
      'wiki/index.md',
      'wiki/chunks/note.md',
    ]);
    expect(hits[0]?.snippet).toMatch(/Password controls/i);
    expect(hits[0]?.line).toBe(1);
  });

  it('normalizes search hits and prefixes library paths', () => {
    const hits = hitsFromSearchResults(
      [
        {
          file: 'qmd://markdown/g3/wiki/index.md',
          line: 4,
          snippet: '  Access control  ',
        },
        { path: 's17/wiki/chapters/02.md', text: 'A long '.repeat(80) },
      ],
      'public:g3',
      5,
    );
    expect(hits[0]).toEqual({
      source: 'public:g3',
      path: 'g3/wiki/index.md',
      line: 4,
      snippet: 'Access control',
    });
    expect(hits[1]?.path).toBe('s17/wiki/chapters/02.md');
    expect(hits[1]?.snippet.endsWith('…')).toBe(true);
    expect(clipSnippet('x'.repeat(201)).length).toBe(200);
    expect(joinWikiHitPath('g3', 'wiki/index.md')).toBe('g3/wiki/index.md');
    expect(joinWikiHitPath('g3', 'g3/wiki/index.md')).toBe('g3/wiki/index.md');
  });

  it('reads a local wiki file with numbered lines', () => {
    const root = mkdtempSync(join(tmpdir(), 'wiki-read-'));
    writeWiki(root, 'wiki/index.md', '# Index\nPassword policy.\n');
    const result = readWikiRootFile({
      rootAbs: root,
      rel: 'wiki/index.md',
      fromLine: 2,
      maxLines: 1,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rel).toBe('wiki/index.md');
    expect(result.fromLine).toBe(2);
    expect(result.text).toMatch(/2\|Password policy/);
  });
});
