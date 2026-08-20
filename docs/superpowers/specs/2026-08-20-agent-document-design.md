# Agent Document Design

Date: 2026-08-20  
Status: **Draft**  
Scope: Add a new chat Agent **Document**. Each conversation is bound to one shipped wiki (SPR or Full CSR). The agent answers with read-only `fs_*` tools chrooted to that wiki, ported from pi-rag Domain Wiki workspace tools.

Related:

- pi-rag Domain Wiki: `D:\Projects\pi-rag\docs\superpowers\specs\2026-08-14-domain-wiki-design.md`
- pi-rag fs tools: `D:\Projects\pi-rag\apps\api\src\agent\agent-fs-tools.ts`, `agent-fs-path.ts`, `agent-fs-config.ts`
- Source wikis:
  - SPR: `D:\Projects\pi-rag\apps\api\data\projects\cd09b57f-5047-4f6f-903c-7dd703cbdca8\d3507547-d362-4fc9-b2d9-ee21b16d4b34\`
  - Full CSR: `D:\Projects\pi-rag\apps\api\data\projects\cd09b57f-5047-4f6f-903c-7dd703cbdca8\df1802ee-0ed6-42fd-8019-5250846daa16\`

## 1. Goal

Users pick **Agent Document**, then pick **one** shipped document. That chat answers only from that document’s files. The agent lists, searches, and reads those files with `fs_ls` / `fs_read` / `fs_grep` / `fs_find`. Visitors never see a file tree and cannot upload or edit.

### 1.1 Outcomes

1. Agents page shows **Agent Document** when the user has `chatDocumentAgent:execute`.
2. Empty Document chat shows a two-card picker: **SPR** and **Full CSR**. A reserved third slot stays hidden until it has a directory on disk.
3. Choosing a document binds the chat. Later turns cannot switch documents.
4. The agent is Q&A only. `fs_*` are read-only and chrooted to that document root.
5. Wiki trees for SPR and Full CSR live in this repo and ship with the Docker image.

### 1.2 Non-goals

| Out of scope | Why |
|--------------|-----|
| Domain Wiki sidebar, catalog page, Workspace, publish toggle | This app has no project model. Document is a chat Agent. |
| Visitor vs owner threads, `projectId` | Bind via `chats.documentId` instead. |
| Third wiki content | Slot reserved; hide until a directory exists. |
| `fs_write`, `run_python`, skills / `read_skill` | User asked for `fs_*` only. |
| KB / RAGFlow retrieval on this Agent | Project files only. |
| Per-message document switching | Locked: one document per chat. |
| Creating or editing wiki pages | Q&A, not wiki maintainer. |
| Adding the iTMS permission row in another repo | This app only filters on `cap_permission_code`. Operators add `chatDocumentAgent:execute` in iTMS. |

### 1.3 Locked decisions

1. Product: one Agent (`agentDocument`) plus a document picker, not two extra Agents.
2. Binding: one chat → one document. Change document = new chat.
3. Persistence: `chats.documentId` (`spr` \| `csr`). Written on first insert; later requests use the row, not the client body.
4. Files: copy SPR and Full CSR wiki trees into `data/documents/{spr,csr}/`.
5. Tools: copy pi-rag `fs_ls`, `fs_read`, `fs_grep`, `fs_find` and chroot helpers. No write tools.
6. Third slot: do not add a catalog object now. `listAvailableDocuments()` omits any slot whose directory is missing, so a later third folder + slot appears automatically.
7. Permission: `chatDocumentAgent:execute`.
8. UI: picker on empty Document chat (not a new sidebar).

---

## 2. Product shape

### 2.1 Entry

Agents page (`/itms/ai/agents`) gains a card:

| Field | Value |
|-------|--------|
| `key` | `agentDocument` |
| `title` | Agent Document |
| `description` | Ask about a selected policy document |
| `icon` | `FileText` (lucide-react) |
| `image` | `/itms/ai/agent_document.png` if added under `public/`; otherwise reuse `/itms/ai/agent-writing.png` so the card does not 404 |
| `permissionCode` | `chatDocumentAgent:execute` |
| `placeholder` | Ask about the selected document… |
| `followUpPlaceholder` | Ask a follow-up about this document… |

### 2.2 Empty chat

When `focusMode === 'agentDocument'` and the current chat has no `documentId`:

- Hide the composer.
- Show two cards from `listAvailableDocuments()` (SPR, Full CSR).
- Click sets `documentId` in client state, then shows the composer.
- Agent heading becomes the selected document title (e.g. “SPR”) plus a one-line description.

When `documentId` is already set (this session or a loaded chat):

- No picker.
- Composer enabled.
- Agent card / heading show the bound document name.

New chat with Agent Document starts unbound again.

### 2.3 Naming

| Term | Meaning |
|------|---------|
| **Agent Document** | The chat Agent (`focusMode = agentDocument`) |
| **Document** | One catalog entry (`spr`, `csr`, later a third id) |
| **Document root** | Absolute directory `data/documents/{dirName}` resolved from cwd |
| **Bound chat** | A `chats` row with `focusMode = agentDocument` and non-null `documentId` |

SPR display name: **SPR** (Stores and Procurement Regulations / 《物料供應及採購規例》).  
CSR display name: **Full CSR** (Civil Service Regulations / 《公務員事務規例》).

---

## 3. Data model

```sql
ALTER TABLE chats ADD COLUMN IF NOT EXISTS "documentId" TEXT;
```

Drizzle: `documentId: text('documentId')` nullable on `chats`.

Rules:

- Non-Document chats leave `documentId` null.
- Document chats must have a catalog id that `listAvailableDocuments()` currently accepts **at insert time**.
- `documentId` is immutable after insert. Follow-up POST bodies may include it; the server ignores it and uses the row.
- SQLite → Postgres import does not need a source column; imported chats get `documentId = NULL`.

Migration file: `drizzle/pg/0002_chat_document_id.sql`. Existing `ran_migrations` naming uses the prefix before `_` (`0002`).

---

## 4. Catalog

Module: `src/lib/documents/catalog.ts`.

Static slots:

```ts
export type DocumentSlot = {
  id: string;          // 'spr' | 'csr' | future id
  title: string;       // picker label
  description: string; // one line
  dirName: string;     // folder under data/documents/
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
```

Do not add a third object until content exists. The array **is** the reserved capacity: adding a third slot later is one catalog entry plus a folder.

`documentsRoot()` = `path.resolve(process.cwd(), 'data', 'documents')` unless `DOCUMENT_FILES_ROOT` is set (absolute or cwd-relative). Tests may point this env at a temp dir.

`documentRootAbs(slot)` = `path.join(documentsRoot(), slot.dirName)`.

`isDocumentAvailable(slot)` is true iff `documentRootAbs(slot)` exists, is a directory, and contains `AGENTS.md` **or** a `wiki/` directory. Missing third slot never appears.

`listAvailableDocuments()` returns available slots only.

`resolveDocument(id)` returns the available slot or `null`.

`GET /api/documents` (auth same as other APIs) returns `{ items: listAvailableDocuments() }` for the picker. Do not expose absolute paths.

---

## 5. Wiki files

Copy from pi-rag into this repo (do not rewrite wiki prose):

| id | Destination | Source (pi-rag) |
|----|-------------|-----------------|
| `spr` | `data/documents/spr/` | `…/d3507547-d362-4fc9-b2d9-ee21b16d4b34/` (`AGENTS.md`, `wiki/`) |
| `csr` | `data/documents/csr/` | `…/df1802ee-0ed6-42fd-8019-5250846daa16/` (`AGENTS.md`, `wiki/`) |

Skip `.gitkeep` if present. Do not invent extra markdown.

Docker: builder and runtime images must copy `data/documents` (today `Dockerfile` only `mkdir`s `data/prompts`). Same for `Dockerfile.slim` if it ships app data.

---

## 6. fs_* tools

Port pi-rag files into this app, adapted to `@earendil-works/pi-agent-core` `AgentTool` (same shape already used by `createGuideSearchTool`):

| pi-rag | This app |
|--------|----------|
| `apps/api/src/agent/agent-fs-path.ts` | `src/lib/search/shared/tools/fs/fsPath.ts` |
| `apps/api/src/agent/agent-fs-config.ts` | `src/lib/search/shared/tools/fs/fsConfig.ts` |
| `apps/api/src/agent/agent-fs-tools.ts` | `src/lib/search/shared/tools/fs/fsTools.ts` |

Keep behavior:

- `resolveFsPath` chroot + realpath + symlink-escape reject
- ignore dirs: `node_modules`, `.git`, `dist`, `build`, `.next`, etc.
- caps from env (`AGENT_FS_MAX_READ_BYTES` default 200 KiB, ls/grep/find caps as in pi-rag)
- binary `fs_read` rejected
- `fs_grep` literal or regex; skip large/binary files
- `fs_find` basename glob

Register tools even when global `AGENT_FS_ENABLED` is false, as long as a per-turn document root getter is provided (pi-rag `getProjectRootAbs` pattern).

**Per-turn root:** `AsyncLocalStorage<DocumentTurnContext>` in `src/lib/search/shared/runtime/documentTurnContext.ts`:

```ts
export type DocumentTurnContext = {
  id: string;
  title: string;
  rootAbs: string;
};
```

`createAgentFsTools({ getProjectRootAbs: () => getDocumentTurnContext()?.rootAbs })`.

Pooled agents reuse tool instances; the getter must read ALS on **execute**, not at registration.

If no context: tools return a skipped text result (“No document folder bound for this turn.”), never the process cwd.

Only `DocumentAgent` enters `runWithDocumentTurn(ctx, fn)`. Other agents must not see a leftover store (ALS is per-async-context; do not use a module-level mutable root).

---

## 7. Agent runtime

### 7.1 Handler

`src/lib/search/documentAgent.ts` implements `MetaSearchAgentType`, same skeleton as `writingAgent.ts`:

- progress “Initializing Document Agent”
- `getOrCreateAgent(stableAgentId, ['fs_ls','fs_read','fs_grep','fs_find'], 'document-agent-template')`
- wrap `prompt` + stream in `runWithDocumentTurn`
- `streamAgentProgressToEmitter` unchanged

`searchAndAnswer` does not take a new parameter. Chat/search routes resolve the document, then call the handler inside `runWithDocumentTurn`. If the handler runs with no context, tools no-op and the prompt still tells the model no document is bound — routes must fail closed **before** that (400).

### 7.2 Template

In `getSharedAgentContext`:

- Register the four fs tools in the shared `tools` map.
- Template `document-agent-template`: system prompt from §7.3, default tools the four names.

### 7.3 System prompt

File: `src/lib/search/shared/prompts/documentAgentSystemPrompt.ts` via `loadPrompt('agentDocument.md', fallback)`.

The model is a **read-only Q&A assistant** for the bound document. It is not a wiki maintainer.

Must include:

- Current document title and that all `fs_*` paths are relative to that document root.
- Tool inventory: `fs_ls`, `fs_read`, `fs_grep`, `fs_find` only.
- First orientation: read `AGENTS.md` if present, then `wiki/index.md` (or `index.md` at root).
- Answer only from files in this folder. If not found, say so. Do not invent articles, dollar limits, or eligibility.
- Cite as the wiki does (`SPR 220(a)`, `CSR 第 N 條`) when the files use those forms.
- **Override AGENTS.md write instructions:** those files tell a maintainer to edit `wiki/`. This Agent cannot create, edit, or delete files. Ignore write/maintain workflows.
- Language: honor an explicit request; else match the user; if unclear, Traditional Chinese.
- Greetings / “what can you do” → no tools required.

Do not list RAG, Python, or `read_skill`.

---

## 8. API

### 8.1 `POST /api/chat`

Body adds optional `documentId: string`.

When `focusMode === 'agentDocument'`:

1. Load chat by `message.chatId` if it exists.
2. If chat exists: `documentId = chat.documentId`. Client value ignored. If the row has no `documentId`, 400.
3. If chat does not exist: require body `documentId`. `resolveDocument(id)` must succeed; else 400 `{ message: 'Select a document' }` or `{ message: 'Unknown or unavailable document' }`.
4. Insert chat with `focusMode` + `documentId`.
5. `runWithDocumentTurn({ id, title, rootAbs }, () => handler.searchAndAnswer(...))`.

When `focusMode` is not `agentDocument`, ignore `documentId` (do not write it).

### 8.2 `GET /api/chats/:id`

Already returns the chat row. After the column exists, `chat.documentId` is present. Client hydrates picker state from it.

### 8.3 `GET /api/documents`

Signed-in. `{ items: [{ id, title, description }] }`. No paths.

### 8.4 `POST /api/search`

If `focusMode === 'agentDocument'`, require `documentId`, resolve, wrap in `runWithDocumentTurn`. Same 400s. Used less than `/api/chat`; still fail closed.

### 8.5 Permissions

`GET /api/permissions` IN-list adds `'chatDocumentAgent:execute'`.

Agents page already filters `focusModes` on `permissionCode`.

---

## 9. Client

`useChat`:

- State `documentId: string | null`.
- Hydrate from `data.chat.documentId` when loading a chat.
- Clear on new chat / focusMode change away from `agentDocument`.
- Changing `focusMode` to `agentDocument` on an unbound new chat leaves `documentId` null (picker).
- `sendMessage` includes `documentId` on POST (server still authoritative).
- Disable send while Document is selected and `documentId` is null.

New component `DocumentPicker` (same visual language as `SfcExactMatchToggle` / Agent cards: title, description, click to select). Render from `EmptyChat` when unbound Document.

`AgentCard` / `EmptyChat` heading: if bound, show document title and description.

`library/page.tsx`: treat `agentDocument` like other modes (icon/title from `focusModes`). Optional subtitle from `documentId` is nice-to-have, not required.

Do not add a Domain Wiki rail item.

---

## 10. Error handling

| Case | Behavior |
|------|----------|
| Document Agent, no `documentId` on create | Client: no send. API: 400 |
| Unknown / unavailable id on create | 400 |
| Bound chat, directory missing later | 200 stream with assistant error: this document is currently unavailable. Do not throw 500. Do not fall back to another document. |
| `fs_*` no ALS root | Tool skipped message; no disk read |
| Path escapes chroot / symlink escape | Tool error string from `resolveFsPath` |
| Binary `fs_read` | Refuse |
| Abort | Same as Writing / Guide agents |
| Missing permission | Card hidden. Direct API still runs if the user is authenticated (same as other Agents today). |

---

## 11. Testing

Unit (vitest, same style as `agent-fs-tools.spec.ts` / `agents.test.ts`):

1. **Catalog:** temp dir with only `spr/AGENTS.md` → list is `[spr]`. Empty `csr` slot omitted. Unknown id → `null`.
2. **Chroot:** `../`, absolute path outside root, symlink out → fail. `wiki/index.md` → ok.
3. **fs tools:** ls skips ignored dirs; read returns text and truncates over cap; grep finds a line; find by glob; binary read refused. Port the pi-rag cases that still apply (no global-admin-only path required when `getProjectRootAbs` is set).
4. **ALS:** two overlapping `runWithDocumentTurn` calls must not leak roots (nested or sequential).
5. **focusModes / searchHandlers / resolveFocusMode** include `agentDocument`.
6. **Chat bind (pure helper):** `resolveBoundDocument({ existingChat, bodyDocumentId, focusMode })` — create requires body id; existing chat uses row; non-document focus returns null; missing id on document create throws/returns error code.

No requirement to hit a live LLM.

UI verification after implementation (browser or closest substitute): pick Agent Document → pick SPR → send; new chat → Full CSR; reopen SPR chat → no picker, cannot switch.

---

## 12. File map

Create:

- `docs/superpowers/specs/2026-08-20-agent-document-design.md` (this file)
- `drizzle/pg/0002_chat_document_id.sql`
- `data/documents/spr/**`, `data/documents/csr/**`
- `src/lib/documents/catalog.ts` + `catalog.test.ts`
- `src/lib/documents/resolveBoundDocument.ts` + test
- `src/lib/search/shared/runtime/documentTurnContext.ts` + test
- `src/lib/search/shared/tools/fs/fsPath.ts` + `fsPath.test.ts`
- `src/lib/search/shared/tools/fs/fsConfig.ts`
- `src/lib/search/shared/tools/fs/fsTools.ts` + `fsTools.test.ts`
- `src/lib/search/shared/prompts/documentAgentSystemPrompt.ts`
- `src/lib/search/documentAgent.ts`
- `src/app/api/documents/route.ts`
- `src/components/DocumentPicker.tsx`

Modify:

- `src/lib/db/schema.ts` — `documentId`
- `src/lib/agents.tsx` + `agents.test.ts`
- `src/lib/search/index.ts` + `index.test.ts`
- `src/lib/search/shared/agent/getSharedAgentContext.ts`
- `src/app/api/chat/route.ts`
- `src/app/api/search/route.ts`
- `src/app/api/chats/[id]/route.ts` — no shape change if the row is returned whole
- `src/app/api/permissions/route.ts`
- `src/lib/hooks/useChat.tsx`
- `src/components/EmptyChat.tsx`, `AgentCard.tsx`, `MessageInput.tsx` / `EmptyChatMessageInput.tsx` as needed to block send
- `Dockerfile`, `Dockerfile.slim` — copy `data/documents`
- `src/lib/db/importSqlite.ts` — omit `documentId` (NULL default)

---

## 13. Implementation order

1. Catalog + tests; copy wiki trees.
2. fs path/config/tools + tests; ALS context.
3. Schema migration + `resolveBoundDocument`.
4. Template, prompt, `DocumentAgent`, wire handlers and chat/search routes.
5. Documents API, permissions, client picker, Docker copy.
6. Browser path in §11.

---

## 14. Success criteria

1. User with `chatDocumentAgent:execute` sees Agent Document.
2. User binds a new chat to SPR, asks a procurement question, and the process panel shows `fs_*` under `data/documents/spr` (relative paths only in tool I/O).
3. Same for Full CSR in a different chat.
4. Reloading the SPR chat does not offer CSR.
5. Third slot is absent until a folder is added.
6. `fs_read('../../package.json')` fails.
7. AGENTS.md “maintain the wiki” text does not cause file writes (impossible: no write tool).
