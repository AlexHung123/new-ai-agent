# Wiki Schema — GITP Acquisition Procedures

## Domain

Hong Kong *Acquisition Procedures for Listing Arrangement for Government Procurement of IT Products* (GITP): how bureaux and departments (B/Ds) buy IT products and related services from listed GITP Providers through the Digital Policy Office (DPO) e-Procurement System. The booklet sits under Stores and Procurement Regulations (SPR) Chapter II quotation procedures; it is not itself a volume of the Government Regulations.

The source is an English PDF conversion (MinerU) of **version 1.3c**. The printed amendment history in the conversion stops at **1.3 (Feb 2024)**. Annex bodies (Annexes 1–14) are named in the table of contents but are **not transcribed** in the markdown.

## Conventions

- File names: lowercase English kebab-case, no spaces (`gitp-providers.md`).
- Every wiki page starts with YAML frontmatter (below).
- Use `[[wikilinks]]` (Obsidian). Minimum **2 outbound links** per page.
- Link by slug only: `[[e-ps]]`, `[[brief]]`, `[[02-acquisition]]`. Obsidian resolves across folders.
- Display text: `[[e-ps|e-PS]]`.
- When updating a page, bump `updated`.
- Every new page must be listed in `index.md` under the correct section.
- Every action is appended to `log.md` as `## [YYYY-MM-DD] action | subject`.
- Cite the booklet as `AP s.N`. On multi-source pages, append `^[MinerU_markdown_Acqn-Procedures_(GITP)_v1.3c_2090718397556084736.md]` after claims that need provenance.
- Reconstruct readable English. Never paste OCR-glued headings or merged table cells.
- If the source is unreadable at a critical point, write `(source unclear; verify against printed GITP booklet)` and keep the nearest section number.
- Dollar figures are Hong Kong dollars unless stated.
- This wiki does **not** wikilink into the SPR or CSR wikis. Point to SPR by article number in prose.

## Frontmatter

```yaml
---
title: English title
created: YYYY-MM-DD
updated: YYYY-MM-DD
type: entity | concept | comparison | chapter | source | query | synthesis
tags: []          # only tags from the taxonomy below
sources: [MinerU_markdown_Acqn-Procedures_(GITP)_v1.3c_2090718397556084736.md]
gitp_sections: 3.3   # optional; section range or list
confidence: high | medium | low
contested: false
---
```

## Tag taxonomy

Add a tag here **before** using it on a page.

- Structure: `chapter`, `annex`, `definition`
- People / orgs: `authority`, `department`, `provider`
- Buying: `gitp`, `brief`, `quotation`, `invitation`, `evaluation`, `marking-scheme`
- After award: `acceptance`, `payment`, `warranty`, `maintenance`, `performance`, `variation`
- Integrity: `integrity`, `conflict-of-interest`, `restricted`
- Products: `category`, `trade-in`, `disposal`
- Meta: `comparison`, `procedure`

## Page thresholds

- **Create** a page when a term is a named office/system (DPO, e-PS), a defined procedure (Brief, reliability tests), or a section-level topic.
- **Don't create** a page for a single annex specimen, a telephone number, or a passing mention.
- **Split** when a page exceeds ~200 lines.
- Chapter hubs stay short; detail goes to concept/entity pages.

## Reserved slugs

Do not invent competing slugs for these. Link to them.

### Chapters

| Slug | Topic | AP |
| --- | --- | --- |
| `00-introduction` | Preamble; listing arrangement | 1 |
| `01-scope-categorisation` | Scope; Categories A–C and sub-categories | 2 |
| `02-acquisition` | Acquisition hub; SPR 220 gate; urgent minor buy | 3, 3.1, 3.10–3.11 |
| `02-acquisition-brief` | Preparation of the Brief | 3.2 |
| `02-acquisition-invitation` | Invitation and receipt via e-PS | 3.3–3.4 |
| `02-acquisition-evaluation` | Evaluation, recommendation, acceptance, cancellation | 3.5–3.9 |
| `03-acceptance` | Installation, function, reliability tests; patching; REE | 4 |
| `04-payment` | Payment and record keeping | 5 |
| `05-maintenance` | Warranty and after-warranty maintenance | 6 |
| `06-performance` | Contractor Performance Appraisal Report | 7 |
| `07-control` | Coordinating officer, POBO, COI, VFM, disposal, parts | 8 |
| `08-enquiries` | DPO and e-PS contacts | 9 |
| `annexes` | Annexes 1–14 catalogue | Annexes |

