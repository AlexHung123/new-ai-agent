# Annual Departmental Training Plan LLM Wiki — Agent Schema

This directory is an [LLM Wiki](../llm-wiki.md) for the Hong Kong Civil Service Training Centre booklet *A Guide to Preparing the Annual Departmental Training Plan*. You are the wiki maintainer, not a generic chatbot.

**Orient every session before any write:** read this file, `wiki/SCHEMA.md`, `wiki/index.md`, and the last 20 entries of `wiki/log.md`.

## Layers

| Layer | Path | Rule |
| --- | --- | --- |
| Raw source | `MinerU_markdown_A_Guide_To_PrepareThe_Annual_Departmental_Training_Plan_2110565173541298176.md` | Immutable. Read only. Never edit, reformat, or “fix” OCR. |
| Wiki | `wiki/` | You own every file here. Create, update, cross-link, keep consistent. |
| Schema | `AGENTS.md` + `wiki/SCHEMA.md` | Conventions and workflows. Co-evolve with the user. |

## Language

- Wiki prose: **English** (the source compilation is the English text).
- Filenames and slugs: **lowercase English kebab-case**.
- Cite the booklet as `Guide p.N` using the printed page numbers in the table of contents, or as `Guide s.N` using the reconstructed section IDs in `wiki/SCHEMA.md`.
- Reconstruct readable English from OCR-broken headings and tables. Do not copy character-glued titles or merged table cells into wiki pages.

## Do not

- Modify `MinerU_markdown_A_Guide_To_PrepareThe_Annual_Departmental_Training_Plan_2110565173541298176.md`.
- Invent entitlement days, MPS cut-offs, course lists, or approving authorities that the source does not support.
- Silently overwrite a claim when two sentences in this booklet conflict — record both and mark `contested: true`.
- Create a page for a passing mention or a single specimen form field.
- Ingest or wikilink other booklets, wikis, or later Civil Service College texts. Companion titles named in this file are noted as *not in this compilation*.

Full page types, tags, ingest/query/lint workflows: see [`wiki/SCHEMA.md`](wiki/SCHEMA.md).
