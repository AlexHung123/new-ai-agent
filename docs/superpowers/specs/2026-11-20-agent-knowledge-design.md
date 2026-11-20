# Agent Knowledge File Manager Design

Date: 2026-11-20  
Status: **Draft**  
Scope: Add a **Knowledge** sidebar page: per-user folder tree, create folders, upload / drag-and-drop files (including nested folders), Markdown conversion on this app, Dochub ingest, and on-page QMD search. Browser never talks to Dochub or QMD MCP.

Related:

- Branch: `feat/agent-knowledge` (from `master` at `d7056e4`)
- Dochub service (Mac file + index center): `http://192.168.1.56:8787`
- Existing converter: `src/lib/writing/convert.ts` (`convertAttachment`)
- Existing writing allow-list: `src/lib/writing/types.ts` (office / PDF)

## 1. Goal

Signed-in users get a **Knowledge** tab in the left nav. They build a private folder tree, drop documents into folders, and search that library. This Next.js app authenticates the user, converts each upload to Markdown, and forwards original + `.md` to Dochub with `X-User-Id`. Dochub stores files, runs `qmd update` then `qmd embed`, and answers search. Isolation is per JWT user id.

### 1.1 Outcomes

1. Sidebar shows **Knowledge** after History on desktop and mobile. Admin stays last (admins only).
2. `/knowledge` is a wide file-manager page: tree, current folder, Markdown preview, search.
3. Users create nested folders. Creating the same path twice is idempotent.
4. Users upload via the Upload button or drag-and-drop onto the current pane or a tree folder.
5. Server converts allowed files to Markdown, then POST original + markdown to Dochub. UI polls ingest until succeeded or failed.
6. Search on the page calls Dochub `/v1/search` for that user only. Default mode is keyword.
7. Browser calls only `/itms/ai/api/knowledge/*` with the existing Bearer JWT. QMD MCP stays on the Mac.

### 1.2 Non-goals

| Out of scope | Why |
|--------------|-----|
| Agent chat tool that searches this library | Locked first slice: file manager + on-page search. |
| Browser → Dochub or QMD MCP | Dochub docs: frontend forwards; do not expose QMD MCP. |
| Delete / rename files or folders | Live Dochub returns 501 for DELETE/PATCH. |
| Empty-file “New document” | Dochub upload requires original + markdown. Upload is the new-file action. |
| New iTMS permission | Every signed-in user sees Knowledge. |
| Changing Agent Writing’s allow-list or FILES panel | Knowledge has its own allow-list; writing stays office/PDF. |
| Storing knowledge files on this app’s disk | Source of truth is Dochub `users/{id}/inbox` + `markdown`. |
| Sharing a library across users | Isolation is `X-User-Id` = JWT id. |

### 1.3 Locked decisions

1. Product: sidebar destination `/knowledge`, not a new agent card.
2. Approach: thin authenticated proxy. Next.js maps 1:1 onto Dochub `/v1/*` after convert-on-upload.
3. Identity: middleware JWT `x-user-id` → Dochub `X-User-Id` (string, e.g. `"1"`). Dochub does not verify the token.
4. Conversion: this app, server-side, before Dochub sees the file. Reuse `convertAttachment` for office/PDF; utf-8 for `.md`/`.txt`.
5. Search: Dochub `mode=search` (keyword) by default; UI can switch to `vsearch` or `query`.
6. Config: `dochub.baseUrl` in `data/config.json`, default `http://192.168.1.56:8787`.
7. No delete/rename in this slice.

---

## 2. Architecture

```
Sidebar Knowledge  →  /knowledge  (wide layout)
        │
        ▼  Authorization: Bearer <JWT>
GET/POST /itms/ai/api/knowledge/*
        │  middleware: verify JWT, set x-user-id
        ▼
src/lib/knowledge/dochubClient.ts
        │  X-User-Id: <jwt user id>
        ▼
Dochub  http://192.168.1.56:8787/v1/*
        tree | folders | files | tasks | search
        users/{id}/inbox, markdown, .qmd
```

Dochub probed 2026-11-20:

