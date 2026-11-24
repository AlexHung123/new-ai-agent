import { describe, expect, it } from 'vitest';
import type { KnowledgeTreeNode } from './types';
import {
  childrenAtPath,
  enclosingStructuredNode,
  fileCountInNode,
  fileTaskIds,
  listKnowledgeFiles,
  findFileByDochubPath,
  findFileForSearchHit,
  flattenKnowledgeNodes,
  flattenVisibleKnowledgeNodes,
  isStructuredKnowledgeNode,
  latestCreatedAt,
  nodeAtPath,
  parentKnowledgePath,
  structuredIndexFile,
  usedBytesFromTree,
} from './tree';

const tree: KnowledgeTreeNode = {
  type: 'dir',
  name: '',
  path: '',
  children: [
    {
      type: 'dir',
      name: 'contracts',
      path: 'contracts',
      children: [
        {
          type: 'dir',
          name: '2024',
          path: 'contracts/2024',
          children: [
            {
              type: 'file',
              name: 'report.pdf',
              path: 'contracts/2024/report.pdf',
              file: {
                id: 'file-1',
                original_filename: 'report.pdf',
                inbox_relpath: 'contracts/2024/report.pdf',
                markdown_relpath: 'contracts/2024/report.md',
                size_bytes: 16,
                task_id: 'task-1',
                created_at: '2026-11-08T11:38:01Z',
              },
            },
          ],
        },
      ],
    },
  ],
};

describe('tree walk', () => {
  it('returns children of a nested folder, files after dirs at root of that folder', () => {
    const kids = childrenAtPath(tree, 'contracts/2024');
    expect(kids.map((n) => n.name)).toEqual(['report.pdf']);
    expect(nodeAtPath(tree, 'contracts')?.type).toBe('dir');
  });

  it('matches a search hit to the file meta via markdown_relpath', () => {
    const meta = findFileForSearchHit(tree, {
      file: 'qmd://markdown/contracts/2024/report.md',
      title: 'report',
      snippet: 'planning',
    });
    expect(meta?.id).toBe('file-1');
  });

  it('returns null when the hit path is not in the tree', () => {
    expect(
      findFileForSearchHit(tree, {
        file: 'qmd://markdown/missing.md',
        title: 'missing',
        snippet: 'nope',
      }),
    ).toBeNull();
  });

  it('collects file task ids from the tree', () => {
    expect(fileTaskIds(tree)).toEqual(['task-1']);
    expect(
      fileTaskIds({ type: 'dir', name: '', path: '', children: [] }),
    ).toEqual([]);
  });

  it('sums size_bytes and counts files under a folder', () => {
    expect(usedBytesFromTree(tree)).toBe(16);
    expect(listKnowledgeFiles(tree)).toEqual([
      { path: 'contracts/2024/report.md', name: 'report.pdf' },
    ]);
    expect(fileCountInNode(tree)).toBe(1);
    expect(fileCountInNode(nodeAtPath(tree, 'contracts')!)).toBe(1);
    expect(latestCreatedAt(tree)).toBe('2026-11-08T11:38:01Z');
  });

  it('flattens dirs and files', () => {
    expect(flattenKnowledgeNodes(tree).map((n) => n.path)).toEqual([
      '',
      'contracts',
      'contracts/2024',
      'contracts/2024/report.pdf',
    ]);
  });

  it('finds a file by markdown, inbox, node path, or qmd prefix', () => {
    expect(findFileByDochubPath(tree, 'contracts/2024/report.md')?.id).toBe('file-1');
    expect(findFileByDochubPath(tree, 'qmd://markdown/contracts/2024/report.md')?.id).toBe(
      'file-1',
    );
    expect(findFileByDochubPath(tree, 'contracts/2024/report.pdf')?.id).toBe('file-1');
    expect(findFileByDochubPath(tree, 'missing.md')).toBeNull();
  });
});

const structuredTree: KnowledgeTreeNode = {
  type: 'dir',
  name: '',
  path: '',
  children: [
    {
      type: 'dir',
      name: 'acqn',
      path: 'acqn',
      wiki: true,
      children: [
        {
          type: 'dir',
          name: 'wiki',
          path: 'acqn/wiki',
          children: [
            {
              type: 'file',
              name: 'index.md',
              path: 'acqn/wiki/index.md',
              file: {
                id: 'idx-1',
                original_filename: 'index.md',
                inbox_relpath: 'acqn/wiki/index.md',
                markdown_relpath: 'acqn/wiki/index.md',
                size_bytes: 8,
              },
            },
            {
              type: 'dir',
              name: 'chapters',
              path: 'acqn/wiki/chapters',
              children: [
                {
                  type: 'file',
                  name: '00-introduction.md',
                  path: 'acqn/wiki/chapters/00-introduction.md',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'dir',
      name: 'notes',
      path: 'notes',
      children: [
        {
          type: 'file',
          name: 'todo.md',
          path: 'notes/todo.md',
        },
      ],
    },
    {
      type: 'dir',
      name: 'csr',
      path: 'csr',
      children: [
        {
          type: 'dir',
          name: 'wiki',
          path: 'csr/wiki',
          children: [
            { type: 'file', name: 'index.md', path: 'csr/wiki/index.md' },
          ],
        },
      ],
    },
  ],
};

describe('structured knowledge nodes', () => {
  it('detects a structured folder from the wiki flag or wiki/index.md', () => {
    const acqn = nodeAtPath(structuredTree, 'acqn');
    const csr = nodeAtPath(structuredTree, 'csr');
    const notes = nodeAtPath(structuredTree, 'notes');
    expect(isStructuredKnowledgeNode(acqn)).toBe(true);
    expect(isStructuredKnowledgeNode(csr)).toBe(true);
    expect(isStructuredKnowledgeNode(notes)).toBe(false);
    expect(isStructuredKnowledgeNode(nodeAtPath(structuredTree, 'acqn/wiki'))).toBe(
      false,
    );
  });

  it('finds the enclosing structured folder and its index file', () => {
    expect(enclosingStructuredNode(structuredTree, 'acqn/wiki/chapters')?.path).toBe(
      'acqn',
    );
    expect(enclosingStructuredNode(structuredTree, 'notes/todo.md')).toBeNull();
    expect(parentKnowledgePath('acqn/wiki/chapters')).toBe('acqn/wiki');
    expect(structuredIndexFile(nodeAtPath(structuredTree, 'acqn')!)?.id).toBe(
      'idx-1',
    );
  });

  it('flattens mentionable nodes without structured internals', () => {
    expect(flattenVisibleKnowledgeNodes(structuredTree).map((n) => n.path)).toEqual(
      ['acqn', 'notes', 'notes/todo.md', 'csr'],
    );
    expect(flattenKnowledgeNodes(structuredTree).map((n) => n.path)).toContain(
      'acqn/wiki/chapters/00-introduction.md',
    );
  });
});
