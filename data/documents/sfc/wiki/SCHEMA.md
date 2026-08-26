# Wiki Schema — 立法會財委會特別會議答問

## Domain

Hong Kong Legislative Council Finance Committee **Special Meetings** on the Estimates of Expenditure (財務委員會審核開支預算特別會議). Each record is an independent written Q&A: a LegCo member asks, a controlling officer answers.

Two immutable raw files:

| File | Role |
| --- | --- |
| `source1.md` | 1 042 Q&As, 2016–2026. Almost entirely the civil-service cluster: 總目 143 公務員事務局, 46 公務員一般開支, 37 衞生署（綱領 7 公務員醫療及牙科）, 120 退休金, 136 公務員敍用委員會秘書處, 174 薪津諮詢委員會聯合秘書處。 |
| `source2.md` | 16 Q&As, mixed heads: 144 政制及內地事務局（《憲法》／《基本法》推廣）, 142 少數族裔事務督導委員會, 92 律政司, 55 創意智優計劃, 44 環保署販賣機／飲水機, 47 數字政策辦公室 AI。 |

The wiki compiles those Q&As into interlinked pages. **The chunk is the unit of evidence.** Do not flatten 1 058 answers into one narrative without citations.

## Chunking

Split on the pattern:

```
年份: YYYY

(問題編號：NNNN)
```

Variants in the raw files (all handled by `scripts/chunk_qas.py`):

- Fullwidth brackets `（問題編號：S0002）`
- Follow-ups `S0016`, `SV0001`, `S045`
- Spaced OCR `# (問 題 編 號 ： S010)`

Each chunk lives at `wiki/chunks/{year}-{question_no}.md` with YAML frontmatter. Example: 年份 2016、問題編號 1140 → `[[2016-1140]]`.

Year directories of chunks: `wiki/catalog/year-2016.md` … `year-2026.md`. Machine catalog: `wiki/catalog.json`.

## Conventions

- File names: lowercase English kebab-case, no spaces (`ncsc.md`). Chunks use `{year}-{qno}`.
- Every compiled wiki page starts with YAML frontmatter (below).
- Use `[[wikilinks]]` (Obsidian). Minimum **2 outbound links** per compiled page.
- Link by slug only: `[[csb]]`, `[[establishment]]`, `[[2016-1140]]`. Obsidian resolves across folders.
- Display text: `[[ncsc|非公務員合約僱員]]`.
- When updating a page, bump `updated`.
- Every new compiled page must be listed in `index.md` under the correct section.
- Every action is appended to `log.md` as `## [YYYY-MM-DD] action | subject`.
- Cite claims with chunk slugs: `[[2016-1140]]`. On multi-source pages you may also append `^[source1.md]`.
- Reconstruct Traditional Chinese. Never paste OCR-spaced characters into compiled pages.
- If a table in a chunk is HTML, summarise in markdown; do not dump the whole table unless it is small and load-bearing.
- Dollar figures are Hong Kong dollars. Establishment / vacancy / expenditure numbers are **as of that Estimates year** unless a later chunk supersedes them — always keep the year.

## Frontmatter

```yaml
---
title: 中文標題
created: YYYY-MM-DD
updated: YYYY-MM-DD
type: entity | concept | comparison | chapter | source | query | synthesis | catalog
tags: []          # only tags from the taxonomy below
sources: [source1.md]   # and/or source2.md
years: 2016-2026        # optional coverage
heads: [143]            # optional 總目 numbers
confidence: high | medium | low
contested: false
---
```

Chunk pages additionally have: `year`, `question_no`, `head`, `programme`, `asker`.

## Tag taxonomy

Add a tag here **before** using it on a page.

- Structure: `chapter`, `catalog`, `qa`
- Orgs: `authority`, `bureau`, `department`, `commission`, `college`
- Workforce: `establishment`, `recruitment`, `vacancy`, `ncsc`, `post-retirement`, `internship`, `disability`
- Training: `training`, `basic-law`, `national-studies`, `college`, `ai-digital`
- Conditions: `pay`, `housing`, `medical`, `pension`, `language`, `overtime`, `five-day-week`, `award`
- Conduct: `discipline`, `national-security`, `psc`
- Other: `ethnic-minorities`, `records`, `outsourcing`, `recreation`, `directorate`, `environment`, `design-creative`
- Meta: `comparison`, `timeline`

## Page thresholds

