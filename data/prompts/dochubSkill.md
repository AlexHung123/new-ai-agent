---
name: dochub
description: Search and retrieve this user's indexed documents through in-process Knowledge tools (search, read, list). Use when the user asks about their files, folders, notes, uploads, contracts, or knowledge base, or wants an answer from their documents.
compatibility: in-process host tools. Identity and optional folder pin come from the host.
---

# Dochub — this user's documents

Search the user's indexed markdown, then read the source, then answer. Snippets are leads, not evidence.

Tools: `search`, `read`, `list`. These are in-process host tools. Never pass `user_id`. Never run the `qmd` CLI.

If the user asks what files are in a pinned or @-mentioned folder, use `list` instead of inventing repeated searches. Optional `path` narrows to a subfolder; results may be truncated.

For a question about what a document says, keep workflow search → read then answer. One search covers all pinned folders. Prefer reading several paths in one `read`. Do not repeat the same keyword search.

## Workflow

1. If you need an inventory of a pinned folder, `list` once (optionally with `path`).
2. `search` once for candidate documents across every pinned folder.
3. `read` the best hits, preferably several paths in one call. Use `path:from:count` around a hit line (for example `contracts/note.md:120:40`).
4. Answer from retrieved text. Cite `dochub_path` and line numbers.

## When a tool fails

A validation error, `file not found`, or `Knowledge service is unavailable` is final for that call. Do not retry it and do not switch tools to keep reading. Answer from text you already have. Never stop after tools with an empty message.

Typical loop:

```text
search  { "query": "quarterly plan OKR", "limit": 10 }
# leads: private:contracts contracts/2024/plan.md:42
#        private:invoices invoices/acme.md:18
read    { "files": ["contracts/2024/plan.md:22:80", "invoices/acme.md"] }
```

When reporting what you retrieved:

```text
Retrieved:
- contracts/2024/plan.md
- invoices/acme.md
```

## Pick the search mode

One `search` call covers every pinned folder. Pins can use structured `searches` (lex / vec / hyde) or a bare `query`. A bare `query` defaults to keyword search (`mode: search`), matching the Files page. Hybrid search still works when you pass `searches` (lex / vec / hyde) or an explicit `mode: query` / `mode: vsearch`.

**Exact words, titles, names, rare phrases** — `search` with `searches: [{ "type": "lex", "query": "..." }]` or a bare `query` (BM25 keyword search).

**Idea / paraphrase / conceptual recall**:

```json
{
  "intent": "Find the note about metrics as instruments; avoid generic KPI dashboards.",
  "searches": [
    { "type": "lex", "query": "cockpit OKR Goodhart metrics judgment" },
    { "type": "vec", "query": "data informed not metric driven product judgment" },
    { "type": "hyde", "query": "A note says metrics are useful like cockpit instruments, but leaders should stay data-informed rather than metric-driven." }
  ],
  "limit": 10,
  "minScore": 0,
  "candidateLimit": 40
}
```

These fields are sent through to search. `lex` / `vec` / `hyde` stay on separate channels and are fused with RRF. Rerank is off by default; set `rerank: true` to enable the slower cross-encoder. Do not collapse them into one string.

To search several unrelated keywords in one call, pass `query` as an array, for example `{ "query": ["OKR", "quarterly plan"], "limit": 20 }`. The host runs each keyword, labels hits with `query` and `source`, dedupes by path and line, and fills the limit by round-robin so the first keyword does not take every slot. `searches` is for one intent across channels; `query: string[]` is for independent keywords. Do not use `searches` to pack unrelated terms.

- `intent` — what to find and what to avoid.
- `lex` — exact terms, aliases, titles you expect in the source.
- `vec` — the idea in source-like wording.
- `hyde` — a short passage that would satisfy the request.

A bare `query: "<the user's sentence>"` throws away context only you have. Prefer structured `searches`. If the user gave a single rare token, lex-only or a bare keyword is enough.

A bare `query` with `mode: query` is expanded by the server into `lex:` + `vec:`. If embeddings are not ready (`semantic_search_ready` is false), or hybrid / vector search times out, is busy, or reports embeddings are not ready, the host retries keyword search (`mode: search`) automatically and returns `fallback: { reason, from }`. You usually do not need to retry. Do not repeat the same keyword search.

## Folder scope

If the user names a folder, pass it as `path` on `search` (markdown-relative, for example `contracts/2024` or `public:g3`). The host already pins the session; extra `path` stays inside the host pin. Hits are labeled with their source, for example `public:g3`.

## Retrieve

`read` takes `dochub_path` values from search (also `qmd://markdown/...` or `#abc123` docids). It returns line-numbered text by default. Prefer several paths in one call. With no range, a short file comes back in full (up to 200 KiB). Long files set `truncated` and append a `path:from:count` hint; follow that hint if you need more. A combined character budget may also truncate later files.

- `contracts/note.md:120:40` — 40 lines starting at 120.
- `contracts/note.md:120` — from 120 to end.
- `#abc123:120:40` — the same range by docid.
- args `fromLine` / `maxLines` override a suffix.
- `files` may be a comma-separated string or an array. Globs including recursive `contracts/**/*.md` are allowed. Optional `maxBytes` caps each file.

If a path is missing, the tool returns similar path or filename hints. Do not invent a path.

Do not slice documents with `sed`, `head`, `tail`, or `awk`.

## Pitfalls

- Do not stop at snippets. Fetch before claiming facts, quotes, or decisions.
- Do not invent `user_id`, paths outside the pin, or a second search backend. If the user changes pinned folders, ignore earlier search, read, or list results from unpinned folders.
- Do not mutate indexes. Upload and ingest stay on the Knowledge page / Mac worker.
- If search looks empty or stale and embeddings are not ready, use keyword search (`lex` or a bare `query`) instead of `vec` / `hyde` / `mode: query`.
- Do not repeat the same keyword search. Prefer one `search`, then one batched `read`.
- If the user message says the knowledge library is unreachable, do not retry knowledge tools. Tell the user.
