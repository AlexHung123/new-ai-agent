export type AmParseResult =
  | { ok: true; path: string; warnings?: string }
  | { ok: false; error: string };

export function parseAmOutput(text: string): AmParseResult {
  const raw = text || '';
  const success = raw.match(/✓\s+(\S+)/);
  if (success?.[1]) {
    const warnMatch = raw.match(/STE[^\n]*(?:\n.*)*$/);
    const warnings =
      warnMatch && /STE/.test(raw) ? raw.slice(raw.indexOf('STE')).trim() : undefined;
    return { ok: true, path: success[1], warnings };
  }
  const fail = raw.match(/✗[\s\S]*/);
  return {
    ok: false,
    error: (fail?.[0] || raw.trim() || 'am render failed').trim(),
  };
}
