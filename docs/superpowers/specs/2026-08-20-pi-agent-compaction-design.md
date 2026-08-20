# Pi-Agent Context Compaction Design

Date: 2026-08-20  
Status: **Draft** — awaiting implementation  
Scope: Port the pi-rag (`D:\Projects\pi-rag\apps\api`) kode-style compaction stack into this project's pi-agent-core runtime: mid-run `transformContext` guard, `convertToLlm` mapping, append-only transcript checkpoints, and cold hydrate.

Source of truth for algorithm and persist semantics: `pi-rag/apps/api/src/agent/agent-compaction.ts`, `agent-convert-to-llm.ts`, `agent-transcript.*`, `context-budget.ts` (compaction-related knobs only), and `rag/evidence.ts` `clipTextToBudget`.

## Goals

1. Before every LLM call (including after tool results), cap oversized tool results and, when estimated tokens exceed `maxTokens`, replace older turns with a local `compactionSummary` and keep a recent tail.
2. Persist full agent trajectory append-only in `agent_transcript_entries`. Compaction does **not** rewrite older rows; it appends a `kind=compaction` checkpoint (`summary` + `firstKeptTimestamp`).
3. Cold-start an agent from transcript: latest checkpoint + tail, then the same mid-run guard, so a pool miss never constructs an over-budget `Agent`.
4. Map `compactionSummary` (and legacy `_compaction` user messages) to a labeled background user message for the provider. Default pi `convertToLlm` drops unknown roles; without this mapping, summaries never reach the model.
5. Keep chat UI contracts unchanged: drizzle `messages` / SSE (`progress`, `response`, `tool_execution`, `tool_error`, `sources`) are not compaction surfaces.

## Non-goals

1. pi-rag skills, fs tools, python sandbox, Cite `evidenceRefs`, personal memory prompt, analyze-tool caps.
2. Full `context-budget.ts` knobs that are unused here (memory tokens/items, evidence chunk caps, summarize caps, evidenceRefs).
3. New SSE events or UI for compaction.
4. LLM-generated summaries (pi-rag uses local `generateLocalSummary` only).
5. Importing kode-era transcripts.
6. Changing RAG / survey tool **business** logic (only wrapping/capping how results sit on the agent message list).

## Background and current state

This app already runs `@earendil-works/pi-agent-core` via `getSharedAgentContext` / `createPiRuntime` / `createPiAgentSessionManager`. Per-chat memory is a rewritten `messages_json` blob in `pi_sessions` keyed by `agent_id`. There is no `transformContext`, no `convertToLlm`, and no compaction.

pi-rag's compaction (ported from kode ContextManager) is:

1. Estimate tokens ≈ chars/4 (images/audio/file = 500).
2. Cap each `toolResult` body (head+tail clip).
3. If tokens > `maxTokens` (default 50_000): keep tail so `keepCount = ceil(n * max(compressToTokens/total, minKeepRatio))` with `minKeepRatio` default 0.6; snap so a cut never starts on an orphan `toolResult`; keep at least `keepRecentMultimodal` (default 3) recent multimodal messages.
4. Prepend `role=compactionSummary` with a local preview of dropped turns. Prior compaction bodies stay whole (stacked compact does not eat the last summary).
5. Write the compacted **view** back onto `agent.state.messages` so the in-memory pool stays bounded.
6. Durable form: append `kind=compaction` to the transcript. Reload = `[latest summary] + messages with timestamp >= firstKeptTimestamp`.

pi-rag keys transcripts by Conversation UUID + Prisma. This app keys agent memory by `agent_id` TEXT (same as `x-agent-id` / `x-chat-id`, plus survey cluster / writing ids) and uses `pg` + drizzle SQL migrations. The algorithm is copied; the store is adapted.

## Chosen approach

**C — Full pi-rag clone (transcript checkpoints + mid-run guard + convertToLlm).**

Rejected:

- **A — Compacted view only in `pi_sessions`:** simpler, but early tool trajectory is destroyed on persist.
- **B — Transform-only, no durable checkpoint:** every call re-compacts from unbounded history; DB grows without bound.

