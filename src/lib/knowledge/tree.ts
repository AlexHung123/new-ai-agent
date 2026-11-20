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
