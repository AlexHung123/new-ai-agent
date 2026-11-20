# Agent Writing Knowledge Files and Dochub Search

Date: 2026-11-20  
Status: **Draft**  
Scope: Show the user's Knowledge library as a preview-only **Files** tree on Agent Writing; support `@folder` and `@document`; on every writing turn search that library through in-process Dochub AgentTools. QMD stays on the Mac.

Related:

- Branch: `feat/agent-knowledge`
- Knowledge manager spec: `docs/superpowers/specs/2026-11-20-agent-knowledge-design.md` (agent chat search was out of that slice; this spec is that slice for Agent Writing)
- Dochub HTTP: `http://192.168.1.56:8787` (`dochub.baseUrl`)
- Dochub skill: host-adapted copy at `data/prompts/dochubSkill.md` (from the pi-agent Dochub `SKILL.md` provided 2026-11-20)

## 1. Goal

Signed-in users browse their Knowledge documents from Agent Writing, preview markdown in the existing right panel, mention a folder or document with `@`, and ask writing questions that the agent answers from that library. Isolation is the JWT user id (`X-User-Id`). The model never sees QMD, an index path, a collection name, or a `user_id` it can type into a tool.

### 1.1 Outcomes

1. Agent Writing left rail shows a FILES tree of the current user's Knowledge folders and files (same tree as `/knowledge`).
2. Clicking a file opens the writing right-panel markdown preview via `GET /api/knowledge/files/:id/content?tree=markdown`.
3. Clicking a folder selects it as the default search pin. Root / no selection means the whole library.
4. Typing `@` in the Agent Writing composer lists matching folders and files; inserting uses the tree node path.
5. Every writing turn registers Dochub tools. Search text is the user question (the model may rewrite it for `query`). The host supplies `user_id` and an optional folder pin.
6. `@` mentions win over the Files selection for that turn, per §5.
7. `/knowledge` remains the upload and manage surface.

### 1.2 Non-goals

| Out of scope | Why |
|--------------|-----|
| Spawn `python3 -m dochub mcp` | Locked approach: in-process AgentTools. Same isolation contract. |
| Browser → Dochub or QMD MCP | Unchanged: browser talks only to `/itms/ai/api/knowledge/*`. |
| Upload, drop, or new-folder on Agent Writing | Preview and `@` only. |
| Delete / rename | Dochub returns 501. |
| Knowledge-page search `path` UI | Tools call `dochubClient` with `path`; the Knowledge page keeps its current search body. |
| Agent Document / other focus modes | Document agent keeps `fs_*`. |
| Delete `data/writing-attachments` or `/api/writing/files` | Leave the old disk library and routes. Writing chat no longer uses them. |
| Persist the Files pin on the chat row | Pin is UI state plus `@` in the message. |
| Sharing a library across users | Isolation is `X-User-Id` = JWT id. |

### 1.3 Locked decisions

1. Every writing turn can search. Tools are always on for `agentWriting`.
2. Files selection is the default pin. `@` wins for that turn.
3. `@folder` is the `path` pin. `@document` is a retrieve hint (`get` that file) and still `query`s. Several `@document`s with no `@folder`: pin to the longest common parent folder, or the whole library when they do not share one.
4. In-process `AgentTool`s named `query`, `get`, `multi_get`, `tree`, `status` wrap `dochubClient`. No Python MCP child.
5. Dochub skill text is stored in-repo and prepended to the writing system prompt. Starting tools does not load the skill by itself.
6. Tool schemas have no `user_id`. The host binds JWT `userId` in writing turn context.
7. Host computes the pin and clamps `query.path` / `tree` to it. Mentioned documents may still be `get`s when they sit outside that pin.
8. Writing `fs_*` is off for this agent. Knowledge is the document source.
9. User question is the only search text the model should need; file bodies are not injected on the first prompt.
10. Contract tests (`readFileSync` / unit tests). No Playwright unless asked.

---

## 2. Architecture

This Next.js process is the agent host. Dochub on the Mac is the only process that runs QMD.

```
Agent Writing
  Files rail  →  GET /api/knowledge/tree
  click file  →  GET /api/knowledge/files/:id/content?tree=markdown
  send chat   →  POST /api/chat
                    │  JWT user id
                    │  pin = @ (wins) or selected folder or (none)
                    ▼
              WritingAgent  (pi-agent-core)
                systemPrompt += Dochub skill
                tools: query, get, multi_get, tree, status,
                       read_skill, am_render
                    │  X-User-Id from login (turn context)
                    │  path from host pin
                    ▼
              dochubClient  →  dochub.baseUrl
                    POST /v1/search   { query, mode, limit, path? }
                    GET  /v1/files/:id/content?tree=markdown
                    GET  /v1/tree
                    GET  /health
                    ▼
              Mac QMD in users/<id>/
```

