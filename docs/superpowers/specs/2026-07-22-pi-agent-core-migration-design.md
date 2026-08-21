# Pi Agent Core Migration Design

Date: 2026-07-22  
Status: **Implemented** (2026-08-19) — runtime uses `@earendil-works/pi-agent-core` via `getSharedAgentContext` / `createPiRuntime` / `createPiAgentSessionManager`.  
Scope: Replace `@shareai-lab/kode-sdk` harness with `@earendil-works/pi-agent-core` while preserving app SSE and chat contracts.

## Goals

1. Fully replace `@shareai-lab/kode-sdk` with `@earendil-works/pi-agent-core` (plus `@earendil-works/pi-ai` and session storage).
2. Keep app contracts stable:
   - `MetaSearchAgentType.searchAndAnswer(...)`
   - Chat API SSE event types: `progress`, `response`, `tool_execution`, `tool_error` (and `sources` when collected)
   - Chat-scoped agent reuse via `x-agent-id` / `x-chat-id`
3. Keep per-chat multi-turn memory across process restarts.
4. Keep `newSfcAgent`, `guideAgent`, `newSurveyAgent`, and `writingAgent` as thin orchestrators.
5. Replace kode `agent.complete()` (survey chat + per-question clustering) with `completePiAgent()` over `agent.prompt()`.

## Non-goals

1. Redesign frontend chat UI or SSE protocol.
2. Change RAGFlow / survey **business logic** inside tools (only the tool wrapper API changes).
3. Migrate non-kode agents (`dataAgent`, legacy `sfcAgent`, `surveyAgent`, `agentImage`, etc.).
4. Adopt full `pi-coding-agent` CLI features (bash/fs coding tools) unless a surviving tool needs them.
5. Automatic import of historical kode agent transcripts into the new session store.

## Background and current state

The project does not depend on a package literally named `kode-agent`. The agent harness is **`@shareai-lab/kode-sdk`** (vendored as `vendor/shareai-lab-kode-sdk-2.7.4.tgz`).

| Layer | Role today |
|-------|------------|
| `createAgentRuntime` / `utils/shared/runtime.ts` | Templates, tool registry, model factory, SQLite/JSON store |
| `createManagedAgentContext` / `persistentAgentPool` | Pool + get-or-create by chat/agent id, busy/idle, LRU |
| `defineTool` tools | BM25, guide search, survey tools |
| `agentStream.ts` | Maps kode `text_chunk` / `tool:*` → frontend SSE |
| Agents | `newSfcAgent`, `guideAgent`, `newSurveyAgent` |

### Conceptual API shift

| kode | pi (`@earendil-works/pi-agent-core`) |
|------|-------------------------------------|
| `agent.send(msg)` | `agent.prompt(msg)` |
| `agent.subscribe(['progress'])` / `text_chunk` | `agent.subscribe(event => …)` / `message_update` + `text_delta` |
| `defineTool` + registry | `AgentTool[]` on agent state |
| `AgentPool` + store | No built-in pool; app session manager + storage |
| Templates registry | Plain map: id → systemPrompt + default tools |

## Chosen approach: Adapter façade over pi (Approach A)

Keep the **same app-facing contracts** (`getSharedAgentContext`, manager methods, SSE shape). Reimplement internals on pi.

Rejected alternatives:

- **B — Clean-break pi-native**: larger simultaneous rewrite of three agents; higher regression risk.
- **C — Long dual-run kode+pi**: conflicts with full replace unless limited to a short smoke flag during cutover.

## Target architecture

```text
API chat route  (unchanged)
        │
        ▼
newSfcAgent / guideAgent / newSurveyAgent  (thin; same searchAndAnswer)
        │
        ▼
getSharedAgentContext()  ──► PiAgentSessionManager
        │                         │
        │                         ├─ getOrCreateAgent(sessionId, templateId, toolNames)
        │                         ├─ markBusy / markIdle / normalizeAgentId
        │                         ├─ in-memory LRU + maxActiveAgents
        │                         └─ load/save via Pi session store
        │
        ├─ createPiRuntime()     // models + streamFn from getAgentModelConfig()
        ├─ template registry     // id → { systemPrompt, defaultTools[] }
        ├─ tool factory map      // name → AgentTool
        └─ streamPiAgentToEmitter()  // pi events → existing SSE JSON lines
```

### Package changes

