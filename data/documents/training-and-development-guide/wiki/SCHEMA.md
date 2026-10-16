# Wiki Schema — Annual Departmental Training Plan

## Domain

Hong Kong Civil Service Training Centre (CSTC) booklet *A Guide to Preparing the Annual Departmental Training Plan*: how departments write a yearly working document of training activities, match needs to resources and policies, and send copies to the Civil Service Branch (CSB) and CSTC.

This is booklet **2** in a CSTC series. The source is an English PDF conversion (MinerU). The appendix example uses **August 1994**. The stamp on the title page is *只供在本中心閱讀* (for reading at this centre only). CSB is printed as **Civil Service Branch**. This wiki treats the booklet as a snapshot of that text. It does not import later college or bureau guides.

## Conventions

- File names: lowercase English kebab-case, no spaces (`departmental-training-plan.md`).
- Every wiki page starts with YAML frontmatter (below).
- Use `[[wikilinks]]` (Obsidian). Minimum **2 outbound links** per page.
- Link by slug only: `[[cstc]]`, `[[training-section]]`, `[[04-contents]]`. Obsidian resolves across folders.
- Display text: `[[cstc|Civil Service Training Centre]]`.
- When updating a page, bump `updated`.
- Every new page must be listed in `index.md` under the correct section.
- Every action is appended to `log.md` as `## [YYYY-MM-DD] action | subject`.
- Cite as `Guide p.N` (printed page from the TOC) and/or `Guide s.N` (reconstructed IDs below). On multi-source pages, append `^[MinerU_markdown_A_Guide_To_PrepareThe_Annual_Departmental_Training_Plan_2110565173541298176.md]` after claims that need provenance.
- Reconstruct readable English. Never paste OCR-glued headings or HTML table markup.
- If the source is unreadable at a critical point, write `(source unclear; verify against printed CSTC booklet)` and keep the nearest heading or page.
- This wiki does **not** wikilink into other repos or the 2021 training-guide wiki. Name companion CSTC booklets in prose only.

## Reconstructed section IDs

The conversion has headings but no numbered paragraphs. These IDs are for citation only.

| ID | Heading | Printed page |
| --- | --- | --- |
| `s.0` | Series list, preamble, Development Unit | front matter |
| `s.1` | What is a Departmental Training Plan | 1 |
| `s.2` | Why is such a plan needed | 1 |
| `s.3` | How is the plan prepared (intro; heading in TOC only) | 2 |
| `s.3.1` | Establishing your training needs | 2 |
| `s.3.2` | Matching training needs with departmental resources and policies | 3 |
| `s.4` | What the Training Plan covers | 5 |
| `s.5` | Follow-up action | 7 |
| `s.6` | An incremental approach | 7 |
| `App.1` | Training Agreement | 9 |

## Frontmatter

```yaml
---
title: English title
created: YYYY-MM-DD
updated: YYYY-MM-DD
type: entity | concept | comparison | chapter | source | query | synthesis
tags: []          # only tags from the taxonomy below
sources: [MinerU_markdown_A_Guide_To_PrepareThe_Annual_Departmental_Training_Plan_2110565173541298176.md]
guide_sections: s.3.1   # optional; reconstructed ID, page, or list
confidence: high | medium | low
contested: false
---
```

## Tag taxonomy

Add a tag here **before** using it on a page.

- Structure: `chapter`, `annex`, `definition`
- People / orgs: `authority`, `department`, `centre`, `committee`
- Planning: `plan`, `needs`, `policy`, `resources`, `appraisal`, `entitlement`
- Delivery: `classroom`, `informal`, `induction`, `survey`
- Meta: `comparison`, `procedure`

## Page thresholds

- **Create** a page when a term is a named office (CSTC, CSB, Training Section), a defined procedure (Training Agreement, incremental approach), or a chapter-level topic.
- **Don't create** a page for a single form field, a telephone blank, or a passing mention (SSCC as a course provider is a passing mention).
- **Split** when a page exceeds ~200 lines.
- Chapter hubs stay short; detail goes to concept/entity pages.

## Reserved slugs

Do not invent competing slugs for these. Link to them.

### Chapters

