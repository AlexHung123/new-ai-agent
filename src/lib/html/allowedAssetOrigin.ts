import { itmsPublicOrigin } from './previewDoc';
import { parseItmsOrigin } from './wcmsQuery';

function hostSuffixes(): string[] {
  return (process.env.ITMS_ASSET_HOST_SUFFIXES || '')
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
}

function hostAllowed(origin: string, suffixes: string[]): boolean {
  let host = '';
  try {
    host = new URL(origin).hostname.toLowerCase();
  } catch {
    return false;
  }
  return suffixes.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`),
  );
}

/** Client origins are used only when they match ITMS_PUBLIC_ORIGIN or ITMS_ASSET_HOST_SUFFIXES. */
export function allowedAssetOrigin(clientOrigin: unknown): string | undefined {
  const configured = parseItmsOrigin(itmsPublicOrigin()) || undefined;
  const suffixes = hostSuffixes();
  const parsed = parseItmsOrigin(clientOrigin);
  if (!parsed) return configured;
  if (configured && parsed === configured) return parsed;
  if (hostAllowed(parsed, suffixes)) return parsed;
  return configured;
}