| Action | Package |
|--------|---------|
| Add | `@earendil-works/pi-agent-core` |
| Add | `@earendil-works/pi-ai` |
| Session storage | App-owned PostgreSQL table `pi_sessions` via `pg` (connection from `PI_SESSION_DATABASE_URL` / `databases.agent.connectionString` / `databases.secondary`) |
| Remove | `@shareai-lab/kode-sdk` |
| Remove | `vendor/shareai-lab-kode-sdk-2.7.4.tgz` |

### Module map

| Current (kode) | Target (pi façade) |
|----------------|--------------------|
| `createAgentRuntime.ts` / `runtime.ts` | `createPiRuntime` — models, streamFn, template + tool maps |
| `createManagedAgentContext.ts` + `persistentAgentPool.ts` | `PiAgentSessionManager` with same manager methods agents already call |
| `agentStream.ts` | Map pi `message_update` / `tool_execution_*` → SSE |
| `esBm25Tool` / guide / survey tools | Same logic; `AgentTool` instead of `defineTool` |
| `demo-model.ts` / kode provider | `pi-ai` models + OpenAI-compatible custom provider for `baseUrl` / `apiKey` |
| Local sandbox / builtin fs-bash | Drop unless a surviving tool needs them (current RAG tools do not) |

### Façade contract (preserve for agents)

```ts
interface PiAgentSessionManager {
  normalizeAgentId(agentId?: string): string;
  touchAgent(agentId: string): void;
  markBusy(agentId: string): void;
  markIdle(agentId: string): void;
  getOrCreateAgent(
    agentId?: string,
    toolsOverride?: string[],
    templateIdOverride?: string,
  ): Promise<Agent>; // @earendil-works/pi-agent-core Agent
}
```

Agents keep the shape: get context → `getOrCreateAgent` → stream subscription → `prompt(message)` → mark idle.

## Session persistence and pool lifecycle

### Requirements (parity with today)

1. Stable id from `x-agent-id` or `x-chat-id` (fallback: default id such as `rag-chat-agent-default`).
2. Same id ⇒ same conversation context across turns.
3. Survive process restart.
4. Bound memory via `maxActiveAgents` (`ragflow.maxActiveAgents`, default 100); LRU eviction of idle agents.
5. Busy protection: do not evict agents currently handling a request.

### Hybrid session model

```text
Request (chatId)
    │
    ▼
normalizeAgentId
    │
    ▼
In-memory map: agentId → { agent, lastUsedAt, busy }
    │
    ├─ HIT  → touch, apply template/tools override if needed, return agent
    │
    └─ MISS → ensureCapacity (evict idle LRU)
              → load messages from SQLite session for agentId (if any)
              → new Agent({ initialState: { systemPrompt, model, tools, messages }, sessionId: agentId, streamFn })
              → cache + return
```

**On run boundaries** (after `agent_end` / idle, and best-effort on process signals):

- Persist `agent.state.messages` (and metadata: templateId, modelId, updatedAt) keyed by `agentId`.

**On eviction from memory:**

1. Flush messages to SQLite.
2. Drop the in-memory `Agent`.
3. Next request for that id: cold start + reload messages → multi-turn context restored.

### Storage

| Topic | Decision |
|-------|----------|
| Backend | Prefer `@earendil-works/pi-storage-sqlite-node` if load/save of message lists by session id is straightforward. |
| Fallback | App-owned SQLite table under `data/` storing serialized `AgentMessage[]` + templateId. |
| Default path | New DB path such as `data/pi-sessions.db` (do not mix with kode agent rows). |
| Config knobs | Keep path semantics similar to current `sqliteDbPath` / `sqliteDataDir` options. |
| Kode DB migration | Out of scope for v1. Existing chats start with empty agent memory unless a converter is added later. |

### Lifecycle methods

| Method | Behavior |
|--------|----------|
| `normalizeAgentId` | trim; empty → default agent id |
| `getOrCreateAgent(id, tools?, templateId?)` | ensure capacity; load/create; set system prompt and tools from template + overrides |
| `markBusy` / `markIdle` | concurrency + eviction safety |
| `touchAgent` | update LRU timestamp |

### Capacity and concurrency

1. Evict only idle agents (`!busy`).
2. Prefer least recently used (`lastUsedAt`).
3. Always persist before unload.
4. If all agents are busy and pool is full: throw a controlled error (no unbounded growth).
5. One in-flight `prompt()` per agent id at a time.
6. Parallel different chat ids allowed up to `maxActiveAgents`.
7. `newSurveyAgent` multi-agent pattern (shell + cluster ids) remains supported as separate session keys.