- `GET /health` → `{ "ok": true, "service": "dochub" }`
- `POST /v1/folders` `{ path }` → `{ path }` (creates matching paths under `inbox/` and `markdown/`)
- `GET /v1/tree` → nested `{ type, name, path, children, file? }`
- `POST /v1/files` multipart `file`, `markdown`, `relative_path` → **202** `{ file, task }`
- `GET /v1/tasks/:id` → `{ task }` with `status` pending/succeeded/failed and `stage` `qmd_update` / `qmd_embed`
- `GET /v1/files/:id/content?tree=markdown|inbox`
- `POST /v1/search` `{ query, mode, limit }` → `{ user_id, mode, query, results[] }`
- DELETE/PATCH files and folders → **501**

---

## 3. Product shape

### 3.1 Sidebar

`src/components/Sidebar.tsx` `navLinks` order:

1. Agents (`/agents`, `LayoutGrid`)
2. History (`/library`, `BookOpenText`)
3. Knowledge (`/knowledge`, lucide `FolderOpen`) — always, for any signed-in session that can load the app
4. Admin (`/admin`, `Shield`) — only when `isAdmin === true`

Active when `segments.includes('knowledge')`. Desktop column and mobile bottom bar both use `navLinks`.

`wide={segments.includes('agents') || segments.includes('knowledge')}`.

### 3.2 Page chrome

`src/app/knowledge/page.tsx` + `layout.tsx` title `Knowledge - AI Agent`.

Match History/Admin: lucide `FolderOpen` + `<h1>Knowledge</h1>`, then a horizontal rule.

Below that: toolbar + three panes filling leftover height (`calc(100dvh - var(--chat-topbar-height) - header)`), with mobile bottom-nav padding.

### 3.3 Toolbar

| Control | Behavior |
|---------|----------|
| New folder | Shows an inline name field (not `window.prompt`). One path segment. Create under the current folder. |
| Upload | Hidden `input type=file` `multiple`. Files go into the current folder. |
| Search | Text field. Enter submits. Empty query returns to folder listing. |
| Mode | `Keyword` (`search`) / `Semantic` (`vsearch`) / `Hybrid` (`query`). Default Keyword. |

### 3.4 Panes

**Left — tree.** Root of `GET /v1/tree`. Folders expand/collapse. Click a folder sets `currentPath`. Drop on a folder uploads into that path.

**Center — listing.** Children of `currentPath`: subfolders then files. Empty copy: “Create a folder or drop files here.” Drop on the pane uploads into `currentPath`. Click a subfolder to enter it. Click a file to select it and load preview.

**Right — preview.** Visible when a file is selected. Renders Markdown from `GET .../content?tree=markdown`. Hidden when nothing is selected.

While a search query is active, the center pane shows search hits instead of folder children. The tree stays. Click a hit that maps to a tree file to preview it.

### 3.5 Indexing badge

Each file may have `task_id`. After upload, poll that task about every 1.5s until `succeeded` or `failed` (stop after ~2 minutes). Badge:

| Task | Badge |
|------|--------|
| pending / running, stage `qmd_update` | Indexing |
| pending / running, stage `qmd_embed` | Embedding |
| succeeded | none (or a brief Ready that clears) |
| failed | Failed (title = `last_error` if present) |

Keyword search is usable after `qmd_update`. Semantic/hybrid need embed finished. Do not block the listing on embed.

### 3.6 Naming

| Term | Meaning |
|------|---------|
| **Knowledge** | Sidebar page and per-user Dochub library |
| **currentPath** | Folder path relative to the user root, `""` at root, e.g. `contracts/2024` |
| **relative_path** | Dochub upload field: `{currentPath}/{filename}` or `{filename}` at root |
| **inbox** | Original bytes on Dochub |
| **markdown** | Converted `.md` that QMD indexes |

---

## 4. Components

### 4.1 Config (`src/lib/knowledge/config.ts`)

```json
{
  "dochub": {
    "baseUrl": "http://192.168.1.56:8787"
  }
}
```

| Field | Default | Notes |
|-------|---------|--------|
| `dochub.baseUrl` | `http://192.168.1.56:8787` | Strip trailing slash. Empty string → unconfigured. |
| `dochub.timeoutMs` | `60000` | Per request. Upload may use `120000`. |
| `dochub.maxUploadBytes` | `33554432` (32 MiB) | Enforced in the files POST route. |

