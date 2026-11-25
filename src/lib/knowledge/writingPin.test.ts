import { describe, expect, it } from 'vitest';
import type { KnowledgeTreeNode } from './types';
import {
  clampPathToPin,
  clampPathToPins,
  pathInsidePin,
  pathInsidePins,
  resolveWritingKnowledgePin,
  splitRetrievalLimit,
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

  it('lets @folder add a turn scope without clearing the pinned folder', () => {
    const result = resolveWritingKnowledgePin({
      text: 'search @writing please',
      tree,
      selectedFolder: 'contracts/2024',
    });
    expect(result.pin).toBe('contracts/2024');
    expect(result.pins).toEqual([
      { path: 'contracts/2024', library: 'private' },
      { path: 'writing', library: 'private' },
    ]);
    expect(result.mentionedFolders).toEqual(['writing']);
  });

  it('does not treat @contracts as a folder when the mention is @contracts/2024/plan.docx', () => {
    const result = resolveWritingKnowledgePin({
      text: 'see @contracts/2024/plan.docx',
      tree,
      selectedFolder: 'invoices',
    });
    expect(result.pin).toBe('invoices');
    expect(result.pins).toEqual([
      { path: 'invoices', library: 'private' },
      { path: 'contracts/2024', library: 'private' },
    ]);
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

  it('keeps the pinned folder when @documents do not share a parent', () => {
    const result = resolveWritingKnowledgePin({
      text: 'compare @writing/a.md and @invoices/acme.md',
      tree,
      selectedFolder: 'contracts',
    });
    expect(result.pin).toBe('contracts');
    expect(result.pins).toEqual([{ path: 'contracts', library: 'private' }]);
    expect(result.mentionedDocuments.map((d) => d.fileId).sort()).toEqual([
      'a1',
      'i1',
    ]);
  });

  it('uses the first @folder in left-to-right order', () => {
    const result = resolveWritingKnowledgePin({
      text: 'look in @invoices and @writing',
      tree,
    });
    expect(result.pin).toBe('invoices');
    expect(result.pins).toEqual([
      { path: 'invoices', library: 'private' },
      { path: 'writing', library: 'private' },
    ]);
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
    ).toEqual({
      pin: null,
      pinLibrary: 'private',
      pins: [],
      mentionedFolders: [],
      mentionedDocuments: [],
    });
  });

  it('resolves @public mentions and public selected folders', () => {
    const publicTree: KnowledgeTreeNode = {
      type: 'dir',
      name: '',
      path: '',
      children: [
        {
          type: 'dir',
          name: 'spr',
          path: 'spr',
          wiki: true,
          children: [],
        },
      ],
    };
    const mentioned = resolveWritingKnowledgePin({
      text: 'see @public/spr',
      tree,
      publicTree,
    });
    expect(mentioned.pin).toBe('spr');
    expect(mentioned.pinLibrary).toBe('public');
    const selected = resolveWritingKnowledgePin({
      text: 'hello',
      tree,
      publicTree,
      selectedFolder: 'public:spr',
    });
    expect(selected.pin).toBe('spr');
    expect(selected.pinLibrary).toBe('public');
  });

  it('skips null or undefined mention paths and still uses a pinned folder without @', () => {
    const messy: KnowledgeTreeNode = {
      type: 'dir',
      name: '',
      path: '',
      children: [
        {
          type: 'dir',
          name: 'testing2',
          path: 'testing2',
          children: [
            {
              type: 'file',
              name: 'broken.md',
              path: 'testing2/broken.md',
              file: {
                id: 'x1',
                original_filename: null as unknown as string,
                inbox_relpath: null as unknown as string,
                markdown_relpath: undefined as unknown as string,
                size_bytes: 1,
              },
            },
          ],
        },
        {
          type: 'file',
          name: 'orphan.md',
          path: null as unknown as string,
          file: {
            id: 'x2',
            original_filename: 'orphan.md',
            inbox_relpath: 'orphan.md',
            markdown_relpath: 'orphan.md',
            size_bytes: 1,
          },
        },
      ],
    };
    const publicTree: KnowledgeTreeNode = {
      type: 'dir',
      name: '',
      path: '',
      children: [
        {
          type: 'dir',
          name: 'sfc',
          path: 'sfc',
          children: [
            {
              type: 'file',
              name: 'hidden.md',
              path: 'sfc/hidden.md',
              file: {
                id: 'h1',
                original_filename: null as unknown as string,
                inbox_relpath: null as unknown as string,
                markdown_relpath: 'sfc/hidden.md',
                size_bytes: 1,
              },
            },
          ],
        },
      ],
    };
    let result: ReturnType<typeof resolveWritingKnowledgePin> | undefined;
    expect(() => {
      result = resolveWritingKnowledgePin({
        text: 'list out all the documents',
        tree: messy,
        publicTree,
        selectedFolder: 'testing2',
      });
    }).not.toThrow();
    expect(result?.pin).toBe('testing2');
    expect(result?.pinLibrary).toBe('private');
    expect(result?.mentionedFolders).toEqual([]);
    expect(result?.mentionedDocuments).toEqual([]);
  });

  it('still resolves @mentions when other files have null paths or filenames', () => {
    const messy: KnowledgeTreeNode = {
      ...tree,
      children: [
        ...(tree.children || []),
        {
          type: 'file',
          name: 'broken.md',
          path: 'broken.md',
          file: {
            id: 'z1',
            original_filename: null as unknown as string,
            inbox_relpath: null as unknown as string,
            markdown_relpath: '',
            size_bytes: 1,
          },
        },
      ],
    };
    const folder = resolveWritingKnowledgePin({
      text: 'search @writing please',
      tree: messy,
      selectedFolder: 'testing2',
    });
    expect(folder.pin).toBe('writing');
    expect(folder.mentionedFolders).toEqual(['writing']);
    const document = resolveWritingKnowledgePin({
      text: 'see @writing/a.md',
      tree: messy,
    });
    expect(document.pin).toBe('writing');
    expect(document.mentionedDocuments.map((d) => d.fileId)).toEqual(['a1']);
  });

  it('loads a comma-separated pin list and keeps @ from clearing it', () => {
    const result = resolveWritingKnowledgePin({
      text: 'see @public/spr',
      tree,
      publicTree: {
        type: 'dir',
        name: '',
        path: '',
        children: [
          { type: 'dir', name: 'spr', path: 'spr', wiki: true, children: [] },
        ],
      },
      selectedFolder: 'private:writing,public:spr',
    });
    expect(result.pins).toEqual([
      { path: 'writing', library: 'private' },
      { path: 'spr', library: 'public' },
    ]);
    expect(result.mentionedFolders).toEqual(['spr']);
  });

  it('returns no scopes when nothing is pinned or mentioned', () => {
    const result = resolveWritingKnowledgePin({ text: 'hello', tree });
    expect(result.pin).toBeNull();
    expect(result.pins).toEqual([]);
    expect(result.mentionedFolders).toEqual([]);
    expect(result.mentionedDocuments).toEqual([]);
  });

  const publicTreeWithHidden: KnowledgeTreeNode = {
    type: 'dir',
    name: '',
    path: '',
    children: [
      { type: 'dir', name: 'spr', path: 'spr', wiki: true, children: [] },
      {
        type: 'dir',
        name: 'sfc',
        path: 'sfc',
        children: [
          fileNode('sfc/hidden.md', 'h1', 'hidden.md', 'sfc/hidden.md'),
        ],
      },
    ],
  };

  it('rejects a selected public sfc folder even when it exists on the unfiltered tree', () => {
    const result = resolveWritingKnowledgePin({
      text: 'hello',
      tree,
      publicTree: publicTreeWithHidden,
      selectedFolder: 'public:sfc',
    });
    expect(result.pins).toEqual([]);
    expect(result.pin).toBeNull();
  });

  it('rejects a public pin that is not a directory on the public tree', () => {
    const result = resolveWritingKnowledgePin({
      text: 'hello',
      tree,
      publicTree: publicTreeWithHidden,
      selectedFolder: 'public:missing',
    });
    expect(result.pins).toEqual([]);
  });

  it('does not pin hidden sfc from a legacy documentId', () => {
    const hidden = resolveWritingKnowledgePin({
      text: 'hello',
      tree,
      publicTree: publicTreeWithHidden,
      documentId: 'sfc',
    });
    expect(hidden.pins).toEqual([]);
    expect(hidden.pin).toBeNull();
  });

  it('pins a visible public document slot from a legacy documentId', () => {
    const visible = resolveWritingKnowledgePin({
      text: 'hello',
      tree,
      publicTree: publicTreeWithHidden,
      documentId: 'spr',
    });
    expect(visible.pins).toEqual([{ path: 'spr', library: 'public' }]);
    expect(visible.pinLibrary).toBe('public');
  });
});

describe('pathInsidePins and retrieval budget', () => {
  it('matches a path against any pin', () => {
    expect(pathInsidePins('writing/a.md', ['writing', 'invoices'])).toBe(true);
    expect(pathInsidePins('other/a.md', ['writing', 'invoices'])).toBe(false);
    expect(pathInsidePins('writing/a.md', [])).toBe(false);
    expect(clampPathToPins('writing/a.md', ['writing', 'invoices'])).toBe(
      'writing/a.md',
    );
    expect(clampPathToPins('other', ['writing', 'invoices'])).toBeNull();
    expect(clampPathToPins('invoices', ['contracts/2024'])).toBe('contracts/2024');
  });

  it('splits a retrieval limit across scopes', () => {
    expect(splitRetrievalLimit(5, 1)).toBe(5);
    expect(splitRetrievalLimit(5, 3)).toBe(2);
    expect(splitRetrievalLimit(10, 2)).toBe(5);
  });

});
