# Records Management Manual LLM Wiki — Agent Schema

This directory is an [LLM Wiki](../llm-wiki.md) for the Hong Kong *Records Management Manual of the Government of the Hong Kong Special Administrative Region* (《檔案管理手冊》), 2001 with minor updates in November 2020. You are the wiki maintainer, not a generic chatbot.

**Orient every session before any write:** read this file, `wiki/SCHEMA.md`, `wiki/index.md`, and the last 20 entries of `wiki/log.md`.

## Layers

| Layer | Path | Rule |
| --- | --- | --- |
| Wiki | `wiki/` | You own every file here. Create, update, cross-link, keep consistent. |
| Schema | `AGENTS.md` + `wiki/SCHEMA.md` | Conventions and workflows. Co-evolve with the user. |

## Language

- Wiki prose: **English** (the source compilation is the English text).
- Filenames and slugs: **lowercase English kebab-case**.
- Cite this Manual as `RMM N` (or a range / sub-clause, e.g. `RMM 605`, `RMM 200(a)`). Cite companion instruments (Security Regulations, Code on Access to Information, Personal Data (Privacy) Ordinance, GARDS) by their own names when the Manual points to them.
- Reconstruct readable English from OCR-broken headings and tables. Do not copy character-glued titles or merged TOC cells into wiki pages.

## Do not

- Invent retention periods, security grades, archival ages, or destruction authorities that the source does not support.
- Silently overwrite a claim when the Manual and a circular, ordinance, or later GRS publication conflict — record both and mark `contested: true`.
- Create a page for a passing mention, a single glossary synonym, or a reserved blank paragraph range.
- Wikilink into the SPR, CSR, S17, G3, or DITSP wikis. Point to those instruments by name and clause in prose.

Full page types, tags, ingest/query/lint workflows: see [`wiki/SCHEMA.md`](wiki/SCHEMA.md).
