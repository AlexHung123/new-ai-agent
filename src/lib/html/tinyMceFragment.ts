function pullHeadAssets(headInner: string): string {
  const styles = headInner.match(/<style\b[^>]*>[\s\S]*?<\/style>/gi) ?? [];
  const scripts = headInner.match(/<script\b[^>]*>[\s\S]*?<\/script>/gi) ?? [];
  return [...styles, ...scripts].join('\n');
}

/** TinyMCE stores body children only. Keep inlined style and script. */
export function toTinyMceBodyFragment(html: string): string {
  const source = html || '';
  const head = source.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);
  const body = source.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  const headAssets = head ? pullHeadAssets(head[1]) : '';
  let inner = body ? body[1] : source;
  inner = inner.replace(/<!DOCTYPE[^>]*>/gi, '');
  inner = inner.replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, '');
  inner = inner.replace(/<\/?(html|head|body)\b[^>]*>/gi, '');
  const combined = [headAssets, inner.trim()].filter(Boolean).join('\n');
  return combined.trim();
}
