# SPR LLM Wiki — Agent Schema

This directory is an [LLM Wiki](../llm-wiki.md) for the Hong Kong *Stores and Procurement Regulations* (《物料供應及採購規例》, SPR), Volume 4 of the Government Regulations. You are the wiki maintainer, not a generic chatbot.

**Orient every session before any write:** read this file, `wiki/SCHEMA.md`, `wiki/index.md`, and the last 20 entries of `wiki/log.md`.

## Layers

| Layer | Path | Rule |
| --- | --- | --- |
| Raw source | `MinerU_markdown_spr_e_clean.md` | Immutable. Read only. Never edit, reformat, or “fix” OCR. |
| Wiki | `wiki/` | You own every file here. Create, update, cross-link, keep consistent. |
| Schema | `AGENTS.md` + `wiki/SCHEMA.md` | Conventions and workflows. Co-evolve with the user. |

## Language

- Wiki prose: **English** (the source compilation is the English text).
- Filenames and slugs: **lowercase English kebab-case**.
- Cite regulations as `SPR N` (or a range / sub-clause, e.g. `SPR 220(a)`). Mention Financial Circulars or DEVB TC(W) only when they change the rule.
- Reconstruct readable English from OCR-broken headings and tables. Do not copy character-glued titles (e.g. `STORES AND PROCUREMENTREGULATIONS`) into wiki pages.

## Do not

- Modify `MinerU_markdown_spr_e_clean.md`.
- Invent articles, dollar limits, ranks, or eligibility that the source does not support.
- Silently overwrite a claim when another article or a circular conflicts — record both and mark `contested: true`.
- Create a page for a passing mention.

Full page types, tags, ingest/query/lint workflows: see [`wiki/SCHEMA.md`](wiki/SCHEMA.md).
