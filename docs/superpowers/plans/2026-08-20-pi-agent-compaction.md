# Pi-Agent Context Compaction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port pi-rag kode-style mid-run compaction and append-only transcript checkpoints into this project's pi-agent-core runtime.

**Architecture:** Copy pi-rag algorithm modules (`agent-compaction`, `convert-to-llm`, transcript codec/checkpoint/hydrate). Persist via a `pg` transcript store keyed by `agent_id` (not Prisma Conversation UUID). Wire `convertToLlm` + `transformContext` on `createPiRuntime` Agent construction. Session manager hydrates from transcript (seed from `pi_sessions` if empty) and flushes checkpoints on idle/evict.

**Tech Stack:** Next.js 15, Vitest, `pg`, `@earendil-works/pi-agent-core` (`AgentOptions.convertToLlm` / `transformContext`).

**Spec:** `docs/superpowers/specs/2026-08-20-pi-agent-compaction-design.md`

**Source tree:** `D:\Projects\pi-rag\apps\api\src\agent\` and `...\src\rag\evidence.ts` (`clipTextToBudget` only).

**Status:** Implemented 2026-08-20. Tasks 1–8 complete; `npx vitest run` 131 passed.

---

## File map

| File | Responsibility |
|------|----------------|
| `src/lib/search/shared/runtime/clipTextToBudget.ts` | Head/tail clip |
| `src/lib/search/shared/agent/contextBudget.ts` | Slim budget: compaction tokens, tool chars, transcript chars, scale, log |
| `src/lib/search/shared/agent/agentCompaction.ts` | Token estimate, tool cap, keep-from, local summary, mid-run guard |
| `src/lib/search/shared/agent/agentConvertToLlm.ts` | `compactionSummary` → labeled user message |
| `src/lib/search/shared/runtime/agentTranscriptCodec.ts` | serialize / classify / prune / pure-append |
| `src/lib/search/shared/runtime/agentTranscriptCheckpoint.ts` | Checkpoint ↔ view + `compactionCheckpointFromGuard` |
| `src/lib/search/shared/runtime/agentTranscriptHydrate.ts` | Cold load + same guard |
| `src/lib/search/shared/runtime/agentTranscriptSettings.ts` | Transcript env knobs |
| `src/lib/search/shared/runtime/agentTranscriptStore.ts` | `load` / `sync` / `appendCheckpoint` (memory + pg) |
| `drizzle/pg/0001_agent_transcript.sql` | Table + index |
| `createPiRuntime.ts` | `convertToLlm` + `transformContext` write-back |
| `piAgentSessionManager.ts` | Hydrate + persist transcript |
| `getSharedAgentContext.ts` | Construct transcript store |

Import rewrite when copying from pi-rag:

```
../rag/evidence          → ../runtime/clipTextToBudget
./context-budget         → ./contextBudget
./agent-compaction       → ../agent/agentCompaction   (from runtime/) or ./agentCompaction
./agent-convert-to-llm   → ./agentConvertToLlm
./agent-transcript.codec → ./agentTranscriptCodec     (runtime)
./agent-transcript.checkpoint → ./agentTranscriptCheckpoint
./agent-transcript.hydrate    → ./agentTranscriptHydrate
./agent-transcript.settings   → ./agentTranscriptSettings
```

Tests live next to modules as `*.test.ts`. Port cases from `D:\Projects\pi-rag\apps\api\test\`. Run: `npx vitest run <file>`.

---

### Task 1: clipTextToBudget

**Files:**
- Create: `src/lib/search/shared/runtime/clipTextToBudget.ts`
- Test: `src/lib/search/shared/runtime/clipTextToBudget.test.ts`

- [x] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { clipTextToBudget } from './clipTextToBudget';

describe('clipTextToBudget', () => {
  it('returns original when under maxChars or maxChars <= 0', () => {
    expect(clipTextToBudget('hello', 100)).toBe('hello');
    expect(clipTextToBudget('hello', 0)).toBe('hello');
  });

  it('keeps head and tail with truncation marker', () => {
    const t = 'HEAD' + 'z'.repeat(200) + 'TAIL';
    const out = clipTextToBudget(t, 80);
    expect(out.length).toBeLessThanOrEqual(80);
    expect(out.startsWith('HEAD')).toBe(true);
    expect(out.endsWith('TAIL')).toBe(true);
    expect(out).toContain('truncated to fit context budget');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/search/shared/runtime/clipTextToBudget.test.ts`
Expected: FAIL cannot find module / clipTextToBudget not exported

