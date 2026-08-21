# Pi Agent Core Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `@shareai-lab/kode-sdk` with `@earendil-works/pi-agent-core` while keeping chat SSE, `searchAndAnswer`, and per-chat memory unchanged.

**Architecture:** Adapter façade. App-facing `getSharedAgentContext().manager` stays (`normalizeAgentId`, `getOrCreateAgent`, `markBusy` / `markIdle`). Internals become a pi `Agent` per session id, SQLite message store, and one stream mapper (`message_update` / `tool_execution_*` → existing SSE). Survey `agent.complete()` becomes `completePiAgent()` (prompt + collect assistant text). `writingAgent` is in scope.

**Tech Stack:** Next.js 15, `@earendil-works/pi-agent-core` + `@earendil-works/pi-ai`, `typebox`, `better-sqlite3`, Vitest.

---

## File map

| File | Responsibility |
|------|----------------|
| `src/lib/search/shared/runtime/piToolResult.ts` | `{ content, details }` helper for AgentTool |
| `src/lib/search/shared/runtime/piModel.ts` | OpenAI-compat model from `getAgentModelConfig()` |
| `src/lib/search/shared/runtime/createPiRuntime.ts` | Templates, tool map, `createAgent` |
| `src/lib/search/shared/runtime/piSessionStore.ts` | SQLite load/save of `messages` by agent id |
| `src/lib/search/shared/agent/piAgentSessionManager.ts` | LRU + busy/idle + getOrCreate |
| `src/lib/search/shared/agent/completePiAgent.ts` | One-shot text completion (replaces kode `complete`) |
| `src/lib/utils/agentStream.ts` | Rewrite: pi events → SSE |
| `src/lib/search/shared/tools/*` | Same exec logic; `defineTool` → `AgentTool` |
| `src/lib/search/shared/agent/getSharedAgentContext.ts` | Wire pi runtime + manager |
| `newSfcAgent` / `guideAgent` / `writingAgent` / `newSurverAgent` | `send` → `prompt`; drop kode listeners |
| `clusterViaKodeAgent.ts` | Use `completePiAgent` |
| Delete | kode runtime, pool, demo-model, sandbox, vendor tarball |

**Out of scope:** LangChain agents, frontend UI, kode DB import, pi-rag skills/fs/python/compaction.

---

### Task 1: Deps + test runner

**Files:**
- Modify: `package.json`
- Modify: `next.config.mjs`
- Create: `vitest.config.ts`

- [ ] **Step 1: Add packages and scripts**

```bash
npm install @earendil-works/pi-agent-core @earendil-works/pi-ai typebox
npm install -D vitest
```

Add scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.

Replace `serverExternalPackages` kode entry with `@earendil-works/pi-agent-core`, `@earendil-works/pi-ai`. Keep `better-sqlite3`.

- [ ] **Step 2: Add `vitest.config.ts`**

```ts
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json next.config.mjs vitest.config.ts
git commit -m "chore: add pi-agent-core, pi-ai, typebox, and vitest"
```

---

### Task 2: Tool result helper + model builder

**Files:**
- Create: `src/lib/search/shared/runtime/piToolResult.ts`
- Create: `src/lib/search/shared/runtime/piToolResult.test.ts`
- Create: `src/lib/search/shared/runtime/piModel.ts`
- Create: `src/lib/search/shared/runtime/piModel.test.ts`

- [ ] **Step 1: Failing tests**

`piToolResult.test.ts`: `jsonToolResult({ total: 1 })` returns `content[0].text === JSON.stringify({ total: 1 })` and `details.total === 1`.

`piModel.test.ts`: `buildPiModelFromConfig({ modelId: 'qwen', apiKey: 'k', baseUrl: 'http://gw:8000/' })` yields `api: 'openai-completions'`, stripped trailing slash, `compat.supportsDeveloperRole === false`, `getApiKey()` returns `'k'`.

- [ ] **Step 2: Run tests — expect FAIL (modules missing)**

```bash
npx vitest run src/lib/search/shared/runtime/piToolResult.test.ts src/lib/search/shared/runtime/piModel.test.ts
```

- [ ] **Step 3: Implement**

```ts
// piToolResult.ts
export function jsonToolResult<T>(value: T) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(value) }],
    details: value,
  };
}
```

