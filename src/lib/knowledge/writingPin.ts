import {
  isHiddenPublicFolder,
  MAX_KNOWLEDGE_PINS,
  parseKnowledgePin,
  parseKnowledgePins,
} from './library';
import { isSafeRelativePath } from './paths';
import { flattenKnowledgeNodes, nodeAtPath } from './tree';
import type { KnowledgeTreeNode } from './types';

export type WritingMentionedDocument = {
  fileId: string;
  path: string;
  name: string;
  markdownRelpath: string;
  library?: 'private' | 'public';
};

export type WritingPinScope = {
  path: string;
  library: 'private' | 'public';
};

export type WritingPinResult = {
  pin: string | null;
  pinLibrary: 'private' | 'public';
  pins: WritingPinScope[];
  mentionedFolders: string[];
  mentionedDocuments: WritingMentionedDocument[];
};

export function splitRetrievalLimit(total: number, scopeCount: number): number {
  const limit = Math.max(1, Math.floor(total) || 1);
  if (scopeCount <= 1) return limit;
  return Math.max(1, Math.ceil(limit / scopeCount));
}

export function pathInsidePins(
  path: string | undefined,
  pins: Array<string | null | undefined>,
): boolean {
  if (!path) return false;
  return pins.some(
    (pin) => typeof pin === 'string' && pin.length > 0 && pathInsidePin(path, pin),
  );
}

export function clampPathToPins(
  path: string | undefined,
  pins: Array<string | null | undefined>,
): string | null {
  const usable = pins.filter(
    (pin): pin is string => typeof pin === 'string' && pin.length > 0,
  );
  if (usable.length === 0) {
    return typeof path === 'string' && isSafeRelativePath(path) ? path : null;
  }
  if (usable.length === 1) return clampPathToPin(path, usable[0]);
  const safe =
    typeof path === 'string' && isSafeRelativePath(path) ? path : null;
  if (!safe) return null;
  return pathInsidePins(safe, usable) ? safe : null;
}

export function pathInsidePin(path: string, pin: string | null): boolean {
  if (!pin) return true;
  return path === pin || path.startsWith(`${pin}/`);
}

export function clampPathToPin(
  path: string | undefined,
  pin: string | null,
): string | null {
  const safe =
    typeof path === 'string' && isSafeRelativePath(path) ? path : null;
  if (!pin) return safe;
  if (!safe) return pin;
  return pathInsidePin(safe, pin) ? safe : pin;
}

function mentionBoundaryOk(text: string, end: number): boolean {
  const after = text[end];
  return after === undefined || /[\s,.;:!?)\]]/.test(after);
}

function mentionNeedles(
  ...values: Array<string | null | undefined>
): string[] {
  return values.filter(
    (value): value is string => typeof value === 'string' && value.length > 0,
  );
}

function isUsableNodePath(path: unknown): path is string {
  return typeof path === 'string' && path.length > 0;
}

function findCompleteAt(
  lower: string,
  needlePath: string | null | undefined,
): number {
  if (typeof needlePath !== 'string' || !needlePath) return -1;
  const needle = `@${needlePath.toLowerCase()}`;
  let from = 0;
  while (from <= lower.length) {
    const idx = lower.indexOf(needle, from);
    if (idx < 0) return -1;
    if (mentionBoundaryOk(lower, idx + needle.length)) return idx;
    from = idx + 1;
  }
  return -1;
}

function parentDir(filePath: string): string {
  const i = filePath.lastIndexOf('/');
  return i <= 0 ? '' : filePath.slice(0, i);
}

function longestCommonParent(filePaths: string[]): string | null {
  if (filePaths.length === 0) return null;
  const parents = filePaths.map(parentDir);
  if (parents.some((p) => p === '')) return null;
  const parts = parents.map((p) => p.split('/'));
  const first = parts[0];
  let i = 0;
  while (i < first.length && parts.every((p) => p[i] === first[i])) i += 1;
  if (i === 0) return null;
  return first.slice(0, i).join('/');
}

function isPinableFolder(
  library: 'private' | 'public',
  path: string,
  privateTree: KnowledgeTreeNode | null,
  publicTree: KnowledgeTreeNode | null,
): boolean {
  if (!path || !isSafeRelativePath(path)) return false;
  if (library === 'public' && isHiddenPublicFolder(path)) return false;
  const tree = library === 'public' ? publicTree : privateTree;
  const node = tree ? nodeAtPath(tree, path) : null;
  return node?.type === 'dir';
}

