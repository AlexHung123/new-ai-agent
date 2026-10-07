import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runWithHtmlTurn } from '@/lib/html/htmlTurnContext';
import { createAmRenderTool } from './amRenderTool';

describe('createAmRenderTool', () => {
  const prev = process.env.HTML_PAGES_ROOT;
  let root: string | undefined;

  afterEach(() => {
    if (prev === undefined) delete process.env.HTML_PAGES_ROOT;
    else process.env.HTML_PAGES_ROOT = prev;
    if (root) rmSync(root, { recursive: true, force: true });
  });

  it('renders a draft and returns the page href', async () => {
    root = mkdtempSync(join(tmpdir(), 'amtool-'));
    process.env.HTML_PAGES_ROOT = root;
    const tool = createAmRenderTool({
      runAm: async ({ outAbs }) => {
        writeFileSync(outAbs, '<html><body>ok</body></html>', 'utf8');
        return { stdout: `✓ ${outAbs}\n`, stderr: '', code: 0 };
      },
    });
    const result = await runWithHtmlTurn({ userId: '42', htmlMode: true }, () =>
      tool.execute('t1', {
        draft: '---\ntitle: Test\n---\n## A Panel\nHi\n',
      }),
    );
    const first = result.content[0];
    const text = first && 'text' in first ? first.text : '';
    expect(text).toMatch(/\/itms\/ai\/api\/html-pages\//);
    expect(result.details).toMatchObject({ ok: true });
  });

  it('errors when HTML mode context is missing', async () => {
    const tool = createAmRenderTool();
    const result = await tool.execute('t1', { draft: 'x' });
    expect(result.details).toMatchObject({ ok: false });
    const first = result.content[0];
    const text = first && 'text' in first ? first.text : '';
    expect(text).toMatch(/HTML mode/i);
  });
});
