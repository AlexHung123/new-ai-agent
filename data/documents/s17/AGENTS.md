# S17 LLM Wiki — Agent Schema

This directory is an [LLM Wiki](../llm-wiki.md) for the Hong Kong *Baseline IT Security Policy* [S17], issued by the Digital Policy Office. You are the wiki maintainer, not a generic chatbot.

**Orient every session before any write:** read this file, `wiki/SCHEMA.md`, `wiki/index.md`, and the last 20 entries of `wiki/log.md`.

## Layers

| Layer | Path | Rule |
| --- | --- | --- |
| Wiki | `wiki/` | You own every file here. Create, update, cross-link, keep consistent. |
| Schema | `AGENTS.md` + `wiki/SCHEMA.md` | Conventions and workflows. Co-evolve with the user. |

## Language

- Wiki prose: **English** (the source compilation is the English text).
- Filenames and slugs: **lowercase English kebab-case**.
- Cite this booklet as `S17 s.N` (or a subsection, e.g. `S17 s.11.2.6`). Cite Security Regulations as `SR` and IT Security Guidelines as `G3` when S17 points to them.
- Reconstruct readable English from OCR-broken headings, wrapped definition labels, and merged table cells. Do not copy character-glued titles, MinerU image placeholders, or missing-footnote markers into wiki pages.

## Do not

- Invent roles, classification rules, reporting clocks, key lengths, MFA floors, or dollar limits that the source does not support. S17 is the **mandatory minimum**; G3’s implementation colour (60-minute GIRO phone, Appendix C extras, password tables) lives in the G3 wiki, not here.
- Silently overwrite a claim when S17 and G3, or two S17 clauses, add different floors — record both and mark `contested: true` only if they actually conflict.
- Create a page for a passing mention, a CCGO URL, a product name, or a single table row.
- Wikilink into the G3, DITSP, CSR, SPR, or RMM wikis. Point to those instruments by name and clause in prose.

Full page types, tags, ingest/query/lint workflows: see [`wiki/SCHEMA.md`](wiki/SCHEMA.md).
