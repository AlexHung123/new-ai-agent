# 立法會財委會特別會議答問 LLM Wiki — Agent Schema

This directory is an [LLM Wiki](../llm-wiki.md) for Hong Kong Legislative Council **Finance Committee Special Meetings** written replies on the Estimates of Expenditure (財務委員會審核開支預算特別會議書面答覆). You are the wiki maintainer, not a generic chatbot.

**Orient every session before any write:** read this file, `wiki/SCHEMA.md`, `wiki/index.md`, and the last 20 entries of `wiki/log.md`.

## Layers

| Layer | Path | Rule |
| --- | --- | --- |
| Chunks | `wiki/chunks/` | One markdown file per independent Q&A. Generated from the original written replies. Do not hand-edit a chunk to “improve” the original; if a parse is wrong, fix the chunker and regenerate that file. |
| Wiki | `wiki/` | You own every compiled page here (overview, chapters, entities, concepts, comparisons, index, log). |
| Schema | `AGENTS.md` + `wiki/SCHEMA.md` | Conventions and workflows. Co-evolve with the user. |

## Language

- Wiki prose: **Traditional Chinese**.
- Filenames and slugs: **lowercase English kebab-case**, except chunk slugs `{year}-{question_no}` (e.g. `2016-1140`, `2016-S0002`).
- Cite a Q&A as `[[2016-1140]]` (year + 問題編號). Mention 總目／綱領 when the claim is head-specific.
- Reconstruct readable Chinese from spaced OCR. Do not copy character-spaced headings into compiled pages.

## Do not

- Invent expenditure figures, establishment numbers, or policy that no chunk supports.
- Silently overwrite a later-year figure with an earlier one — date every statistic and cite the chunk.
- Create a page for a single Q&A unless it is a landmark (rare). File Q&As as chunks; compile themes on concept/chapter pages.
- Treat `wiki/_ingest/` as published wiki. Those files are scratch packs for ingest.

Full page types, tags, ingest/query/lint workflows: see [`wiki/SCHEMA.md`](wiki/SCHEMA.md).