## Target architecture

```text
getOrCreateAgent(agentId)
        │
        ├─ HIT  → return in-memory Agent (already a compacted view)
        │
        └─ MISS → ensureCapacity
                  → load transcript (prefer) else pi_sessions.messages
                  → if transcript empty and pi_sessions has messages:
                       seed transcript via replaceAll (preserve history
                       before the first checkpoint)
                  → applyTranscriptCheckpoints
                  → applyMidRunContextGuard
                  → if guard compacted: appendCheckpoint immediately
                    (do not leave __pendingCheckpoint — that is only
                    for mid-run transformContext, to avoid a duplicate
                    row on the first markIdle)
                  → new Agent({ messages: guarded view,
                                convertToLlm,
                                transformContext })
                  → cache; watermark = guarded view length

each LLM call: agent.transformContext(msgs)
        → cap tool results → compact if over maxTokens
        → if changed: agent.state.messages = result.messages
        → if compacted: __pendingCheckpoint + __compactedViewLength

markIdle / evict
        → appendCheckpoint if pending
        → transcript.syncMessages (append suffix, else replaceAll)
        → also persist compacted view + templateId to pi_sessions
          (fallback + existing manager contract)
```

User-facing drizzle `messages` is never rewritten.

## Schema

New table, same database as `pi_sessions` (`getAppDatabaseUrl()` / `getPiSessionConnectionString()`). No FK to `chats`: survey cluster ids and the default agent id are not chat rows.

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

`kind` is one of: `user` | `assistant` | `toolResult` | `compaction`.

Ship as `drizzle/pg/0001_agent_transcript.sql` (applied by existing `runMigrations`). The store also `CREATE TABLE IF NOT EXISTS` on first use, matching `pi_sessions`.

`pi_sessions` stays. It is **not** the source of truth once a transcript exists:

| Situation | Hydrate source |
|-----------|----------------|
| Transcript has rows | Transcript → checkpoints → guard |
| Transcript empty, `pi_sessions.messages` non-empty | Seed those messages into transcript, then checkpoints (none) → guard |
| Both empty | Empty message list |

After a run, `pi_sessions.messages_json` continues to store the **compacted view** (plus `template_id`) so a transcript-disabled process can still boot. Transcript remains the durable full history.

Do not add `message_id` (pi-rag optional UI link). This app does not join transcript rows to drizzle messages.

## Module map

Follow this repo's camelCase filenames. Logic is copied from pi-rag; Prisma/Nest is replaced by `pg` functions.

| New file | Source | Responsibility |
|----------|--------|----------------|
| `src/lib/search/shared/agent/contextBudget.ts` | `context-budget.ts` (subset) | `compactionMaxTokens`, `compactionCompressToTokens`, `toolResultMaxChars`, `transcriptMaxChars`, `scale`, `logEnabled` |
| `src/lib/search/shared/runtime/clipTextToBudget.ts` | `rag/evidence.ts` `clipTextToBudget` | Head 60% / tail 40% clip with marker |
| `src/lib/search/shared/agent/agentCompaction.ts` | `agent-compaction.ts` | Token estimate, tool cap, keep-from, local summary, `applyMidRunContextGuard` |
| `src/lib/search/shared/agent/agentConvertToLlm.ts` | `agent-convert-to-llm.ts` | `compactionSummary` → labeled user background message |
| `src/lib/search/shared/runtime/agentTranscriptCodec.ts` | `agent-transcript.codec.ts` | classify / serialize / deserialize / prune index / pure-append |
| `src/lib/search/shared/runtime/agentTranscriptCheckpoint.ts` | `agent-transcript.checkpoint.ts` plus `compactionCheckpointFromGuard` from `agent.service.ts` | Checkpoint ↔ view; `applyTranscriptCheckpoints`; build a checkpoint from a `MidRunGuardResult` |
| `src/lib/search/shared/runtime/agentTranscriptHydrate.ts` | `agent-transcript.hydrate.ts` | Resolve source + same guard |
| `src/lib/search/shared/runtime/agentTranscriptSettings.ts` | `agent-transcript.settings.ts` | enabled / maxEntries / pruneTo / maxChars |
| `src/lib/search/shared/runtime/agentTranscriptStore.ts` | `agent-transcript.service.ts` | `loadMessages`, `syncMessages`, `appendCheckpoint`, prune; `pg` not Prisma |

