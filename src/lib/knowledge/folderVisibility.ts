import { nodeAtPath, parentKnowledgePath } from './tree';
import type { KnowledgeLibrary } from './library';
import type { KnowledgeTreeNode } from './types';

export type KnowledgeTrees = {
  private?: KnowledgeTreeNode | null;
  public?: KnowledgeTreeNode | null;
};

function isDirectoryAtPath(
  tree: KnowledgeTreeNode | null | undefined,
  path: string,
): boolean {
  if (!tree || !path) return false;
  const node = nodeAtPath(tree, path);
  return Boolean(node && node.type === 'dir');
}

export function isRootFolderPath(path: string): boolean {
  return !parentKnowledgePath(path);
}

export function librariesContainingFolder(
  path: string,
  trees: KnowledgeTrees,
): KnowledgeLibrary[] {
  const found: KnowledgeLibrary[] = [];
  if (isDirectoryAtPath(trees.private, path)) found.push('private');
  if (isDirectoryAtPath(trees.public, path)) found.push('public');
  return found;
}

export function inheritedFolderSubtitle(
  parentPath: string,
  library: KnowledgeLibrary,
): string {
  const label = library === 'public' ? 'Public' : 'Private';
  return `New folder inside ${parentPath}. It will be ${label} because the parent is ${label}.`;
}

/**
 * Nested folder paths must use the parent folder's library.
 * Root paths (a single segment) may choose Private or Public.
 * Returns an error message when the requested library is not allowed.
 */
export function childFolderLibraryError(
  path: string,
  library: KnowledgeLibrary,
  trees: KnowledgeTrees,
): string | null {
  const parentPath = parentKnowledgePath(path);
  if (!parentPath) return null;
  const parentLibraries = librariesContainingFolder(parentPath, trees);
  if (parentLibraries.length === 0) {
    return `Parent folder "${parentPath}" was not found.`;
  }
  if (!parentLibraries.includes(library)) {
    const parentLibrary = parentLibraries[0] === 'public' ? 'Public' : 'Private';
    return `A child folder must be ${parentLibrary} because its parent is ${parentLibrary}.`;
  }
  return null;
}
