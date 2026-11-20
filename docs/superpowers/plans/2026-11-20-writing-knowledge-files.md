# Writing Knowledge Files and Dochub Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the user's Knowledge library as a preview-only FILES tree on Agent Writing, support `@folder` / `@document`, and search that library on every writing turn through in-process Dochub AgentTools.

**Architecture:** This Next.js process is the agent host. Files rail and `@` picker call `/itms/ai/api/knowledge/*` with JWT. The writing agent registers `query`, `get`, `multi_get`, `tree`, `status` that call `dochubClient` with `X-User-Id` from turn context. QMD stays on the Mac. The host computes the folder pin (`@` wins over Files selection) and clamps `path`.

**Tech Stack:** Next.js 15 (basePath `/itms/ai`), Vitest, `@earendil-works/pi-agent-core` `AgentTool`, existing `dochubClient`, `markdown-to-jsx` preview.

**Spec:** `docs/superpowers/specs/2026-11-20-writing-knowledge-files-design.md`

## Global Constraints

- Browser never fetches Dochub or QMD MCP; only `/itms/ai/api/knowledge/*` with Bearer JWT.
- Dochub `X-User-Id` is the JWT user id from middleware `x-user-id`. Ignore any client-supplied user id, including tool args named `user_id`.
- Tool schemas have no `user_id` property. Drop extra `user_id` if the model sends one.
- Do not spawn `python3 -m dochub mcp`.
- Do not add upload, drop, or new-folder on Agent Writing. `/knowledge` stays the manager.
- Do not delete `data/writing-attachments` or `/api/writing/files`.
- Writing `fs_*` is off for this agent. Agent Document keeps `fs_*`.
- Tests: `npx vitest run <file>`. No Playwright unless the user asks (`AGENTS.md`).
- Do not commit `data/config.json`, `tsconfig.tsbuildinfo`, `__pycache__`, or `data/documents/sfc/wiki/_ingest`.
- On Windows PowerShell, write commit messages with UTF-8 **without BOM**:

```powershell
$msg = Join-Path $env:TEMP "commit-msg.txt"
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($msg, "feat: short subject`n", $utf8)
git add <files>
git commit -F $msg
Remove-Item $msg
```

## Review Focus

- `@contracts` inside `@contracts/2024/plan.docx` is not a folder mention; pin is the file's parent `contracts/2024`. Owned by Task 1.
- Model `query.path` of `invoices` while pin is `contracts/2024` stays `contracts/2024`. Owned by Task 4.
- Tool args `{ user_id: "alice" }` with JWT user `1` send `X-User-Id: 1` and never put `user_id` on the schema. Owned by Task 4.
- `getTree` throws on a writing send: the turn still runs; tools return `{ ok: false }`. Owned by Task 6.
- `.chat-workspace:has(.right-panel-open) .writing-left-rail` stays `display: flex` at xl so FILES remains while preview is open. Owned by Task 8.

---

## File map

| File | Responsibility |
|------|----------------|
| `src/lib/knowledge/tree.ts` | Add `flattenKnowledgeNodes`, `findFileByDochubPath` |
| `src/lib/knowledge/writingPin.ts` | Pin/mention resolver, `pathInsidePin`, `clampPathToPin` |
| `src/lib/knowledge/writingPin.test.ts` | Pin unit tests |
| `src/lib/knowledge/dochubQuery.ts` | Map skill `query` args → Dochub `{ query, mode, limit, path? }` |
| `src/lib/knowledge/dochubQuery.test.ts` | Mapping tests |
| `src/lib/knowledge/dochubGet.ts` | Resolve path, fetch markdown, line slice |
| `src/lib/knowledge/dochubGet.test.ts` | Get/slice tests |
| `src/lib/knowledge/dochubClient.ts` | Optional `path` on search; `getHealth` |
| `src/lib/knowledge/dochubClient.test.ts` | Search `path` + health tests |
| `src/lib/search/shared/tools/dochubTools.ts` | Five AgentTools |
| `src/lib/search/shared/tools/dochubTools.test.ts` | Tool isolation tests |
| `src/lib/search/shared/runtime/writingTurnContext.ts` | `{ userId, pin, mentionedDocuments, tree }` |
| `src/lib/search/shared/runtime/bindTurnDochubTools.ts` | Re-enter ALS on tool execute |
| `src/lib/search/shared/runtime/loadWritingTurnContext.ts` | `getTree` + pin resolve; tree null on failure |
| `src/lib/search/shared/prompts/writingTurnPrefix.ts` | Always-on Dochub tools + pin/mention prompt |
| `data/prompts/dochubSkill.md` | Host-adapted Dochub skill |
| `data/prompts/agentWriting.md` | Drop `fs_*` document instructions |
| `src/lib/search/shared/agent/getSharedAgentContext.ts` | Register tools; writing template list |
| `src/lib/search/writingAgent.ts` | Bind Dochub tools; no `bindTurnFsTools` |
| `src/app/api/chat/route.ts` | Load tree, resolve pin, no writing workspace |
| `src/lib/chat/chatBodySchema.ts` | Optional `knowledgeFolder` |
| `src/lib/chat/writingPreviewTabs.ts` | `knowledge:` tab ids + `source` |
| `src/components/WritingPreviewPanel.tsx` | Fetch knowledge markdown |
| `src/components/RightPanelContext.tsx` | `openKnowledgeFile` |
| `src/lib/knowledge/useKnowledgeTree.ts` | Client tree fetch hook |
| `src/components/WritingKnowledgeFiles.tsx` | FILES explorer |
| `src/components/WritingKnowledgeAtMenu.tsx` | `@` picker |
| `src/components/WritingLeftRail.tsx` | Mount FILES |
| `src/components/MessageInput.tsx` / `EmptyChatMessageInput.tsx` | `@` menu |
| `src/lib/hooks/useChat.tsx` | `knowledgeFolder` on send |
| `src/app/globals.css` | FILES rail + keep rail with preview |
| `src/lib/writing/fileBrowserLayout.test.ts` | New FILES contracts |
| `src/lib/search/shared/runtime/bindTurnFsTools.ts` | Drop writing binding |

---

### Task 1: Pin resolver

**Files:**
- Create: `src/lib/knowledge/writingPin.ts`
- Create: `src/lib/knowledge/writingPin.test.ts`
- Modify: `src/lib/knowledge/tree.ts`
- Modify: `src/lib/knowledge/tree.test.ts`

**Interfaces:**
- Consumes: `KnowledgeTreeNode`, `KnowledgeFileMeta`, `isSafeRelativePath`, `nodeAtPath`, `stripQmdMarkdownPath`
- Produces:

```ts
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

export function flattenKnowledgeNodes(root: KnowledgeTreeNode): KnowledgeTreeNode[];
export function findFileByDochubPath(
  root: KnowledgeTreeNode,
  path: string,
): KnowledgeFileMeta | null;

export function pathInsidePin(path: string, pin: string | null): boolean;
export function clampPathToPin(
  path: string | undefined,
  pin: string | null,
): string | null;

export function resolveWritingKnowledgePin(input: {
  text: string;
  tree: KnowledgeTreeNode | null;
  selectedFolder?: string;
}): WritingPinResult;
```

- [ ] **Step 1: Write the failing tests**

Add to `src/lib/knowledge/tree.test.ts` (same `tree` fixture already in that file):

```ts
import { findFileByDochubPath, flattenKnowledgeNodes } from './tree';

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
```

Create `src/lib/knowledge/writingPin.test.ts` with a tree that has `contracts/2024/plan.docx`, `writing/a.md`, `writing/b.md`, `invoices/acme.md`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/knowledge/writingPin.test.ts src/lib/knowledge/tree.test.ts`

