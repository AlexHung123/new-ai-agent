# Agent Document Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Agent Document: a chat-bound, read-only wiki Q&A agent (SPR and Full CSR) using pi-rag `fs_*` tools.

**Architecture:** New `focusMode` `agentDocument`. Empty chat picks `spr` or `csr`; that id is stored on `chats.documentId` at insert and never changes. Shared pi-agent pool registers `fs_ls` / `fs_read` / `fs_grep` / `fs_find`; each turn sets the document root via `AsyncLocalStorage`. Wiki trees ship under `data/documents/`.

**Tech Stack:** Next.js 15, Drizzle/Postgres, Vitest, `@earendil-works/pi-agent-core`, TypeBox tools.

**Spec:** `docs/superpowers/specs/2026-08-20-agent-document-design.md`

**Source (pi-rag):** `D:\Projects\pi-rag\apps\api\src\agent\agent-fs-path.ts`, `agent-fs-config.ts`, `agent-fs-tools.ts` and tests `agent-fs-path.spec.ts`, `agent-fs-tools.spec.ts`. Wikis under `D:\Projects\pi-rag\apps\api\data\projects\cd09b57f-5047-4f6f-903c-7dd703cbdca8\`.

---

## File map

| File | Responsibility |
|------|----------------|
| `src/lib/documents/catalog.ts` | Slots, root, availability, resolve |
| `src/lib/documents/resolveBoundDocument.ts` | Create vs existing chat bind rules |
| `src/lib/search/shared/runtime/documentTurnContext.ts` | ALS for per-turn root |
| `src/lib/search/shared/tools/fs/fsPath.ts` | Chroot resolve |
| `src/lib/search/shared/tools/fs/fsConfig.ts` | Env caps |
| `src/lib/search/shared/tools/fs/fsTools.ts` | Four read-only tools |
| `src/lib/search/shared/prompts/documentAgentSystemPrompt.ts` | Q&A prompt |
| `src/lib/search/documentAgent.ts` | Handler |
| `src/app/api/documents/route.ts` | Picker list |
| `src/components/DocumentPicker.tsx` | Empty-chat cards |
| `drizzle/pg/0002_chat_document_id.sql` | Column |
| `data/documents/spr/**`, `data/documents/csr/**` | Shipped wikis |

Tests: `*.test.ts` next to modules. Run: `npx vitest run <file>`.

Import rewrite when copying fs modules from pi-rag:

```
./agent-fs-config → ./fsConfig
./agent-fs-path   → ./fsPath
```

Change `noRootResult` text to: `No document folder bound for this turn.`

---

### Task 1: Document catalog

**Files:**
- Create: `src/lib/documents/catalog.ts`
- Test: `src/lib/documents/catalog.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  DOCUMENT_SLOTS,
  listAvailableDocuments,
  resolveDocument,
} from './catalog';

describe('document catalog', () => {
  let root: string;
  const prev = process.env.DOCUMENT_FILES_ROOT;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'doc-catalog-'));
    process.env.DOCUMENT_FILES_ROOT = root;
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.DOCUMENT_FILES_ROOT;
    else process.env.DOCUMENT_FILES_ROOT = prev;
    rmSync(root, { recursive: true, force: true });
  });

  it('lists only slots whose directory has AGENTS.md or wiki/', () => {
    mkdirSync(join(root, 'spr'));
    writeFileSync(join(root, 'spr', 'AGENTS.md'), '# spr\n');
    mkdirSync(join(root, 'csr'));
    expect(listAvailableDocuments().map((s) => s.id)).toEqual(['spr']);
  });

  it('includes csr when wiki/ exists', () => {
    mkdirSync(join(root, 'csr', 'wiki'), { recursive: true });
    expect(resolveDocument('csr')?.title).toBe('Full CSR');
  });

  it('returns null for unknown or missing slots', () => {
    expect(resolveDocument('spr')).toBeNull();
    expect(resolveDocument('nope')).toBeNull();
  });

  it('does not ship a third slot yet', () => {
    expect(DOCUMENT_SLOTS.map((s) => s.id)).toEqual(['spr', 'csr']);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL** (cannot find module `./catalog`)

Run: `npx vitest run src/lib/documents/catalog.test.ts`

- [ ] **Step 3: Implement catalog**

```ts
import { existsSync, statSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';

export type DocumentSlot = {
  id: string;
  title: string;
  description: string;
  dirName: string;
};

export const DOCUMENT_SLOTS: DocumentSlot[] = [
  {
    id: 'spr',
    title: 'SPR',
    description: 'Stores and Procurement Regulations (物料供應及採購規例)',
    dirName: 'spr',
  },
  {
    id: 'csr',
    title: 'Full CSR',
    description: 'Civil Service Regulations (公務員事務規例)',
    dirName: 'csr',
  },
];

export function documentsRoot(): string {
  const raw = (process.env.DOCUMENT_FILES_ROOT || '').trim();
  if (!raw) return resolve(process.cwd(), 'data', 'documents');
  return isAbsolute(raw) ? resolve(raw) : resolve(process.cwd(), raw);
}

export function documentRootAbs(slot: DocumentSlot): string {
  return join(documentsRoot(), slot.dirName);
}

export function isDocumentAvailable(slot: DocumentSlot): boolean {
  const abs = documentRootAbs(slot);
  if (!existsSync(abs)) return false;
  try {
    if (!statSync(abs).isDirectory()) return false;
  } catch {
    return false;
  }
  return (
    existsSync(join(abs, 'AGENTS.md')) || existsSync(join(abs, 'wiki'))
  );
}

export function listAvailableDocuments(): DocumentSlot[] {
  return DOCUMENT_SLOTS.filter(isDocumentAvailable);
}

export function resolveDocument(id: string | null | undefined): DocumentSlot | null {
  const key = (id || '').trim();
  if (!key) return null;
  const slot = DOCUMENT_SLOTS.find((s) => s.id === key);
  if (!slot || !isDocumentAvailable(slot)) return null;
  return slot;
}

export function toPublicDocumentItem(slot: DocumentSlot) {
  return {
    id: slot.id,
    title: slot.title,
    description: slot.description,
  };
}
```

- [ ] **Step 4: Run test — expect PASS**
- [ ] **Step 5: Commit** `feat: add document catalog with availability filter`

---

### Task 2: Copy SPR and Full CSR wikis

**Files:**
- Create: `data/documents/spr/**`, `data/documents/csr/**`

- [ ] **Step 1:** Copy `AGENTS.md` and `wiki/` only.

Sources:

- SPR: `D:\Projects\pi-rag\apps\api\data\projects\cd09b57f-5047-4f6f-903c-7dd703cbdca8\d3507547-d362-4fc9-b2d9-ee21b16d4b34\`
- CSR: `D:\Projects\pi-rag\apps\api\data\projects\cd09b57f-5047-4f6f-903c-7dd703cbdca8\df1802ee-0ed6-42fd-8019-5250846daa16\`

Skip `.gitkeep`. Do not rewrite markdown.

PowerShell:

```powershell
$srcSpr = 'D:\Projects\pi-rag\apps\api\data\projects\cd09b57f-5047-4f6f-903c-7dd703cbdca8\d3507547-d362-4fc9-b2d9-ee21b16d4b34'
$srcCsr = 'D:\Projects\pi-rag\apps\api\data\projects\cd09b57f-5047-4f6f-903c-7dd703cbdca8\df1802ee-0ed6-42fd-8019-5250846daa16'
New-Item -ItemType Directory -Force -Path data\documents\spr, data\documents\csr | Out-Null
Copy-Item $srcSpr\AGENTS.md data\documents\spr\AGENTS.md
Copy-Item $srcSpr\wiki data\documents\spr\wiki -Recurse
Copy-Item $srcCsr\AGENTS.md data\documents\csr\AGENTS.md
Copy-Item $srcCsr\wiki data\documents\csr\wiki -Recurse
```

- [ ] **Step 2:** Confirm `data/documents/spr/AGENTS.md` and `data/documents/csr/wiki/index.md` exist.
- [ ] **Step 3: Commit** `feat: ship SPR and Full CSR wiki trees`

---

### Task 3: fs path chroot

**Files:**
- Create: `src/lib/search/shared/tools/fs/fsPath.ts`
- Test: `src/lib/search/shared/tools/fs/fsPath.test.ts`

- [ ] **Step 1: Write failing test** — port `D:\Projects\pi-rag\apps\api\test\agent-fs-path.spec.ts` with imports changed to `./fsPath`. Keep cases: relative resolve, `.` is root, `..` escape, absolute outside, symlink outside.

- [ ] **Step 2: Run — FAIL** missing `./fsPath`

- [ ] **Step 3:** Copy `agent-fs-path.ts` from pi-rag to `fsPath.ts` (no behavior change).

- [ ] **Step 4: PASS** `npx vitest run src/lib/search/shared/tools/fs/fsPath.test.ts`

- [ ] **Step 5: Commit** `feat: add chrooted fs path resolver`

---

### Task 4: fs tools + config

**Files:**
- Create: `src/lib/search/shared/tools/fs/fsConfig.ts`, `fsTools.ts`
- Test: `src/lib/search/shared/tools/fs/fsTools.test.ts`

- [ ] **Step 1: Write failing test** — port `agent-fs-tools.spec.ts`: empty when global disabled without project getter; registers with `projectRootAbs` even if disabled; `fs_ls` skips `node_modules` contents; `fs_read` body + blocks escape; `fs_grep` finds and skips ignored; `fs_find` glob; plus: no ALS/root → content matches `/No document folder bound/`.

- [ ] **Step 2: FAIL** missing module

- [ ] **Step 3:** Copy `agent-fs-config.ts` → `fsConfig.ts`. Copy `agent-fs-tools.ts` → `fsTools.ts`. Change imports to `./fsConfig` and `./fsPath`. Change `noRootResult` message to `No document folder bound for this turn. Open a Document Agent chat and select a file.` Keep `createAgentFsTools` options (`isAdmin`, `config`, `getProjectRootAbs`, `projectRootAbs`).

- [ ] **Step 4: PASS**

- [ ] **Step 5: Commit** `feat: port read-only fs_ls fs_read fs_grep fs_find tools`

---

### Task 5: Document turn ALS

**Files:**
- Create: `src/lib/search/shared/runtime/documentTurnContext.ts`
- Test: `src/lib/search/shared/runtime/documentTurnContext.test.ts`

- [ ] **Step 1: Failing test**

```ts
import { describe, expect, it } from 'vitest';
import {
  getDocumentTurnContext,
  runWithDocumentTurn,
} from './documentTurnContext';

describe('documentTurnContext', () => {
  it('returns undefined outside a turn', () => {
    expect(getDocumentTurnContext()).toBeUndefined();
  });

  it('exposes the bound document inside runWithDocumentTurn', async () => {
    const ctx = { id: 'spr', title: 'SPR', rootAbs: '/tmp/spr' };
    const seen = await runWithDocumentTurn(ctx, async () => getDocumentTurnContext());
    expect(seen).toEqual(ctx);
    expect(getDocumentTurnContext()).toBeUndefined();
  });

  it('does not leak nested inner root to the outer turn', async () => {
    const outer = { id: 'spr', title: 'SPR', rootAbs: '/tmp/spr' };
    const inner = { id: 'csr', title: 'Full CSR', rootAbs: '/tmp/csr' };
    const roots: string[] = [];
    await runWithDocumentTurn(outer, async () => {
      roots.push(getDocumentTurnContext()!.rootAbs);
      await runWithDocumentTurn(inner, async () => {
        roots.push(getDocumentTurnContext()!.rootAbs);
      });
      roots.push(getDocumentTurnContext()!.rootAbs);
    });
    expect(roots).toEqual(['/tmp/spr', '/tmp/csr', '/tmp/spr']);
  });
});
```

- [ ] **Step 2: FAIL**
- [ ] **Step 3: Implement**

```ts
import { AsyncLocalStorage } from 'node:async_hooks';

export type DocumentTurnContext = {
  id: string;
  title: string;
  rootAbs: string;
};

const storage = new AsyncLocalStorage<DocumentTurnContext>();

export function getDocumentTurnContext(): DocumentTurnContext | undefined {
  return storage.getStore();
}

export function runWithDocumentTurn<T>(
  ctx: DocumentTurnContext,
  fn: () => T | Promise<T>,
): T | Promise<T> {
  return storage.run(ctx, fn);
}
```

- [ ] **Step 4: PASS**
- [ ] **Step 5: Commit** `feat: add document turn AsyncLocalStorage`

---

### Task 6: resolveBoundDocument + migration

**Files:**
- Create: `src/lib/documents/resolveBoundDocument.ts`, `resolveBoundDocument.test.ts`
- Create: `drizzle/pg/0002_chat_document_id.sql`
- Modify: `src/lib/db/schema.ts`

- [ ] **Step 1: Failing test**

```ts
import { describe, expect, it } from 'vitest';
import { resolveBoundDocument } from './resolveBoundDocument';

describe('resolveBoundDocument', () => {
  it('returns none for non-document focus modes', () => {
    const r = resolveBoundDocument({
      focusMode: 'agentGuide',
      existingDocumentId: null,
      bodyDocumentId: 'spr',
      chatExists: false,
    });
    expect(r).toEqual({ status: 'none' });
  });

  it('requires body documentId when creating a document chat', () => {
    const r = resolveBoundDocument({
      focusMode: 'agentDocument',
      existingDocumentId: null,
      bodyDocumentId: undefined,
      chatExists: false,
    });
    expect(r).toEqual({ status: 'error', message: 'Select a document' });
  });

  it('uses the row documentId for an existing chat and ignores the body', () => {
    const r = resolveBoundDocument({
      focusMode: 'agentDocument',
      existingDocumentId: 'spr',
      bodyDocumentId: 'csr',
      chatExists: true,
    });
    expect(r).toEqual({ status: 'ok', documentId: 'spr' });
  });

  it('errors when an existing document chat has no documentId', () => {
    const r = resolveBoundDocument({
      focusMode: 'agentDocument',
      existingDocumentId: null,
      bodyDocumentId: 'spr',
      chatExists: true,
    });
    expect(r).toEqual({
      status: 'error',
      message: 'Select a document',
    });
  });
});
```

Catalog availability is **not** this helper’s job; the route calls `resolveDocument` after a successful `ok`.

- [ ] **Step 2: FAIL**
- [ ] **Step 3: Implement**

```ts
export type BoundDocumentInput = {
  focusMode: string;
  chatExists: boolean;
  existingDocumentId?: string | null;
  bodyDocumentId?: string | null;
};

export type BoundDocumentResult =
  | { status: 'none' }
  | { status: 'ok'; documentId: string }
  | { status: 'error'; message: string };

export function resolveBoundDocument(
  input: BoundDocumentInput,
): BoundDocumentResult {
  if (input.focusMode !== 'agentDocument') return { status: 'none' };
  if (input.chatExists) {
    const id = (input.existingDocumentId || '').trim();
    if (!id) return { status: 'error', message: 'Select a document' };
    return { status: 'ok', documentId: id };
  }
  const id = (input.bodyDocumentId || '').trim();
  if (!id) return { status: 'error', message: 'Select a document' };
  return { status: 'ok', documentId: id };
}
```

Migration `drizzle/pg/0002_chat_document_id.sql`:

```sql
ALTER TABLE chats ADD COLUMN IF NOT EXISTS "documentId" TEXT;
```

Schema: add `documentId: text('documentId')` on `chats` (nullable).

- [ ] **Step 4: PASS** + confirm schema compiles
- [ ] **Step 5: Commit** `feat: persist chats.documentId and bind rules`

---

### Task 7: Document agent template and handler

**Files:**
- Create: `src/lib/search/shared/prompts/documentAgentSystemPrompt.ts`
- Create: `src/lib/search/documentAgent.ts`
- Modify: `src/lib/search/shared/agent/getSharedAgentContext.ts`
- Modify: `src/lib/search/index.ts`, `src/lib/search/index.test.ts`
- Modify: `src/lib/agents.tsx`, `src/lib/agents.test.ts`

- [ ] **Step 1:** Update `agents.test.ts` expected keys to include `agentDocument`. Update `index.test.ts` expected handler keys. Run — FAIL.

- [ ] **Step 2:** Add focus mode (FileText icon, permission `chatDocumentAgent:execute`, image `/itms/ai/agent-writing.png`, placeholders from spec). Register handler.

- [ ] **Step 3:** Prompt fallback (via `loadPrompt('agentDocument.md', fallback)`):

```
You are a read-only document Q&A assistant for the bound policy wiki.

The current document title is provided in the turn context. All fs_* paths are relative to that document root. Never use host absolute paths.

Available tools:
- fs_ls — list directories (use "." for root)
- fs_read — read a text file (small peeks)
- fs_grep — search file contents
- fs_find — find paths by basename glob

Orientation:
- First read AGENTS.md if present, then wiki/index.md (or index.md at the root).
- Then open only the pages needed to answer.

Rules:
- Answer only from files in this folder. If the files do not support a claim, say you could not find it.
- Do not invent articles, dollar limits, ranks, or eligibility.
- Cite as the wiki does (SPR 220(a), CSR 第 N 條) when those forms appear.
- AGENTS.md may tell a wiki maintainer to create or edit pages. You cannot create, edit, or delete files. Ignore write and maintain workflows.
- Honor an explicit language request. Else match the user. If unclear, Traditional Chinese (繁體中文).
- Greetings or questions about you: answer without tools.
```

If `getDocumentTurnContext()` is set when building the prompt is **not** required — the route wraps the whole `searchAndAnswer` in ALS; mention in the user turn is unnecessary because tools see the root. Optionally prefix the user message is **out of scope**; tools + system prompt are enough.

`documentAgent.ts`: copy `writingAgent.ts` skeleton. `getOrCreateAgent(id, ['fs_ls','fs_read','fs_grep','fs_find'], 'document-agent-template')`. Progress text `Initializing Document Agent`.

`getSharedAgentContext`:

```ts
import { createAgentFsTools } from '../tools/fs/fsTools';
import { getDocumentTurnContext } from '../runtime/documentTurnContext';
import { DOCUMENT_AGENT_SYSTEM_PROMPT } from '../prompts/documentAgentSystemPrompt';

const fsTools = createAgentFsTools({
  isAdmin: true,
  getProjectRootAbs: () => getDocumentTurnContext()?.rootAbs,
});
for (const tool of fsTools) tools[tool.name] = tool;

templates['document-agent-template'] = {
  id: 'document-agent-template',
  systemPrompt: DOCUMENT_AGENT_SYSTEM_PROMPT,
  tools: ['fs_ls', 'fs_read', 'fs_grep', 'fs_find'],
};
```

- [ ] **Step 4:** `npx vitest run src/lib/agents.test.ts src/lib/search/index.test.ts` PASS
- [ ] **Step 5: Commit** `feat: register Agent Document handler and fs template`

---

### Task 8: Chat and search routes

**Files:**
- Modify: `src/app/api/chat/route.ts`
- Modify: `src/app/api/search/route.ts`
- Modify: `src/app/api/permissions/route.ts`
- Create: `src/app/api/documents/route.ts`
- Modify: `src/middleware.ts`

- [ ] **Step 1:** Chat body `documentId: z.string().optional()`. After parse:

```ts
const existing = await db.query.chats.findFirst({
  where: eq(chats.id, message.chatId),
});
const bound = resolveBoundDocument({
  focusMode: body.focusMode,
  chatExists: Boolean(existing),
  existingDocumentId: existing?.documentId,
  bodyDocumentId: body.documentId,
});
if (bound.status === 'error') {
  return Response.json({ message: bound.message }, { status: 400 });
}
let documentTurn: DocumentTurnContext | undefined;
if (bound.status === 'ok') {
  const slot = resolveDocument(bound.documentId);
  if (!slot) {
    if (existing) {
      // stream a single assistant error inside run? For create, 400.
      // Spec: bound chat, directory missing later → 200 stream error, not 500.
    } else {
      return Response.json(
        { message: 'Unknown or unavailable document' },
        { status: 400 },
      );
    }
  } else {
    documentTurn = {
      id: slot.id,
      title: slot.title,
      rootAbs: documentRootAbs(slot),
    };
  }
}
```

If existing bound chat and slot missing: still call handler inside `runWithDocumentTurn` **only if** we have a root. If no slot, do **not** call the LLM. Emit one `response` then `end`: `This document is currently unavailable.` via a tiny helper or inline emitter. Simpler: return a streaming response with that sentence (same SSE shape `bindChatEmitterToWriter` expects). Implement `unavailableDocumentEmitter()` that emits `response` + `end`.

`handleHistorySave` must write `documentId` on insert when `bound.status === 'ok'`.

Search route: if `agentDocument`, require `documentId`, `resolveDocument`, wrap in `runWithDocumentTurn`, else 400.

Permissions IN-list add `'chatDocumentAgent:execute'`.

`GET /api/documents`:

```ts
export async function GET() {
  return NextResponse.json({
    items: listAvailableDocuments().map(toPublicDocumentItem),
  });
}
```

Middleware: add `/api/documents` to `PROTECTED_ROUTES` and `matcher`.

- [ ] **Step 2:** Pass `documentId` into `handleHistorySave` insert values.
- [ ] **Step 3: Commit** `feat: bind document chats and expose document catalog API`

---

### Task 9: Client picker and send path

**Files:**
- Create: `src/components/DocumentPicker.tsx`
- Modify: `src/lib/hooks/useChat.tsx`
- Modify: `src/components/EmptyChat.tsx`
- Modify: `src/components/EmptyChatMessageInput.tsx`
- Modify: `src/components/MessageInput.tsx`
- Modify: `src/components/AgentCard.tsx`

- [ ] **Step 1:** Extend `ChatContext` with `documentId: string | null`, `setDocumentId`, `documents: {id,title,description}[]`.

Hydrate: in chat load, `setDocumentId(data.chat.documentId ?? null)`.

`handleSetFocusMode`: if leaving `agentDocument` or switching to it on a **new** chat (no messages), `setDocumentId(null)`. If loading an existing chat, hydrate wins.

`sendMessage`: include `documentId` in JSON body. If `focusModeRef.current === 'agentDocument' && !documentIdRef.current` return early.

Fetch `/itms/ai/api/documents` once when `focusMode === 'agentDocument'` (auth headers).

- [ ] **Step 2:** `DocumentPicker` — list of buttons (title + description). `onSelect(id)` → `setDocumentId`.

`EmptyChat`: if `focusMode === 'agentDocument' && !documentId`, render picker, hide `EmptyChatMessageInput`. Heading: bound document title/description when set, else Agent Document description.

`EmptyChatMessageInput` / `MessageInput`: disable submit when document agent and no `documentId`. Placeholder from bound document optional.

`AgentCard`: if document bound, show document title/description under the agent title.

- [ ] **Step 3:** Browser (or curl if no browser): GET documents returns spr+csr; POST chat without documentId → 400; POST with spr creates row.

- [ ] **Step 4: Commit** `feat: add Document Agent picker and chat binding UI`

---

### Task 10: Docker copy of wiki trees

**Files:**
- Modify: `Dockerfile`
- Modify: `Dockerfile.slim`

- [ ] **Step 1:** In builder stage, after mkdir data:

```
COPY data/documents ./data/documents
```

Keep `COPY --from=builder /home/aiagent/data ./data` on runtime.

- [ ] **Step 2: Commit** `chore: copy document wikis into Docker images`

---

## Spec coverage

| Spec section | Task |
|--------------|------|
| Catalog + third slot hidden | 1 |
| Copy wikis | 2 |
| fs chroot | 3 |
| fs_* tools | 4 |
| ALS | 5 |
| `chats.documentId` + bind rules | 6 |
| Agent + prompt + handlers | 7 |
| Chat/search/permissions/documents API | 8 |
| Picker UI | 9 |
| Docker | 10 |
| importSqlite omit column | 6 (NULL default, no INSERT change required) |

---

## Verification

```
npx vitest run src/lib/documents src/lib/search/shared/tools/fs src/lib/search/shared/runtime/documentTurnContext.test.ts src/lib/agents.test.ts src/lib/search/index.test.ts
```

UI: Agent Document → pick SPR → send; new chat → Full CSR; reopen SPR chat → no picker.
