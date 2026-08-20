# Wiki Schema — Stores and Procurement Regulations

## Domain

Hong Kong Stores and Procurement Regulations (SPR / 《物料供應及採購規例》): authority and procurement policy, conflict of interest, quotations, tenders, consultants selection, contract administration, stores records and accounting, stores management, imported stores, audit and write-off, surplus disposal, and confiscated or dangerous goods. The source is an English PDF conversion (MinerU) with OCR artefacts (glued headings, broken tables, two untranscribed diagrams). The wiki is the compiled, readable, interlinked form of that source.

Effective date printed on the compilation: **31 July 2026**. SPR is Volume 4 of the Government Regulations, made under section 11(1) of the Public Finance Ordinance (Cap. 2).

## Conventions

- File names: lowercase English kebab-case, no spaces (`controlling-officer.md`).
- Every wiki page starts with YAML frontmatter (below).
- Use `[[wikilinks]]` (Obsidian). Minimum **2 outbound links** per page.
- Link by slug only: `[[pstsy]]`, `[[quotation]]`, `[[03-tenders]]`. Obsidian resolves across folders.
- Display text: `[[pstsy|PS(Tsy)]]`.
- When updating a page, bump `updated`.
- Every new page must be listed in `index.md` under the correct section.
- Every action is appended to `log.md` as `## [YYYY-MM-DD] action | subject`.
- Cite the source as `SPR N`. On multi-source pages, append `^[MinerU_markdown_spr_e_clean.md]` after claims that need provenance.
- Reconstruct readable English. Never paste OCR-glued headings.
- If the source is unreadable at a critical point, write `(source unclear; verify against printed SPR)` and keep the nearest article number.
- Dollar figures are Hong Kong dollars unless stated.

## Frontmatter

```yaml
---
title: English title
created: YYYY-MM-DD
updated: YYYY-MM-DD
type: entity | concept | comparison | chapter | source | query | synthesis
tags: []          # only tags from the taxonomy below
sources: [MinerU_markdown_spr_e_clean.md]
spr_articles: 100-160   # optional; article range or list
confidence: high | medium | low
contested: false
---
```

## Tag taxonomy

Add a tag here **before** using it on a page.

- Structure: `chapter`, `appendix`, `definition`
- People / orgs: `authority`, `board`, `department`
- Policy: `policy`, `national-security`, `integrity`, `conflict-of-interest`
- Buying: `quotation`, `tender`, `consultancy`, `wto-gpa`, `marking-scheme`, `direct-engagement`
- After award: `contract`, `variation`, `performance`
- Stores: `stores`, `inventory`, `accounting`, `audit`, `write-off`, `disposal`
- Meta: `comparison`, `procedure`

## Page thresholds

- **Create** a page when a term is a named board/authority, a defined procedure (quotation, tender type, write-off), or a chapter-level topic.
- **Don't create** a page for a single appendix specimen, a government form number, or a passing mention.
- **Split** when a page exceeds ~200 lines.
- Chapter hubs stay short; detail goes to concept/entity pages.

## Reserved slugs

Do not invent competing slugs for these. Link to them.

### Chapters

| Slug | Topic | SPR |
| --- | --- | --- |
| `00-introduction` | Validity of Government Regulations | 1–99 |
| `01-authority` | Authority, policy, DGL, COs, complaints | 100–160 |
| `01a-conflict-of-interest` | Private interests; consultant/contractor roles | 180–198 |
| `02-procurement` | Quotation procedures; departmental buying | 200–298 |
| `03-tenders` | Scope, boards, types of tendering, direct engagement, funding | 300–338 |
| `03-tenders-process` | Notices, documents, evaluation, award | 340–390 |
| `04-consultants` | Consultants selection | 400–470 |
| `05-contract-admin` | Execution, payment, variation, performance | 500–541 |
| `06-stores-records` | Ledgers, vouchers, registers | 600–680 |
| `07-accounting` | Classification; inventory and non-inventory | 700–775 |
| `08-stores-management` | Receipt, issue, custody, handover | 800–896 |
| `09-overseas-stores` | Import, inspection, claims | 900–965 |
| `10-audit-writeoff` | Audit, discrepancies, write-off, surcharge | 1000–1085 |
| `11-surplus-disposal` | Surplus stores | 1100–1155 |
| `12-dangerous-confiscated` | Dangerous materials; confiscated goods | 1200–1235 |
| `appendices` | Appendices I–VII catalogue | Appendices |

