# Wiki Schema — Records Management Manual

## Domain

Hong Kong *Records Management Manual* (RMM): the Director of Administration’s code of practices for a comprehensive records management programme in bureaux and departments (B/Ds). It covers creation and collection, classification, retrieval and access, storage and security, scheduling and disposal, vital records, administrative change, and monitoring. The source is an English PDF conversion (MinerU) of the **2001** edition with **minor updates in November 2020**. Filename version token: **2.3.1**. The wiki is the compiled, readable, interlinked form of that source.

The Manual is **not** a volume of the Government Regulations. It is to be used with the GRS Records Management Publications (Appendix A). Security Regulations, the Code on Access to Information, the Public Records (Access) Rules, and the Personal Data (Privacy) Ordinance sit alongside it. This wiki does **not** wikilink into those other wikis.

## Conventions

- File names: lowercase English kebab-case, no spaces (`departmental-records-manager.md`).
- Every wiki page starts with YAML frontmatter (below).
- Use `[[wikilinks]]` (Obsidian). Minimum **2 outbound links** per page.
- Link by slug only: `[[grs]]`, `[[records-disposal]]`, `[[05-scheduling-disposal]]`. Obsidian resolves across folders.
- Display text: `[[grs|GRS]]`.
- When updating a page, bump `updated`.
- Every new page must be listed in `index.md` under the correct section.
- Every action is appended to `log.md` as `## [YYYY-MM-DD] action | subject`.
- Cite the Manual as `RMM N`. On multi-source pages, append `^[MinerU_markdown_2.3.1_RM_Manual_(Eng)_2090718349128654848.md]` after claims that need provenance.
- Reconstruct readable English. Never paste OCR-glued headings, mashed TOC rows, or MinerU image placeholders.
- If the source is unreadable at a critical point, write `(source unclear; verify against printed RMM)` and keep the nearest paragraph number.
- This wiki does **not** wikilink into the SPR, CSR, S17, G3, or DITSP wikis. Point to those instruments by name in prose.

## Frontmatter

```yaml
---
title: English title
created: YYYY-MM-DD
updated: YYYY-MM-DD
type: entity | concept | comparison | chapter | source | query | synthesis
tags: []          # only tags from the taxonomy below
sources: [MinerU_markdown_2.3.1_RM_Manual_(Eng)_2090718349128654848.md]
rmm_paras: 600-639   # optional; paragraph range or list
confidence: high | medium | low
contested: false
---
```

## Tag taxonomy

Add a tag here **before** using it on a page.

- Structure: `chapter`, `appendix`, `definition`
- People / orgs: `authority`, `role`, `department`
- Policy: `policy`, `integrity`
- Records: `record`, `classification`, `access`, `storage`, `disposal`, `archive`, `vital`
- Change: `transfer`, `outsourcing`, `privatization`
- Assurance: `review`, `survey`
- Meta: `comparison`, `procedure`

## Page thresholds

- **Create** a page when a term is a named office/role (GRS, DRM, PRO), a defined records class (administrative / programme / vital / archival), a defined procedure (scheduling, disposal, access review), or a chapter-level topic.
- **Don't create** a page for a single glossary synonym, a reserved blank paragraph range, a publication number, or a passing mention (ADRM, Chief Secretary for Administration, ITSD).
- **Split** when a page exceeds ~200 lines.
- Chapter hubs stay short; detail goes to concept/entity pages and the named splits.

## Reserved slugs

Do not invent competing slugs for these. Link to them.

### Chapters

| Slug | Topic | RMM |
| --- | --- | --- |
| `00-introduction` | Validity, definitions, regulatory framework, electronic records | 100–123 |
| `01-policy-responsibilities` | Government RM policy; HoD, DRM, GRS | 200–221 |
| `02-creation-collection` | What to create; how to capture a complete record | 300–318 |
| `03-classification` | Recordkeeping system; records vs non-records; personal papers | 400–413, 480–482 |
| `03-classification-content` | Content classification; programme vs administrative schemes | 414–429 |
| `03-classification-security` | Security grades and downgrading | 430–449 |
| `03-access` | Retrieval, public access, 30-year rule, tracking | 450–479 |
| `04-storage-security` | Physical storage; climate for long-term / permanent records | 500–523 |
| `05-scheduling-disposal` | Authority, GARDS vs programme schedules, destruction bar, PRO transfer | 600–639 |
| `06-vital-records` | Identification, protection, programme maintenance | 700–730 |
| `07-administrative-changes` | New / deleted / transferred functions inside Government | 800–820 |
| `07-outsourcing-transfer` | Outsourcing, privatisation, corporatisation; custody vs ownership | 821–838 |
| `08-monitoring` | GRS review, study, survey; DRM five-year evaluation | 900–917 |
| `annexes` | Appendices A–C catalogue | Appendices |
| `annex-publications` | Appendix A: GRS publications list | App A |
| `annex-glossary` | Appendix B: glossary catalogue | App B |
| `annex-drm-duties` | Appendix C: major DRM duties | App C |