export function resolveWritingKnowledgePin(input: {
  text: string;
  tree: KnowledgeTreeNode | null;
  publicTree?: KnowledgeTreeNode | null;
  selectedFolder?: string | string[];
  documentId?: string | null;
}): WritingPinResult {
  const empty: WritingPinResult = {
    pin: null,
    pinLibrary: 'private',
    pins: [],
    mentionedFolders: [],
    mentionedDocuments: [],
  };
  const privateTree = input.tree;
  const publicTree = input.publicTree ?? null;
  if (!privateTree && !publicTree) return empty;
  const text = input.text || '';
  const lower = text.toLowerCase();
  const nodes = [
    ...(privateTree
      ? flattenKnowledgeNodes(privateTree).map((n) => ({
          ...n,
          library: n.library || ('private' as const),
        }))
      : []),
    ...(publicTree
      ? flattenKnowledgeNodes(publicTree).map((n) => ({
          ...n,
          library: n.library || ('public' as const),
        }))
      : []),
  ].filter(
    (n) =>
      isUsableNodePath(n.path) &&
      !(n.library === 'public' && isHiddenPublicFolder(n.path)),
  );
  const folders = nodes
    .filter((n) => n.type === 'dir')
    .sort((a, b) => b.path.length - a.path.length);
  const files = nodes
    .filter((n) => n.type === 'file' && n.file)
    .sort((a, b) => b.path.length - a.path.length);

  const mentionedFolders: {
    path: string;
    library: 'private' | 'public';
    index: number;
  }[] = [];
  for (const folder of folders) {
    const library = folder.library === 'public' ? 'public' : 'private';
    const needles = mentionNeedles(
      folder.path,
      `${library}/${folder.path}`,
      `${library}:${folder.path}`,
    );
    const index = needles.reduce((best, needle) => {
      const idx = findCompleteAt(lower, needle);
      if (idx < 0) return best;
      return best < 0 ? idx : Math.min(best, idx);
    }, -1);
    if (index >= 0) mentionedFolders.push({ path: folder.path, library, index });
  }
  mentionedFolders.sort((a, b) => a.index - b.index);

  const mentionedDocuments: WritingMentionedDocument[] = [];
  const seenDocs = new Set<string>();
  for (const node of files) {
    const file = node.file!;
    const library = node.library === 'public' ? 'public' : 'private';
    const needles = mentionNeedles(
      node.path,
      `${library}/${node.path}`,
      `${library}:${node.path}`,
      file.original_filename,
      file.markdown_relpath,
      file.inbox_relpath,
    );
    const index = needles.reduce((best, needle) => {
      const idx = findCompleteAt(lower, needle);
      if (idx < 0) return best;
      return best < 0 ? idx : Math.min(best, idx);
    }, -1);
    if (index >= 0 && !seenDocs.has(file.id)) {
      seenDocs.add(file.id);
      mentionedDocuments.push({
        fileId: file.id,
        path: node.path,
        name: file.original_filename,
        markdownRelpath: file.markdown_relpath,
        library,
      });
    }
  }

  const selected: WritingPinScope[] = [];
  for (const parsed of parseKnowledgePins(input.selectedFolder)) {
    if (
      isPinableFolder(parsed.library, parsed.path, privateTree, publicTree)
    ) {
      selected.push({ path: parsed.path, library: parsed.library });
    }
  }

  const pins: WritingPinScope[] = [];
  const seenPins = new Set<string>();
  const addPin = (scope: WritingPinScope) => {
    if (!scope.path || pins.length >= MAX_KNOWLEDGE_PINS) return;
    if (scope.library === 'public' && isHiddenPublicFolder(scope.path)) return;
    const key = `${scope.library}:${scope.path}`;
    if (seenPins.has(key)) return;
    seenPins.add(key);
    pins.push({ path: scope.path, library: scope.library });
  };

  for (const scope of selected) addPin(scope);
  for (const folder of mentionedFolders) {
    addPin({ path: folder.path, library: folder.library });
  }

  if (mentionedDocuments.length) {
    const byLibrary = new Map<'private' | 'public', string[]>();
    for (const doc of mentionedDocuments) {
      const library = doc.library === 'public' ? 'public' : 'private';
      const list = byLibrary.get(library) || [];
      list.push(doc.path);
      byLibrary.set(library, list);
    }
    for (const [library, paths] of byLibrary) {
      const parent = longestCommonParent(paths);
      if (parent) addPin({ path: parent, library });
    }
  }

  if (pins.length === 0 && input.documentId) {
    const raw = input.documentId.trim();
    const parsed = parseKnowledgePin(raw);
    const path = parsed?.path || raw;
    const library =
      raw.includes(':') || raw.startsWith('public/') || raw.startsWith('shared/')
        ? parsed?.library || 'public'
        : 'public';
    if (isPinableFolder(library, path, privateTree, publicTree)) {
      addPin({ path, library });
    }
  }

  return {
    pin: pins[0]?.path ?? null,
    pinLibrary: pins[0]?.library ?? 'private',
    pins,
    mentionedFolders: mentionedFolders.map((f) => f.path),
    mentionedDocuments,
  };
}