The model sees the user question, optional `[Pinned folder]` / `[Mentioned documents]` notes, and the tools. It never receives the qmd binary, `.qmd/index.sqlite`, or collection names.

---

## 3. Product shape

### 3.1 Files rail

`WritingLeftRail` keeps `AgentCard` and adds a FILES panel below it (`WritingKnowledgeFiles`).

- Loads `GET /itms/ai/api/knowledge/tree` with the existing JWT helper.
- Renders folders and files from that tree (recursive). Knowledge's manager tree stays folders-only; this rail is an explorer.
- Click a folder: select it (highlight). That path is `knowledgeFolder` on the next send.
- Click the FILES heading (or a Root row): clear selection (whole library).
- Click a file: open a right-panel tab. Do not change the folder pin.
- No upload, drop, create-folder, or paperclip on this rail or the writing composers.
- Empty copy: `Upload documents on Knowledge.`
- Dochub/tree error: inline message, empty tree, `@` has no suggestions.

Visibility follows `.writing-left-rail`: shown at `min-width: 1280px`. While the writing preview is open, the rail **stays visible** (do not use `display: none` on `.writing-left-rail` when `.right-panel-open`). Chat content keeps left padding so it clears the fixed rail.

### 3.2 Preview

Extend preview tabs:

- `id`: `knowledge:${fileId}`
- `kind`: `'file'`
- `source`: `'knowledge'`
- `fileId`: Dochub file id
- `label`: original filename

`WritingPreviewPanel` loads knowledge tabs from  
`GET /itms/ai/api/knowledge/files/:id/content?tree=markdown`  
and keeps Source / Preview / download. HTML explainer tabs are unchanged.

### 3.3 `@` picker

On `focusMode === 'agentWriting'` only, composers (`MessageInput`, `EmptyChatMessageInput`) show an `@` menu when `atQueryAtCursor` matches.

- Candidates: flatten the Knowledge tree (dirs and files).
- Filter by name and path substring (case-insensitive).
- Insert `@${node.path} ` via existing `insertMention`.
- Shared tree fetch with the Files rail (one hook). On viewports where the rail is hidden, the picker still works.

### 3.4 Chat body

Optional `knowledgeFolder`: string, default omitted/empty. Client sends the selected folder path. Server never trusts `body.userId`. Pin resolution always re-checks the live tree (§5).

---

## 4. Components (code units)

| Unit | Responsibility |
|------|----------------|
| `WritingKnowledgeFiles` | FILES tree UI; selection; file click → `openWritingFile` / preview tab |
| Writing `@` menu | Composer suggestions from the same tree |
| `resolveWritingKnowledgePin` | Pure function: message + tree + selected folder → `{ pin, mentionedFolders, mentionedDocuments }` |
| `writingTurnContext` | `{ userId, pin, mentionedDocuments, tree }` (drop `rootAbs` / `files` from the writing agent path). `tree` is the `getTree` result for this turn, or `null` when Dochub failed. |
| `createDochubTools()` | Five AgentTools; read context; no `user_id` in schemas |
| `dochubClient.search` | Optional `path` on `POST /v1/search` |
| `mapDochubQueryArgs` | Skill-style `searches` / `intent` → Dochub `{ query, mode, limit, path? }` |
| `getDochubMarkdown` | Resolve path on the tree → `getFileContent` markdown, line slice |
| `data/prompts/dochubSkill.md` | Host-adapted skill; prepended to writing system prompt |
| `buildWritingUserPrompt` | Pin / mention notes + `[User request]`; no file bodies |

`/knowledge` components stay the manager. Reuse `isSafeRelativePath`, tree walkers, and knowledge HTTP helpers.

---

## 5. Pin and mention resolution

`resolveWritingKnowledgePin({ text, tree, selectedFolder })`.

Match `@` against tree nodes, longest path first, case-insensitive:

- Folder: `node.path` (type `dir`)
- File: `node.path`, `file.original_filename`, `file.markdown_relpath`, `file.inbox_relpath`

Spaced names use a full `@path` / `@filename` substring (same idea as current `resolveMentionedFiles`). Token regex `/@([^\s@]+)/g` is a fallback for paths without spaces.

Then:

1. If any `@folder` matched: `pin` = the first of those folders in left-to-right message order.
2. Else if any `@document` matched: `pin` = longest common parent directory of those files. If that parent is empty, `pin` = `null` (whole library).
3. Else if `selectedFolder` is a non-empty safe path and names a `dir` on the tree: `pin` = that path.
4. Else `pin` = `null`.

`mentionedDocuments` = every matched file (id, path, original filename, `markdown_relpath`).

Unknown `@` tokens and unknown `selectedFolder` are ignored (no send failure). Unsafe paths (`..`, leading `/`, backslash) are ignored.