- [ ] **Step 3: Write implementation**

Copy `clipTextToBudget` from `D:\Projects\pi-rag\apps\api\src\rag\evidence.ts` (the function only, including `maxChars < 64` prefix+ellipsis branch).

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit** `feat: add clipTextToBudget helper`

---

### Task 2: Slim context budget

**Files:**
- Create: `src/lib/search/shared/agent/contextBudget.ts`
- Test: `src/lib/search/shared/agent/contextBudget.test.ts`

- [ ] **Step 1: Failing tests** for defaults (`compactionMaxTokens=50000`, `compactionCompressToTokens=30000`, `toolResultMaxChars=120000`, `transcriptMaxChars=400000`, `scale=1`), `CONTEXT_BUDGET_*` override, `AGENT_MAX_TOOL_RESULT_CHARS` then `RAG_EVIDENCE_MAX_CHARS` cascade, `0` stays unlimited under scale, `CONTEXT_BUDGET_SCALE` multiplies.

Do **not** export memory / evidenceRefs / analyze fields.

- [ ] **Step 2: Run — FAIL**
- [ ] **Step 3: Implement** by copying env helpers + the compaction/tool/transcript/scale/log sections from pi-rag `context-budget.ts`. Keep `RAG_EVIDENCE_MAX_CHARS` as tool-char fallback (compaction tests require it).
- [ ] **Step 4: PASS**
- [ ] **Step 5: Commit** `feat: add slim agent context budget`

---

### Task 3: Compaction core

**Files:**
- Create: `src/lib/search/shared/agent/agentCompaction.ts`
- Test: `src/lib/search/shared/agent/agentCompaction.test.ts`

- [ ] **Step 1:** Port `D:\Projects\pi-rag\apps\api\test\agent-compaction.spec.ts` → `agentCompaction.test.ts`, rewrite imports to `./agentCompaction`.
- [ ] **Step 2:** Run — FAIL
- [ ] **Step 3:** Copy `agent-compaction.ts` with imports to `./contextBudget` and `../runtime/clipTextToBudget`. Keep all exported functions and string constants identical (`COMPACTION_SUMMARY_PREFIX` / `SUFFIX`).
- [ ] **Step 4:** PASS
- [ ] **Step 5: Commit** `feat: add kode-style agent compaction`

---

### Task 4: convertToLlm

**Files:**
- Create: `src/lib/search/shared/agent/agentConvertToLlm.ts`
- Test: `src/lib/search/shared/agent/agentConvertToLlm.test.ts`

- [ ] **Step 1:** Port `agent-convert-to-llm.spec.ts`; imports from `./agentCompaction` and `./agentConvertToLlm`.
- [ ] **Step 2:** FAIL
- [ ] **Step 3:** Copy `agent-convert-to-llm.ts`; import prefix/suffix from `./agentCompaction`. `COMPACTION_LLM_LEAD_IN` must match pi-rag byte-for-byte.
- [ ] **Step 4:** PASS
- [ ] **Step 5: Commit** `feat: map compactionSummary to labeled LLM user message`

---

### Task 5: Transcript codec, checkpoint, hydrate, settings

**Files:**
- Create the four runtime modules listed in the file map
- Tests: `agentTranscriptCodec.test.ts`, `agentTranscriptCheckpoint.test.ts`, `agentTranscriptHydrate.test.ts`, `agentTranscriptSettings.test.ts`

- [ ] **Step 1:** Port the four pi-rag specs; fix imports.
- [ ] **Step 2:** FAIL
- [ ] **Step 3:** Copy the four source files. Add `compactionCheckpointFromGuard` to `agentTranscriptCheckpoint.ts` (from pi-rag `agent.service.ts`): if `!compacted` return null; hardDrop summary `'(earlier turns dropped)'`; else take first compaction message body + `firstKeptTimestamp` + `tokensBefore`.
- [ ] **Step 4:** PASS all four
- [ ] **Step 5: Commit** `feat: add agent transcript codec checkpoint hydrate`

---

### Task 6: Transcript store + migration

**Files:**
- Create: `src/lib/search/shared/runtime/agentTranscriptStore.ts`
- Test: `src/lib/search/shared/runtime/agentTranscriptStore.test.ts`
- Create: `drizzle/pg/0001_agent_transcript.sql`

Store interface:

```ts
export type TranscriptSyncResult = {
  mode: 'append' | 'replace' | 'skip';
  newWatermark: number;
  entryCount: number;
};

export type AgentTranscriptStore = {
  loadMessages: (agentId: string, env?: NodeJS.ProcessEnv) => Promise<TranscriptAgentMessage[]>;
  syncMessages: (args: {
    agentId: string;
    messages: TranscriptAgentMessage[];
    watermark: number;
    previousMessages?: TranscriptAgentMessage[];
    env?: NodeJS.ProcessEnv;
  }) => Promise<TranscriptSyncResult>;
  appendCheckpoint: (args: {
    agentId: string;
    checkpoint: CompactionCheckpoint;
    env?: NodeJS.ProcessEnv;
  }) => Promise<{ seq: number } | null>;
};
```

Semantics copy `AgentTranscriptService` but key by `agent_id` TEXT. Provide `createMemoryAgentTranscriptStore()` (in-memory rows map, same prune/append rules) and `createPgAgentTranscriptStore({ query })` (CREATE TABLE IF NOT EXISTS + SQL).

SQL:

```sql
CREATE TABLE IF NOT EXISTS agent_transcript_entries (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  seq INT NOT NULL,
  kind TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agent_id, seq)
);
CREATE INDEX IF NOT EXISTS agent_transcript_entries_agent_seq
  ON agent_transcript_entries (agent_id, seq);
```

Tests (memory store):
- appendCheckpoint does not delete older rows
- hydrate via `applyTranscriptCheckpoints(loadMessages())` returns summary+tail
- syncMessages pure append inserts suffix only
- disabled env returns skip / empty load

- [ ] TDD then commit `feat: add agent transcript store and migration`

---

### Task 7: Runtime + session manager wiring

**Files:**
- Modify: `src/lib/search/shared/runtime/createPiRuntime.ts`
- Modify: `src/lib/search/shared/agent/piAgentSessionManager.ts`
- Modify: `src/lib/search/shared/agent/piAgentSessionManager.test.ts`
- Modify: `src/lib/search/shared/agent/getSharedAgentContext.ts`

`createAgent`:
1. `new Agent({ ..., convertToLlm: (msgs) => convertAgentMessagesToLlm(Array.isArray(msgs) ? msgs : []) as never })`
2. Assign `transformContext`: `applyMidRunContextGuard` → log `formatContextManageLog` with `conversationId=sessionId` and `label: pre-llm#N` → on `changed` write `agent.state.messages` → on `compacted` set `__pendingCheckpoint` / `__compactedViewLength` → on throw warn and return original msgs.

Manager:
- New option `transcript: AgentTranscriptStore`
- Session entry: `transcriptWatermark: number`
- Cold miss:
  1. `transcript.loadMessages(id)`
  2. If empty and `store.load(id)?.messages?.length`, `syncMessages({ agentId, messages: stored.messages, watermark: 0 })` (replaceAll seed)
  3. `resolveAndGuardHydrateMessages({ transcript: seededOrLoaded, uiHistory: [], modelId: '' })`
  4. If `guard.compacted`, `appendCheckpoint` immediately; do **not** set `__pendingCheckpoint`
  5. `createAgent({ messages: guarded view })`; `transcriptWatermark = view.length`
- `markIdle` / evict persist:
  1. If `__pendingCheckpoint`, `appendCheckpoint` then `syncMessages` with `watermark = __compactedViewLength ?? msgs.length` and `previousMessages = msgs.slice(0, viewLen)`; clear pending
  2. Else `syncMessages` with stored watermark
  3. Existing `pi_sessions` persist of compacted view
  4. All transcript I/O soft-fail (`console.warn`)

Tests:
- Existing manager tests still pass (pass memory transcript store)
- Cold create seeds `pi_sessions` into transcript
- After compact persist, old transcript rows remain and agent view starts with `compactionSummary`

- [ ] TDD, PASS existing + new manager tests
- [ ] Commit `feat: wire compaction transformContext and transcript hydrate`

---

### Task 8: Full suite + spec coverage check

- [ ] `npx vitest run`
- [ ] Confirm spec items: mid-run cap+compact, convertToLlm, append-only checkpoint, seed rule, hydrate immediate checkpoint, soft-fail, no SSE/UI change, env knobs
- [ ] Commit any leftover wiring/docs

---

## Execution notes

- Follow TDD: test file first, watch FAIL, then copy/adapt implementation, watch PASS, commit.
- Do not change drizzle `messages` / chat SSE.
- Do not port pi-rag memory / Cite / python / skills.
- This branch already holds the pi-agent-core migration; implement in the current workspace (not a fresh worktree) so uncommitted runtime files remain visible.