### Entities

| Slug | Name |
| --- | --- |
| `director-of-administration` | Director of Administration |
| `grs` | Government Records Service |
| `grs-director` | Government Records Service Director |
| `drm` | Departmental Records Manager |
| `head-of-bd` | Head of bureau or department |
| `pro` | Public Records Office |
| `rmo` | Records Management Office |
| `records-centre` | Records Centre |

### Concepts

| Slug | Name |
| --- | --- |
| `government-records` | Government record: content, structure, context |
| `recordkeeping-system` | Capture, inventory, indexes, tracking |
| `electronic-records` | Electronic records as government records |
| `personal-papers` | Private materials vs official records |
| `content-classification` | Classification scheme; vocabulary control |
| `security-classification` | Top Secret / Secret / Confidential / Restricted; downgrade |
| `records-access` | Code on Access to Information; Public Records (Access) Rules |
| `administrative-records` | Common internal-administration records; GARDS |
| `programme-records` | Unique mission records; own schedules |
| `records-scheduling` | Retention and disposal schedules; five-year review |
| `records-disposal` | Destroy / retain / migrate / off-site; no destroy without GRS Director |
| `archival-records` | Permanent preservation; 30-year appraisal |
| `vital-records` | Essential / important / useful; disaster survival |
| `administrative-changes` | Function create, delete, transfer |
| `custody-ownership` | Custody vs ownership when records leave Government |
| `records-review` | GRS review / study / survey; DRM internal evaluation |

### Comparisons

| Slug | Content |
| --- | --- |
| `compare-roles` | HoD / DRM / GRS / GRS Director / PRO / RMO |
| `compare-records-vs-nonrecords` | Record / non-record / personal papers / labelled “personal” but official |
| `compare-admin-vs-programme` | Classification scheme and disposal path |
| `compare-disposal-paths` | Destroy / Records Centre / media transfer / PRO / Central Preservation Library |
| `compare-custody-ownership` | Custody, ownership, copies, temporary transfer, access-while-kept |

## Operations

**Ingest.** Read the source (never edit it). Update the source summary, chapter hub, every reserved entity/concept the source materially changes, then `index.md` and `log.md`. One RMM ingest can touch 15+ pages.

**Query.** Read `index.md` first, then only the needed pages. Cite wiki pages in the answer. File substantial answers under `queries/`.

**Lint.** Check orphans, broken `[[wikilinks]]`, index completeness, frontmatter, contested pages, pages over 200 lines, tags not in this taxonomy.

## Update policy

1. Later RMM revisions and current GRS publications generally supersede earlier text on the same point. This compilation is **2001 with minor updates in November 2020**. Treat “strategy for electronic records will be issued in due course” (RMM 107) and “Information Technology Services Department” (RMM 717) as a dated snapshot.
2. If two live paragraphs conflict, keep both, date them, set `contested: true`, and list the other slug under `contradictions`.
3. Companion publications (GARDS, Subject Filing, Vital Records Protection, etc.) are catalogued, not transcribed. Do not invent their contents.
4. RMM 103 says B/Ds should follow “as far as possible”. Hard bars still sit in the text (no destruction without the GRS Director, RMM 605; no records in a privatisation instrument without GRS Director authority, RMM 822). Record the overlay rather than collapsing “should” into “must”.
5. Reserved blank ranges (`202–205`, `214–219`, `305–309`, …) are unused numbers, not missing chapters. Do not invent text for them.
6. Paragraph **824** is printed as `24.` in the conversion. Reconstruct as RMM 824.
7. The printed subject index cites **RMM 434** for classification; the body stops at RMM 433. Flag as `(source unclear; verify against printed RMM)`.

## Source map (`MinerU_markdown_2.3.1_RM_Manual_(Eng)_2090718349128654848.md`)

Approximate 1-indexed line ranges:

| Block | Lines |
| --- | --- |
| Title / TOC | 1–23 |
| Chapter 1 Introduction 100–123 | 25–143 |
| Chapter 2 Policy and responsibilities 200–221 | 145–249 |
| Chapter 3 Creation and collection 300–318 | 251–309 |
| Chapter 4 Classification, retrieval, access 400–482 | 311–477 |
| Chapter 5 Storage and security 500–523 | 479–531 |
| Chapter 6 Scheduling and disposal 600–639 | 533–615 |
| Chapter 7 Vital records 700–730 | 617–671 |
| Chapter 8 Administrative changes 800–838 | 673–777 |
| Chapter 9 Monitoring 900–917 | 779–809 |
| Appendix A publications | 811–829 |
| Appendix B glossary | 831–1119 |
| Appendix C DRM duties | 1121–1143 |
| Subject index | 1145–1148 |

Known conversion defects: TOC rows for Chapters 4–9 are mashed into unnumbered paragraphs; Appendix A–C headings omit the letters A/B/C; RMM 824 printed as `24.`; subject index cites 434 with no body paragraph; HTML table for the subject index is one block; Publication No. 8 title is Chinese (`《中文檔案管理指引》`).
