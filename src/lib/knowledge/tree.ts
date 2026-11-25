import { stripQmdMarkdownPath } from './search';
import type {
  KnowledgeFileMeta,
  KnowledgeSearchHit,
  KnowledgeTreeNode,
} from './types';

export function nodeAtPath(
  root: KnowledgeTreeNode,
  path: string,
): KnowledgeTreeNode | null {
  if (!path) return root;
  const parts = path.split('/');
  let current: KnowledgeTreeNode | undefined = root;
  for (const part of parts) {
    current = (current.children || []).find((child) => child.name === part);
    if (!current) return null;
  }
  return current;
}

/** True when a folder is a bound / structured document (wiki flag or wiki/index.md). */
export function isStructuredKnowledgeNode(
  node: KnowledgeTreeNode | null | undefined,
): boolean {
  if (!node || node.type !== 'dir') return false;
  if (node.wiki) return true;
  const wikiDir = (node.children || []).find(
    (child) => child.type === 'dir' && child.name === 'wiki',
  );
  if (!wikiDir) return false;
  return (wikiDir.children || []).some(
    (child) =>
      child.type === 'file' &&
      (child.name === 'index.md' ||
        (child.path || '').replace(/\\/g, '/').endsWith('wiki/index.md')),
  );
}

/** Nearest structured ancestor of `path`, including the node itself. */
export function enclosingStructuredNode(
  root: KnowledgeTreeNode,
  path: string,
): KnowledgeTreeNode | null {
  if (!path) return isStructuredKnowledgeNode(root) ? root : null;
  const parts = path.split('/').filter(Boolean);
  let acc = '';
  for (const part of parts) {
    acc = acc ? `${acc}/${part}` : part;
    const current = nodeAtPath(root, acc);
    if (isStructuredKnowledgeNode(current)) return current;
  }
  return null;
}

export function parentKnowledgePath(path: string): string {
  const parts = path.split('/').filter(Boolean);
  return parts.slice(0, -1).join('/');
}

/** The bound document's index file, if the tree includes it. */
export function structuredIndexFile(
  node: KnowledgeTreeNode,
): KnowledgeFileMeta | null {
  const wikiDir = (node.children || []).find(
    (child) => child.type === 'dir' && child.name === 'wiki',
  );
  const candidates = [
    ...(wikiDir?.children || []),
    ...(node.children || []),
  ];
  const index = candidates.find(
    (child) =>
      child.type === 'file' &&
      (child.name === 'index.md' ||
        (child.path || '').replace(/\\/g, '/').endsWith('wiki/index.md')),
  );
  return index?.file ?? null;
}

export function childrenAtPath(
  root: KnowledgeTreeNode,
  path: string,
): KnowledgeTreeNode[] {
  const node = nodeAtPath(root, path);
  if (!node) return [];
  const children = node.children || [];
  const dirs = children.filter((child) => child.type === 'dir');
  const files = children.filter((child) => child.type !== 'dir');
  return [...dirs, ...files];
}

function walkFiles(
  node: KnowledgeTreeNode,
  visit: (file: KnowledgeFileMeta) => void,
): void {
  if (node.type === 'file' && node.file) visit(node.file);
  for (const child of node.children || []) walkFiles(child, visit);
}

export function fileTaskIds(root: KnowledgeTreeNode): string[] {
  const ids: string[] = [];
  walkFiles(root, (file) => {
    if (file.task_id) ids.push(file.task_id);
  });
  return ids;
}

export function storedBytesFromFile(file: {
  size_bytes?: number;
  inbox_size_bytes?: number | null;
  markdown_size_bytes?: number | null;
  inbox_relpath?: string | null;
  markdown_relpath?: string | null;
}): number {
  const original = Math.max(
    0,
    Number(file.inbox_size_bytes ?? file.size_bytes) || 0,
  );
  const markdownSize = Number(file.markdown_size_bytes);
  const hasMarkdownSize = Number.isFinite(markdownSize) && markdownSize >= 0;
  const inbox = (file.inbox_relpath || '').trim();
  const markdown = (file.markdown_relpath || '').trim();
  if (hasMarkdownSize) {
    return (inbox ? original : 0) + markdownSize;
  }
  // Fallback only when Dochub has not yet returned the converted size:
  // upload charges original + actual markdown bytes, which this approximates.
  if (inbox && markdown) return original * 2;
  return original;
}

export function usedBytesFromTree(root: KnowledgeTreeNode): number {
  let sum = 0;
  walkFiles(root, (file) => {
    sum += storedBytesFromFile(file);
  });
  return sum;
}