Longest common parent: parents of `writing/2024/a.md` and `writing/2024/b.md` → `writing/2024`; `writing/a.md` and `contracts/b.md` → `null`; `writing/2024/a.md` and `writing/2025/b.md` → `writing`.

---

## 6. Agent turn

### 6.1 Context

On `POST /api/chat` with `focusMode === 'agentWriting'`:

1. `userId` from JWT.
2. `getTree(userId)`. If this fails, still run the turn with `pin: null`, `mentionedDocuments: []`, `tree: null`; tools will error when called.
3. Resolve pin from message content + `body.knowledgeFolder` + that tree.
4. `runWithWritingTurn({ userId, pin, mentionedDocuments, tree }, runSearch)`.
5. Do not call `ensureUserWritingWorkspace` and do not `bindTurnFsTools` for writing.

### 6.2 Tools

`writing-agent-template` tools:

`query`, `get`, `multi_get`, `tree`, `status`, `read_skill`, `am_render`.

`writingToolsForTurn` always returns that list. Keep `bindTurnHtmlTool` and `promptWithImages` on the writing turn.

### 6.3 User prompt

```
[Pinned folder]
contracts/2024

[Mentioned documents]
The user @-mentioned these files. After query, get them (and the search hits). Do not invent quotes from snippets.
- `writing/plan.md` — Plan.docx

[User request]
季度規劃喺邊份合約
```

Omit a block when it is empty. Never attach markdown bodies here.

### 6.4 System prompt

Prepend `data/prompts/dochubSkill.md` to the writing prompt (via `loadPrompt` / `withSkillsCatalog` as today). Adapt the downloaded skill:

- Compatibility: in-process host tools; identity and pin come from the host.
- Keep workflow `query` → `get` / `multi_get` → answer; structured `searches`; never pass `user_id`; never run `qmd`.
- Replace MCP spawn wording.

Remove writing-prompt instructions that tell the model to use `fs_*` / `[Mentioned files]` / `INDEX.md`. Keep language, drafting, and HTML-explainer (`read_skill` / `am_render`) rules.

---

## 7. Tool contracts

All five tools: no `user_id` property. Extra `user_id` in arguments is dropped. Missing turn `userId` → `{ ok: false, error: 'No user bound' }`.

### 7.1 `query`

Args: `query?`, `mode?` (`search` | `vsearch` | `query`), `searches?` (`{ type: lex|vec|hyde, query }[]`), `intent?`, `limit?`, `path?`.

Map to Dochub `POST /v1/search`:

| Input | `mode` | `query` string |
|-------|--------|----------------|
| Only `lex` searches | `search` | joined lex queries |
| Only `vec` searches | `vsearch` | joined vec queries |
| Mixed / `hyde` / `intent` | `query` | `intent`, else hyde text, else joined searches |
| Bare `query` string (no `searches`) | `args.mode` if valid, else `query` | that string |

If both `searches` and `query` are present, use `searches`. If neither yields a non-empty query string, return `{ ok: false, error: 'query is required' }`.

`limit`: default 5, min 1, max 10.

`path`: start from turn `pin`. A path is inside the pin when it equals the pin or starts with `pin + '/'`. If the model also passes `path` and it is a safe relative path inside the pin, use the more specific path. If it is outside the pin, keep the pin. If `pin` is null, a safe model `path` is allowed. Omit `path` on the HTTP body when unset.

Strip `qmd://markdown/` on result `file` fields before returning to the model.

### 7.2 `get`

Args: `file` (path, optional `:from:count` or `:from`), optional `fromLine`, `maxLines`.

Resolve `file` (after stripping `qmd://markdown/` and the range suffix) against the tree: `markdown_relpath`, `inbox_relpath`, `node.path`. Then `getFileContent(userId, file.id, 'markdown')`.

Line slice: `fromLine`/`maxLines` override a suffix. Default peek: line 1, 80 lines. From-only suffix: from that line to end, still capped. Byte cap 200 KiB. Return line-numbered text plus `dochub_path`.

`get` of a path in `mentionedDocuments` is allowed even when it sits outside `pin`. Any other path must be under `pin` when `pin` is set (else `{ ok: false }`). Paths always stay inside this user's tree.

### 7.3 `multi_get`

Args: `files` string or string[] (comma-separated allowed). Max 10 paths per call. A last-segment glob (`contracts/*.md`) expands to matching files in that folder on the tree (not recursive). Each path uses `get` rules; one failure does not stop the others.

### 7.4 `tree`

Returns the user's tree. When `pin` is set, return the subtree at that path (empty if missing). Model `path` is clamped like `query`.

### 7.5 `status`

`{ ok, bound: true, pin }` plus Dochub `/health` when reachable. Do **not** return the user id string.

