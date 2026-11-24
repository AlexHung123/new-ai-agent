import { describe, expect, it } from 'vitest';
import type { KnowledgeTreeNode } from './types';
import {
  childFolderLibraryError,
  inheritedFolderSubtitle,
  isRootFolderPath,
  librariesContainingFolder,
} from './folderVisibility';

function dir(
  name: string,
  path: string,
  children: KnowledgeTreeNode[] = [],
): KnowledgeTreeNode {
  return { type: 'dir', name, path, children };
}

const empty: KnowledgeTreeNode = dir('', '', []);

const privateTree: KnowledgeTreeNode = dir('', '', [
  dir('sfc', 'sfc', [dir('testing2', 'sfc/testing2')]),
]);

const publicTree: KnowledgeTreeNode = dir('', '', [
  dir('acqn', 'acqn'),
  dir('shared', 'shared', [dir('policies', 'shared/policies')]),
]);

describe('folder visibility inheritance', () => {
  it('treats a single-segment path as a root folder', () => {
    expect(isRootFolderPath('docs')).toBe(true);
    expect(isRootFolderPath('spr')).toBe(true);
    expect(isRootFolderPath('sfc/testing2')).toBe(false);
    expect(isRootFolderPath('sfc/testing2/child')).toBe(false);
  });

  it('describes the inherited library in the create-folder subtitle', () => {
    expect(inheritedFolderSubtitle('sfc/testing2', 'private')).toBe(
      'New folder inside sfc/testing2. It will be Private because the parent is Private.',
    );
    expect(inheritedFolderSubtitle('shared/policies', 'public')).toBe(
      'New folder inside shared/policies. It will be Public because the parent is Public.',
    );
  });

  it('allows a root folder to choose either library', () => {
    const trees = { private: privateTree, public: publicTree };
    expect(childFolderLibraryError('notes', 'private', trees)).toBeNull();
    expect(childFolderLibraryError('notes', 'public', trees)).toBeNull();
  });

  it('requires a nested folder to match its parent library', () => {
    const trees = { private: privateTree, public: publicTree };
    expect(
      childFolderLibraryError('sfc/testing2/child', 'private', trees),
    ).toBeNull();
    expect(
      childFolderLibraryError('sfc/testing2/child', 'public', trees),
    ).toBe(
      'A child folder must be Private because its parent is Private.',
    );
    expect(
      childFolderLibraryError('shared/policies/2026', 'public', trees),
    ).toBeNull();
    expect(
      childFolderLibraryError('shared/policies/2026', 'private', trees),
    ).toBe(
      'A child folder must be Public because its parent is Public.',
    );
  });

  it('rejects a nested folder when the parent does not exist', () => {
    const trees = { private: empty, public: empty };
    expect(childFolderLibraryError('missing/child', 'private', trees)).toBe(
      'Parent folder "missing" was not found.',
    );
  });

  it('allows a nested folder when the same parent name exists in both libraries', () => {
    const both: KnowledgeTreeNode = dir('', '', [dir('shared', 'shared')]);
    const trees = { private: both, public: both };
    expect(librariesContainingFolder('shared', trees)).toEqual([
      'private',
      'public',
    ]);
    expect(childFolderLibraryError('shared/child', 'private', trees)).toBeNull();
    expect(childFolderLibraryError('shared/child', 'public', trees)).toBeNull();
  });
});
