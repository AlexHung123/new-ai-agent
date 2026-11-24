import { isHiddenPublicFolder, parseKnowledgePin } from './library';
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

export type WritingPinResult = {
  pin: string | null;
  pinLibrary: 'private' | 'public';
  mentionedFolders: string[];
  mentionedDocuments: WritingMentionedDocument[];
};

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

export function resolveWritingKnowledgePin(input: {
  text: string;
  tree: KnowledgeTreeNode | null;
  publicTree?: KnowledgeTreeNode | null;
  selectedFolder?: string;
  documentId?: string | null;
}): WritingPinResult {
  const empty: WritingPinResult = {
    pin: null,
    pinLibrary: 'private',
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
      ? flattenKnowledgeNodes(privateTree).map((n) => ({ ...n, library: n.library || 'private' as const }))
      : []),
    ...(publicTree
      ? flattenKnowledgeNodes(publicTree).map((n) => ({ ...n, library: n.library || 'public' as const }))
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

  const mentionedFolders: { path: string; library: 'private' | 'public'; index: number }[] = [];
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
  const seen = new Set<string>();
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
    if (index >= 0 && !seen.has(file.id)) {
      seen.add(file.id);
      mentionedDocuments.push({
        fileId: file.id,
        path: node.path,
        name: file.original_filename,
        markdownRelpath: file.markdown_relpath,
        library,
      });
    }
  }

  let pin: string | null = null;
  let pinLibrary: 'private' | 'public' = 'private';
  if (mentionedFolders.length) {
    pin = mentionedFolders[0].path;
    pinLibrary = mentionedFolders[0].library;
  } else if (mentionedDocuments.length) {
    const lib = mentionedDocuments[0].library === 'public' ? 'public' : 'private';
    const sameLib = mentionedDocuments.filter((d) => (d.library || 'private') === lib);
    pin = longestCommonParent(sameLib.map((d) => d.path));
    pinLibrary = lib;
  } else if (input.selectedFolder) {
    const parsed = parseKnowledgePin(input.selectedFolder);
    if (parsed?.path && isSafeRelativePath(parsed.path)) {
      const treeForLib = parsed.library === 'public' ? publicTree : privateTree;
      const node = treeForLib ? nodeAtPath(treeForLib, parsed.path) : null;
      if (parsed.library === 'public' || node?.type === 'dir') {
        pin = parsed.path;
        pinLibrary = parsed.library;
      }
    }
  } else if (input.documentId) {
    const raw = input.documentId.trim();
    const parsed = parseKnowledgePin(raw);
    const path = parsed?.path || raw;
    if (path && isSafeRelativePath(path)) {
      pin = path;
      pinLibrary =
        raw.includes(':') || raw.startsWith('public/')
          ? parsed?.library || 'public'
          : 'public';
    }
  }

  return {
    pin,
    pinLibrary,
    mentionedFolders: mentionedFolders.map((f) => f.path),
    mentionedDocuments,
  };
}