### Not persisted

- Kode progress stream bookmarks.
- Sandbox / workDir state.
- Provider stream caches beyond what `sessionId` already implies.

### Abort

- Wire `AbortSignal` into stream subscription and cancel active run when pi supports it.
- On abort: mark idle, best-effort flush, end SSE cleanly.

## Tools, templates, models, stream mapping

### Model config (`createPiRuntime`)

Source of truth remains `getAgentModelConfig()` (`base.modelId`, `base.apiKey`, `base.baseURL`).

- Build a process-singleton `Models` collection via `createModels()` from `@earendil-works/pi-ai`.
- Prefer an **OpenAI-completions-compatible** custom provider pointed at `base.baseURL` (config uses model ids such as `gpt-3.5-turbo` and a custom gateway URL).
- Set `compat` flags (for example `supportsDeveloperRole: false`) when the gateway is Ollama/vLLM-like.
- Pass `streamFn: models.streamSimple.bind(models)` into each `Agent`.
- Optional later: Anthropic Messages path if a deployment requires it.

### Templates

Replace kode `AgentTemplateRegistry` with a plain map:

| Template id | System prompt | Default tools |
|-------------|---------------|---------------|
| `rag-base-template` | `RAG_BM25_SYSTEM_PROMPT` | `[]` (SFC typically passes `['es_bm25_search']`) |
| `rag-training-guide-template` | `RAG_BM25_SYSTEM_PROMPT_TRAINING_GUIDE` | guide tool(s) as today |
| `rag-survey-template` | `RAG_SURVEY_SYSTEM_PROMPT` | survey tool names |
| `rag-survey-chat-template` | `RAG_SURVEY_CHAT_SYSTEM_PROMPT` | `[]` |
| `writing-agent-template` | `WRITING_AGENT_SYSTEM_PROMPT` | `[]` |

On `getOrCreateAgent(..., toolsOverride, templateIdOverride)`:

1. Resolve template → system prompt + default tool names.
2. Effective tools = `toolsOverride ?? template.tools`.
3. Assign `agent.state.systemPrompt` and `agent.state.tools`.

Prompt **content** stays in `src/lib/search/shared/prompts/*`.

### Tools

Port wrappers from kode `defineTool` to pi `AgentTool` (TypeBox parameters). Business logic unchanged.

Convention:

- `content[].text` = string the model sees (JSON string of today’s tool result).
- `details` = structured object for the stream adapter (for example `chunks` for source extraction).

Tool **names** and model-facing JSON fields stay stable.

| Module | Change |
|--------|--------|
| `esBm25Tool.ts` | Wrapper → `AgentTool` |
| `guideSearchTool.ts` | Wrapper → `AgentTool` |
| `surveySearchTool.ts` | Wrapper → `AgentTool` (all defined tools) |
| `clusterViaKodeAgent.ts` | Behavior preserved; no kode `Agent` (short-lived pi agent or pure LLM JSON helper) |

If survey tools assume ordered multi-tool steps, set `toolExecution: 'sequential'` on those agents.

### Stream adapter (`streamPiAgentToEmitter`)

Prefer one shared helper for text, tools, errors, and finish so agents stay thin.

| Pi event | Frontend SSE |
|----------|--------------|
| First assistant `message_update` with `text_delta` | Optional disclaimer `response` (existing red warning), then `response` deltas |
| Subsequent `text_delta` | `{ type: 'response', data: delta }` |
| `tool_execution_start` | `{ type: 'tool_execution', data: { id, name, state: 'RUNNING', inputPreview: args } }` |
| `tool_execution_end` | Optional update; if `details.chunks`, collect sources |
| Tool error | `{ type: 'tool_error', data: { id, name, error, ... } }` |
| Agent/runtime error | `response` with error text and/or `tool_error` |
| `agent_end` | Emit `sources` if collected; emit `progress` finished; complete |

Removed kode concepts: progress bookmark / `since` cursor, `subscribe(['progress'])` envelopes.

### Agent orchestrator flow (unchanged shape)

```text
emit progress start
agent = await manager.getOrCreateAgent(id, tools, templateId)
markBusy / touch
subscription = streamPiAgentToEmitter({ agent, emitter, signal, ... })
await agent.prompt(message)   // was agent.send
await subscription            // or rely on prompt() settlement + flush
markIdle
emit end
```

