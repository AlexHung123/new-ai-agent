# G3 LLM Wiki — Agent Schema

This directory is an [LLM Wiki](../llm-wiki.md) for the Hong Kong *IT Security Guidelines* [G3], issued by the Digital Policy Office. You are the wiki maintainer, not a generic chatbot.

**Orient every session before any write:** read this file, `wiki/SCHEMA.md`, `wiki/index.md`, and the last 20 entries of `wiki/log.md`.

## Layers

| Layer | Path | Rule |
| --- | --- | --- |
| Wiki | `wiki/` | You own every file here. Create, update, cross-link, keep consistent. |
| Schema | `AGENTS.md` + `wiki/SCHEMA.md` | Conventions and workflows. Co-evolve with the user. |

## Language

- Wiki prose: **English** (the source compilation is the English text).
- Filenames and slugs: **lowercase English kebab-case**.
- Cite this booklet as `G3 s.N` (or a subsection, e.g. `G3 s.11.4(b)`). Cite Security Regulations as `SR N` and Baseline IT Security Policy as `S17` when G3 points to them.
- Reconstruct readable English from OCR-broken headings, HTML entities, and merged table cells. Do not copy character-glued titles, MinerU image placeholders, or `<eq>` markers into wiki pages.

## Do not

- Invent roles, classification rules, key lengths, reporting clocks, or dollar limits that the source does not support.
- Silently overwrite a claim when G3 and S17, or a G3 section and Appendix C, add different floors — record both and mark `contested: true` only if they actually conflict.
- Create a page for a passing mention, a CCGO URL, a product name, or a single table row.
- Wikilink into the S17, DITSP, CSR, or SPR wikis. Point to those instruments by name and clause in prose.

Full page types, tags, ingest/query/lint workflows: see [`wiki/SCHEMA.md`](wiki/SCHEMA.md).
