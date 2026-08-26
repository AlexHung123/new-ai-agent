# Wiki Schema — 《公務員培訓事務指引》

## Domain

Hong Kong *Guidelines on Training in the Civil Service* (《公務員培訓事務指引》), issued by the Civil Service Bureau / Civil Service College in **2021**. The guide tells bureaux and departments how to run training-and-development policy and how to interpret Civil Service Regulations (CSR) Chapter 7 (training: CSR 第 1000–1010 條).

The source is a Traditional Chinese PDF conversion (`training_guide.md`) with OCR artefacts (glued headings, eaten characters, a flattened 第 3.19 段 table, truncated appendix forms). The wiki is the compiled, readable, interlinked form of that source.

This wiki does **not** wikilink into the CSR wiki. Point to CSR by article number in prose.

## Conventions

- File names: lowercase English kebab-case, no spaces (`full-pay-study-leave.md`).
- Every wiki page starts with YAML frontmatter (below).
- Use `[[wikilinks]]` (Obsidian). Minimum **2 outbound links** per page.
- Link by slug only: `[[gts]]`, `[[hod]]`, `[[03-undertaking]]`. Obsidian resolves across folders.
- Display text: `[[gts|政府培訓獎學金]]`.
- When updating a page, bump `updated`.
- Every new page must be listed in `index.md` under the correct section.
- Every action is appended to `log.md` as `## [YYYY-MM-DD] action | subject`.
- Cite the guide as `指引 第 N 段`. Cite regulations as `CSR 第 N 條`. On multi-source pages, append `^[training_guide.md]` after claims that need provenance.
- Reconstruct Traditional Chinese. Never paste OCR-glued headings or merged table cells.
- If the source is unreadable at a critical point, write `（原文 OCR 不清，待核）` and keep the nearest paragraph number.
- Dollar figures are Hong Kong dollars unless stated. Subsistence rates in 附件 1 are a **2021 snapshot**.
- Specimen appendix forms are catalogued, not transcribed in full.

## Frontmatter

```yaml
---
title: 中文標題
created: YYYY-MM-DD
updated: YYYY-MM-DD
type: entity | concept | comparison | chapter | source | query | synthesis
tags: []          # only tags from the taxonomy below
sources: [training_guide.md]
guide_sections: 3.5-3.13   # optional; paragraph range or list
csr_articles: 1001         # optional; article number or range
confidence: high | medium | low
contested: false
---
```

## Tag taxonomy

Add a tag here **before** using it on a page.

- Structure: `chapter`, `annex`, `definition`, `faq`
- People / orgs: `authority`, `department`, `college`
- Strategy: `strategy`, `competency`, `evaluation`
- Leave: `study-leave`, `full-pay`, `unpaid`, `examination`
- Bond: `undertaking`, `surety`, `guarantee`, `debt`
- Money: `sponsorship`, `subsistence`, `reimbursement`, `gts`, `loan`
- Meta: `comparison`, `procedure`

## Page thresholds

- **Create** a page when a term is a named office (公務員學院、庫務署署長), a defined procedure (承諾書、政府培訓獎學金), or a chapter-level topic.
- **Don't create** a page for a single specimen form, a telephone blank, or a passing mention.
- **Split** when a page exceeds ~200 lines.
- Chapter hubs stay short; detail goes to concept/entity pages.

## Reserved slugs

Do not invent competing slugs for these. Link to them.

### Chapters

| Slug | Topic | Guide |
| --- | --- | --- |
| `00-introduction` | 指引簡介與對象 | 引言 |
| `01-strategy` | 培訓發展策略：原則與實踐 | 第 1.1–1.4 段 |
| `02-roles` | 角色與職責 | 第 2.1–2.4 段 |
| `03-csr-training` | CSR 培訓條文總覽；批核權力；日間批假 | 第 3.1–3.4 段 |
| `03-full-pay-study-leave` | 全薪進修假期（CSR 第 1001、1002 條） | 第 3.5–3.13 段 |
| `03-unpaid-study-leave` | 無薪進修假期（CSR 第 1004、1005 條） | 第 3.14–3.17 段 |
| `03-undertaking` | 承諾書、保證、擔保、追討 | 第 3.18–3.45 段 |
| `03-sponsorship` | 培訓資助、進修津貼、市議會稅 | 第 3.46–3.49 段；附件 1–2 |
| `03-course-fee-reimbursement` | 發還課程及考試費用（CSR 第 1010 條） | 第 3.50–3.53 段 |
| `04-faq` | 常見問題目錄（問題 1–48） | 第四章 |
| `annexes` | 附錄 1–3 目錄 | 附錄 |
| `annex-1-non-gts` | 政府培訓獎學金以外的訓練 | 附錄 1 |
| `annex-2-gts` | 政府培訓獎學金 | 附錄 2 |
| `annex-3-csr` | 與培訓有關的 CSR 第 1000–1010 條 | 附錄 3 |

