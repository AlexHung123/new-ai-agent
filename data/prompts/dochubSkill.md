---
name: dochub
description: Search and retrieve this user's indexed documents through in-process Dochub tools (query, get, multi_get, tree, status). Use when the user asks about their files, folders, notes, uploads, contracts, or knowledge base, or wants an answer from their documents.
compatibility: in-process host tools. Identity and optional folder pin come from the host.
---

# Dochub — this user's documents

Search the user's indexed markdown, then read the source, then answer. Snippets are leads, not evidence.

Tools: `query`, `get`, `multi_get`, `tree`, `status`. These are in-process host tools. Never pass `user_id`. Never run the `qmd` CLI.

For a question about what a document says, keep workflow query → get (or `multi_get`) then answer. For a request to list files, call `tree` once and answer from `files`.

## Workflow

1. `query` for candidate documents.
2. `get` or `multi_get` the best hits. Use `path:from:count` around a hit line (for example `contracts/note.md:120:40`).
3. Answer from retrieved text. Cite `dochub_path` and line numbers.

## List the library

When the user asks which files exist, or to list, enumerate, or show every file or folder (列出文件, 有哪些文件, all files, files submitted to the library), call `tree` once. The `files` array is the inventory. Each entry is `{ path, name }`. Reply with those names and paths. Do not call `query`, `get`, or `multi_get` to build a file list, and do not open file bodies.

If `truncated` is true, say the list is incomplete and include every path you were given.

## When a tool fails

A validation error, `file not found`, or `Knowledge service is unavailable` is final for that call. Do not retry it and do not switch tools to keep reading. Answer from `files` or from text you already have. The reply must contain the list or the answer. Never stop after tools with an empty message.

Typical loop:

```text
query  { "searches": [{ "type": "lex", "query": "quarterly plan OKR" }], "limit": 5 }
# leads: contracts/2024/plan.md:42  invoices/acme.md:18
get    { "file": "contracts/2024/plan.md:22:80" }
```

When reporting what you retrieved:

```text
Retrieved:
- contracts/2024/plan.md
- invoices/acme.md
```

## Pick the search mode

**Exact words, titles, names, rare phrases** — `query` with `searches: [{ "type": "lex", "query": "..." }]` (BM25, fast, works after index update even before embeddings).

**Idea / paraphrase / conceptual recall** — default to a structured query you write yourself:

```json
{
  "intent": "Find the note about metrics as instruments; avoid generic KPI dashboards.",
  "searches": [
    { "type": "lex", "query": "cockpit OKR Goodhart metrics judgment" },
    { "type": "vec", "query": "data informed not metric driven product judgment" },
    { "type": "hyde", "query": "A note says metrics are useful like cockpit instruments, but leaders should stay data-informed rather than metric-driven." }
  ],
  "limit": 10
}
```

- `intent` — what to find and what to avoid.
- `lex` — exact terms, aliases, titles you expect in the source.
- `vec` — the idea in source-like wording.
- `hyde` — a short passage that would satisfy the request.

A bare `query: "<the user's sentence>"` throws away context only you have. Prefer structured `searches`. If the user gave a single rare token, lex-only is enough.

If `query` / `vsearch` fails (model or GPU), retry with lex-only or `"mode": "search"`.

## Folder scope

If the user names a folder, pass it as `path` on `query` / `tree` (markdown-relative, for example `contracts/2024`). The host already pins the session; extra `path` stays inside the host pin.

`tree` lists the folder tree when you need to see what exists before searching.

## Retrieve

`get` / `multi_get` take `dochub_path` values from search (also `qmd://markdown/...`). They return line-numbered text by default.

- `contracts/note.md:120:40` — 40 lines starting at 120.
- `contracts/note.md:120` — from 120 to end.
- `get` args `fromLine` / `maxLines` override a suffix.

Do not slice documents with `sed`, `head`, `tail`, or `awk`.

`multi_get` accepts comma-separated paths or a glob (`contracts/*.md`).

## Pitfalls

- Do not stop at snippets. Fetch before claiming facts, quotes, or decisions.
- Do not invent `user_id`, paths outside the pin, or a second search backend.
- Do not mutate indexes. Upload and ingest stay on the Knowledge page / Mac worker.
- Keyword search works after ingest. Semantic `vec` / `hyde` / `mode: query` need embeddings; if those fail, use lex.