Expected: FAIL — `flattenKnowledgeNodes` / `resolveWritingKnowledgePin` not exported.

- [ ] **Step 3: Implement**

In `src/lib/knowledge/tree.ts` add:

```ts
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
```

Create `src/lib/knowledge/writingPin.ts`:

```ts
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

function mentionBoundaryOk(text: string, start: number, end: number): boolean {
  const after = text[end];
  return after === undefined || /[\s,.;:!?)\]]/.test(after);
}

function findCompleteAt(
  lower: string,
  needlePath: string,
): number {
  const needle = `@${needlePath.toLowerCase()}`;
  let from = 0;
  while (from <= lower.length) {
    const idx = lower.indexOf(needle, from);
    if (idx < 0) return -1;
    if (mentionBoundaryOk(lower, idx, idx + needle.length)) return idx;
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
    const needles = [node.path, file.original_filename, file.markdown_relpath, file.inbox_relpath];
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/knowledge/writingPin.test.ts src/lib/knowledge/tree.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```powershell
$msg = Join-Path $env:TEMP "commit-msg.txt"
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($msg, "feat: resolve writing knowledge pin from @ and folder`n", $utf8)
git add src/lib/knowledge/writingPin.ts src/lib/knowledge/writingPin.test.ts src/lib/knowledge/tree.ts src/lib/knowledge/tree.test.ts
git commit -F $msg
Remove-Item $msg
```

---

### Task 2: Search mapping and `path`

**Files:**
- Create: `src/lib/knowledge/dochubQuery.ts`
- Create: `src/lib/knowledge/dochubQuery.test.ts`
- Modify: `src/lib/knowledge/dochubClient.ts`
- Modify: `src/lib/knowledge/dochubClient.test.ts`

**Interfaces:**
- Consumes: `KnowledgeSearchMode`, `isSafeRelativePath`, `DochubDeps`
- Produces:

```ts
export type MappedDochubQuery =
  | {
      ok: true;
      query: string;
      mode: KnowledgeSearchMode;
      limit: number;
      path?: string;
    }
  | { ok: false; error: string };

export function mapDochubQueryArgs(args: unknown): MappedDochubQuery;

export async function search(
  userId: string,
  input: {
    query: string;
    mode: KnowledgeSearchMode;
    limit: number;
    path?: string;
  },
  deps?: DochubDeps,
): Promise<{ user_id: string; mode: string; query: string; results: unknown[] }>;

export async function getHealth(
  deps?: DochubDeps,
): Promise<{ ok: boolean; service?: string }>;
```

- [ ] **Step 1: Write the failing tests**

`src/lib/knowledge/dochubQuery.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { mapDochubQueryArgs } from './dochubQuery';

describe('mapDochubQueryArgs', () => {
  it('maps lex-only searches to mode search', () => {
    expect(
      mapDochubQueryArgs({
        searches: [{ type: 'lex', query: 'quarterly plan' }],
        limit: 5,
      }),
    ).toEqual({
      ok: true,
      query: 'quarterly plan',
      mode: 'search',
      limit: 5,
    });
  });

  it('maps vec-only searches to vsearch', () => {
    expect(
      mapDochubQueryArgs({
        searches: [{ type: 'vec', query: 'cockpit instruments' }],
      }),
    ).toMatchObject({ ok: true, mode: 'vsearch', query: 'cockpit instruments', limit: 5 });
  });

  it('maps mixed searches to query mode using intent', () => {
    expect(
      mapDochubQueryArgs({
        intent: 'Find the OKR note',
        searches: [
          { type: 'lex', query: 'OKR' },
          { type: 'hyde', query: 'A note about quarterly OKRs' },
        ],
        limit: 10,
      }),
    ).toMatchObject({ ok: true, mode: 'query', query: 'Find the OKR note', limit: 10 });
  });

  it('prefers searches over a bare query string', () => {
    expect(
      mapDochubQueryArgs({
        query: 'ignored',
        searches: [{ type: 'lex', query: 'kept' }],
      }),
    ).toMatchObject({ ok: true, query: 'kept', mode: 'search' });
  });

  it('uses a bare query string when there are no searches', () => {
    expect(mapDochubQueryArgs({ query: 'hello', mode: 'vsearch' })).toMatchObject({
      ok: true,
      query: 'hello',
      mode: 'vsearch',
    });
  });

  it('returns query is required when empty', () => {
    expect(mapDochubQueryArgs({})).toEqual({
      ok: false,
      error: 'query is required',
    });
    expect(mapDochubQueryArgs({ user_id: 'alice' }).ok).toBe(false);
  });

  it('clamps limit to 1..10 and keeps a safe path', () => {
    expect(mapDochubQueryArgs({ query: 'q', limit: 99 })).toMatchObject({
      ok: true,
      limit: 10,
    });
    expect(mapDochubQueryArgs({ query: 'q', path: 'contracts/2024' })).toMatchObject({
      ok: true,
      path: 'contracts/2024',
    });
    expect(mapDochubQueryArgs({ query: 'q', path: '../etc' }).path).toBeUndefined();
  });
});
```

Add to `dochubClient.test.ts`:

```ts
it('forwards optional search path and omits it when unset', async () => {
  const fetchMock = vi.fn(async () =>
    jsonResponse(200, { user_id: '1', mode: 'search', query: 'q', results: [] }),
  );
  await search(
    '1',
    { query: 'q', mode: 'search', limit: 5, path: 'contracts/2024' },
    { fetch: fetchMock, config },
  );
  expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
    query: 'q',
    mode: 'search',
    limit: 5,
    path: 'contracts/2024',
  });
  fetchMock.mockClear();
  await search('1', { query: 'q', mode: 'search', limit: 5 }, { fetch: fetchMock, config });
  expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
    query: 'q',
    mode: 'search',
    limit: 5,
  });
});

it('getHealth calls /health without X-User-Id', async () => {
  const fetchMock = vi.fn(async () => jsonResponse(200, { ok: true, service: 'dochub' }));
  await expect(getHealth({ fetch: fetchMock, config })).resolves.toEqual({
    ok: true,
    service: 'dochub',
  });
  expect(String(fetchMock.mock.calls[0][0])).toBe('http://dochub.test/health');
  expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get('X-User-Id')).toBeNull();
});
```

Import `getHealth` next to `search`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/knowledge/dochubQuery.test.ts src/lib/knowledge/dochubClient.test.ts`

Expected: FAIL — `mapDochubQueryArgs` / `getHealth` missing; search body has no `path`.

- [ ] **Step 3: Implement**

`src/lib/knowledge/dochubQuery.ts`:

```ts
import { isSafeRelativePath } from './paths';
import type { KnowledgeSearchMode } from './types';

const MODES = new Set<KnowledgeSearchMode>(['search', 'vsearch', 'query']);

export type MappedDochubQuery =
  | {
      ok: true;
      query: string;
      mode: KnowledgeSearchMode;
      limit: number;
      path?: string;
    }
  | { ok: false; error: string };

function asRecord(args: unknown): Record<string, unknown> {
  return args && typeof args === 'object' ? (args as Record<string, unknown>) : {};
}

function clampLimit(value: unknown): number {
  const n = typeof value === 'number' && Number.isInteger(value) ? value : 5;
  return Math.min(10, Math.max(1, n));
}

export function mapDochubQueryArgs(args: unknown): MappedDochubQuery {
  const rec = asRecord(args);
  const searches = Array.isArray(rec.searches) ? rec.searches : null;
  let query = '';
  let mode: KnowledgeSearchMode = 'query';

  if (searches && searches.length > 0) {
    const typed = searches
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const row = item as Record<string, unknown>;
        const type = typeof row.type === 'string' ? row.type : '';
        const q = typeof row.query === 'string' ? row.query.trim() : '';
        return q ? { type, query: q } : null;
      })
      .filter((row): row is { type: string; query: string } => Boolean(row));
    const types = new Set(typed.map((row) => row.type));
    const joined = typed.map((row) => row.query).join(' ').trim();
    const intent = typeof rec.intent === 'string' ? rec.intent.trim() : '';
    const hyde = typed.find((row) => row.type === 'hyde')?.query || '';
    if (types.size === 1 && types.has('lex')) {
      mode = 'search';
      query = joined;
    } else if (types.size === 1 && types.has('vec')) {
      mode = 'vsearch';
      query = joined;
    } else {
      mode = 'query';
      query = intent || hyde || joined;
    }
  } else if (typeof rec.query === 'string' && rec.query.trim()) {
    query = rec.query.trim();
    mode =
      typeof rec.mode === 'string' && MODES.has(rec.mode as KnowledgeSearchMode)
        ? (rec.mode as KnowledgeSearchMode)
        : 'query';
  }

  if (!query) return { ok: false, error: 'query is required' };

  const mapped: MappedDochubQuery = {
    ok: true,
    query,
    mode,
    limit: clampLimit(rec.limit),
  };
  if (typeof rec.path === 'string' && isSafeRelativePath(rec.path)) {
    mapped.path = rec.path;
  }
  return mapped;
}
```

Change `search` in `dochubClient.ts` so the JSON body is `{ query, mode, limit }` plus `path` only when `input.path` is a non-empty string.

Add `getHealth`:

```ts
export async function getHealth(
  deps?: DochubDeps,
): Promise<{ ok: boolean; service?: string }> {
  const { fetch: doFetch, config } = depsOf(deps);
  if (!isDochubConfigured(config)) throw unavailableError();
  try {
    const res = await doFetch(`${config.baseUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(config.timeoutMs),
    });
    const body = await readJson(res);
    const rec = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
    return {
      ok: rec.ok === true,
      service: typeof rec.service === 'string' ? rec.service : undefined,
    };
  } catch {
    throw unavailableError();
  }
}
```

`getHealth` must not set `X-User-Id` (do not use `send()`).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/knowledge/dochubQuery.test.ts src/lib/knowledge/dochubClient.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```powershell
$msg = Join-Path $env:TEMP "commit-msg.txt"
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($msg, "feat: map Dochub query args and forward search path`n", $utf8)
git add src/lib/knowledge/dochubQuery.ts src/lib/knowledge/dochubQuery.test.ts src/lib/knowledge/dochubClient.ts src/lib/knowledge/dochubClient.test.ts
git commit -F $msg
Remove-Item $msg
```

---

### Task 3: Markdown get and line slice

**Files:**
- Create: `src/lib/knowledge/dochubGet.ts`
- Create: `src/lib/knowledge/dochubGet.test.ts`

**Interfaces:**
- Consumes: `findFileByDochubPath`, `pathInsidePin`, `parseFsReadLocator`, `getFileContent`, `WritingMentionedDocument`, `stripQmdMarkdownPath`
- Produces:

```ts
export type DochubGetResult =
  | {
      ok: true;
      dochub_path: string;
      text: string;
      fromLine: number;
      lineCount: number;
    }
  | { ok: false; error: string };

export function sliceMarkdownLines(
  markdown: string,
  fromLine: number,
  maxLines: number,
): { text: string; fromLine: number; lineCount: number };

export async function getDochubMarkdown(opts: {
  userId: string;
  tree: KnowledgeTreeNode | null;
  pin: string | null;
  mentionedDocuments: WritingMentionedDocument[];
  file: string;
  fromLine?: unknown;
  maxLines?: unknown;
  deps?: DochubDeps;
}): Promise<DochubGetResult>;
```

Constants: default peek 80 lines; byte cap `200 * 1024`. From-only suffix (`path:120`) reads to end, then byte-caps. `fromLine` / `maxLines` args override a suffix.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it, vi } from 'vitest';
import { getDochubMarkdown, sliceMarkdownLines } from './dochubGet';
import type { KnowledgeTreeNode } from './types';

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
          type: 'file',
          name: 'plan.docx',
          path: 'contracts/plan.docx',
          file: {
            id: 'p1',
            original_filename: 'plan.docx',
            inbox_relpath: 'contracts/plan.docx',
            markdown_relpath: 'contracts/plan.md',
            size_bytes: 10,
          },
        },
      ],
    },
    {
      type: 'file',
      name: 'other.md',
      path: 'other.md',
      file: {
        id: 'o1',
        original_filename: 'other.md',
        inbox_relpath: 'other.md',
        markdown_relpath: 'other.md',
        size_bytes: 10,
      },
    },
  ],
};

describe('sliceMarkdownLines', () => {
  it('numbers a peek starting at fromLine', () => {
    const md = ['a', 'b', 'c', 'd'].join('\n');
    const sliced = sliceMarkdownLines(md, 2, 2);
    expect(sliced.text).toBe('2|b\n3|c');
    expect(sliced.fromLine).toBe(2);
    expect(sliced.lineCount).toBe(2);
  });
});

describe('getDochubMarkdown', () => {
  it('resolves path, slices, and allows a mentioned file outside the pin', async () => {
    const getFileContent = vi.fn(async () => ({
      bytes: new TextEncoder().encode('one\ntwo\nthree\nfour'),
      contentType: 'text/markdown',
    }));
    const mentioned = [
      {
        fileId: 'o1',
        path: 'other.md',
        name: 'other.md',
        markdownRelpath: 'other.md',
      },
    ];
    const hit = await getDochubMarkdown({
      userId: '1',
      tree,
      pin: 'contracts',
      mentionedDocuments: mentioned,
      file: 'other.md:2:2',
      deps: { getFileContent },
    });
    expect(hit).toMatchObject({
      ok: true,
      dochub_path: 'other.md',
      text: '2|two\n3|three',
    });
    expect(getFileContent).toHaveBeenCalledWith('1', 'o1', 'markdown');
  });

  it('rejects a path outside the pin when it was not mentioned', async () => {
    const result = await getDochubMarkdown({
      userId: '1',
      tree,
      pin: 'contracts',
      mentionedDocuments: [],
      file: 'other.md',
      deps: { getFileContent: vi.fn() },
    });
    expect(result.ok).toBe(false);
  });

  it('returns unavailable when tree is null', async () => {
    const result = await getDochubMarkdown({
      userId: '1',
      tree: null,
      pin: null,
      mentionedDocuments: [],
      file: 'other.md',
    });
    expect(result).toEqual({
      ok: false,
      error: 'Knowledge library is unavailable.',
    });
  });
});
```

Give `getDochubMarkdown` an injectable `getFileContent` in `deps` so tests do not hit the network. Extend `DochubDeps` locally in `dochubGet.ts`:

```ts
export type DochubGetDeps = DochubDeps & {
  getFileContent?: typeof getFileContent;
};
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/knowledge/dochubGet.test.ts`

Expected: FAIL — module missing.

- [ ] **Step 3: Implement**

`src/lib/knowledge/dochubGet.ts`:

- Parse `file` with `parseFsReadLocator` after `stripQmdMarkdownPath` on the raw string (locator keeps `:from:count`).
- Default range: `fromLine = locator.fromLine ?? 1`. If locator/args have `maxLines`, use it; if only `fromLine` (no maxLines), use `Number.MAX_SAFE_INTEGER` then byte-cap. If neither, `maxLines = 80`. Args override suffix via `asPositiveInt`.
- Resolve with `findFileByDochubPath`. Missing → `{ ok: false, error: 'file not found' }`.
- Allow when `pathInsidePin(file.markdown_relpath || node path, pin)` OR mentionedDocuments contains that `fileId` / `markdownRelpath` / `path`.
- Else `{ ok: false, error: 'path is outside the pinned folder' }`.
- `getFileContent(userId, file.id, 'markdown')`, decode UTF-8, `sliceMarkdownLines`.
- Prefix each kept line with `${lineNumber}|`.
- While `Buffer.byteLength(text, 'utf8') > 200 * 1024`, drop the last line.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/knowledge/dochubGet.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```powershell
$msg = Join-Path $env:TEMP "commit-msg.txt"
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($msg, "feat: get knowledge markdown by path with line slices`n", $utf8)
git add src/lib/knowledge/dochubGet.ts src/lib/knowledge/dochubGet.test.ts
git commit -F $msg
Remove-Item $msg
```

---

### Task 4: Dochub AgentTools

**Files:**
- Create: `src/lib/search/shared/tools/dochubTools.ts`
- Create: `src/lib/search/shared/tools/dochubTools.test.ts`

**Interfaces:**
- Consumes: `getWritingTurnContext`, `mapDochubQueryArgs`, `clampPathToPin`, `search`, `getDochubMarkdown`, `getHealth`, `getTree`, `nodeAtPath`, `jsonToolResult`, `stripQmdMarkdownPath`
- Produces:

```ts
export const DOCHUB_TOOL_NAMES = [
  'query',
  'get',
  'multi_get',
  'tree',
  'status',
] as const;

export function createDochubTools(deps?: {
  search?: typeof search;
  getDochubMarkdown?: typeof getDochubMarkdown;
  getHealth?: typeof getHealth;
  getTree?: typeof getTree;
}): AgentTool[];
```

Tool schemas must not include `user_id`. Execute reads `getWritingTurnContext()`. Missing `userId` → `{ ok: false, error: 'No user bound' }`. Extra `user_id` in args is ignored.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it, vi } from 'vitest';
import { runWithWritingTurn } from '../runtime/writingTurnContext';
import { createDochubTools } from './dochubTools';

const tree = {
  type: 'dir' as const,
  name: '',
  path: '',
  children: [
    {
      type: 'dir' as const,
      name: 'contracts',
      path: 'contracts',
      children: [],
    },
  ],
};

const ctx = {
  userId: '1',
  pin: 'contracts/2024',
  mentionedDocuments: [] as const,
  tree,
};

describe('createDochubTools', () => {
  it('does not put user_id on any schema', () => {
    for (const tool of createDochubTools()) {
      const params = JSON.stringify(tool.parameters);
      expect(params).not.toMatch(/user_id/);
      expect(tool.name).toMatch(/^(query|get|multi_get|tree|status)$/);
    }
  });

  it('sends JWT user id and clamped path on query', async () => {
    const search = vi.fn(async () => ({
      user_id: '1',
      mode: 'search',
      query: 'plan',
      results: [{ file: 'qmd://markdown/contracts/2024/plan.md', line: 12 }],
    }));
    const tools = createDochubTools({ search });
    const query = tools.find((t) => t.name === 'query')!;
    const result = await runWithWritingTurn(ctx, () =>
      query.execute('id', {
        searches: [{ type: 'lex', query: 'plan' }],
        path: 'invoices',
        user_id: 'alice',
      }),
    );
    expect(search).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({
        query: 'plan',
        mode: 'search',
        path: 'contracts/2024',
      }),
    );
    const details = result.details as { results: Array<{ file: string }> };
    expect(details.results[0].file).toBe('contracts/2024/plan.md');
  });

  it('omits path when the turn is unpinned', async () => {
    const search = vi.fn(async () => ({
      user_id: '1',
      mode: 'query',
      query: 'hi',
      results: [],
    }));
    const tools = createDochubTools({ search });
    const query = tools.find((t) => t.name === 'query')!;
    await runWithWritingTurn(
      { ...ctx, pin: null },
      () => query.execute('id', { query: 'hi' }),
    );
    const body = search.mock.calls[0][1] as { path?: string };
    expect(body.path).toBeUndefined();
  });

  it('returns No user bound outside a turn', async () => {
    const query = createDochubTools()[0];
    const result = await query.execute('id', { query: 'hi' });
    expect(result.details).toMatchObject({
      ok: false,
      error: 'No user bound',
    });
  });
});
```

These tests need the Task 5 `WritingTurnContext` shape. If `writingTurnContext.ts` still has `rootAbs`, **update the type in this task** to:

```ts
export type WritingTurnContext = {
  userId: string;
  pin: string | null;
  mentionedDocuments: WritingMentionedDocument[];
  tree: KnowledgeTreeNode | null;
};
```

and fix compile errors in `bindTurnFsTools` / tests in the same step (remove the `writing` branch from `bindTurnFsTools`; keep document binding). See Task 5 for the exact type — do that type change here if the compiler requires it, then Task 5 only rewrites prompts.

Prefer: change the context type in **this** task so tools compile, and immediately fix `bindTurnFsTools.ts` + `bindTurnFsTools.test.ts` + `writingTurnContext.test.ts` + `writingTurnPrefix.test.ts` + `chat/route.ts` so `npx vitest run` of this file and the touched tests pass.

Minimum type fix if you hit errors before Task 5/6:

- `writingTurnContext.ts` as above.
- `bindTurnFsTools.ts`: delete `writing` from `TurnFsBinding`; wrap only `document`.
- `bindTurnFsTools.test.ts`: delete the two tests that pass `writing: { rootAbs }`.
- `writingTurnContext.test.ts`: use `{ userId, pin: 'a', mentionedDocuments: [], tree: null }` instead of `rootAbs`.
- `writingTurnPrefix.test.ts` and `chat/route.ts`: temporary stubs (`pin: null, mentionedDocuments: [], tree: null`) so TypeScript compiles. Task 5/6 replace the stubs with real behavior.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/search/shared/tools/dochubTools.test.ts`

Expected: FAIL — `createDochubTools` missing.

- [ ] **Step 3: Implement `createDochubTools`**

Pattern: same as `createEsBm25SearchTool` / `createHtmlGetTool` (`Type.Object`, `jsonToolResult`).

`query`: `mapDochubQueryArgs` → `clampPathToPin(mapped.path, ctx.pin)` → `search(ctx.userId, { query, mode, limit, ...(path ? { path } : {}) })`. Strip `qmd://markdown/` on each result `file`. Catch errors → `{ ok: false, error: message }`.

`get`: read `file`, `fromLine`, `maxLines`; call `getDochubMarkdown({ userId: ctx.userId, tree: ctx.tree, pin: ctx.pin, mentionedDocuments: ctx.mentionedDocuments, file, fromLine, maxLines })`.

`multi_get`: `files` string or string[]; split commas; max 10; last-segment glob `folder/*.md` expands via `nodeAtPath(ctx.tree, folder)` children names (not recursive). Each path calls `getDochubMarkdown`. Return `{ ok: true, files: DochubGetResult[] }`.

`tree`: if `ctx.tree` is null, `{ ok: false, error: 'Knowledge library is unavailable.' }`. Clamp optional args `path` with `clampPathToPin`. Return `nodeAtPath(ctx.tree, path || ctx.pin || '')` or empty `{ type:'dir', name:'', path:'', children:[] }`.

