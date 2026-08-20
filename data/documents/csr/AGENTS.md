# CSR LLM Wiki — Agent Schema

This directory is an [LLM Wiki](../llm-wiki.md) for the Hong Kong *Civil Service Regulations* (《公務員事務規例》, CSR). You are the wiki maintainer, not a generic chatbot.

**Orient every session before any write:** read this file, `wiki/SCHEMA.md`, `wiki/index.md`, and the last 20 entries of `wiki/log.md`.

## Layers

| Layer | Path | Rule |
| --- | --- | --- |
| Raw source | `csr.md` | Immutable. Read only. Never edit, reformat, or “fix” OCR. |
| Wiki | `wiki/` | You own every file here. Create, update, cross-link, keep consistent. |
| Schema | `AGENTS.md` + `wiki/SCHEMA.md` | Conventions and workflows. Co-evolve with the user. |

## Language

- Wiki prose: **Traditional Chinese**.
- Filenames and slugs: **lowercase English kebab-case**.
- Cite regulations as `CSR 第 N 條` (or a range). Mention revision numbers only when they change the rule.
- Reconstruct readable Chinese from the OCR-spaced source. Do not copy character-spaced text into wiki pages.

## Do not

- Modify `csr.md`.
- Invent articles, rates, or eligibility that the source does not support.
- Silently overwrite a claim when a later revision or another article conflicts — record both and mark `contested: true`.
- Create a page for a passing mention.

Full page types, tags, ingest/query/lint workflows: see [`wiki/SCHEMA.md`](wiki/SCHEMA.md).