```ts
// piModel.ts — OpenAI-completions custom provider against getAgentModelConfig()
export type PiModelConfig = { modelId: string; apiKey: string; baseUrl: string };
export function buildPiModelFromConfig(config: PiModelConfig) { /* see implementation */ }
export function createPiModelBundle(config: PiModelConfig) {
  return { model: buildPiModelFromConfig(config), getApiKey: () => config.apiKey || undefined };
}
```

- [ ] **Step 4: Tests pass + commit**

---

### Task 3: SQLite session store

**Files:**
- Create: `src/lib/search/shared/runtime/piSessionStore.ts`
- Create: `src/lib/search/shared/runtime/piSessionStore.test.ts`

- [ ] **Step 1: Failing tests (use temp db file)**

- `save` then `load` returns same messages + templateId
- `load` missing id returns null
- `exists` true/false
- overwrite updates messages

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement `better-sqlite3` table `pi_sessions (agent_id PK, template_id, messages_json, updated_at)`**

- [ ] **Step 4: Tests pass + commit**

---

### Task 4: Session manager (LRU / busy / getOrCreate)

**Files:**
- Create: `src/lib/search/shared/agent/piAgentSessionManager.ts`
- Create: `src/lib/search/shared/agent/piAgentSessionManager.test.ts`

Inject `createAgent` so tests never construct a real pi Agent.

- [ ] **Step 1: Failing tests**

- empty / whitespace id → `rag-chat-agent-default`
- same id returns same instance
- template + tools override applied on create
- markBusy blocks eviction; idle LRU evicted when over max
- evicted idle agent is persisted then dropped; next getOrCreate reloads messages
- all busy + full pool throws `Agent pool is full`

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement manager matching façade:**

```ts
getOrCreateAgent(id?, toolsOverride?, templateIdOverride?): Promise<PooledAgent>
normalizeAgentId / touchAgent / markBusy / markIdle
```

`markIdle` flushes messages to store.

- [ ] **Step 4: Tests pass + commit**

---

### Task 5: complete() adapter + stream mapper

**Files:**
- Create: `src/lib/search/shared/agent/completePiAgent.ts`
- Create: `src/lib/search/shared/agent/completePiAgent.test.ts`
- Modify: `src/lib/utils/agentStream.ts`
- Create: `src/lib/utils/agentStream.test.ts`

- [ ] **Step 1: Failing tests**

`completePiAgent`: fake agent emits `text_delta` "hello" then `agent_end`; result `{ status: 'ok', text: 'hello' }`.

`streamAgentProgressToEmitter`:
- first `text_delta` emits disclaimer `response` then delta `response`
- `tool_execution_start` → `{ type: 'tool_execution', data: { id, name, state: 'RUNNING', inputPreview } }`
- `tool_execution_end` with `details.chunks[].document_link` collects `sources`
- `tool_execution_end` `isError` → `tool_error`
- `agent_end` → `sources` (if any) + `progress.finished`

Drop `progressBookmarkByAgent`. Keep export name `streamAgentProgressToEmitter`.

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement using `agent.subscribe` callback (not kode async iterator)**

- [ ] **Step 4: Tests pass + commit**

---

### Task 6: Port tools to AgentTool

**Files:**
- Modify: `src/lib/search/shared/tools/esBm25Tool.ts`
- Modify: `src/lib/search/shared/tools/guideSearchTool.ts`
- Modify: `src/lib/search/shared/tools/surveySearchTool.ts`
- Create: `src/lib/search/shared/tools/esBm25Tool.test.ts` (wrapper shape only; mock `queryRagflow` if needed — prefer testing `jsonToolResult` usage via a tiny `asAgentTool` unit if exec is too heavy)

Keep tool **names** and JSON fields identical. Drop `defineTool` / `EnhancedToolContext`. Survey `ctx.emit` is unused by the orchestrator — delete it.

```ts
import { Type } from 'typebox';
import type { AgentTool } from '@earendil-works/pi-agent-core';
import { jsonToolResult } from '../runtime/piToolResult';

export function createEsBm25SearchTool(): AgentTool {
  return {
    name: 'es_bm25_search',
    label: 'ES BM25 search',
    description: 'Search chunks in Elasticsearch using BM25.',
    parameters: Type.Object({
      query: Type.String({ description: 'Natural language query text' }),
      top_k: Type.Optional(Type.Number({ description: 'Maximum number of returned chunks' })),
    }),
    execute: async (_id, args) => jsonToolResult(await runEsBm25(args)),
  };
}
```