`status`: `{ ok, bound: true, pin: ctx.pin, service? }` from `getHealth`. Never include `userId`. Health throw → `{ ok: false, bound: true, pin: ctx.pin }`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/search/shared/tools/dochubTools.test.ts src/lib/search/shared/runtime/bindTurnFsTools.test.ts src/lib/search/shared/runtime/writingTurnContext.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```powershell
$msg = Join-Path $env:TEMP "commit-msg.txt"
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($msg, "feat: add in-process Dochub agent tools`n", $utf8)
git add src/lib/search/shared/tools/dochubTools.ts src/lib/search/shared/tools/dochubTools.test.ts src/lib/search/shared/runtime/writingTurnContext.ts src/lib/search/shared/runtime/bindTurnFsTools.ts src/lib/search/shared/runtime/bindTurnFsTools.test.ts src/lib/search/shared/runtime/writingTurnContext.test.ts src/lib/search/shared/prompts/writingTurnPrefix.test.ts src/app/api/chat/route.ts
git commit -F $msg
Remove-Item $msg
```

Only `git add` files you actually changed.

---

### Task 5: Prompts, skill, and turn prefix

**Files:**
- Create: `data/prompts/dochubSkill.md`
- Modify: `data/prompts/agentWriting.md`
- Modify: `src/lib/search/shared/prompts/writingAgentSystemPrompt.ts`
- Modify: `src/lib/search/shared/prompts/writingTurnPrefix.ts`
- Modify: `src/lib/search/shared/prompts/writingTurnPrefix.test.ts`
- Create: `src/lib/search/shared/prompts/writingDochubPrompt.test.ts` (contract)

**Interfaces:**
- Consumes: `WritingTurnContext`, `WritingMentionedDocument`
- Produces:

```ts
export const WRITING_DOCHUB_TOOLS = [
  'query', 'get', 'multi_get', 'tree', 'status',
];
export const READ_SKILL_TOOL = 'read_skill';
export const AM_RENDER_TOOL = 'am_render';

export function writingToolsForTurn(): string[];
export function buildWritingUserPrompt(
  userMessage: string,
  ctx?: WritingTurnContext,
): string;
```

Delete `writingFsToolsForTurn` / `WRITING_FS_TOOLS` / `loadWritingIndexMd`.

- [ ] **Step 1: Write the failing tests**

Replace `writingTurnPrefix.test.ts` with:

```ts
import { describe, expect, it } from 'vitest';
import {
  buildWritingUserPrompt,
  writingToolsForTurn,
} from './writingTurnPrefix';
import type { WritingTurnContext } from '../runtime/writingTurnContext';

const ctx: WritingTurnContext = {
  userId: '1',
  pin: 'contracts/2024',
  mentionedDocuments: [
    {
      fileId: 'p1',
      path: 'contracts/2024/plan.docx',
      name: 'plan.docx',
      markdownRelpath: 'contracts/2024/plan.md',
    },
  ],
  tree: { type: 'dir', name: '', path: '', children: [] },
};

describe('writingToolsForTurn', () => {
  it('always returns Dochub tools plus read_skill and am_render', () => {
    expect(writingToolsForTurn()).toEqual([
      'query',
      'get',
      'multi_get',
      'tree',
      'status',
      'read_skill',
      'am_render',
    ]);
  });
});

describe('buildWritingUserPrompt', () => {
  it('returns only the user request without context', () => {
    expect(buildWritingUserPrompt('Draft a memo')).toBe(
      '[User request]\nDraft a memo',
    );
  });

  it('adds pin and mention notes and does not inject file bodies', () => {
    const prompt = buildWritingUserPrompt('季度規劃喺邊份合約', ctx);
    expect(prompt).toContain('[Pinned folder]\ncontracts/2024');
    expect(prompt).toContain('[Mentioned documents]');
    expect(prompt).toContain('contracts/2024/plan.md');
    expect(prompt).toContain('plan.docx');
    expect(prompt).toContain('[User request]\n季度規劃喺邊份合約');
    expect(prompt).not.toMatch(/fs_/);
    expect(prompt).not.toContain('[Attachments]');
    expect(prompt).not.toContain('# ');
  });
});
```

`src/lib/search/shared/prompts/writingDochubPrompt.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { WRITING_AGENT_SYSTEM_PROMPT } from './writingAgentSystemPrompt';

function readRepo(...parts: string[]) {
  return readFileSync(path.join(process.cwd(), ...parts), 'utf8');
}

