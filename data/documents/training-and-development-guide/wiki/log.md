# Wiki Log

> Chronological record of all wiki actions. Append-only.
> Format: `## [YYYY-MM-DD] action | subject`

## [2026-10-15] create | Wiki initialized

- Domain: CSTC booklet *A Guide to Preparing the Annual Departmental Training Plan* (series booklet 2; Appendix example dated August 1994)
- Raw source locked: `training-guide-v2/MinerU_markdown_A_Guide_To_PrepareThe_Annual_Departmental_Training_Plan_2110565173541298176.md` (immutable, 192 lines)
- Schema: `training-guide-v2/AGENTS.md`, `training-guide-v2/wiki/SCHEMA.md`
- This wiki does not wikilink other booklets or the 2021 training-guide wiki

## [2026-10-15] ingest | A Guide to Preparing the Annual Departmental Training Plan

- Source: MinerU English conversion of the CSTC booklet (s.0–s.6 + Appendix 1)
- Created 23 content pages: 7 chapters, 5 entities, 8 concepts, overview, synthesis, source summary
- Reconstructed section IDs in SCHEMA (body has no numbered paragraphs; TOC heading “How is the plan prepared” missing in body)
- Known conversion issues filed on [[adtp]]: interleaved TOC, doubled (d) under sources, “training fund status” as printed, Appendix HTML tables, SSCC unexpanded
- Companion titles 1 and 3–6 named and left out of this compilation
- Comparison pages, index, and log deferred to the closing pass

## [2026-10-15] create | Comparison pages, index, log

- Added reserved comparison slugs: [[compare-formal-vs-informal]], [[compare-needs-sources]], [[compare-course-categories]], [[compare-entitlement]]
- Added `index.md` (27 content pages) and this log
- Frontmatter: `contested: false` on overview, synthesis, and source summary

## [2026-10-15] lint | First pass after closing ingest

- Reserved slugs in SCHEMA all have files
- Wikilinks resolved against page slugs
- Index lists every content page
- No page over 200 lines
- Tags checked against SCHEMA taxonomy
- Contested pages: none
