import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runWithReadingTurn } from '../runtime/readingTurnContext';
import { buildReadingUserPrompt } from './readingTurnPrefix';

describe('buildReadingUserPrompt', () => {
  let root: string;

  afterEach(() => {
    if (root) rmSync(root, { recursive: true, force: true });
  });

  it('marks an unbound turn', () => {
    expect(buildReadingUserPrompt('Summarize')).toContain('[No PDF bound]');
  });

  it('injects INDEX.md for a bound PDF', async () => {
    root = mkdtempSync(join(tmpdir(), 'reading-prefix-'));
    writeFileSync(join(root, 'INDEX.md'), '# paper.pdf\n\n- part-01.md\n', 'utf8');
    const prompt = await runWithReadingTurn(
      {
        userId: 'u1',
        fileId: 'f1',
        title: 'paper.pdf',
        rootAbs: root,
        status: 'ready',
      },
      () => buildReadingUserPrompt('Summarize this'),
    );
    expect(prompt).toContain('[PDF]');
    expect(prompt).toContain('paper.pdf');
    expect(prompt).toContain('part-01.md');
    expect(prompt).toContain('[User question]\nSummarize this');
    expect(prompt).toContain('<!-- page: N -->');
    expect(prompt).toContain('outline.md');
  });
});
