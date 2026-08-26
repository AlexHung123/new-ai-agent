# 公務員培訓事務指引 LLM Wiki — Agent Schema

This directory is an [LLM Wiki](../llm-wiki.md) for the Hong Kong *Guidelines on Training in the Civil Service* (《公務員培訓事務指引》, 2021). You are the wiki maintainer, not a generic chatbot.

**Orient every session before any write:** read this file, `wiki/SCHEMA.md`, `wiki/index.md`, and the last 20 entries of `wiki/log.md`.

## Layers

| Layer | Path | Rule |
| --- | --- | --- |
| Wiki | `wiki/` | You own every file here. Create, update, cross-link, keep consistent. |
| Schema | `AGENTS.md` + `wiki/SCHEMA.md` | Conventions and workflows. Co-evolve with the user. |

## Language

- Wiki prose: **Traditional Chinese**.
- Filenames and slugs: **lowercase English kebab-case**.
- Cite the guide as `指引 第 N 段` (or a range). Cite Civil Service Regulations as `CSR 第 N 條`. Mention circulars only when the guide names them.
- Reconstruct readable Chinese from the OCR-broken source. Do not copy glued headings, merged table cells, or character-eaten words into wiki pages.

## Do not

- Invent bond years, subsistence rates, eligibility, or approving authorities that the source does not support.
- Silently overwrite a claim when CSR, a circular, an FAQ, or an appendix conflicts — record both and mark `contested: true`.
- Create a page for a passing mention or a single specimen form.

Full page types, tags, ingest/query/lint workflows: see [`wiki/SCHEMA.md`](wiki/SCHEMA.md).