export function fileCountInNode(node: KnowledgeTreeNode): number {
  let count = 0;
  walkFiles(node, () => {
    count += 1;
  });
  return count;
}

export type KnowledgeFileIndexEntry = {
  path: string;
  name: string;
};

/** Flat inventory for "list my files". Paths prefer markdown, then inbox, then the node path. */
export function listKnowledgeFiles(
  root: KnowledgeTreeNode,
): KnowledgeFileIndexEntry[] {
  const out: KnowledgeFileIndexEntry[] = [];
  const visit = (node: KnowledgeTreeNode) => {
    if (node.type === 'file') {
      const path =
        node.file?.markdown_relpath ||
        node.file?.inbox_relpath ||
        node.path ||
        node.name;
      const name = node.file?.original_filename || node.name || path;
      if (path) out.push({ path, name });
      return;
    }
    for (const child of node.children || []) visit(child);
  };
  visit(root);
  return out;
}

export function latestCreatedAt(node: KnowledgeTreeNode): string | null {
  let latest: string | null = null;
  walkFiles(node, (file) => {
    if (file.created_at && (!latest || file.created_at > latest)) {
      latest = file.created_at;
    }
  });
  return latest;
}

export function flattenKnowledgeNodes(
  root: KnowledgeTreeNode,
): KnowledgeTreeNode[] {
  const out: KnowledgeTreeNode[] = [root];
  for (const child of root.children || []) {
    out.push(...flattenKnowledgeNodes(child));
  }
  return out;
}

/** Flatten the tree but treat structured folders as leaves (no internal files). */
export function flattenVisibleKnowledgeNodes(
  root: KnowledgeTreeNode,
): KnowledgeTreeNode[] {
  const out: KnowledgeTreeNode[] = [];
  const visit = (node: KnowledgeTreeNode, isRoot = false) => {
    if (!isRoot) out.push(node);
    if (isStructuredKnowledgeNode(node)) return;
    for (const child of node.children || []) visit(child);
  };
  visit(root, true);
  return out;
}

export function findFileByDochubPath(
  root: KnowledgeTreeNode,
  path: string,
): KnowledgeFileMeta | null {
  const rel = stripQmdMarkdownPath(path || '');
  if (!rel) return null;
  let found: KnowledgeFileMeta | null = null;
  const visit = (node: KnowledgeTreeNode) => {
    if (found) return;
    if (node.type === 'file' && node.file) {
      if (
        node.file.markdown_relpath === rel ||
        node.file.inbox_relpath === rel ||
        node.path === rel
      ) {
        found = node.file;
      }
    }
    for (const child of node.children || []) visit(child);
  };
  visit(root);
  return found;
}

export function findFileForSearchHit(
  root: KnowledgeTreeNode,
  hit: KnowledgeSearchHit,
): KnowledgeFileMeta | null {
  return findFileByDochubPath(root, hit.file || '');
}

function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

/** User-facing title for a Knowledge search hit. Prefers the uploaded filename. */
export function searchHitDisplayTitle(
  hit: KnowledgeSearchHit,
  file?: KnowledgeFileMeta | null,
  structuredName?: string | null,
): string {
  if (nonEmpty(structuredName)) return structuredName.trim();
  if (nonEmpty(file?.original_filename)) return file.original_filename.trim();
  if (nonEmpty(hit.title)) return hit.title.trim();
  if (nonEmpty(hit.file)) return hit.file;
  return '';
}

/** Resolve a search hit to its tree file and the title shown in the files list. */
export function resolveSearchHitDisplay(
  root: KnowledgeTreeNode,
  hit: KnowledgeSearchHit,
): { title: string; file: KnowledgeFileMeta | null } {
  const file = findFileForSearchHit(root, hit);
  const rel = stripQmdMarkdownPath(hit.file || '');
  const structured = rel ? enclosingStructuredNode(root, rel) : null;
  return {
    title: searchHitDisplayTitle(hit, file, structured?.name),
    file,
  };
}

export function stampLibrary(
  node: KnowledgeTreeNode,
  library: KnowledgeTreeNode['library'],
): KnowledgeTreeNode {
  return {
    ...node,
    library,
    children: (node.children || []).map((child) => stampLibrary(child, library)),
  };
}

export function filterTree(
  node: KnowledgeTreeNode,
  keep: (node: KnowledgeTreeNode) => boolean,
): KnowledgeTreeNode {
  const children = (node.children || [])
    .map((child) => filterTree(child, keep))
    .filter((child) => keep(child) || (child.type === 'dir' && (child.children || []).length > 0));
  return { ...node, children };
}