### Files to modify

| File | Change |
|------|--------|
| `createPiRuntime.ts` | Pass `convertToLlm`; after `new Agent`, assign `transformContext` that runs the guard, writes back `state.messages`, and records `__pendingCheckpoint` / `__compactedViewLength` |
| `piAgentSessionManager.ts` | On create: hydrate from transcript (seed from `pi_sessions` if needed). On `markIdle` and evict: append checkpoint + `syncMessages`, then existing `pi_sessions` persist. Store `transcriptWatermark` on the session entry |
| `getSharedAgentContext.ts` | Construct transcript store from the same connection string as `pi_sessions` and pass it into the manager |
| `drizzle/pg/0001_agent_transcript.sql` | Create table + index |

App-facing `PiAgentSessionManager` methods (`normalizeAgentId`, `getOrCreateAgent`, `markBusy`, `markIdle`, `touchAgent`) stay. Agents (`newSfcAgent`, `guideAgent`, `newSurveyAgent`, `writingAgent`, `completePiAgent`) keep calling the same façade; they do not call compaction APIs directly. `completePiAgent` goes through `agent.prompt()`, so `transformContext` applies automatically.

## Compaction algorithm (normative)

Copy behavior from pi-rag; do not invent a second policy.

### Settings (`getAgentCompactionSettings`)

| Field | Default | Env |
|-------|---------|-----|
| `enabled` | `true` | `AGENT_COMPACTION_ENABLED` (`0`/`false`/`off` disables) |
| `maxTokens` | `50_000` | `CONTEXT_BUDGET_COMPACTION_MAX_TOKENS` or `AGENT_COMPACTION_MAX_TOKENS` or `AGENT_COMPACTION_THRESHOLD_TOKENS` (clamp 1_000…2_000_000) |
| `compressToTokens` | `30_000` | `CONTEXT_BUDGET_COMPACTION_COMPRESS_TO` or `AGENT_COMPACTION_COMPRESS_TO_TOKENS` (clamp 256…2_000_000) |
| `minKeepRatio` | `0.6` | `AGENT_COMPACTION_MIN_KEEP_RATIO` (clamp 0.1…0.95) |
| `keepRecentMultimodal` | `3` | `AGENT_COMPACTION_KEEP_RECENT_MULTIMODAL` (clamp 0…50) |

`CONTEXT_BUDGET_SCALE` (default 1, clamp 0.1…4) multiplies the token/char caps except `0` = unlimited.

Tool-result cap (`getMaxToolResultChars`): `CONTEXT_BUDGET_TOOL_CHARS` or `AGENT_MAX_TOOL_RESULT_CHARS` or default `120_000`. `<= 0` means no clip.

Transcript char budget: `CONTEXT_BUDGET_TRANSCRIPT_CHARS` or `AGENT_TRANSCRIPT_MAX_CHARS` default `400_000` (clamp 10_000…5_000_000).

Master transcript switch: `AGENT_TRANSCRIPT_ENABLED` default true. `AGENT_TRANSCRIPT_MAX_ENTRIES` default 80; `AGENT_TRANSCRIPT_PRUNE_TO_ENTRIES` default 60 (cannot exceed maxEntries).

`CONTEXT_BUDGET_LOG` default true. When true, log `formatContextManageLog(...)` on hydrate and each pre-LLM guard (including no-op), same one-line shape as pi-rag. This app has no Nest logger: use `console.log` / `console.warn` (same style as existing `[piAgentSessionManager] persist failed` logs).

No UI config fields in v1. Env only.