### Entities

| Slug | Name |
| --- | --- |
| `sfst` | Financial Secretary / Secretary for Financial Services and the Treasury |
| `pstsy` | Permanent Secretary for Financial Services and the Treasury (Treasury) |
| `dgl` | Director of Government Logistics / GLD |
| `controlling-officer` | Controlling Officer |
| `dsm` | Departmental Stores Manager |
| `ctb` | Central Tender Board (and subsidiary boards) |
| `ccsb` | Consultants selection boards (CCSB, AACSB, EACSB, DCSC) |
| `dtc` | Departmental Tender Committee |
| `review-body` | Review Body on Bid Challenges |
| `finance-committee` | Finance Committee of the Legislative Council |
| `doj` | Department of Justice / LAD(W)/DEVB |

### Concepts

| Slug | Name |
| --- | --- |
| `government-regulations` | Government Regulations (seven volumes) |
| `value-for-money` | Value for money |
| `procurement-principles` | Open competition, transparency, pro-innovation, integrity |
| `national-security` | Duty to safeguard national security |
| `conflict-of-interest` | Actual / potential / perceived conflict |
| `quotation` | Quotation procedures and limits |
| `tendering` | Tender procedures and types |
| `marking-scheme` | Marking schemes and SMS Framework |
| `wto-gpa` | WTO Agreement on Government Procurement |
| `consultants-selection` | When and how to select consultants |
| `parallel-tendering` | Invite bids before funding is secured |
| `direct-engagement` | Engage without a bidding process |
| `contract-variation` | Variations after award |
| `stores-classification` | GLD unallocated vs departmental; inventory vs non-inventory |
| `write-off` | Lost or deficient stores |
| `disposal` | Surplus, donation, commercial sale, dumping |

### Comparisons

| Slug | Content |
| --- | --- |
| `compare-procurement-routes` | Quotation / tender / consultants / direct engagement |
| `compare-tendering-types` | Open, selective, single/restricted, prequalified, direct |
| `compare-approving-authorities` | Who may invite, negotiate, accept, vary, write off |
| `compare-stores-classes` | Unallocated / departmental; inventory / non-inventory; surplus paths |

## Operations

**Ingest.** Read the source (never edit it). Update the source summary, chapter hub, every reserved entity/concept the source materially changes, then `index.md` and `log.md`. One SPR ingest can touch 15+ pages.

**Query.** Read `index.md` first, then only the needed pages. Cite wiki pages in the answer. File substantial answers under `queries/`.

**Lint.** Check orphans, broken `[[wikilinks]]`, index completeness, frontmatter, contested pages, pages over 200 lines, tags not in this taxonomy.

## Update policy

1. Later SPR revisions and current Financial Circulars generally supersede earlier text on the same point.
2. If two live articles conflict, keep both, date them, set `contested: true`, and list the other slug under `contradictions`.
3. Specimen appendices are catalogued, not transcribed in full.

## Source map (`MinerU_markdown_spr_e_clean.md`)

Approximate 1-indexed line ranges:

| Block | Lines |
| --- | --- |
| Title / TOC | 1–132 |
| Introduction 1–16 | 134–223 |
| Chapter I 100–160 | 226–335 |
| Chapter IA 180–198 | 337–413 |
| Chapter II 200–298 | 417–591 |
| Chapter III 300–390 | 595–1083 |
| Chapter IV 400–470 | 1085–1253 |
| Chapter V 500–541 | 1257–1355 |
| Chapter VI 600–680 | 1357–1413 |
| Chapter VII 700–775 | 1417–1535 |
| Chapter VIII 800–896 | 1539–1681 |
| Chapter IX 900–965 | 1683–1747 |
| Chapter X 1000–1085 | 1749–1927 |
| Chapter XI 1100–1155 | 1929–2014 |
| Chapter XII 1200–1235 | 2016–2074 |
| Appendices + Glossary | 2078–3370 |

SPR 116 (board structure and dollar limits) and SPR 1110 (disposal flowchart) are images in the source. Transcribed values live on [[ctb]], [[ccsb]], and [[11-surplus-disposal]].
