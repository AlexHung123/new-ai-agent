# New SFC Agent Harness Design

Date: 2026-04-02
Target file: `src/lib/search/newSfcAgent.ts`
Scope: Integrate the `@shareai-lab/kode-sdk` sample into existing `NewSfcAgent` while preserving current frontend SSE contract.

## Goals

1. Keep `newSfcAgent.ts` as an independent handler entry.
2. Preserve frontend stream event shape as `{ type, data }`.
3. Emit only `progress` and `response` events from this agent.
4. Integrate Kode runtime/tooling flow in a maintainable structure.

## Non-goals

1. Do not replace `agentSFC` handler wiring in `src/lib/search/index.ts`.
2. Do not introduce `sources` events in `NewSfcAgent`.
3. Do not change route-level streaming protocol in `src/app/api/chat/route.ts`.

## Constraints and Compatibility

1. `NewSfcAgent` must continue implementing `MetaSearchAgentType`.
2. `searchAndAnswer(...)` signature remains unchanged for compatibility with existing API routes.
3. Existing frontend progress UX should continue to work without schema changes.

## Proposed Architecture

Keep implementation in one file, but with clear function boundaries:

1. `queryRAGFlow(keyword, signal, sfcTrainingRelated)`
Purpose: Call retrieval endpoint and return raw data.

2. `createEsBm25SearchTool(defaultSfcTrainingRelated)`
Purpose: Build `defineTool(...)` instance with cache and consistent return payload.

3. `createHarnessAgent(tool)`
Purpose: Register runtime template/tool and create Kode `Agent`.

4. `streamHarnessToEmitter(agent, emitter, signal)`
Purpose: Subscribe to Kode progress stream and map text chunks to SSE `response` events.

5. `searchAndAnswer(...)` (orchestrator)
Purpose: Emit start progress, run harness, emit finish progress, and finalize stream lifecycle.

## Data Flow

1. User message enters `searchAndAnswer(...)`.
2. Emit start progress event:
`{ type: 'progress', data: { status: 'processing', total: 2, current: 1, ... } }`
3. Build tool with `sfcTrainingRelated` default and create harness agent.
4. Send user message via `agent.send(message)`.
5. As `text_chunk` arrives, emit:
`{ type: 'response', data: delta }`
6. On harness `done`, emit finish progress:
`{ type: 'progress', data: { status: 'finished', total: 2, current: 2, ... } }`
7. End stream with `emitter.emit('end')`.

## Tool and Retrieval Behavior

1. Tool name remains `es_bm25_search`.
2. Cache key fields: `query`, `top_k`, `sfc_training_related`.
3. Retrieval response mapping:
`chunks = raw.data.chunks ?? raw.chunks ?? []`
`total = raw.data.total ?? chunks.length`
4. Tool returns:
`{ total, chunks, no_result, search_query, year_filter }`

## Event Contract

Outbound events from `newSfcAgent.ts`:

1. `progress` start
2. `response` stream chunks
3. `progress` finished
4. stream end signal (`emitter.emit('end')`, not an SSE payload type)

Not emitted:

1. `sources`
2. custom terminal payload types

## Error Handling and Abort

1. If `AbortSignal` is triggered:
   - stop processing loop
   - end stream cleanly
2. Retrieval/tool/agent errors:
   - emit a final `response` chunk with readable error text
   - always end stream in `finally`
3. Avoid hanging stream by guaranteeing exactly one end path.

## Testing and Verification Plan

1. Static checks:
   - TypeScript compile passes for `newSfcAgent.ts` edits.
2. Runtime smoke:
   - Send request through existing chat API with `focusMode: 'newSfcAgent'`.
   - Confirm frontend receives `progress` then `message` chunks then `messageEnd`.
3. Contract checks:
   - Verify no `sources` event is emitted by this handler.
   - Verify abort closes stream without deadlock.

## Risks and Mitigations

1. Risk: Tool return shape drifts from prompt expectations.
Mitigation: Keep existing field names and retry semantics unchanged.

2. Risk: Stream completion race between `agent.send` and subscription loop.
Mitigation: Keep explicit subscription task and await both send and stream completion.

3. Risk: Hardcoded model/base URL mismatches deployment.
Mitigation: Preserve current file behavior in this change; config externalization is out of scope.

