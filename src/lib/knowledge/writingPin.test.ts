import { describe, expect, it } from 'vitest';
import type { KnowledgeTreeNode } from './types';
import {
  clampPathToPin,
  pathInsidePin,
  resolveWritingKnowledgePin,
} from './writingPin';

function fileNode(
  path: string,
  id: string,
  original: string,
  markdown: string,
): KnowledgeTreeNode {
  return {
    type: 'file',
    name: original,
    path,
    file: {
      id,
      original_filename: original,
      inbox_relpath: path,
      markdown_relpath: markdown,
      size_bytes: 1,
    },
  };
}

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
            fileNode(
              'contracts/2024/plan.docx',
              'p1',
              'plan.docx',
              'contracts/2024/plan.md',
            ),
          ],
        },
      ],
    },
    {
      type: 'dir',
      name: 'writing',
      path: 'writing',
      children: [
        fileNode('writing/a.md', 'a1', 'a.md', 'writing/a.md'),
        fileNode('writing/b.md', 'b1', 'b.md', 'writing/b.md'),
      ],
    },
    {
      type: 'dir',
      name: 'invoices',
      path: 'invoices',
      children: [fileNode('invoices/acme.md', 'i1', 'acme.md', 'invoices/acme.md')],
    },
  ],
};

describe('pathInsidePin', () => {
  it('treats equal path as inside', () => {
    expect(pathInsidePin('contracts/2024', 'contracts/2024')).toBe(true);
    expect(pathInsidePin('contracts/2024/plan.md', 'contracts/2024')).toBe(true);
    expect(pathInsidePin('contracts', 'contracts/2024')).toBe(false);
    expect(pathInsidePin('invoices', 'contracts/2024')).toBe(false);
    expect(pathInsidePin('invoices', null)).toBe(true);
  });
});

describe('clampPathToPin', () => {
  it('keeps a more specific path inside the pin and rejects outside', () => {
    expect(clampPathToPin('contracts/2024/q1', 'contracts/2024')).toBe(
      'contracts/2024/q1',
    );
    expect(clampPathToPin('invoices', 'contracts/2024')).toBe('contracts/2024');
    expect(clampPathToPin(undefined, 'contracts/2024')).toBe('contracts/2024');
    expect(clampPathToPin('invoices', null)).toBe('invoices');
    expect(clampPathToPin(undefined, null)).toBeNull();
    expect(clampPathToPin('../etc', 'contracts')).toBe('contracts');
  });
});

describe('resolveWritingKnowledgePin', () => {
  it('uses selected folder when there is no @', () => {
    expect(
      resolveWritingKnowledgePin({
        text: '季度規劃喺邊份合約',
        tree,
        selectedFolder: 'contracts/2024',
      }).pin,
    ).toBe('contracts/2024');
  });

  it('uses whole library when nothing is selected', () => {
    expect(resolveWritingKnowledgePin({ text: 'hello', tree }).pin).toBeNull();
  });

  it('lets @folder win over selected folder', () => {
    const result = resolveWritingKnowledgePin({
      text: 'search @writing please',
      tree,
      selectedFolder: 'contracts/2024',
    });
    expect(result.pin).toBe('writing');
    expect(result.mentionedFolders).toEqual(['writing']);
  });

  it('does not treat @contracts as a folder when the mention is @contracts/2024/plan.docx', () => {
    const result = resolveWritingKnowledgePin({
      text: 'see @contracts/2024/plan.docx',
      tree,
      selectedFolder: 'invoices',
    });
    expect(result.pin).toBe('contracts/2024');
    expect(result.mentionedFolders).toEqual([]);
    expect(result.mentionedDocuments.map((d) => d.fileId)).toEqual(['p1']);
  });

  it('pins several @documents to the longest common parent', () => {
    expect(
      resolveWritingKnowledgePin({
        text: 'compare @writing/a.md and @writing/b.md',
        tree,
      }).pin,
    ).toBe('writing');
  });

  it('clears the pin when @documents do not share a parent', () => {
    expect(
      resolveWritingKnowledgePin({
        text: 'compare @writing/a.md and @invoices/acme.md',
        tree,
        selectedFolder: 'contracts',
      }).pin,
    ).toBeNull();
  });

  it('uses the first @folder in left-to-right order', () => {
    expect(
      resolveWritingKnowledgePin({
        text: 'look in @invoices and @writing',
        tree,
      }).pin,
    ).toBe('invoices');
  });

  it('ignores unknown @, unknown selected folder, unsafe paths, and a null tree', () => {
    expect(
      resolveWritingKnowledgePin({
        text: 'see @missing',
        tree,
        selectedFolder: 'nope',
      }).pin,
    ).toBeNull();
    expect(
      resolveWritingKnowledgePin({
        text: 'hello',
        tree,
        selectedFolder: '../etc',
      }).pin,
    ).toBeNull();
    expect(
      resolveWritingKnowledgePin({
        text: '@writing',
        tree: null,
        selectedFolder: 'writing',
      }),
    ).toEqual({ pin: null, mentionedFolders: [], mentionedDocuments: [] });
  });
});