Extract current `exec` bodies into `run*` functions so business logic is untouched.

- [ ] **Step 1: Implement wrappers; keep service functions public**
- [ ] **Step 2: `npx tsc --noEmit` should have no kode imports in these files**
- [ ] **Step 3: Commit**

---

### Task 7: Runtime + shared context + agents

**Files:**
- Create: `src/lib/search/shared/runtime/createPiRuntime.ts`
- Modify: `src/lib/search/shared/agent/getSharedAgentContext.ts`
- Modify: `src/lib/search/shared/agent/createManagedAgentContext.ts` (thin re-export or delete if unused)
- Modify: `src/lib/search/newSfcAgent.ts`
- Modify: `src/lib/search/guideAgent.ts`
- Modify: `src/lib/search/writingAgent.ts`
- Modify: `src/lib/search/newSurverAgent.ts`
- Modify: `src/lib/search/shared/survey/clusterViaKodeAgent.ts`

- [ ] **Step 1: `createPiRuntime` builds model via `streamSimple` from `@earendil-works/pi-ai`, registers templates + tools, `createAgent({ sessionId, systemPrompt, tools, messages })` → `new Agent({ initialState, streamFn, getApiKey, sessionId, toolExecution: 'sequential' })`**

Templates:

| id | prompt | default tools |
|----|--------|----------------|
| `rag-base-template` | `RAG_BM25_SYSTEM_PROMPT` | `[]` |
| `rag-training-guide-template` | `RAG_BM25_SYSTEM_PROMPT_TRAINING_GUIDE` | `[]` |
| `rag-survey-template` | `RAG_SURVEY_SYSTEM_PROMPT` | survey tool names |
| `rag-survey-chat-template` | `RAG_SURVEY_CHAT_SYSTEM_PROMPT` | `[]` |
| `writing-agent-template` | `WRITING_AGENT_SYSTEM_PROMPT` | `[]` |

- [ ] **Step 2: Agents**

```ts
const { manager } = getSharedAgentContext();
const agent = await manager.getOrCreateAgent(id, ['es_bm25_search'], 'rag-base-template');
manager.markBusy(id);
try {
  const done = streamAgentProgressToEmitter({ agent, emitter, signal, safeJson });
  await agent.prompt(message);
  await done;
} finally {
  manager.markIdle(id);
}
```

Survey chat + clustering:

```ts
const { text } = await completePiAgent(chatAgent, chatPrompt, signal);
const clusters = await clusterQuestionViaKodeAgent({
  agent: { complete: (input) => completePiAgent(clusterAgent, input, signal) },
  question, items, signal,
});
```

Remove `agent.on('tool_executed')` / `agent.on('error')` / `agent.send` / `progressBookmarkByAgent`.

- [ ] **Step 3: Typecheck + unit tests**
- [ ] **Step 4: Commit**

---

### Task 8: Remove kode

**Files:**
- Delete: `src/lib/search/shared/runtime/createAgentRuntime.ts`
- Delete: `src/lib/utils/persistentAgentPool.ts`
- Delete: `src/lib/utils/shared/runtime.ts`
- Delete: `src/lib/utils/shared/demo-model.ts`
- Delete: `src/lib/utils/shared/localSandboxFactory.ts`
- Delete: `src/lib/utils/shared/agent-error.ts` (unused)
- Delete: `vendor/shareai-lab-kode-sdk-2.7.4.tgz`
- Modify: `package.json` remove `@shareai-lab/kode-sdk`
- Modify: design spec status → implemented

- [ ] **Step 1: `rg "@shareai-lab/kode-sdk" src` → zero hits**
- [ ] **Step 2: `npx tsc --noEmit` + `npx vitest run`**
- [ ] **Step 3: Commit**

---

## Verification

1. Unit tests for store, manager, stream, complete, model.
2. `tsc --noEmit` clean; no kode imports.
3. Manual smoke (when gateway available): SFC / Guide / Writing / Survey chat / Survey cluster; same `x-chat-id` after restart.

## Risks

| Risk | Mitigation |
|------|------------|
| Gateway not Anthropic | OpenAI-completions + compat flags (copy pi-rag `pi-model`) |
| Tool JSON shape | `jsonToolResult` keeps today's fields in `content` + `details` |
| `complete()` missing | `completePiAgent` |
| ESM in Next | `serverExternalPackages` for both pi packages |