---

## 8. Data flow (end to end)

1. User types a question, optionally selects a folder, optionally `@` mentions.
2. Browser `POST /itms/ai/api/chat` with JWT and optional `knowledgeFolder`.
3. Server resolves pin; binds turn context; `agent.prompt(buildWritingUserPrompt(...))`.
4. Model `query` → host adds/clamps `path` → `POST http://<mac>:8787/v1/search` header `X-User-Id`.
5. Mac runs QMD in `users/<id>/`; hits return to the tool.
6. Model `get` → tree resolve → `GET /v1/files/:id/content?tree=markdown` → sliced lines.
7. Model answers from retrieved text, citing `dochub_path` and lines.

---

## 9. Error handling

| Case | Behavior |
|------|----------|
| Dochub down on tree fetch (Files / `@`) | Inline error, empty tree, no suggestions |
| Dochub down on a writing send | Turn still runs; tools return `{ ok: false, error }`; agent writes and says the library is unavailable when documents were needed |
| Zero search hits | Return empty results; agent must not invent quotes |
| Semantic / hybrid search fails | Tool returns the error; skill says retry lex / `mode: search` |
| Unknown get path, still indexing, 404 | `{ ok: false }` for that path |
| `multi_get` partial failure | Include per-path errors; continue the rest |
| No JWT | 401 on chat and knowledge routes |
| Unsafe / unknown pin | Ignore; treat as no pin |
| File still ingesting | Preview markdown if content exists; `query` may miss it until ingest finishes |

---

## 10. Testing

No Playwright unless asked. Vitest contract and unit tests.

**UI**

- `WritingLeftRail` mounts FILES + `AgentCard`.
- Source has no upload, drop, new-folder, or writing paperclip.
- Composers include an `@` picker only for `agentWriting`.
- `WritingPreviewPanel` fetches knowledge content for `source === 'knowledge'`.
- CSS: `.writing-knowledge-files` exists; `.writing-left-rail` stays visible with `.right-panel-open` at xl.

**Pin**

- Selected folder only.
- `@folder` wins over selection.
- `@document` shared parent; mixed parents → `pin` null.
- Unknown `@` ignored.
- Unsafe paths rejected.

**Tools**

- Schemas have no `user_id`.
- `query` HTTP body includes `path` when pinned and omits it when not.
- Path outside the pin is clamped.
- `X-User-Id` is the JWT user.
- `dochubClient.search` forwards `path`.
- `mapDochubQueryArgs` lex → `mode=search`, vec → `vsearch`, mixed → `query`.

**Agent wiring**

- Template tool list is the five Dochub tools plus `read_skill`, `am_render`.
- Writing system prompt includes the Dochub skill and has no `fs_*` document instructions.
- `buildWritingUserPrompt` adds pin/mention notes and does not inject file bodies.
- `writingAgent` does not `bindTurnFsTools`.

**Knowledge page**

- Existing `knowledgeUi` / route tests still pass.
- Browser source still has no `qmd mcp`.

---

## 11. Files likely to change

- `src/components/WritingLeftRail.tsx`, new `WritingKnowledgeFiles` (+ `@` menu in composers)
- `src/components/WritingPreviewPanel.tsx`, `src/lib/chat/writingPreviewTabs.ts`, `RightPanelContext`
- `src/lib/hooks/useChat.tsx`, `src/lib/chat/chatBodySchema.ts`, `src/app/api/chat/route.ts`
- `src/lib/knowledge/writingPin.ts` (new; `insertMention` / `atQueryAtCursor` stay in `src/lib/writing/mentions.ts`)
- `src/lib/search/shared/runtime/writingTurnContext.ts`
- `src/lib/search/shared/tools/dochubTools.ts` (new)
- `src/lib/search/shared/prompts/writingTurnPrefix.ts`, `writingAgentSystemPrompt.ts`, `data/prompts/agentWriting.md`
- `data/prompts/dochubSkill.md` (new)
- `src/lib/search/shared/agent/getSharedAgentContext.ts`, `src/lib/search/writingAgent.ts`
- `src/lib/knowledge/dochubClient.ts`, `src/lib/knowledge/search.ts`
- `src/app/globals.css`
- Tests listed in §10; rewrite `src/lib/writing/fileBrowserLayout.test.ts` for the new FILES rail

---

## 12. Isolation checklist

- Login `user_id` only, same value as Knowledge `X-User-Id`.
- No `user_id` on tool schemas; drop it if the model sends one.
- No qmd binary, index path, or collection name in prompts or tool args.
- No shared MCP / shared tool instance across users: tools read `userId` from AsyncLocalStorage per request.
- Optional folder pin from `@` / Files selection, clamped on the host.
- Browser never calls Dochub.