### Entities

| Slug | 名稱 |
| --- | --- |
| `csb` | 公務員事務局／公務員事務局局長 |
| `civil-service-college` | 公務員學院 |
| `hod` | 部門／職系首長 |
| `dst` | 庫務署署長 |
| `receiving-department` | 接收部門（政府培訓獎學金） |
| `parent-department` | 所屬部門（政府培訓獎學金） |

### Concepts

| Slug | 名稱 |
| --- | --- |
| `competency` | 才能／才能架構 |
| `training-framework` | 培訓發展架構 |
| `study-leave` | 進修假期（日間批假／全薪／無薪） |
| `examination-leave` | 考試全薪進修假期（CSR 第 1002 條） |
| `undertaking` | 承諾書與受訓後服務 |
| `surety-and-guarantee` | 保證人、保證書、擔保書 |
| `training-sponsorship` | 培訓資助 |
| `subsistence-allowance` | 進修津貼 |
| `gts` | 政府培訓獎學金 |
| `course-fee-reimbursement` | 發還課程及考試費用 |
| `council-tax` | 英國市議會稅 |
| `training-debt` | 訓練債務與追討 |

### Comparisons

| Slug | 內容 |
| --- | --- |
| `compare-study-leave` | 日間批假／全薪／無薪：賺假、增薪、退休金、旅費 |
| `compare-sponsorship` | 全薪港外／全薪本地／獎學金港外／獎學金本地 |
| `compare-roles` | 學院／決策局／部門管理層／督導／員工 |
| `compare-gts-vs-departmental` | 政府培訓獎學金 vs 部門訓練 |

## Operations

**Ingest.** Read the source (never edit it). Update the source summary, chapter hub, every reserved entity/concept the source materially changes, then `index.md` and `log.md`. One guide ingest can touch 15+ pages.

**Query.** Read `index.md` first, then only the needed pages. Cite wiki pages in the answer. File substantial answers under `queries/`.

**Lint.** Check orphans, broken `[[wikilinks]]`, index completeness, frontmatter, contested pages, pages over 200 lines, tags not in this taxonomy.

## Update policy

1. Later editions of the guide, later CSR revisions, and named circulars generally supersede earlier text on the same point. The 2021 booklet is a snapshot: the 第 3.18 段 $210,000 undertaking threshold and 附件 1 subsistence rates are dated.
2. If two live clauses conflict (guide body vs FAQ vs appendix terms), keep both, date them, set `contested: true`, and list the other slug under `contradictions`.
3. Specimen forms are catalogued, not reproduced as operative law. If Chinese and English form texts differ, the forms themselves say the English version prevails.

## Source map (`training_guide.md`)

Approximate 1-indexed line ranges:

| Block | Lines |
| --- | --- |
| Title / TOC | 1–46 |
| 引言 | 47–61 |
| 第一章 策略 | 63–113 |
| 第二章 角色 | 115–155 |
| 第三章 3.1–3.17 原則、批假、全薪、無薪 | 157–226 |
| 第三章 3.18–3.45 承諾書 | 228–352 |
| 第三章 3.46–3.53 資助與發還 | 354–397 |
| 附件 1 進修津貼表 | 398–419 |
| 附件 2 英國市議會稅 | 421–457 |
| 第四章 FAQ 問題 1–48 | 459–921 |
| 附錄 1 獎學金以外的訓練 | 923–1248 |
| 附錄 2 政府培訓獎學金 | 1250–2032 |
| 附錄 3 CSR 第 1000–1010 條 | 2034–2101 |

Known OCR defects: 第 3.19 段受訓後服務期年數表幾乎整欄丟失；第 3.47 段「根據府/所載比率」應為附件 1；第一章評核四層次的腳註 1 正文缺；附錄表格與承諾書有大量斷字。對訴訟或正式人事決定，核對公務員事務局／公務員學院現行印刷本。
