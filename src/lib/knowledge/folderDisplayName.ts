import { DOCUMENT_SLOTS } from '@/lib/documents/slots';

function normalizeKnowledgePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '');
}

/** Catalog title for a root wiki folder; otherwise the fallback or last path segment. */
export function knowledgeFolderDisplayName(
  path: string,
  fallback?: string,
): string {
  const normalized = normalizeKnowledgePath(path || '');
  const segments = normalized.split('/').filter(Boolean);
  if (segments.length === 1) {
    const slug = segments[0];
    const slot = DOCUMENT_SLOTS.find(
      (entry) => entry.id === slug || entry.dirName === slug,
    );
    if (slot?.title) return slot.title;
  }
  if (fallback && fallback.trim()) return fallback;
  return segments.at(-1) || path || '';
}