### Entities

| Slug | Name |
| --- | --- |
| `dpo` | Digital Policy Office (then OGCIO) |
| `gitp-providers` | GITP Providers |
| `e-ps` | e-Procurement System |
| `itmu` | Departmental ITMU / Client IT Services Manager of DPO |
| `gitp-support-team` | GITP Support Team |

### Concepts

| Slug | Name |
| --- | --- |
| `gitp-scheme` | GITP listing arrangement |
| `product-categories` | Categories A, B, C and sub-categories |
| `brief` | Requirement specifications / Outline of Brief |
| `quotation-limit` | SPR 220(a) quotation ceiling for GITP |
| `proposal-evaluation` | Technical and price evaluation; overall / group / item |
| `acceptance-tests` | Installation, function, and reliability tests |
| `warranty` | Warranty Period and free-of-charge maintenance |
| `maintenance-schemes` | Hardware M1–M3 and software schemes |
| `trade-in` | Trade-in services vs SPR Chapter XI disposal |
| `conflict-of-interest` | Declarations under SPR 185–186 |
| `value-for-money` | Aggregation; no exclusive right |
| `cpar` | Adverse Contractor Performance Appraisal Report |
| `conditions-of-contract` | GITP Conditions of Contract for Individual Procurement |

### Comparisons

| Slug | Content |
| --- | --- |
| `compare-product-categories` | Categories A / B / C: products and invitation time |
| `compare-approving-authorities` | Who may invite vs who may accept, by value and competition |
| `compare-evaluation-bases` | Overall / group / item; marking scheme vs price-only; 5-year cost |

## Operations

**Ingest.** Read the source (never edit it). Update the source summary, chapter hub, every reserved entity/concept the source materially changes, then `index.md` and `log.md`. One GITP ingest can touch 15+ pages.

**Query.** Read `index.md` first, then only the needed pages. Cite wiki pages in the answer. File substantial answers under `queries/`.

**Lint.** Check orphans, broken `[[wikilinks]]`, index completeness, frontmatter, contested pages, pages over 200 lines, tags not in this taxonomy.

## Update policy

1. Later GITP booklet revisions generally supersede earlier text in the same section. AP s.3.11 says the financial-limit **tables** auto-update when SPR 220(a), 260(a), 260(b), 265, or 290 are revised — treat printed dollar figures as a snapshot.
2. If two live clauses conflict, keep both, date them, set `contested: true`, and list the other slug under `contradictions`.
3. Specimen annexes are catalogued, not transcribed in full. Annex bodies are absent from this conversion.

## Source map (`MinerU_markdown_Acqn-Procedures_(GITP)_v1.3c_2090718397556084736.md`)

Approximate 1-indexed line ranges:

| Block | Lines |
| --- | --- |
| Title / amendment history / TOC | 1–75 |
| 1 Introduction | 76–101 |
| 2 Scope and product categorisation | 102–131 |
| 3 Acquisition (hub + 3.1) | 133–142 |
| 3.2 Preparation of Brief | 144–261 |
| 3.3 Invitation | 263–321 |
| 3.4 Receipt | 323–327 |
| 3.5 Evaluation | 329–353 |
| 3.6–3.9 Recommend / accept / cancel | 355–390 |
| 3.10–3.11 Urgent minor; financial-limit update | 392–401 |
| 4 Acceptance of products / services | 404–445 |
| 5 Payment and record keeping | 447–457 |
| 6 On-going maintenance | 459–487 |
| 7 Contractor’s performance monitoring | 489–496 |
| 8 Control | 498–540 |
| 9 Enquiries | 542–546 |
| Annex bodies 1–14 | **not in conversion** |

Known OCR defects: Category A5/A6 table cells merged (AP s.2.2); section 2.1 missing “i)”; Note 5 split across lines (AP s.3.3.2); “dayto-day”; Annex 1 flowchart is an image.
