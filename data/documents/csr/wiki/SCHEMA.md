# Wiki Schema — 《公務員事務規例》

## Domain

Hong Kong Civil Service Regulations (CSR / 《公務員事務規例》): appointment, termination, conduct and discipline, pay and allowances, housing, medical and dental, training, leave, passages and baggage, and later housing-finance schemes. The source is a Chinese PDF conversion with OCR artefacts (spaced characters, broken tables, superscripts). The wiki is the compiled, readable, interlinked form of that source.

There is no Chapter 10 in this compilation. After Chapter 9 the numbering jumps to Chapter 11. Annexes (附件) begin around source line 11964.

## Conventions

- File names: lowercase English kebab-case, no spaces (`acting-appointment.md`).
- Every wiki page starts with YAML frontmatter (below).
- Use `[[wikilinks]]` (Obsidian). Minimum **2 outbound links** per page.
- Link by slug only: `[[probation]]`, `[[scs]]`, `[[01-appointment]]`. Obsidian resolves across folders.
- Display text: `[[probation|試用]]`.
- When updating a page, bump `updated`.
- Every new page must be listed in `index.md` under the correct section.
- Every action is appended to `log.md` as `## [YYYY-MM-DD] action | subject`.
- Cite the source as `CSR 第 N 條`. On multi-source pages, append `^[csr.md]` (or the specific source path) after claims that need provenance.
- Reconstruct Traditional Chinese. Never paste OCR-spaced characters.
- If the source is unreadable at a critical point, write `（原文 OCR 不清，待核）` and keep the nearest article number.

## Frontmatter

```yaml
---
title: 中文標題
created: YYYY-MM-DD
updated: YYYY-MM-DD
type: entity | concept | comparison | chapter | source | query | synthesis
tags: []          # only tags from the taxonomy below
sources: [csr.md]
csr_articles: 100-299   # optional; article range or list
confidence: high | medium | low
contested: false
---
```

## Tag taxonomy

Add a tag here **before** using it on a page.

- Structure: `chapter`, `annex`, `definition`
- People / orgs: `authority`, `commission`, `department`
- Appointment: `appointment`, `terms`, `probation`, `acting`, `promotion`, `appraisal`
- Exit: `termination`, `resignation`, `retirement`, `pension`, `mpf`
- Conduct: `conduct`, `discipline`, `advantages`, `investment`, `outside-work`
- Pay: `pay`, `allowance`, `overtime`, `education-allowance`
- Housing: `housing`, `quarters`, `hfs`, `nacs`, `occupancy`, `double-benefit`
- Welfare: `medical`, `dental`, `training`, `leave`, `passage`
- Meta: `comparison`, `timeline`, `procedure`, `deleted`

## Page thresholds

- **Create** a page when a term is defined in CSR 第 100 條, is a named scheme/authority, or is a chapter-level topic.
- **Don't create** a page for a single annex table row, a deleted article number, or a passing mention.
- **Split** when a page exceeds ~200 lines.
- Chapter hubs stay short; detail goes to concept/entity pages.

## Reserved slugs

Do not invent competing slugs for these. Link to them.

### Chapters

| Slug | Topic | CSR |
| --- | --- | --- |
| `00-introduction` | 引言；政府規例體系 | 1–99 |
| `01-appointment` | 聘任總覽 | 100–299 |
| `01-appointment-acting` | 署任、借調、暫離廉署 | 160–179 |
| `01-appointment-probation` | 試用、試任、已刪考績關限 | 180–229 |
| `01-appointment-appraisal` | 評核報告、證書 | 230–259 |
| `01-appointment-reemployment` | 延長服務、重行受僱、續約 | 260–299 |
| `02-termination` | 終止聘用總覽 | 300–399 |
| `02-termination-retirement` | 退休、喪失工作能力、迫令退休 | 325–389 |
| `02-termination-benefits` | 退休金及公積金權益 | 395–399 |
| `03-conduct-discipline` | 品行與紀律總覽 | 400–599 |
| `03-conduct-advantages` | 利益、禮物、投資、借貸 | 431–483 |
| `03-conduct-outside-work` | 外間工作、輔助部隊、制服 | 550–573 |
| `04-pay-allowances` | 薪金及津貼總覽 | 600–799 |
| `04-pay-overtime` | 逾時及工作相關津貼 | 662–693 |
| `04-pay-education` | 教育津貼 | 755–778 |
| `04-pay-travel-subsistence` | 膳宿、交通、酬酢 | 710–754 |
| `05-housing-benefits` | 房屋福利總覽 | 800–899 |
| `05-housing-quarters` | 宿舍、酒店、自行租屋 | 810–860 |
| `05-housing-private` | 私有房屋津貼、租金 | 861–899 |
| `06-medical-dental` | 醫療及牙科 | 900–999 |
| `07-training` | 培訓 | 1000–1099 |
| `08-leave` | 假期總覽 | 1100–1299 |
| `08-leave-local` | 本地／新／劃一及 D4 | 1150–1199 |
| `08-leave-overseas` | 海外條款休假 | 1200–1269 |
| `08-leave-sick-maternity` | 病假、侍產、分娩 | 1270–1299 |
| `09-passages-baggage` | 旅費總覽 | 1300–1499 |
| `09-passages-overseas` | 海外度假、家屬、學生旅費 | 1320–1339 |
| `09-passages-special` | 特殊旅費、公幹、行李 | 1340–1499 |
| `11-home-financing` | 居所資助計劃 | 1600–1799 |
| `12-accommodation-allowance` | 住所津貼計劃 | 1800–1899 |
| `13-rent-allowance` | 租金津貼計劃 | 1900–1999 |
| `14-nacs` | 非實報實銷現金津貼計劃 | 2000–2099 |
| `annexes` | 附件總覽 | 附件 1–14 |

