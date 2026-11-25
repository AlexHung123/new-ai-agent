---
name: dochub
description: Search and retrieve this user's indexed documents through in-process Knowledge tools (search, read). Use when the user asks about their files, folders, notes, uploads, contracts, or knowledge base, or wants an answer from their documents.
compatibility: in-process host tools. Identity and optional folder pin come from the host.
---

# Dochub — this user's documents

Search the user's indexed markdown, then read the source, then answer. Snippets are leads, not evidence.

Tools: `search`, `read`. These are in-process host tools. Never pass `user_id`. Never run the `qmd` CLI.

For a question about what a document says, keep workflow search → read then answer. One search covers all pinned folders. Prefer reading several paths in one `read`. Do not repeat the same keyword search.

## Workflow

1. `search` once for candidate documents across every pinned folder.
2. `read` the best hits, preferably several paths in one call. Use `path:from:count` around a hit line (for example `contracts/note.md:120:40`).
3. Answer from retrieved text. Cite `dochub_path` and line numbers.

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

One `search` call covers every pinned folder. Pins can use structured `searches` (lex / vec / hyde) or a bare `query`.

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

- `intent` — what to find and what to avoid.
- `lex` — exact terms, aliases, titles you expect in the source.
- `vec` — the idea in source-like wording.
- `hyde` — a short passage that would satisfy the request.

A bare `query: "<the user's sentence>"` throws away context only you have. Prefer structured `searches`. If the user gave a single rare token, lex-only or a bare keyword is enough.

A bare `query` with `mode: query` is expanded by the server into `lex:` + `vec:`. If hybrid search times out, is busy, fails, or embeddings are not ready, the host retries keyword search automatically and may return `fallback.reason`. You usually do not need to retry. Do not repeat the same keyword search.

## Folder scope

If the user names a folder, pass it as `path` on `search` (markdown-relative, for example `contracts/2024` or `public:g3`). The host already pins the session; extra `path` stays inside the host pin. Hits are labeled with their source, for example `public:g3`.

## Retrieve

`read` takes `dochub_path` values from search (also `qmd://markdown/...` or `#abc123` docids). It returns line-numbered text by default. Prefer several paths in one call.

- `contracts/note.md:120:40` — 40 lines starting at 120.
- `contracts/note.md:120` — from 120 to end.
- `#abc123:120:40` — the same range by docid.
- args `fromLine` / `maxLines` override a suffix.
- `files` may be a comma-separated string or an array. Globs including recursive `contracts/**/*.md` are allowed. Optional `maxBytes` caps each file.

If a path is missing, the tool returns similar path or filename hints. Do not invent a path.

Do not slice documents with `sed`, `head`, `tail`, or `awk`.

## Pitfalls

- Do not stop at snippets. Fetch before claiming facts, quotes, or decisions.
- Do not invent `user_id`, paths outside the pin, or a second search backend.
- Do not mutate indexes. Upload and ingest stay on the Knowledge page / Mac worker.
- If search looks empty or stale and embeddings are not ready, use keyword search (`lex` or a bare `query`) instead of `vec` / `hyde` / `mode: query`.
- Do not repeat the same keyword search. Prefer one `search`, then one batched `read`.
- If the user message says the knowledge library is unreachable, do not retry knowledge tools. Tell the user.
