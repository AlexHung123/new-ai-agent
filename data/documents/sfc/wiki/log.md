# Wiki Log

> Chronological record of all wiki actions. Append-only.
> Format: `## [YYYY-MM-DD] action | subject`

## [2026-08-24] create | Wiki initialized

- Domain: 立法會財務委員會審核開支預算特別會議書面答覆（2016–2026）
- Raw sources locked: `sfc/source1.md` (1 042 Q&As), `sfc/source2.md` (16 Q&As)
- Schema: `sfc/AGENTS.md`, `sfc/wiki/SCHEMA.md`

## [2026-08-24] create | Entity pages (9)

- Wrote `wiki/entities/` for reserved slugs: [[csb]], [[scs]], [[civil-service-college]], [[psc]], [[dh]], [[treasury]], [[cmab]], [[em-steering]], [[basic-law-steering]]
- Evidence from `catalog.json`, `wiki/_ingest/`, chunks, `wiki/sources/source2.md`
- Index already listed these slugs; sources and chunks not edited

## [2026-08-24] ingest | Chunk all Q&As from source1 + source2

- Split on `年份: YYYY` + `問題編號` (including S/SV follow-ups and spaced OCR)
- Wrote 1 058 files under `wiki/chunks/{year}-{qno}.md`
- Catalogs: `wiki/catalog.json`, `wiki/catalog/year-2016.md` … `year-2026.md`
- Chunker: `sfc/scripts/chunk_qas.py`
- 0 missing 問題編號; 13 chunks missing 提問人 line; 2 missing 答覆 block

## [2026-08-24] compile | Chapter hubs for heads 143, 46, 37, 120, 136, 174, other

- Wrote `wiki/chapters/143-csb.md` (818 Q&As; four programmes)
- Wrote `wiki/chapters/46-general-expenses.md` (housing/education/passage/award; NACS vs establishment)
- Wrote `wiki/chapters/37-medical-dental.md` (DH executes, CSB pays; attendance vs patients)
- Wrote `wiki/chapters/120-pensions.md` (Treasury pays; monthly bands; MPF/CSPF split)
- Wrote `wiki/chapters/136-psc-secretariat.md` (appointments/promotions/discipline advice; [[2026-S008]])
- Wrote `wiki/chapters/174-pay-advisory.md` (five pay bodies + post-service employment)
- Wrote `wiki/chapters/other-heads.md` (16 source2 Q&As: 144, 142, 92, 55, 47, 44)

## [2026-08-24] compile | Concept pages (7 reserved) + comparison pages (3)

- Wrote `wiki/concepts/discipline.md` — 品行、紀律、表現管理、第 12 條；定罪革職表 [[2017-3171]]、離職就業 68 宗 [[2016-0776]]、43／42 [[2020-S045]]、簡化第 12 條 24 宗 [[2026-S007]]
- Wrote `wiki/concepts/ethnic-minorities.md` — 不收集種族 [[2016-5600]]；2010 年起逾 20 職系放寬中文 [[2016-4021]]；督導委員會約 5 億、16 項 [[2019-2517]]
- Wrote `wiki/concepts/ai-in-government.md` — 培訓處約 60 項／2 000 人加部門 43 000 [[2019-1779]]；學院約 70 場／470 萬／6 000 人次 [[2026-S010]]；港文通 [[2025-1750]]
- Wrote `wiki/concepts/language-policy.md` — 綱領 3；普通話比賽 5,000 元、734 人 [[2016-2769]]；審稿中文約 95%；入職中文見少數族裔
- Wrote `wiki/concepts/post-retirement-contract.md` — PRSC 臨時／專門知識；2016 年延遲收集數據 [[2016-S0005]]
- Wrote `wiki/concepts/pay-adjustment.md` — 薪趨會；2015 入職薪酬調查 [[2016-2818]]；職方退出薪趨會
- Wrote `wiki/concepts/internship.md` — 主要專上學生；殘疾計劃含 VTC 展亮 [[2026-S003]]
- Wrote `wiki/comparisons/compare-years.md` — 2016–2026 條數表；2022 年 49 條；2019–20 紀律、2021 零增長、2025 減編制＋AI
- Wrote `wiki/comparisons/compare-heads.md` — 143=818、46=76、37=71、120=44、136=21、174=12、其他 16；管制人員
- Wrote `wiki/comparisons/compare-employment-types.md` — 公務員／NCSC／PRSC／外判：目的、福利、轉換、披露限度
- Index already listed these slugs; sources and chunks not edited

## [2026-08-24] compile | Core concept pages (8 reserved)

- Wrote/updated `wiki/concepts/establishment.md`, `ncsc.md`, `civil-service-training.md`, `basic-law-promotion.md`, `national-studies.md`, `civil-service-medical.md`, `pension-benefits.md`, `housing-benefits.md`
- Decade series dated to chunks; 2016 figures not treated as current

## [2026-08-24] lint | Wikilinks and year catalogs

- Year catalogs originally escaped `[[slug|label]]` for markdown tables; converted to `[[slug]]` so Obsidian resolves
- Fixed `synthesis.md` citation 2016-3171 → [[2017-3171]]
- Compiled pages: overview, synthesis, 7 chapters, 9 entities, 15 concepts, 3 comparisons, 11 year catalogs, 1 058 chunks

## [2026-10-06] ingest | source3 2026 初步問題 85 條

- 原料鎖定 `sfc/source3.md`（由 `wiki/new add/MinerU_2026_SFC_初步問題的書面答覆.md` 複製）；增量切檔 `sfc/scripts/ingest_source3.py`（不重寫 source1／source2 chunk，因工作樹沒有那兩份 raw）
- 新增 85 個 chunk `wiki/chunks/2026-*.md`；與 source1 的 9 條 2026 跟進（`S…`）無 slug 重疊
- 目錄合併為 1 143 條；[[year-2026]] 94 條（9 跟進 + 85 主體）；總目 143=892、37=77、46=80、136=22
- 來源摘要 [[source3]]；SCHEMA／index／catalog／chunks／overview／synthesis 改為三份 immutable raw
- `chunk_qas.py` 加入 source3；缺 raw 時中止全量重寫

## [2026-10-06] compile | 把 2026 主體寫進章／概念／實體

- 章：[[143-csb]]、[[37-medical-dental]]、[[46-general-expenses]]、[[136-psc-secretariat]]、[[120-pensions]]（120 本身無 2026 chunk，人數改引 [[2026-2276]]）
- 概念：[[establishment]]、[[ncsc]]、[[ai-in-government]]、[[internship]]、[[housing-benefits]]、[[civil-service-medical]]、[[discipline]]、[[civil-service-training]]、[[post-retirement-contract]]、[[pension-benefits]]、[[pay-adjustment]]、[[language-policy]]、[[basic-law-promotion]]、[[ethnic-minorities]]、[[national-studies]]
- 實體：[[csb]]、[[civil-service-college]]、[[psc]]、[[dh]]、[[treasury]]
- 比較：[[compare-years]]、[[compare-heads]]、[[compare-employment-types]]
- 義工嘉許只記在 [[143-csb]]／[[csb]]（2026 年 2–3 條，未跨年，不開概念頁）
- 後期數字不覆蓋前期：空缺 18 193（[[2026-S013]]）vs 19 866（[[2026-2249]]）；PRSC 4 919（2024-06-30）vs 3 751（2025-06-30）；NACS 實際 16 417 vs 預算 17 100