### Token estimate

- `compactionSummary`: `ceil((summary.length + 80) / 4)`, min 1.
- String content: `ceil(length / 4)`.
- Content blocks: text/thinking by chars/4; `image`/`audio`/`file` = 500; `toolCall` name+args chars/4.
- Object fallback: `JSON.stringify` chars/4.
- Each message at least 1 token.

### Guard (`applyMidRunContextGuard`)

1. Cap oversized `toolResult` / `tool` bodies via `clipTextToBudget`.
2. `compactMessagesIfNeeded` if `enabled && tokens > maxTokens`.
3. If `findKeepFromIndex` is `<= 0`, do not compact (cut would keep all).
4. Dropped prefix → `generateLocalSummary`. Prior `compactionSummary` / `_compaction` bodies are kept whole; only newly dropped turns are previewed (text sliced to 200 chars; tool results `[result name] ` + 100 chars).
5. On summary throw: `hardDrop=true`, keep tail only, no summary node. Checkpoint summary becomes `(earlier turns dropped)`.
6. New head node: `buildSummaryUserMessage` with `role=compactionSummary`, `summary` + `content` = body, `_compaction: true`, `tokensBefore`, `timestamp`.

`clipTextToBudget`: if `maxChars < 64`, prefix+`…`; else head 60% + `\n\n…[truncated to fit context budget]…\n\n` + tail. `maxChars <= 0` is a no-op.

### convertToLlm

- Compaction nodes → one `role=user` message: `COMPACTION_LLM_LEAD_IN` + `COMPACTION_SUMMARY_PREFIX` + body + `COMPACTION_SUMMARY_SUFFIX`. Lead-in states this is **not** a new user request and must not trigger tools.
- Pass through `user` / `assistant` / `toolResult` unchanged (ids, tool calls intact).
- Drop unknown roles and empty compaction bodies.
- Unwrap nested wrappers so stacked converts do not double-nest `<context-summary>`.

String constants must match pi-rag exactly (`COMPACTION_SUMMARY_PREFIX`, `COMPACTION_SUMMARY_SUFFIX`, `COMPACTION_LLM_LEAD_IN`) so tests and operator greps stay stable.

## Transcript persist semantics

Match pi-rag `AgentTranscriptService`:

**loadMessages:** newest `maxEntries` by `seq`, chronological; walk from end under `maxChars`; drop a leading orphan `toolResult`. Disabled → `[]`.

**syncMessages:** cap tool bodies for storage (`…[truncated for transcript storage]`). If no rows or not a pure append of the in-memory prefix → `replaceAll` (trim to `maxEntries` at a user/compaction boundary). Else insert only the suffix. Then prune if over `maxEntries` down to `pruneToEntries`.

**appendCheckpoint:** insert `kind=compaction` with serialized `compactionSummary` including `firstKeptTimestamp` and `tokensBefore`. Then prune.

**applyTranscriptCheckpoints:** latest compaction row wins. Tail = non-compaction messages with `timestamp >= firstKeptTimestamp`, **or missing timestamp** (keep; safer than drop). Strip other compaction rows from the view; prepend one summary node.

**Checkpoints vs view:** `transformContext` only changes the LLM view unless we write back — we write back so the pool is bounded. Durable history is the appended checkpoint, not a rewrite of older rows.

**Watermark (required to avoid wipe):**

- Session entry field `transcriptWatermark: number`.
- After hydrate, set to guarded view length.
- After a compact persist: `appendCheckpoint`, then `syncMessages` with `watermark = __compactedViewLength` and `previousMessages = msgs.slice(0, viewLen)` so only post-cut suffix is appended.
- After a non-compact persist: `syncMessages` with the stored watermark, then update watermark to `newWatermark`.
- Never call `syncMessages` with `watermark = 0` when the transcript already has rows unless the in-memory prefix truly does not match (replaceAll is then correct).