describe('writing Dochub skill', () => {
  it('prepends the skill and drops fs_* document instructions', () => {
    expect(WRITING_AGENT_SYSTEM_PROMPT).toMatch(/query → get/);
    expect(WRITING_AGENT_SYSTEM_PROMPT).toMatch(/Never pass `user_id`/);
    expect(WRITING_AGENT_SYSTEM_PROMPT).not.toMatch(/fs_ls/);
    expect(WRITING_AGENT_SYSTEM_PROMPT).not.toMatch(/INDEX\.md/);
    const skill = readRepo('data/prompts/dochubSkill.md');
    expect(skill).toMatch(/in-process/);
    expect(skill).not.toMatch(/python -m dochub mcp/);
    const writing = readRepo('data/prompts/agentWriting.md');
    expect(writing).not.toMatch(/fs_/);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/search/shared/prompts/writingTurnPrefix.test.ts src/lib/search/shared/prompts/writingDochubPrompt.test.ts`

Expected: FAIL — still `fs_*` tools / prompt.

- [ ] **Step 3: Implement prompts**

Write `data/prompts/dochubSkill.md` as the host-adapted skill (full file). Do not mention `python -m dochub mcp`. Include the literal phrases `in-process`, `Never pass user_id`, and `query → get`. Also include structured `searches` (lex / vec / hyde), `path:from:count` locators, and that extra `path` stays inside the host pin. The system-prompt contract test matches `Never pass \`user_id\`` so keep those backticks in the skill body.

Replace `data/prompts/agentWriting.md` Attachments section with:

```
Documents:
- This user has a Knowledge library. Use query then get (Dochub tools) when the question needs those documents.
- A [Pinned folder] or [Mentioned documents] note is a search scope. Do not invent quotes from snippets.
- Keep HTML explainer behavior: call read_skill then am_render when the user wants a visual explainer page.
- Do not mention tool names or folder paths in the user-visible reply unless the user asked where a fact came from (then cite dochub_path).
```

`writingAgentSystemPrompt.ts`: prepend `loadPrompt('dochubSkill.md', fallbackSkill)` before the writing prompt inside `withSkillsCatalog`. Update the inline fallback: no `fs_*`. Keep language and drafting rules.

In `src/lib/html/htmlComposer.test.ts`, change the writingTurnPrefix assertion from `[...fsTools, READ_SKILL_TOOL, AM_RENDER_TOOL]` to `[...WRITING_DOCHUB_TOOLS, READ_SKILL_TOOL, AM_RENDER_TOOL]`. Leave the document-agent `FS_TOOLS` assertion unchanged.

`writingTurnPrefix.ts`:

```ts
export const WRITING_DOCHUB_TOOLS = [
  'query',
  'get',
  'multi_get',
  'tree',
  'status',
];
export const READ_SKILL_TOOL = 'read_skill';
export const AM_RENDER_TOOL = 'am_render';

export function writingToolsForTurn(): string[] {
  return [...WRITING_DOCHUB_TOOLS, READ_SKILL_TOOL, AM_RENDER_TOOL];
}

export function buildWritingUserPrompt(
  userMessage: string,
  ctx: WritingTurnContext | undefined = getWritingTurnContext(),
): string {
  const question = `[User request]\n${userMessage}`;
  if (!ctx) return question;
  const blocks: string[] = [];
  if (ctx.pin) blocks.push(`[Pinned folder]\n${ctx.pin}\n`);
  if (ctx.mentionedDocuments.length) {
    const lines = ctx.mentionedDocuments
      .map((doc) => `- \`${doc.markdownRelpath || doc.path}\` — ${doc.name}`)
      .join('\n');
    blocks.push(
      `[Mentioned documents]\nThe user @-mentioned these files. After query, get them (and the search hits). Do not invent quotes from snippets.\n${lines}\n`,
    );
  }
  return blocks.length ? `${blocks.join('\n')}\n${question}` : question;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/search/shared/prompts/writingTurnPrefix.test.ts src/lib/search/shared/prompts/writingDochubPrompt.test.ts src/lib/html/htmlComposer.test.ts`

Expected: PASS. Document-agent template in `htmlComposer.test.ts` still lists `fs_*`.

- [ ] **Step 5: Commit**

```powershell
$msg = Join-Path $env:TEMP "commit-msg.txt"
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($msg, "feat: add Dochub skill to the writing agent prompt`n", $utf8)
git add data/prompts/dochubSkill.md data/prompts/agentWriting.md src/lib/search/shared/prompts/writingAgentSystemPrompt.ts src/lib/search/shared/prompts/writingTurnPrefix.ts src/lib/search/shared/prompts/writingTurnPrefix.test.ts src/lib/search/shared/prompts/writingDochubPrompt.test.ts src/lib/html/htmlComposer.test.ts
git commit -F $msg
Remove-Item $msg
```

---

### Task 6: Chat and agent wiring

**Files:**
- Create: `src/lib/search/shared/runtime/bindTurnDochubTools.ts`
- Create: `src/lib/search/shared/runtime/bindTurnDochubTools.test.ts`
- Create: `src/lib/search/shared/runtime/loadWritingTurnContext.ts`
- Create: `src/lib/search/shared/runtime/loadWritingTurnContext.test.ts`
- Modify: `src/lib/search/shared/agent/getSharedAgentContext.ts`
- Modify: `src/lib/search/writingAgent.ts`
- Modify: `src/app/api/chat/route.ts`
- Modify: `src/lib/chat/chatBodySchema.ts`
- Modify: `src/lib/chat/chatBodySchema.test.ts`
- Create: `src/lib/search/writingAgent.wiring.test.ts`

**Interfaces:**
- Consumes: `createDochubTools`, `resolveWritingKnowledgePin`, `getTree`, `runWithWritingTurn`, `writingToolsForTurn`
- Produces:

```ts
export function bindTurnDochubTools(
  agent: PooledAgent,
  ctx: WritingTurnContext,
): () => void;

export async function loadWritingTurnContext(opts: {
  userId: string;
  text: string;
  selectedFolder?: string;
  loadTree?: typeof getTree;
}): Promise<WritingTurnContext>;
```

Chat body: `knowledgeFolder?: string`.

- [ ] **Step 1: Write the failing tests**

`bindTurnDochubTools.test.ts` (copy the fakeAgent helper from `bindTurnFsTools.test.ts`):

```ts
it('re-enters writing context during query after the outer turn is gone', async () => {
  let seen: string | undefined;
  const agent = fakeAgent([
    {
      name: 'query',
      execute: async () => {
        seen = getWritingTurnContext()?.userId;
        return { ok: true };
      },
    } as PooledAgent['state']['tools'][number],
  ]);
  const restore = bindTurnDochubTools(agent, {
    userId: '1',
    pin: null,
    mentionedDocuments: [],
    tree: null,
  });
  expect(getWritingTurnContext()).toBeUndefined();
  await (agent.state.tools[0] as { execute: () => Promise<unknown> }).execute();
  expect(seen).toBe('1');
  restore();
});
```

`chatBodySchema.test.ts`:

```ts
it('accepts optional knowledgeFolder', () => {
  const result = parseChatBody({
    ...validWritingBody,
    knowledgeFolder: 'contracts/2024',
  });
  expect(result.success).toBe(true);
  if (result.success) expect(result.data.knowledgeFolder).toBe('contracts/2024');
});
```

`loadWritingTurnContext.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { loadWritingTurnContext } from './loadWritingTurnContext';
import type { KnowledgeTreeNode } from '@/lib/knowledge/types';

const tree: KnowledgeTreeNode = {
  type: 'dir',
  name: '',
  path: '',
  children: [
    {
      type: 'dir',
      name: 'writing',
      path: 'writing',
      children: [],
    },
  ],
};

it('resolves pin from a loaded tree', async () => {
  const ctx = await loadWritingTurnContext({
    userId: '1',
    text: 'hello',
    selectedFolder: 'writing',
    loadTree: async () => ({ user_id: '1', tree }),
  });
  expect(ctx).toMatchObject({ userId: '1', pin: 'writing', tree });
});

it('still returns a turn when getTree throws', async () => {
  const ctx = await loadWritingTurnContext({
    userId: '1',
    text: '@writing hello',
    selectedFolder: 'writing',
    loadTree: async () => {
      throw new Error('ECONNREFUSED');
    },
  });
  expect(ctx).toEqual({
    userId: '1',
    pin: null,
    mentionedDocuments: [],
    tree: null,
  });
});
```

`writingAgent.wiring.test.ts` (readFileSync):

```ts
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readSrc(...parts: string[]) {
  return readFileSync(path.join(__dirname, ...parts), 'utf8');
}

describe('writing agent Dochub wiring', () => {
  it('registers Dochub tools and does not bind fs tools', () => {
    const ctx = readSrc('shared/agent/getSharedAgentContext.ts');
    expect(ctx).toMatch(/createDochubTools/);
    expect(ctx).toMatch(/'query', 'get', 'multi_get', 'tree', 'status'/);
    const agent = readSrc('writingAgent.ts');
    expect(agent).toMatch(/bindTurnDochubTools/);
    expect(agent).not.toMatch(/bindTurnFsTools/);
    const route = readFileSync(
      path.join(__dirname, '../../../app/api/chat/route.ts'),
      'utf8',
    );
    expect(route).toMatch(/loadWritingTurnContext/);
    expect(route).not.toMatch(/ensureUserWritingWorkspace/);
    expect(ctx).toMatch(/SHARED_AGENT_CONTEXT_REV = 14/);
  });
});
```

The template tools line in `getSharedAgentContext.ts` may be split; if the source uses `WRITING_DOCHUB_TOOLS`, assert that identifier instead of the string list.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/search/shared/runtime/bindTurnDochubTools.test.ts src/lib/search/shared/runtime/loadWritingTurnContext.test.ts src/lib/chat/chatBodySchema.test.ts src/lib/search/writingAgent.wiring.test.ts`

Expected: FAIL

- [ ] **Step 3: Implement wiring**

`bindTurnDochubTools.ts`: wrap tools named `query|get|multi_get|tree|status` so `execute` runs inside `runWithWritingTurn(ctx, ...)`. Restore original `agent.state.tools` on cleanup. Mirror `bindTurnFsTools.ts` (map `agent.state.tools`, keep a restore closure).

`loadWritingTurnContext.ts`: call `opts.loadTree ?? getTree` with `opts.userId`. On throw, `tree = null`. Then `resolveWritingKnowledgePin({ text, tree, selectedFolder })` and return `{ userId, pin, mentionedDocuments, tree }`.

`getSharedAgentContext.ts`:

```ts
const dochubTools = createDochubTools();
for (const tool of dochubTools) tools[tool.name] = tool;
```

```ts
'writing-agent-template': {
  id: 'writing-agent-template',
  systemPrompt: WRITING_AGENT_SYSTEM_PROMPT,
  tools: ['query', 'get', 'multi_get', 'tree', 'status', 'read_skill', 'am_render'],
},
```

Bump `SHARED_AGENT_CONTEXT_REV` from `13` to `14`.

In `htmlComposer.test.ts` the writing+document tools assertion currently matches `fs_ls` on both templates. Split it: document-agent-template still has `fs_ls`…`am_render`; writing-agent-template has `query`, `get`, `multi_get`, `tree`, `status`, `read_skill`, `am_render`. Expect `SHARED_AGENT_CONTEXT_REV = 14`.

`getProjectRootAbs`: `() => getDocumentTurnContext()?.rootAbs` (writing has no `rootAbs`).

`writingAgent.ts`: `const tools = writingToolsForTurn();` (no message/ctx args). Replace `bindTurnFsTools` with `bindTurnDochubTools(agent, writingCtx)` when `writingCtx` is set; restore in `finally`. Keep `bindTurnHtmlTool`.

`chatBodySchema.ts`: add `knowledgeFolder: z.string().optional()`.

`chat/route.ts` writing branch:

```ts
} else if (body.focusMode === 'agentWriting') {
  const writingTurn = await loadWritingTurnContext({
    userId,
    text: body.message.content,
    selectedFolder: body.knowledgeFolder,
  });
  stream = await withHtml(() => runWithWritingTurn(writingTurn, runSearch));
}
```

Remove `ensureUserWritingWorkspace` import if unused.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/search/shared/runtime/bindTurnDochubTools.test.ts src/lib/search/shared/runtime/loadWritingTurnContext.test.ts src/lib/chat/chatBodySchema.test.ts src/lib/search/writingAgent.wiring.test.ts src/lib/search/shared/prompts/writingTurnPrefix.test.ts src/lib/search/shared/agent/piAgentSessionManager.test.ts src/lib/html/htmlComposer.test.ts`

Expected: PASS. `piAgentSessionManager.test.ts` uses its own in-test writing template with `fs_ls`; leave that fixture as local test data unless a test imports the real template tool list.

- [ ] **Step 5: Commit**

```powershell
$msg = Join-Path $env:TEMP "commit-msg.txt"
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($msg, "feat: bind Dochub tools on writing chat turns`n", $utf8)
git add src/lib/search/shared/runtime/bindTurnDochubTools.ts src/lib/search/shared/runtime/bindTurnDochubTools.test.ts src/lib/search/shared/runtime/loadWritingTurnContext.ts src/lib/search/shared/runtime/loadWritingTurnContext.test.ts src/lib/search/shared/agent/getSharedAgentContext.ts src/lib/search/writingAgent.ts src/app/api/chat/route.ts src/lib/chat/chatBodySchema.ts src/lib/chat/chatBodySchema.test.ts src/lib/search/writingAgent.wiring.test.ts src/lib/html/htmlComposer.test.ts
git commit -F $msg
Remove-Item $msg
```

---

### Task 7: Knowledge preview tabs

**Files:**
- Modify: `src/lib/chat/writingPreviewTabs.ts`
- Modify: `src/lib/chat/writingPreviewTabs.test.ts`
- Modify: `src/components/RightPanelContext.tsx`
- Modify: `src/components/WritingPreviewPanel.tsx`
- Modify: `src/lib/chat/rightPanel.test.ts`

**Interfaces:**
- Consumes: existing `PreviewTab`, `openPreviewTab`
- Produces:

```ts
export type PreviewTab = {
  id: string;
  label: string;
  kind: 'file' | 'html';
  source?: 'knowledge' | 'writing';
  fileId?: string;
  pageId?: string;
};

export function knowledgeFileTabId(fileId: string): string; // `knowledge:${fileId}`
```

`RightPanelContext.openKnowledgeFile(id: string, label?: string)` opens that tab and shows the panel.

- [ ] **Step 1: Write the failing tests**

Add to `writingPreviewTabs.test.ts`:

```ts
it('uses a knowledge tab id distinct from writing file ids', () => {
  const tab: PreviewTab = {
    id: knowledgeFileTabId('file-a'),
    label: 'plan.docx',
    kind: 'file',
    source: 'knowledge',
    fileId: 'file-a',
  };
  expect(tab.id).toBe('knowledge:file-a');
  expect(openPreviewTab([], tab)[0].source).toBe('knowledge');
});
```

Add to `rightPanel.test.ts`:

```ts
expect(readSrc('../../components/RightPanelContext.tsx')).toMatch(/openKnowledgeFile/);
expect(readSrc('../../components/WritingPreviewPanel.tsx')).toMatch(
  /\/api\/knowledge\/files\//,
);
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/chat/writingPreviewTabs.test.ts src/lib/chat/rightPanel.test.ts`

Expected: FAIL — `knowledgeFileTabId` / `openKnowledgeFile` missing.

- [ ] **Step 3: Implement**

- Add `knowledgeFileTabId` and optional `source` on `PreviewTab`. Include `source` in `openPreviewTab` equality.
- `openKnowledgeFile` clones `openWritingFile` but `id: knowledgeFileTabId(fileId)`, `source: 'knowledge'`.
- Export `openKnowledgeFile` on the context type and value.
- In `WritingPreviewPanel`, `WritingFileView` takes `source?: 'knowledge' | 'writing'`. When `source === 'knowledge'`, `GET /itms/ai/api/knowledge/files/${id}/content?tree=markdown` with `getAuthHeaders()`, `res.text()`, treat as markdown. Writing tabs keep the JSON `/api/writing/files/:id/file` fetch.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/chat/writingPreviewTabs.test.ts src/lib/chat/rightPanel.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```powershell
$msg = Join-Path $env:TEMP "commit-msg.txt"
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($msg, "feat: preview knowledge files in the writing right panel`n", $utf8)
git add src/lib/chat/writingPreviewTabs.ts src/lib/chat/writingPreviewTabs.test.ts src/components/RightPanelContext.tsx src/components/WritingPreviewPanel.tsx src/lib/chat/rightPanel.test.ts
git commit -F $msg
Remove-Item $msg
```

---

### Task 8: FILES rail UI

**Files:**
- Create: `src/lib/knowledge/useKnowledgeTree.ts`
- Create: `src/components/WritingKnowledgeFiles.tsx`
- Modify: `src/components/WritingLeftRail.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/lib/hooks/useChat.tsx`
- Modify: `src/lib/writing/fileBrowserLayout.test.ts`

**Interfaces:**
- Consumes: `GET /itms/ai/api/knowledge/tree`, `openKnowledgeFile`, `flattenKnowledgeNodes`
- Produces: `useKnowledgeTree()` `{ tree, error, loading }`; `knowledgeFolder` / `setKnowledgeFolder` on chat context (string, `''` = whole library).

- [ ] **Step 1: Write the failing layout tests**

Replace `src/lib/writing/fileBrowserLayout.test.ts` contents with:

```ts
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readSrc(...parts: string[]): string {
  return readFileSync(path.join(__dirname, ...parts), 'utf8');
}

describe('writing Knowledge FILES rail', () => {
  it('mounts a preview-only Knowledge tree under the agent card', () => {
    expect(
      existsSync(path.join(__dirname, '../../components/WritingKnowledgeFiles.tsx')),
    ).toBe(true);
    const rail = readSrc('../../components/WritingLeftRail.tsx');
    expect(rail).toMatch(/AgentCard/);
    expect(rail).toMatch(/WritingKnowledgeFiles/);
    const files = readSrc('../../components/WritingKnowledgeFiles.tsx');
    expect(files).toMatch(/FILES/);
    expect(files).toMatch(/\/api\/knowledge\/tree/);
    expect(files).toMatch(/openKnowledgeFile/);
    expect(files).toMatch(/Upload documents on Knowledge/);
    expect(files).not.toMatch(/type=["']file["']/);
    expect(files).not.toMatch(/onDrop/);
    expect(files).not.toMatch(/Create folder/);
    expect(files).not.toMatch(/\/api\/writing\/files/);
  });

  it('does not restore writing upload or paperclip', () => {
    expect(
      existsSync(path.join(__dirname, '../../components/WritingFileBrowser.tsx')),
    ).toBe(false);
    expect(
      existsSync(path.join(__dirname, '../../components/WritingComposerTools.tsx')),
    ).toBe(false);
    const chat = readSrc('../hooks/useChat.tsx');
    expect(chat).not.toMatch(/uploadWritingFile/);
    expect(chat).toMatch(/knowledgeFolder/);
    expect(chat).toMatch(/setKnowledgeFolder/);
  });

  it('keeps the FILES rail visible when the preview panel is open', () => {
    const css = readSrc('../../app/globals.css');
    expect(css).toMatch(/\.writing-knowledge-files/);
    expect(css).toMatch(/\.writing-left-rail\s*\{[^}]*position:\s*fixed/s);
    expect(css).not.toMatch(
      /\.chat-workspace:has\(\.right-panel-open\)\s+\.writing-left-rail\s*\{[^}]*display:\s*none/s,
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/writing/fileBrowserLayout.test.ts`

Expected: FAIL — `WritingKnowledgeFiles.tsx` missing.

- [ ] **Step 3: Implement the rail**

`useKnowledgeTree.ts` (`'use client'`): fetch `GET /itms/ai/api/knowledge/tree` with `getAuthHeaders()` on mount. On `!res.ok`, set `error` from `body.message` or `'Knowledge service is unavailable.'` and keep an empty root `{ type:'dir', name:'', path:'', children:[] }`.

Chat context: add `knowledgeFolder: string` and `setKnowledgeFolder: (path: string) => void` to the type, default context, state, value, and a `knowledgeFolderRef` updated each render. Do **not** put it on the POST body yet (Task 9).

`WritingKnowledgeFiles.tsx`:

- Header button `FILES` calls `setKnowledgeFolder('')`.
- Recursive list of `tree.children`: dirs and files. Dir click → `setKnowledgeFolder(path)` and `is-active` when `path === knowledgeFolder`. File click → `openKnowledgeFile(file.id, file.original_filename)`.
- Empty children: `Upload documents on Knowledge.`
- `error` shown as an inline `<p className="writing-knowledge-error">`.
- No `<input type="file">`, no drag handlers, no create-folder.

`WritingLeftRail`: render `<WritingKnowledgeFiles />` under `AgentCard`.

CSS (xl rail already `display:flex; position:fixed`):

- Remove the rule `.chat-workspace:has(.right-panel-open) .writing-left-rail { display: none; }`.
- `.writing-knowledge-files { flex: 1 1 auto; min-height: 0; overflow: auto; display: flex; flex-direction: column; gap: 0.35rem; }`
- `.writing-knowledge-files-header` button, `.writing-knowledge-list` nested ul, `.writing-knowledge-item.is-active` highlight.
- At `min-width: 1280px`, pad `.chat-workspace:has(.writing-knowledge-files) .wiki-chat` with `padding-left` equal to the rail width (`clamp(10.5rem, calc(10.5rem + 0.55 * (100vw - 80rem)), 18.75rem)` plus `0.75rem`) so chat clears the fixed rail, including when `.right-panel-open`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/writing/fileBrowserLayout.test.ts src/lib/chat/rightPanel.test.ts src/lib/knowledge/knowledgeUi.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```powershell
$msg = Join-Path $env:TEMP "commit-msg.txt"
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($msg, "feat: show Knowledge tree as writing FILES rail`n", $utf8)
git add src/lib/knowledge/useKnowledgeTree.ts src/components/WritingKnowledgeFiles.tsx src/components/WritingLeftRail.tsx src/app/globals.css src/lib/hooks/useChat.tsx src/lib/writing/fileBrowserLayout.test.ts
git commit -F $msg
Remove-Item $msg
```

---

### Task 9: `@` picker and send pin

**Files:**
- Create: `src/components/WritingKnowledgeAtMenu.tsx`
- Modify: `src/components/MessageInput.tsx`
- Modify: `src/components/EmptyChatMessageInput.tsx`
- Modify: `src/lib/hooks/useChat.tsx`
- Modify: `src/lib/writing/fileBrowserLayout.test.ts`
- Modify: `src/lib/html/htmlComposer.test.ts` only if it asserts composers have no `@` menu — keep HtmlSkillHint tests passing.

**Interfaces:**
- Consumes: `useKnowledgeTree`, `flattenKnowledgeNodes`, `atQueryAtCursor`, `insertMention`, `filterFilesByQuery` (or path/name includes)
- Produces: `@` menu on `agentWriting` only; POST body `knowledgeFolder` when `focusMode === 'agentWriting'` and the ref is non-empty.

- [ ] **Step 1: Extend layout tests**

Add to `fileBrowserLayout.test.ts`:

```ts
it('offers an @ picker on Agent Writing composers', () => {
  for (const src of [
    readSrc('../../components/MessageInput.tsx'),
    readSrc('../../components/EmptyChatMessageInput.tsx'),
  ]) {
    expect(src).toMatch(/WritingKnowledgeAtMenu/);
    expect(src).not.toMatch(/WritingToolbarButtons/);
    expect(src).not.toMatch(/uploadWritingFile/);
  }
  const menu = readSrc('../../components/WritingKnowledgeAtMenu.tsx');
  expect(menu).toMatch(/atQueryAtCursor/);
  expect(menu).toMatch(/insertMention/);
  const chat = readSrc('../hooks/useChat.tsx');
  expect(chat).toMatch(/knowledgeFolder:/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/writing/fileBrowserLayout.test.ts`

Expected: FAIL — `WritingKnowledgeAtMenu` missing.

- [ ] **Step 3: Implement picker and send field**

`WritingKnowledgeAtMenu.tsx`:

- Props: `text: string`, `cursor: number`, `onPick: (next: { text: string; cursor: number }) => void`.
- `atQueryAtCursor(text, cursor)`; if null, return null.
- `useKnowledgeTree()`; `flattenKnowledgeNodes(tree)` excluding the empty-path root.
- Filter: `name` or `path` includes `query` case-insensitive.
- Render a list (`role="listbox"`). Click / Enter on a row calls `insertMention(text, cursor, start, node.path)` then `onPick`.
- Show folder vs file via `node.type`.

In both composers, when `focusMode === 'agentWriting'`, track `selectionStart` on `select`/`keyup`/`click`, render the menu above the textarea, apply `onPick` to the draft.

`useChat` send JSON (inside the existing `JSON.stringify` object):

```ts
...(fm === 'agentWriting' && knowledgeFolderRef.current
  ? { knowledgeFolder: knowledgeFolderRef.current }
  : {}),
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/writing/fileBrowserLayout.test.ts src/lib/html/htmlComposer.test.ts src/lib/writing/mentions.test.ts src/lib/knowledge/knowledgeUi.test.ts src/lib/search/writingAgent.wiring.test.ts src/lib/search/shared/prompts/writingDochubPrompt.test.ts src/lib/knowledge/writingPin.test.ts src/lib/search/shared/tools/dochubTools.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```powershell
$msg = Join-Path $env:TEMP "commit-msg.txt"
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($msg, "feat: mention Knowledge folders and files from writing chat`n", $utf8)
git add src/components/WritingKnowledgeAtMenu.tsx src/components/MessageInput.tsx src/components/EmptyChatMessageInput.tsx src/lib/hooks/useChat.tsx src/lib/writing/fileBrowserLayout.test.ts
git commit -F $msg
Remove-Item $msg
```

---

## Execution notes

- `getSharedAgentContext` is a process singleton. After changing template tools, restart the Next dev server before a manual writing turn.
- Do not add Playwright. Contract tests are enough (`AGENTS.md`).
- `htmlComposer.test.ts` writing-template and `writingTurnPrefix` assertions are updated in Tasks 5 and 6. Document agent keeps `fs_*`.
