import { isSafeRelativePath } from './paths';
import { flattenKnowledgeNodes, nodeAtPath } from './tree';
import type { KnowledgeTreeNode } from './types';

export type WritingMentionedDocument = {
  fileId: string;
  path: string;
  name: string;
  markdownRelpath: string;
};

export type WritingPinResult = {
  pin: string | null;
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

function findCompleteAt(lower: string, needlePath: string): number {
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
  selectedFolder?: string;
}): WritingPinResult {
  const empty: WritingPinResult = {
    pin: null,
    mentionedFolders: [],
    mentionedDocuments: [],
  };
  if (!input.tree) return empty;
  const text = input.text || '';
  const lower = text.toLowerCase();
  const nodes = flattenKnowledgeNodes(input.tree).filter((n) => n.path);
  const folders = nodes
    .filter((n) => n.type === 'dir')
    .sort((a, b) => b.path.length - a.path.length);
  const files = nodes
    .filter((n) => n.type === 'file' && n.file)
    .sort((a, b) => b.path.length - a.path.length);

  const mentionedFolders: { path: string; index: number }[] = [];
  for (const folder of folders) {
    const index = findCompleteAt(lower, folder.path);
    if (index >= 0) mentionedFolders.push({ path: folder.path, index });
  }
  mentionedFolders.sort((a, b) => a.index - b.index);

  const mentionedDocuments: WritingMentionedDocument[] = [];
  const seen = new Set<string>();
  for (const node of files) {
    const file = node.file!;
    const needles = [
      node.path,
      file.original_filename,
      file.markdown_relpath,
      file.inbox_relpath,
    ];
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
      });
    }
  }

  let pin: string | null = null;
  if (mentionedFolders.length) pin = mentionedFolders[0].path;
  else if (mentionedDocuments.length) {
    pin = longestCommonParent(mentionedDocuments.map((d) => d.path));
  } else {
    const selected = (input.selectedFolder || '').trim();
    if (selected && isSafeRelativePath(selected)) {
      const node = nodeAtPath(input.tree, selected);
      if (node?.type === 'dir') pin = selected;
    }
  }

  return {
    pin,
    mentionedFolders: mentionedFolders.map((f) => f.path),
    mentionedDocuments,
  };
}