**Seed rule (this app only):** on cold miss, if transcript is empty and `pi_sessions.messages` is non-empty, `replaceAll` those messages into the transcript **before** the hydrate guard. Otherwise the first compact would persist only the compacted view and destroy uncheckpointed history that only lived in `pi_sessions`. Do not seed from drizzle `messages` (no tool trajectory). If both stores are empty, start with `[]`; the first user `prompt()` still works.

**Disabled transcript:** skip load/sync/checkpoint. Compaction still runs in memory via `transformContext` when compaction is enabled. `pi_sessions` still saves the compacted view.

**Disabled compaction:** no summary nodes. Tool-result cap still runs inside the guard.

## Runtime wiring details

`createPiRuntime.createAgent`:

1. `new Agent({ ..., convertToLlm: (msgs) => convertAgentMessagesToLlm(...) })`.
2. Assign `transformContext` that calls `applyMidRunContextGuard`, logs `formatContextManageLog` with `label: pre-llm#N` and `conversationId=sessionId`, writes back on `changed`, sets `__pendingCheckpoint` from `compactionCheckpointFromGuard` when `compacted`.
3. On guard throw: log warning and return original msgs (pi-rag: skip, do not fail the turn).

`createPiAgentSessionManager` gains a `transcript: AgentTranscriptStore` option.

Hydrate and persist are **soft-fail**: log and continue. Chat must not 500 because transcript SQL failed.

Evict path uses the same persist as `markIdle` (transcript then `pi_sessions`) before dropping the in-memory agent.

Survey multi-agent (shell + cluster ids) is unchanged: each `agentId` is its own transcript partition.

## Error handling

| Failure | Behavior |
|---------|----------|
| Transcript load error | Warn; fall back to `pi_sessions.messages` then empty list |
| Hydrate guard error | Warn; use unguarded resolved messages |
| Checkpoint append error | Warn; do not abort the chat |
| `syncMessages` error | Warn; still attempt `pi_sessions` persist |
| `transformContext` error | Warn; pass original messages to the model |
| `generateLocalSummary` throw | `hardDrop`; keep tail; checkpoint text `(earlier turns dropped)` |
| Pool full, all busy | Existing throw; unchanged |

## Testing

Colocate Vitest files (`*.test.ts`) next to modules. Port pi-rag cases (adapt imports/paths; keep assertions):

| Source spec | Must cover |
|-------------|------------|
| `agent-compaction.spec.ts` | defaults, env disable, compact only over maxTokens, stacked summary kept whole, tool cap under threshold, `formatContextManageLog` lines |
| `agent-convert-to-llm.spec.ts` | `compactionSummary` / `_compaction` detection, labeled user mapping, empty drop, normal user not treated as compaction |
| `agent-transcript.checkpoint.spec.ts` | latest checkpoint, missing timestamp kept, stacked compact |
| `agent-transcript.codec.spec.ts` | kind, serialize round-trip, prune snap, pure append |
| `agent-transcript.hydrate.spec.ts` | transcript vs fallback, guard on cold load |
| `agent-transcript.settings.spec.ts` | defaults and clamps |

New tests in this repo:

- Memory transcript store: append checkpoint does not delete older rows; hydrate returns summary+tail.
- Session manager: cold create seeds `pi_sessions` → transcript; after compact, old rows remain and view starts with `compactionSummary`.
- `createPiRuntime` (or a thin wrapper test): `convertToLlm` is passed; transform write-back is unit-tested via a fake Agent if constructing a real Agent is heavy — at minimum test the guard callback in isolation and that manager persist calls `appendCheckpoint` + `syncMessages`.

Do not require a live Postgres for unit tests; use an in-memory transcript store (same pattern as `createMemoryPiSessionStore`).

## Out of scope (explicit)

- Frontend, SSE protocol, drizzle `messages` / `chats` shape.
- pi-rag memory / Cite / python / skills / workspace fs.
- Changing `contextWindow: 256_000` on `piModel` (compaction uses its own `maxTokens`, not the model field).
- Backfill job for historical chats beyond the first-hydrate seed from `pi_sessions`.
- UI settings for compaction knobs.