- **Create** a compiled page when a theme recurs across years (編制、NCSC、基本法培訓), or a named office/scheme (公務員學院、敍用委員會、少數族裔事務督導委員會), or a 總目 hub.
- **Don't create** a compiled page for a single member’s one-off question, a vending-machine count, or a passing mention.
- **Split** when a page exceeds ~200 lines.
- Chapter hubs stay short; time series and mechanisms go to concept pages.
- Chunks are source pages, not concept pages. Do not duplicate a chunk’s full text on a concept page — summarise and link.

## Reserved slugs

Do not invent competing slugs for these. Link to them.

### Hubs

| Slug | Topic |
| --- | --- |
| `overview` | 總覽 |
| `synthesis` | 十年綜合 |
| `index` | 目錄 |
| `catalog` | 問題總目錄（按年） |
| `chunks` | Chunk 規則 |

### Source summaries

| Slug | File |
| --- | --- |
| `source1` | `source1.md` 公務員集群 |
| `source2` | `source2.md` 雜項總目 |

### Chapters (總目)

| Slug | 總目 |
| --- | --- |
| `143-csb` | (143) 公務員事務局 |
| `46-general-expenses` | (46) 公務員一般開支 |
| `37-medical-dental` | (37) 衞生署 · 公務員醫療及牙科 |
| `120-pensions` | (120) 退休金 |
| `136-psc-secretariat` | (136) 公務員敍用委員會秘書處 |
| `174-pay-advisory` | (174) 薪津諮詢委員會聯合秘書處 |
| `other-heads` | source2 及其他總目（144、142、92、55、47、44） |

### Year catalogs

`year-2016` … `year-2026`

### Entities

| Slug | 名稱 |
| --- | --- |
| `csb` | 公務員事務局 |
| `scs` | 公務員事務局局長 |
| `civil-service-college` | 公務員學院 |
| `psc` | 公務員敍用委員會 |
| `dh` | 衞生署 |
| `treasury` | 庫務署 |
| `cmab` | 政制及內地事務局 |
| `em-steering` | 少數族裔事務督導委員會 |
| `basic-law-steering` | 基本法推廣督導委員會 |

### Concepts

| Slug | 名稱 |
| --- | --- |
| `establishment` | 公務員編制、空缺、招聘與流失 |
| `ncsc` | 非公務員合約僱員 |
| `civil-service-training` | 公務員培訓（總覽） |
| `basic-law-promotion` | 《憲法》／《基本法》推廣與培訓 |
| `national-studies` | 國家事務研習與內地交流 |
| `civil-service-medical` | 公務員醫療及牙科 |
| `pension-benefits` | 退休金及退休福利 |
| `housing-benefits` | 房屋津貼（含 NACS） |
| `discipline` | 品行、紀律、表現管理、第 12 條 |
| `ethnic-minorities` | 少數族裔招聘與支援 |
| `ai-in-government` | 公務員 AI／創科能力 |
| `language-policy` | 兩文三語與入職語文要求 |
| `post-retirement-contract` | 退休後服務合約 |
| `pay-adjustment` | 薪酬調整與諮詢架構 |
| `internship` | 政府實習計劃 |

### Comparisons

| Slug | 內容 |
| --- | --- |
| `compare-years` | 2016–2026 提問密度與政策轉向 |
| `compare-heads` | 各總目覆蓋與管制人員 |
| `compare-employment-types` | 公務員／NCSC／退休後合約／外判 |

## Operations

**Ingest.** Never edit raw sources. Re-run `scripts/chunk_qas.py` only when a source is replaced. Then: update the matching source summary, every reserved entity/concept the new Q&As materially change, year catalog, `index.md`, `log.md`. A batch of Q&As can touch 10–20 compiled pages.

**Query.** Read `index.md` first, then year catalog or concept page, then only the needed chunks. Cite chunk slugs in the answer. File substantial answers under `queries/`.

**Lint.** Check orphans (compiled pages with no inbound link), broken `[[wikilinks]]`, index completeness, frontmatter, contested pages, compiled pages over 200 lines, tags not in this taxonomy. Chunks are allowed to be orphans from the compiled graph if they appear in a year catalog.

## Update policy

1. A later Estimates year **does not automatically repeal** an earlier figure. Keep both, dated.
2. If two answers in the same year conflict, keep both, set `contested: true`, and list the other slug under `contradictions`.
3. Follow-up questions (`S…`, `SV…`) amend or unpack a main reply; link them from the concept page, do not treat them as a different policy.

## Source map

| Block | Approx. Q&As | Path |
| --- | --- | --- |
| source1 2016–2026 | 1 042 | `source1.md` |
| source2 mixed | 16 | `source2.md` |
| Chunks | 1 058 | `wiki/chunks/` |
| Year catalogs | 11 | `wiki/catalog/year-*.md` |
| Machine catalog | 1 058 records | `wiki/catalog.json` |