`getDochubConfig()` / `isDochubConfigured()`. Missing `dochub` key uses defaults (service is expected on the LAN).

Add `dochub` to `SECRET_CONFIG_KEYS` in `src/lib/config/publicConfig.ts` so `GET /api/config` omits it and `POST /api/config` rejects `dochub` and `dochub.*`. The Knowledge page only talks to `/api/knowledge`.

Restart Next.js after editing `config.json` (same as other keys).

### 4.2 Path helpers (`src/lib/knowledge/paths.ts`)

Pure functions:

| Function | Rule |
|----------|------|
| `sanitizePathSegment(name)` | Trim. Reject empty, `.`, `..`, any `/` or `\`, control chars. Max 200 chars. |
| `joinKnowledgePath(parent, name)` | `parent` empty → `name`; else `parent + '/' + name`. |
| `isSafeRelativePath(path)` | No leading `/`, no `..` segments, no backslash, no empty segments, max 500 chars. |
| `buildRelativePath(folderPath, filename)` | `joinKnowledgePath(folderPath, displayFilename(filename))`. |
| `markdownName(filename)` | Replace extension with `.md` (`report.pdf` → `report.md`; `notes.md` stays `notes.md`). |

### 4.3 Convert (`src/lib/knowledge/convert.ts`)

Do not change `isAllowedWritingFilename`.

Knowledge allow-list = writing office/PDF set **plus** `md`, `markdown`, `txt`.

`convertKnowledgeAttachment(bytes, filename)`:

1. Reject if not allowed or over `maxUploadBytes`.
2. `.md` / `.markdown` / `.txt`: utf-8 decode (strip BOM). Empty → fail.
3. Else call `convertAttachment` (office/PDF / anydoc).

`.md` uploads send the same bytes as both `file` and `markdown`.

### 4.4 Dochub client (`src/lib/knowledge/dochubClient.ts`)

Server-only. Every request includes `X-User-Id: userId`. Never forwards the JWT to Dochub.

| Method | Dochub |
|--------|--------|
| `getTree(userId)` | `GET /v1/tree` |
| `createFolder(userId, path)` | `POST /v1/folders` JSON `{ path }` |
| `uploadFile(userId, { original, originalName, originalType, markdown, relativePath })` | `POST /v1/files` multipart `file`, `markdown`, `relative_path` |
| `getTask(userId, taskId)` | `GET /v1/tasks/:id` |
| `getFileContent(userId, fileId, tree)` | `GET /v1/files/:id/content?tree=markdown\|inbox` |
| `search(userId, { query, mode, limit })` | `POST /v1/search` JSON |

Map HTTP errors to a small `DochubError` `{ status, code, message }` using Dochub `{ error, message }` when present. Network / timeout → 503 `"Knowledge service is unavailable."`.

Upload success status is **202**. Client must accept 202 as success.

### 4.5 HTTP API

Add `/api/knowledge` to middleware `PROTECTED_ROUTES` and `matcher`. `x-user-id` required; else 401.

| Route | Body / query | Upstream |
|-------|----------------|----------|
| `GET /api/knowledge/tree` | | `getTree` |
| `POST /api/knowledge/folders` | `{ path }` | sanitize, `createFolder` |
| `POST /api/knowledge/files` | multipart `file` + `relative_path` | convert, `uploadFile` |
| `GET /api/knowledge/files/[id]/content?tree=markdown\|inbox` | default `markdown` | `getFileContent` |
| `GET /api/knowledge/tasks/[id]` | | `getTask` |
| `POST /api/knowledge/search` | `{ query, mode?, limit? }` | `search` |

Do not add `GET /api/knowledge/files` in this slice. The UI uses the tree.

JSON from Dochub may be passed through after a light type guard. Do not add a second knowledge database.

**POST files**

- Missing `file` → 400.
- Missing/unsafe `relative_path` → 400.
- File too large → 413.
- Convert fail → 400 `{ message }` from converter.
- Dochub 202 → 202 `{ file, task }`.

**POST search**

- `query` trim; empty → 400.
- `mode` one of `search` \| `vsearch` \| `query`; default `search`.
- `limit` integer 1–50; default 10.

**POST folders**

- `{ path }` must pass `isSafeRelativePath`.
- Repeat create is success (Dochub is idempotent).

### 4.6 UI components

| Path | Role |
|------|------|
| `src/app/knowledge/page.tsx` | Client page: token init, load tree, host manager |
| `src/app/knowledge/layout.tsx` | Title |
| `src/components/knowledge/KnowledgeFileManager.tsx` | Toolbar + panes |
| `src/components/knowledge/KnowledgeTree.tsx` | Folder tree |
| `src/components/knowledge/KnowledgeListing.tsx` | Folder listing / search hits |
| `src/components/knowledge/KnowledgePreview.tsx` | Markdown preview (`markdown-to-jsx`, same as document preview) |

Auth: `initializeAuthToken` + `getAuthHeaders()`, same as History/Admin.

CSS: `src/app/globals.css` under `.knowledge-*`. Reuse wiki/chat tokens (`--wiki-border`, `--wiki-surface`, `--chat-topbar-height`). Do not reuse `.writing-file-browser` layout (that panel is the Writing FILES rail).

### 4.7 Search hits

Live keyword hit shape:

```json
{
  "docid": "#15aec8",
  "score": 0,
  "file": "qmd://markdown/contracts/2024/report.md",
  "line": 11,
  "title": "report",
  "context": "User markdown documents",
  "snippet": "quarterly planning notes"
}
```

Display `title`, `snippet`, and a short path (strip `qmd://markdown/`). On click, match that path to a tree node’s `file.markdown_relpath` (or the same path with `.pdf`/original extension via `inbox_relpath`). If matched, select that file and load preview. If not matched, still show the snippet; skip preview.

