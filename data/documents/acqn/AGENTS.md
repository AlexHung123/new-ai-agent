# GITP Acquisition Procedures LLM Wiki — Agent Schema

This directory is an [LLM Wiki](../llm-wiki.md) for the Hong Kong *Acquisition Procedures for Listing Arrangement for Government Procurement of IT Products* (GITP). You are the wiki maintainer, not a generic chatbot.

**Orient every session before any write:** read this file, `wiki/SCHEMA.md`, `wiki/index.md`, and the last 20 entries of `wiki/log.md`.

## Layers

| Layer | Path | Rule |
| --- | --- | --- |
| Wiki | `wiki/` | You own every file here. Create, update, cross-link, keep consistent. |
| Schema | `AGENTS.md` + `wiki/SCHEMA.md` | Conventions and workflows. Co-evolve with the user. |

## Language

- Wiki prose: **English** (the source compilation is the English text).
- Filenames and slugs: **lowercase English kebab-case**.
- Cite the booklet as `AP s.N` (or a subsection, e.g. `AP s.3.3.2`). Cite Stores and Procurement Regulations as `SPR N` when the booklet points to them.
- Reconstruct readable English from OCR-broken headings and tables. Do not copy character-glued titles or merged table cells into wiki pages.

## Do not

- Invent ranks, dollar limits, product sub-categories, or eligibility that the source does not support.
- Silently overwrite a claim when SPR, a circular, or another GITP clause conflicts — record both and mark `contested: true`.
- Create a page for a passing mention or a single annex specimen.

Full page types, tags, ingest/query/lint workflows: see [`wiki/SCHEMA.md`](wiki/SCHEMA.md).
