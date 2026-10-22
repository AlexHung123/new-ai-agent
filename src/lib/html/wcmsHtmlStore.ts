import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { htmlOwnerRoot } from './paths';
import type { WcmsBind } from './wcmsQuery';

export function wcmsWorkingHtmlAbs(
  userId: string,
  bind: WcmsBind,
): string {
  return join(
    htmlOwnerRoot(userId),
    'wcms',
    String(bind.wcmsContentId),
    `${bind.lang}-${bind.pageIndex}.html`,
  );
}

export function readWcmsWorkingHtml(
  userId: string,
  bind: WcmsBind,
): string | null {
  try {
    return readFileSync(wcmsWorkingHtmlAbs(userId, bind), 'utf8');
  } catch {
    return null;
  }
}

function revisionAbs(htmlAbs: string): string {
  return `${htmlAbs}.rev`;
}

export function readWcmsWorkingRevision(
  userId: string,
  bind: WcmsBind,
): number {
  try {
    const raw = readFileSync(
      revisionAbs(wcmsWorkingHtmlAbs(userId, bind)),
      'utf8',
    ).trim();
    const revision = Number(raw);
    if (Number.isInteger(revision) && revision >= 0) return revision;
  } catch {
    /* no working copy yet */
  }
  return 0;
}

export function saveWcmsWorkingHtml(opts: {
  userId: string;
  bind: WcmsBind;
  html: string;
  expectedRevision?: number;
}): { ok: true; revision: number } | { ok: false; revision: number } {
  const current = readWcmsWorkingRevision(opts.userId, opts.bind);
  if (
    opts.expectedRevision != null &&
    opts.expectedRevision !== current
  ) {
    return { ok: false, revision: current };
  }
  const revision = current + 1;
  const abs = wcmsWorkingHtmlAbs(opts.userId, opts.bind);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, opts.html, 'utf8');
  writeFileSync(revisionAbs(abs), String(revision), 'utf8');
  return { ok: true, revision };
}