---

## 5. Data flow

1. Operator may set `dochub.baseUrl`; default already points at `192.168.1.56:8787`. Restart Node after config edits.
2. User opens `/knowledge`. Client `GET /itms/ai/api/knowledge/tree` with Bearer. Server sets `X-User-Id` and calls Dochub. Empty tree is valid (new user).
3. New folder: client `POST /api/knowledge/folders` `{ path: "contracts/2024" }`. Server sanitizes and POSTs Dochub. Client reloads tree and sets `currentPath`.
4. Upload: client POST multipart original + `relative_path`. Server converts, builds `markdown` part (`{stem}.md`), POST Dochub, returns 202. Client inserts the file node (or reloads tree) and polls `/api/knowledge/tasks/:id`.
5. Preview: `GET /api/knowledge/files/:id/content?tree=markdown` as text; render Markdown.
6. Search: `POST /api/knowledge/search` `{ query, mode, limit: 10 }`. Center pane lists `results`. Clear query → folder listing again.

Dochub worker is serial per user. The UI does not run QMD itself.

---

## 6. Error handling

| Case | Behavior |
|------|----------|
| Missing JWT | Middleware 401. Page behaves like History (failed fetch). |
| Empty `x-user-id` in a route | 401 `{ message: 'Unauthorized - Authentication required' }`. |
| `dochub.baseUrl` empty | 503 `{ message: 'Knowledge service is unavailable.' }`. |
| Dochub down / timeout / DNS | 503 same message. Page banner with that text. |
| Convert fail | 400, toast, no Dochub call. |
| Unsupported type | Toast: “This file type is not supported. Attach Word, PowerPoint, Excel, OpenDocument, RTF, EPUB, CSV, PDF, Markdown, or text files.” Skip that file. |
| File > 32 MiB | 413 / toast. Skip that file. |
| Unsafe path (`..`, `/foo`) | 400. |
| Ingest task `failed` | Red Failed badge. File remains in the tree. |
| Search with empty query | 400. Client does not send it. |
| Search while still indexing | Dochub may return `[]`. Listing still shows Indexing badges. |
| Preview 404 | Inline “File not found.” |

Do not toast `tool_error`-style duplicates for poll failures; show the badge / banner.

---

## 7. Testing

Vitest, `src/**/*.test.ts`. Contract tests via `readFileSync` (same as `chatTopbar.test.ts`). No Playwright unless asked (`AGENTS.md`).

### 7.1 Paths (`src/lib/knowledge/paths.test.ts`)