### Entities

| Slug | 名稱 |
| --- | --- |
| `scs` | 公務員事務局局長 |
| `psc` | 公務員敍用委員會 |
| `ce` | 行政長官 |
| `dst` | 庫務署署長 |
| `icac` | 廉政公署 |
| `cspf` | 公務員公積金計劃 |
| `hfs` | 居所資助計劃 |
| `aas` | 住所津貼計劃 |
| `ras` | 租金津貼計劃 |
| `nacs` | 非實報實銷現金津貼計劃 |
| `dq` | 高級公務員宿舍 |
| `disciplined-services` | 紀律部隊 |

### Concepts

| Slug | 名稱 |
| --- | --- |
| `government-regulations` | 政府規例 |
| `appointment-terms` | 聘用條款 |
| `officer-classes` | 甲類／乙類人員；設定職位 |
| `probation` | 試用及試用關限 |
| `trial` | 試任及試任關限 |
| `acting` | 署任 |
| `appraisal` | 評核報告 |
| `post-retirement-employment` | 退休後重行受僱／延長服務 |
| `pension` | 退休金福利 |
| `discipline` | 紀律處分 |
| `advantages` | 接受利益 |
| `outside-work` | 外間工作 |
| `double-housing` | 雙重房屋福利 |
| `occupancy` | 入住規定 |
| `leave` | 假期制度 |
| `passages` | 旅費 |
| `pay` | 薪金、增薪、逾時工作 |

### Comparisons

| Slug | 內容 |
| --- | --- |
| `compare-appointment-terms` | 本地／海外／劃一／新條款 |
| `compare-housing-schemes` | 宿舍、租屋、HFS、住所／租金津貼、NACS |
| `compare-leave-regimes` | 各聘用條款下的休假安排 |
| `compare-exit-routes` | 辭職、退休、迫令退休、喪失工作能力 |

## Operations

**Ingest.** Read the source (never edit it). Update the source summary, chapter hub, every reserved entity/concept the source materially changes, then `index.md` and `log.md`. One CSR ingest can touch 15+ pages.

**Query.** Read `index.md` first, then only the needed pages. Cite wiki pages in the answer. File substantial answers under `queries/`.

**Lint.** Check orphans, broken `[[wikilinks]]`, index completeness, frontmatter, contested pages, pages over 200 lines, tags not in this taxonomy.

## Update policy

1. Later CSR revisions generally supersede earlier text in the same article.
2. If two live articles conflict, keep both, date them, set `contested: true`, and list the other slug under `contradictions`.
3. Deleted articles (`（刪除）`) are noted once on the chapter page; do not keep zombie pages for them.

## Source map (`csr.md`)

Approximate body line ranges (1-indexed, after the printed 目錄):

| Block | Lines |
| --- | --- |
| 引言 1–99 | 460–575 |
| 第一章 100–299 | 576–2431 |
| 第二章 300–399 | 2432–3239 |
| 第三章 400–599 | 3240–4173 |
| 第四章 600–799 | 4174–5523 |
| 第五章 800–899 | 5524–6740 |
| 第六章 900–999 | 6741–7040 |
| 第七章 1000–1099 | 7041–7132 |
| 第八章 1100–1299 | 7133–9032 |
| 第九章 1300–1499 | 9033–10523 |
| 第十一章 1600–1799 | 10524–11255 |
| 第十二章 1800–1899 | 11256–11481 |
| 第十三章 1900–1999 | 11482–11691 |
| 第十四章 2000–2099 | 11692–11963 |
| 附件 | 11964–20325 |
