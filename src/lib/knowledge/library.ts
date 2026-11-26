import { knowledgeFolderDisplayName } from './folderDisplayName';
import { isSafeRelativePath } from './paths';

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
  return {
    library: 'private',
    path: text.replace(/^\/+/, '').replace(/\/+$/, ''),
  };
}

export function knowledgeMentionToken(pin: {
  library: KnowledgeLibrary;
  path: string;
}): string {
  const path = (pin.path || '').replace(/^\/+/, '');
  return path ? `${pin.library}/${path}` : pin.library;
}

export function knowledgeMentionMatches(input: {
  name: string;
  path: string;
  library: KnowledgeLibrary;
  query: string;
}): boolean {
  const query = input.query.trim().toLowerCase();
  if (!query) return true;
  const name = (input.name || '').toLowerCase();
  const path = (input.path || '').toLowerCase();
  const display = knowledgeFolderDisplayName(
    input.path,
    input.name,
  ).toLowerCase();
  if (name.includes(query) || path.includes(query) || display.includes(query)) {
    return true;
  }
  if (query.includes('/')) {
    return knowledgeMentionToken({
      library: input.library,
      path: input.path,
    })
      .toLowerCase()
      .includes(query);
  }
  return query === input.library;
}

export function isHiddenPublicFolder(path: string): boolean {
  const head = path.split('/').filter(Boolean)[0] || '';
  return HIDDEN_PUBLIC_FOLDERS.has(head);
}

function knowledgeHitRelPath(hit: unknown): string {
  if (!hit || typeof hit !== 'object') return '';
  const rec = hit as Record<string, unknown>;
  for (const key of ['path', 'file', 'dochub_path', 'filepath'] as const) {
    const value = rec[key];
    if (typeof value !== 'string' || !value.trim()) continue;
    let path = value.trim();
    const prefix = 'qmd://markdown/';
    if (path.startsWith(prefix)) path = path.slice(prefix.length);
    return path.replace(/^\/+/, '').replace(/^markdown\//, '');
  }
  return '';
}

/** Drop search hits whose path is under a hidden public folder such as sfc. */
export function filterHiddenPublicHits<T>(results: T[]): T[] {
  return results.filter((hit) => {
    const path = knowledgeHitRelPath(hit);
    return !path || !isHiddenPublicFolder(path);
  });
}

/**
 * Old Agent Document chats stored a slot id (spr, sfc, …).
 * Only visible public folders become Knowledge pins.
 */
export function knowledgeFolderFromLegacyDocumentId(
  documentId: string | null | undefined,
): string | null {
  if (typeof documentId !== 'string') return null;
  const raw = documentId.trim();
  if (!raw) return null;
  const parsed = parseKnowledgePin(raw);
  const path = parsed?.path || raw;
  if (!path || !isSafeRelativePath(path) || isHiddenPublicFolder(path)) {
    return null;
  }
  return formatKnowledgePin({ library: 'public', path });
}

export function pinTitle(pin: KnowledgePin): string {
  if (pin.title) return pin.title;
  if (!pin.path) return pin.library === 'public' ? 'Public' : 'Private';
  return knowledgeFolderDisplayName(pin.path);
}

export function pinsEqual(
  a: KnowledgePin | null | undefined,
  b: KnowledgePin | null | undefined,
): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.library === b.library && a.path === b.path;
}

export const MAX_KNOWLEDGE_PINS = 5;

export const KNOWLEDGE_PIN_CAP_REASON = 'You can pin up to 5 folders.';

function isUsablePin(
  pin: KnowledgePin | null | undefined,
): pin is KnowledgePin {
  return Boolean(pin && pin.path);
}

export function knowledgePinKey(pin: {
  library: KnowledgeLibrary;
  path?: string | null;
}): string {
  return formatKnowledgePin(pin);
}

export function uniqueKnowledgePins(pins: KnowledgePin[]): KnowledgePin[] {
  const seen = new Set<string>();
  const out: KnowledgePin[] = [];
  for (const pin of pins) {
    if (!isUsablePin(pin)) continue;
    const key = knowledgePinKey(pin);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      library: pin.library,
      path: pin.path,
      ...(pin.wiki ? { wiki: true } : {}),
      ...(pin.title ? { title: pin.title } : {}),
    });
    if (out.length >= MAX_KNOWLEDGE_PINS) break;
  }
  return out;
}

/**
 * Parse a stored pin list. A single legacy value (`public:spr`, `private:notes`,
 * or a bare private path) becomes a one-item list. Also accepts a JSON array,
 * a comma-separated list of the same keys, or a string array.
 */
export function parseKnowledgePins(raw: unknown): KnowledgePin[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return uniqueKnowledgePins(
      raw.flatMap((item) => {
        if (typeof item !== 'string') return [];
        const pin = parseKnowledgePin(item);
        return isUsablePin(pin) ? [pin] : [];
      }),
    );
  }
  if (typeof raw !== 'string') return [];
  const text = raw.trim();
  if (!text) return [];
  if (text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parseKnowledgePins(parsed);
    } catch {
      /* fall through to a single pin or comma list */
    }
  }
  if (text.includes(',')) {
    const parts = text
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    const pins = parts
      .map((part) => parseKnowledgePin(part))
      .filter(isUsablePin);
    if (pins.length === parts.length && pins.length > 0) {
      return uniqueKnowledgePins(pins);
    }
  }
  const single = parseKnowledgePin(text);
  return isUsablePin(single) ? [single] : [];
}

/** Serialize pins for chat state / API. One pin stays a single key. */
export function formatKnowledgePins(pins: KnowledgePin[]): string {
  const unique = uniqueKnowledgePins(pins);
  if (unique.length === 0) return '';
  if (unique.length === 1) return formatKnowledgePin(unique[0]);
  return unique.map((pin) => formatKnowledgePin(pin)).join(',');
}

export function toggleKnowledgePin(
  current: string | string[] | null | undefined,
  next: string | KnowledgePin,
): {
  value: string;
  pins: KnowledgePin[];
  added: boolean;
  reason?: string;
} {
  const pins = parseKnowledgePins(current);
  const candidate = typeof next === 'string' ? parseKnowledgePin(next) : next;
  if (!isUsablePin(candidate)) {
    return { value: formatKnowledgePins(pins), pins, added: false };
  }
  const key = knowledgePinKey(candidate);
  const existing = pins.findIndex((pin) => knowledgePinKey(pin) === key);
  if (existing >= 0) {
    const nextPins = pins.filter((_, index) => index !== existing);
    return {
      value: formatKnowledgePins(nextPins),
      pins: nextPins,
      added: false,
    };
  }
  if (pins.length >= MAX_KNOWLEDGE_PINS) {
    return {
      value: formatKnowledgePins(pins),
      pins,
      added: false,
      reason: KNOWLEDGE_PIN_CAP_REASON,
    };
  }
  const nextPins = [
    ...pins,
    { library: candidate.library, path: candidate.path },
  ];
  return { value: formatKnowledgePins(nextPins), pins: nextPins, added: true };
}

export function removeKnowledgePin(
  current: string | string[] | null | undefined,
  key: string,
): string {
  const target = parseKnowledgePin(key);
  if (!isUsablePin(target))
    return formatKnowledgePins(parseKnowledgePins(current));
  const next = parseKnowledgePins(current).filter(
    (pin) => knowledgePinKey(pin) !== knowledgePinKey(target),
  );
  return formatKnowledgePins(next);
}