| Slug | Topic | Guide |
| --- | --- | --- |
| `00-introduction` | Series, audience, Development Unit | s.0 |
| `01-what-and-why` | Definition of the plan; four reasons it is needed | s.1–s.2 |
| `02-establishing-needs` | Corporate plan, outside consultation, appraisal | s.3–s.3.1 |
| `03-matching` | Resources, policies, formulating, multi-section plans | s.3.2 |
| `04-contents` | Eight common areas of the Plan | s.4 |
| `05-follow-up` | Copies, notification, amendments; incremental approach | s.5–s.6 |
| `annex-training-agreement` | Appendix 1 specimen | App.1 |

### Entities

| Slug | Name |
| --- | --- |
| `cstc` | Civil Service Training Centre (Development Unit) |
| `csb` | Civil Service Branch |
| `departmental-training-committee` | Departmental Training Committee / HRM Advisory Team |
| `training-section` | Departmental Training Section or unit |
| `branch-rmu` | Branch Resource Management Unit |

### Concepts

| Slug | Name |
| --- | --- |
| `departmental-training-plan` | Annual Departmental Training Plan |
| `training-needs-analysis` | Establishing training needs |
| `performance-appraisal-training` | Appraisal as a source of formal training needs |
| `training-entitlement` | Individual days; CSTC 2-day / 4-day view |
| `departmental-training-policy` | Departmental training policies and parameters |
| `informal-development` | Non-classroom learning; out of the Plan |
| `classroom-training` | Courses documented in the Plan |
| `incremental-approach` | First-year imperfect; separate then master plans |

### Comparisons

| Slug | Content |
| --- | --- |
| `compare-formal-vs-informal` | Formal classroom (in Plan) vs informal individual (out) |
| `compare-needs-sources` | Corporate plan / survey / appraisal / other influences |
| `compare-course-categories` | Local/overseas; professional / management / language / IT |
| `compare-entitlement` | MPS Point 16 or below vs Point 17 or above |

## Operations

**Ingest.** Read the source (never edit it). Update the source summary, chapter hub, every reserved entity/concept the source materially changes, then `index.md` and `log.md`. One booklet ingest can touch 15+ pages.

**Query.** Read `index.md` first, then only the needed pages. Cite wiki pages in the answer. File substantial answers under `queries/`.

**Lint.** Check orphans, broken `[[wikilinks]]`, index completeness, frontmatter, contested pages, pages over 200 lines, tags not in this taxonomy.

## Update policy

1. This booklet is a snapshot. Later CSTC / Civil Service College texts are **out of scope** unless the user adds them as a new raw source.
2. If two live sentences conflict, keep both, date them, set `contested: true`, and list the other slug under `contradictions`.
3. The Appendix 1 specimen is catalogued and described; do not treat the example row (August 1994) as a live course.

## Source map (`MinerU_markdown_A_Guide_To_PrepareThe_Annual_Departmental_Training_Plan_2110565173541298176.md`)

Approximate 1-indexed line ranges:

| Block | Lines |
| --- | --- |
| Series list | 1–13 |
| Title / stamp | 15–19 |
| TOC headings mixed with preamble | 21–39 |
| Purpose paragraph | 41 |
| What is a Departmental Training Plan | 43–47 |
| Why is such a plan needed | 49–57 |
| How intro (no heading in body) | 59 |
| 1. Establishing your training needs | 61–77 |
| 2. Matching needs with resources and policies | 79–101 |
| What the Training Plan covers | 103–163 |
| Follow-up action | 165–171 |
| An incremental approach | 173–179 |
| Appendix 1 Training Agreement | 181–192 |

Known conversion issues:

- TOC is interleaved with the series preamble (lines 21–39).
- Body has no heading **How is the plan prepared**; the TOC lists it at p.2. The paragraph “Quite simply, a training plan should be formulated…” is treated as `s.3`.
- Sources list under `s.4` item 3 uses **(d)** twice (service-wide requirements, then manpower projections). Reconstruct as (d) and (e).
- Companion title in the series list is *Formulating Departmental Training Policies*; the body cites *Formulating Departmental Training Policies and Strategies*.
- “training fund status” is as printed (`s.4` item 2). May be trading fund status; do not silently rewrite.
- Appendix tables arrived as HTML. “Several institute may be providing” is as printed.
- SSCC is named once as a course provider; expansion is not in this file.
