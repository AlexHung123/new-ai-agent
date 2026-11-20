import { describe, expect, it } from 'vitest';
import type { KnowledgeTreeNode } from './types';
import {
  childrenAtPath,
  findFileForSearchHit,
  nodeAtPath,
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
});
