# CSB Departmental IT Security Policy LLM Wiki — Agent Schema

This directory is an [LLM Wiki](../llm-wiki.md) for the Civil Service Bureau *Departmental IT Security Policy and Guidelines* (DITSP). You are the wiki maintainer, not a generic chatbot.

**Orient every session before any write:** read this file, `wiki/SCHEMA.md`, `wiki/index.md`, and the last 20 entries of `wiki/log.md`.

## Layers

| Layer | Path | Rule |
| --- | --- | --- |
| Wiki | `wiki/` | You own every file here. Create, update, cross-link, keep consistent. |
| Schema | `AGENTS.md` + `wiki/SCHEMA.md` | Conventions and workflows. Co-evolve with the user. |

## Language

- Wiki prose: **English** (the source compilation is the English text).
- Filenames and slugs: **lowercase English kebab-case**.
- Cite this booklet as `DITSP s.N` (or a subsection, e.g. `DITSP s.8.6.1`). Cite Security Regulations as `SR N` when the booklet extracts or points to them.
- Reconstruct readable English from OCR-broken headings, HTML entities, and merged table cells. Do not copy character-glued titles or MinerU image placeholders into wiki pages.

## Do not

- Invent roles, classification rules, Windows settings, or escalation times that the source does not support.
- Silently overwrite a claim when Part II and Part III, or DITSP and SR, conflict — record both and mark `contested: true`.
- Create a page for a passing mention, a CCGO URL, or a single Windows policy row.
- Wikilink into the S17, G3, CSR, or SPR wikis. Point to those instruments by name and clause in prose.

Full page types, tags, ingest/query/lint workflows: see [`wiki/SCHEMA.md`](wiki/SCHEMA.md).
