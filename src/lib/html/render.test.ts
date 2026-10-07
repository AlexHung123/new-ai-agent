import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { renderHtmlDraft } from './render';

describe('renderHtmlDraft', () => {
  const prev = process.env.HTML_PAGES_ROOT;
  let root: string | undefined;

  afterEach(() => {
    if (prev === undefined) delete process.env.HTML_PAGES_ROOT;
    else process.env.HTML_PAGES_ROOT = prev;
    if (root) rmSync(root, { recursive: true, force: true });
  });

  it('saves the CLI output file and returns the app href', async () => {
    root = mkdtempSync(join(tmpdir(), 'hrender-'));
    process.env.HTML_PAGES_ROOT = root;
    const result = await renderHtmlDraft({
      userId: '42',
      draft: '---\ntitle: TCP\n---\n## A Hi\nhello\n',
      pageId: 'tcpdemo01',
      runAm: async ({ outAbs, draft }) => {
        expect(draft).toMatch(/title: TCP/);
        writeFileSync(outAbs, '<html><body>page</body></html>', 'utf8');
        return { stdout: `✓ ${outAbs}\n`, stderr: '', code: 0 };
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.href).toBe('/itms/ai/api/html-pages/tcpdemo01');
    expect(result.pageId).toBe('tcpdemo01');
    expect(readFileSync(join(root, '42', 'tcpdemo01.html'), 'utf8')).toMatch(
      /page/,
    );
  });

  it('rewrites mermaid flowchart fences to AM flow before calling the CLI', async () => {
    root = mkdtempSync(join(tmpdir(), 'hrender-'));
    process.env.HTML_PAGES_ROOT = root;
    let seen = '';
    const result = await renderHtmlDraft({
      userId: '42',
      draft: `---
title: Route
---

## A Route
\`\`\`mermaid
flowchart TD
A[Start] --> B{Go?}
B -- yes --> C[Done]
\`\`\`
`,
      pageId: 'mermaid01',
      runAm: async ({ outAbs, draft }) => {
        seen = draft;
        writeFileSync(outAbs, '<html><body>page</body></html>', 'utf8');
        return { stdout: `✓ ${outAbs}\n`, stderr: '', code: 0 };
      },
    });
    expect(result.ok).toBe(true);
    expect(seen).toMatch(/```flow TB/);
    expect(seen).toMatch(/\[Start\] -> \{Go\?\}/);
    expect(seen).not.toMatch(/```mermaid/);
  });

  it('returns the CLI error without writing a page on failure', async () => {
    root = mkdtempSync(join(tmpdir(), 'hrender-'));
    process.env.HTML_PAGES_ROOT = root;
    const result = await renderHtmlDraft({
      userId: '42',
      draft: 'bad',
      pageId: 'failpage1',
      runAm: async () => ({
        stdout: '✗ L1 [flow] unknown node\nCorrect example:\nA -> B\n',
        stderr: '',
        code: 1,
      }),
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/L1/);
  });

  it(
    'renders a draft with the vendored am.mjs CLI',
    async () => {
      root = mkdtempSync(join(tmpdir(), 'hrender-cli-'));
      process.env.HTML_PAGES_ROOT = root;
      const result = await renderHtmlDraft({
        userId: '42',
        draft: `---
title: TCP handshake
---

## A Overview
TCP starts a connection with three steps.

## B Handshake
\`\`\`sequence
Client -> Server: SYN
Server -> Client: SYN-ACK
Client -> Server: ACK
\`\`\`
`,
        pageId: 'clirender',
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.href).toBe('/itms/ai/api/html-pages/clirender');
      const html = readFileSync(join(root, '42', 'clirender.html'), 'utf8');
      expect(html).toMatch(/<html/i);
      expect(html).toMatch(/TCP handshake/);
    },
    20_000,
  );

  it(
    'renders a mermaid flowchart fence as an AM flow diagram',
    async () => {
      root = mkdtempSync(join(tmpdir(), 'hrender-mermaid-cli-'));
      process.env.HTML_PAGES_ROOT = root;
      const result = await renderHtmlDraft({
        userId: '42',
        draft: `---
title: Buy a PC
---

## Route
\`\`\`mermaid
flowchart TD
A[Start] --> B{In stock?}
B -- yes --> C[Use contract]
B -- no --> D[Get quotes]
\`\`\`
`,
        pageId: 'mermaidir',
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const html = readFileSync(join(root, '42', 'mermaidir.html'), 'utf8');
      expect(html).toMatch(/am-diagram am-flow/);
      expect(html).not.toMatch(/data-lang="mermaid"/);
      expect(html).toMatch(/Use contract/);
    },
    20_000,
  );
});
