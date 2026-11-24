export const KNOWLEDGE_LIBRARIES = ['private', 'public'] as const;

export type KnowledgeLibrary = (typeof KNOWLEDGE_LIBRARIES)[number];

export type KnowledgePin = {
  library: KnowledgeLibrary;
  path: string;
  wiki?: boolean;
  title?: string;
};

/** Public folders omitted from Knowledge FILES / @ pickers (still seeded). */
export const HIDDEN_PUBLIC_FOLDERS = new Set(['sfc']);

export function isKnowledgeLibrary(value: unknown): value is KnowledgeLibrary {
  return value === 'private' || value === 'public';
}

export function parseKnowledgeLibrary(
  raw: unknown,
  fallback: KnowledgeLibrary = 'private',
): KnowledgeLibrary {
  if (typeof raw !== 'string') return fallback;
  const value = raw.trim().toLowerCase();
  if (value === 'public' || value === 'shared') return 'public';
  if (value === 'private' || value === 'priv' || value === '') return fallback;
  return fallback;
}

export function parseKnowledgeLibraryStrict(
  raw: unknown,
): KnowledgeLibrary | null {
  if (typeof raw !== 'string') return null;
  const value = raw.trim().toLowerCase();
  if (value === 'public' || value === 'shared') return 'public';
  if (value === 'private' || value === 'priv') return 'private';
  return null;
}

/** Serialize a pin for chat state / API (`public:spr`, `private:notes`). */
export function formatKnowledgePin(pin: {
  library: KnowledgeLibrary;
  path?: string | null;
}): string {
  const path = (pin.path || '').replace(/^\/+/, '').replace(/\/+$/, '');
  return path ? `${pin.library}:${path}` : `${pin.library}:`;
}

/**
 * Parse a stored pin or mention token.
 * Accepts `public:spr`, `private/notes`, `public/spr/wiki`, or a bare private path.
 */
export function parseKnowledgePin(
  raw: string | null | undefined,
): KnowledgePin | null {
  if (raw == null) return null;
  const text = raw.trim();
  if (!text) return null;
  const colon = text.match(/^(private|public|shared)[:/](.*)$/i);
  if (colon) {
    const library = parseKnowledgeLibrary(colon[1], 'private');
    const path = (colon[2] || '').replace(/^\/+/, '').replace(/\/+$/, '');
    return { library, path };
  }
  if (text === 'private' || text === 'public') {
    return { library: text, path: '' };
  }
  return { library: 'private', path: text.replace(/^\/+/, '').replace(/\/+$/, '') };
}

export function knowledgeMentionToken(pin: {
  library: KnowledgeLibrary;
  path: string;
}): string {
  const path = (pin.path || '').replace(/^\/+/, '');
  return path ? `${pin.library}/${path}` : pin.library;
}

export function isHiddenPublicFolder(path: string): boolean {
  const head = path.split('/').filter(Boolean)[0] || '';
  return HIDDEN_PUBLIC_FOLDERS.has(head);
}

export function pinTitle(pin: KnowledgePin): string {
  if (pin.title) return pin.title;
  if (!pin.path) return pin.library === 'public' ? 'Public' : 'Private';
  return pin.path.split('/').filter(Boolean).at(-1) || pin.path;
}

export function pinsEqual(
  a: KnowledgePin | null | undefined,
  b: KnowledgePin | null | undefined,
): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.library === b.library && a.path === b.path;
}
