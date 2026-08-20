# Wiki Log

> Chronological record of all wiki actions. Append-only.
> Format: `## [YYYY-MM-DD] action | subject`

## [2026-08-14] create | Wiki initialized

- Domain: Hong Kong Stores and Procurement Regulations (《物料供應及採購規例》, SPR)
- Raw source locked: `spr/MinerU_markdown_spr_e_clean.md` (immutable)
- Schema: `spr/AGENTS.md`, `spr/wiki/SCHEMA.md`

## [2026-08-14] ingest | Stores and Procurement Regulations (effective 31 July 2026)

- Source: `MinerU_markdown_spr_e_clean.md` (~3,370 lines; Introduction–Chapter XII + Appendices I–VII + Glossary)
- Created 50 content pages (chapters, entities, concepts, comparisons, overview, synthesis, source summary)
- Chapter hubs for I–XII; Chapter III split into `03-tenders` + `03-tenders-process`; Chapter IA as its own hub
- SPR 116 board limits transcribed from source diagram (CTB no limit; GLD TB ≤ $60m; PWTB ≤ $200m; DTC ≤ $10m; CCSB/AACSB/EACSB no limit; DCSC ≤ $10m)
- SPR 1110 disposal tree reconstructed from SPR 1115–1151
- Comparison pages: procurement routes, tendering types, approving authorities, stores classes
- Lint (first pass): no broken `[[wikilinks]]`; no orphan content pages; no page over 200 lines
- Known gaps: unnumbered articles in the conversion (300, 310, 320, 325, 330, 337, 365, 385, 455, 505, 510, 720, 890–895, 1010, 1040, 1080, 195); SPR 1225 Note 1 empty; WTO GPA dollar thresholds and SMS Framework mark bands live in circulars, not this compilation
- Amounts are the 31 July 2026 snapshot; confirm against current FCs before acting
