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

export function usedBytesFromTree(root: KnowledgeTreeNode): number {
  let sum = 0;
  walkFiles(root, (file) => {
    sum += Number(file.size_bytes) || 0;
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
  const rel = stripQmdMarkdownPath(hit.file || '');
  if (!rel) return null;
  let found: KnowledgeFileMeta | null = null;
  walkFiles(root, (file) => {
    if (found) return;
    if (file.markdown_relpath === rel || file.inbox_relpath === rel) {
      found = file;
    }
  });
  return found;
}
