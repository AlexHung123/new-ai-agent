import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { htmlOwnerRoot, htmlPageAbs } from './paths';
import { htmlPageHref } from './pageLink';
import { parseAmOutput } from './parseAmOutput';
import { rewriteMermaidFences } from './mermaidToFlow';
import { saveHtmlPage } from './store';

export type AmRunResult = {
  stdout: string;
  stderr: string;
  code: number;
};

export type AmRunner = (opts: {
  draft: string;
  outAbs: string;
  amHome: string;
}) => Promise<AmRunResult>;

export type RenderHtmlResult =
  | { ok: true; pageId: string; href: string; warnings?: string }
  | { ok: false; error: string };

const RENDER_TIMEOUT_MS = 15_000;

export function newHtmlPageId(): string {
  return randomBytes(8).toString('hex');
}

export function amCliPath(): string {
  return join(
    process.cwd(),
    'vendor',
    'answer-me-with-html',
    'scripts',
    'am.mjs',
  );
}

export async function spawnAmRender(opts: {
  draft: string;
  outAbs: string;
  amHome: string;
}): Promise<AmRunResult> {
  mkdirSync(dirname(opts.outAbs), { recursive: true });
  mkdirSync(opts.amHome, { recursive: true });
  writeFileSync(
    join(opts.amHome, 'config.json'),
    JSON.stringify({ open: 'off', update_check: 'off' }),
    'utf8',
  );

  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [amCliPath(), 'render', '-', '-o', opts.outAbs, '--no-open'],
      {
        env: { ...process.env, AM_HOME: opts.amHome },
        windowsHide: true,
      },
    );
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('am render timed out'));
    }, RENDER_TIMEOUT_MS);
    child.stdout?.on('data', (chunk) => {
      stdout += String(chunk);
    });
    child.stderr?.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, code: code ?? 1 });
    });
    child.stdin?.end(opts.draft, 'utf8');
  });
}

export async function renderHtmlDraft(opts: {
  userId: string;
  draft: string;
  pageId?: string;
  runAm?: AmRunner;
}): Promise<RenderHtmlResult> {
  const draft = (opts.draft || '').trim();
  if (!draft) return { ok: false, error: 'Draft is empty' };
  const rewritten = rewriteMermaidFences(draft);
  const pageId = opts.pageId || newHtmlPageId();
  const outAbs = htmlPageAbs(opts.userId, pageId);
  const amHome = htmlOwnerRoot(opts.userId);
  mkdirSync(dirname(outAbs), { recursive: true });
  const run = opts.runAm ?? spawnAmRender;
  let ran: AmRunResult;
  try {
    ran = await run({ draft: rewritten.draft, outAbs, amHome });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
  const parsed = parseAmOutput(`${ran.stdout}\n${ran.stderr}`);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  let html: string;
  try {
    html = readFileSync(outAbs, 'utf8');
  } catch {
    try {
      html = readFileSync(parsed.path, 'utf8');
    } catch {
      return { ok: false, error: 'am render produced no HTML file' };
    }
  }
  saveHtmlPage({ userId: opts.userId, pageId, html });
  const warnings = [rewritten.warnings.join('\n'), parsed.warnings]
    .filter(Boolean)
    .join('\n');
  return {
    ok: true,
    pageId,
    href: htmlPageHref(pageId),
    warnings: warnings || undefined,
  };
}