### Frontend / API compatibility (must not change)

- Chat route SSE framing
- Event type names used by chat UI / tool panel
- Headers `x-agent-id` / `x-chat-id`
- Focus-mode wiring in `searchHandlers`

## Migration order

| Phase | Work | Outcome |
|-------|------|---------|
| 0. Prep | Add pi packages | Deps install; types available |
| 1. Runtime | `createPiRuntime` | Can construct a bare `Agent` against configured gateway |
| 2. Tools | Port BM25 / guide / survey to `AgentTool` | Tools unit-callable |
| 3. Session manager | LRU, busy/idle, SQLite load/save | Drop-in manager API |
| 4. Stream adapter | Pi events → SSE | Contract covered by smoke |
| 5. Wire agents | Context singleton → pi; `send` → `prompt` | Three harness agents on pi |
| 6. Remove kode | Delete kode utils, package, vendor tarball | Zero kode imports |
| 7. Docs / config | Document session DB path and no kode-DB migration | Operators informed |

Optional short feature flag (`agentRuntime: 'pi' | 'kode'`) only during phase 5 smoke — not a long dual stack; remove before merge if full replace is the goal.

### Files expected to change

**Rewrite / replace**

- `src/lib/search/shared/runtime/createAgentRuntime.ts`
- `src/lib/search/shared/agent/createManagedAgentContext.ts`
- `src/lib/search/shared/agent/getSharedAgentContext.ts`
- `src/lib/utils/persistentAgentPool.ts` → pi session manager
- `src/lib/utils/agentStream.ts`
- `src/lib/utils/shared/runtime.ts`, `demo-model.ts`, `localSandboxFactory.ts` (remove or gut)
- Tools under `src/lib/search/shared/tools/*`

**Light touch**

- `newSfcAgent.ts`, `guideAgent.ts`, `newSurverAgent.ts`
- `package.json` / lockfile
- Delete `vendor/shareai-lab-kode-sdk-2.7.4.tgz`

**Unchanged**

- Chat API route, frontend components, non-kode agents, RAGFlow client business logic, system prompt text (cosmetic “Kode” labels optional)

## Testing and verification

1. Typecheck / build with zero kode imports.
2. Smoke SFC: progress → disclaimer → streamed text → tool_execution when tools run → finished progress → stream end.
3. Smoke Guide with guide template/tools.
4. Smoke Survey: shell + cluster agent ids; busy/idle; no hang.
5. Persistence: two requests same `x-chat-id` share context; after server restart, history still loads.
6. Eviction: low `maxActiveAgents`; oldest idle evicted; re-open reloads messages from DB.
7. Abort: mid-stream cancel → clean SSE end, agent idle.
8. Error path: bad API key / tool failure → readable error, stream always ends.

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| OpenAI vs Anthropic wire mismatch with gateway | Explicit OpenAI-completions custom provider + compat flags; smoke against real `base.baseURL` in phase 1 |
| Tool result format breaks model behavior | Stable JSON field names; model string in `content`, structured data in `details` |
| pi-storage API friction | Spike load/save in phase 3; fallback app-owned message table |
| Lost multi-turn after deploy | Document no kode-DB migration; new `data/pi-sessions.db` |
| Parallel tool calls reorder survey steps | `toolExecution: 'sequential'` when needed |
| Double tool SSE events | Single stream adapter owns mapping |
| Pool full under load | Controlled error; no unbounded Map growth |

## Success criteria

- [ ] No dependency on `@shareai-lab/kode-sdk` or vendor tarball
- [ ] `newSfcAgent`, `guideAgent`, `newSurveyAgent` work with existing UI
- [ ] Per-chat persistence across restart
- [ ] SSE event types and chat headers unchanged
- [ ] RAG/survey tool business behavior unchanged

## Deferred

- Importing historical kode agent transcripts
- Adopting `pi-coding-agent` coding tools
- Redesigning frontend tool panel
- Migrating LangChain-based agents to pi

## Decision log

| Decision | Choice |
|----------|--------|
| Package | `@earendil-works/pi-agent-core` (+ `pi-ai`, `pi-storage-sqlite-node`) |
| Scope | Full replace of kode harness |
| Persistence | Per-chat, survives restart |
| Architecture | Adapter façade (Approach A) |
| Old kode sessions | Not migrated in v1 |
| Model wire | Prefer OpenAI-completions-compatible against `base.baseURL` |