- Reject `..`, `/abs`, `foo/../bar`, `a\\b`, empty, `.`
- Join root + `2024` → `2024`; `contracts` + `2024` → `contracts/2024`
- `buildRelativePath('', 'Report.PDF')` → `Report.PDF`
- `markdownName('report.pdf')` → `report.md`

### 7.2 Convert (`src/lib/knowledge/convert.test.ts`)

- Accepts `.md` / `.txt` utf-8
- Rejects empty text
- Rejects `.zip` / images
- Office/PDF go through `convertAttachment` (csv fixture, same pattern as `src/lib/writing/convert.test.ts`)

### 7.3 Client (`src/lib/knowledge/dochubClient.test.ts`)

- Every request sets `X-User-Id` to the given user id
- Does not send `Authorization` to Dochub
- Upload uses multipart fields `file`, `markdown`, `relative_path`
- Treats 202 as success
- Timeout / fetch throw → unavailable message

### 7.4 Search payload (`src/lib/knowledge/search.test.ts`)

- Default mode `search`, limit 10
- Rejects unknown mode
- Hit path strip: `qmd://markdown/contracts/2024/report.md` → `contracts/2024/report.md`

### 7.5 Sidebar contract (`src/lib/chat/sidebarNav.test.ts` or extend an existing layout test)

- `Sidebar.tsx` contains `Knowledge`, `href: '/knowledge'`, `FolderOpen`
- Knowledge appears after History
- `wide` includes `knowledge`

### 7.6 Public config (`src/lib/config/publicConfig.test.ts`)

- `publicConfigValues` omits `dochub`
- `isForbiddenConfigKey('dochub')` and `isForbiddenConfigKey('dochub.baseUrl')` are true

### 7.7 Manual (implementation verification)

- `/itms/ai/test-login` → Knowledge tab → empty tree
- Create `contracts/2024`, drop a PDF, see Indexing then file in that folder
- Search “a term in the file” after index; click hit → preview
- Second user id does not see the first user’s tree (two tokens)

---

## 8. Files

| Path | Change |
|------|--------|
| `src/components/Sidebar.tsx` | Knowledge nav item; wide layout |
| `src/app/knowledge/page.tsx` | Create page |
| `src/app/knowledge/layout.tsx` | Title |
| `src/components/knowledge/*` | File manager UI |
| `src/app/globals.css` | `.knowledge-*` |
| `src/app/api/knowledge/**/route.ts` | Proxy routes |
| `src/lib/knowledge/config.ts` | Config |
| `src/lib/knowledge/paths.ts` | Path sanitizing |
| `src/lib/knowledge/convert.ts` | Knowledge convert |
| `src/lib/knowledge/dochubClient.ts` | HTTP client |
| `src/lib/knowledge/*.test.ts` | Unit tests |
| `src/middleware.ts` | Protect `/api/knowledge` |
| `src/lib/config/publicConfig.ts` | Strip / forbid `dochub` |
| `src/lib/config/publicConfig.test.ts` | Assert `dochub` is secret |
| `data/config.json` | Optional operator `dochub.baseUrl` (local; do not commit secrets) |

No Drizzle migration. No iTMS permission row. No `SHARED_AGENT_CONTEXT_REV` bump (no agent tools in this slice).

---

## 9. Security notes

- Client never receives a Dochub URL it must call. All knowledge I/O is same-origin `/api/knowledge`.
- Dochub trusts `X-User-Id`. Only this server sets it, from a verified JWT. Do not accept a client-supplied user id header as override.
- Do not proxy arbitrary Dochub paths. Allow-list the routes above.
- `tree=inbox` content is original bytes; require auth. Preview in this slice uses `markdown` only in the UI; keep `inbox` available for a later download control.
- Path sanitizing is mandatory before any Dochub folder/file call.
- QMD MCP is not an HTTP route on this app.

---

## 10. Follow-ups (not this spec)

- Agent tool to search the current user’s Knowledge library in chat.
- Delete / rename when Dochub supports them.
- iTMS permission to hide the tab.
- Download original (`tree=inbox`).
- Empty Markdown note create if Dochub adds a single-part upload.
- Shared / team libraries.
