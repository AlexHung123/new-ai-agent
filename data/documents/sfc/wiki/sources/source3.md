---
title: 來源摘要 — source3.md
created: 2026-10-06
updated: 2026-10-06
type: source
tags: [catalog]
sources: [source3.md]
confidence: high
---

# 來源摘要 — source3.md

2026 年財委會特別會議**初步問題**的書面答覆。MinerU 轉寫，85 條獨立問答，全部年份 2026。原文不可改。與 [[source1]] 的 9 條 2026 跟進（`S…`）不重複：跟進引用主體答覆（例如 CSB028），主體本身在本檔。切成的 chunk 在 `wiki/chunks/`，該年目錄見 [[year-2026]]。

## 覆蓋的總目

| 總目 | 條數 | 章 |
| --- | --- | --- |
| (143) 政府總部：公務員事務局 | 74 | [[143-csb]] |
| (37) 衞生署 · 綱領 (7) 公務員醫療及牙科服務 | 6 | [[37-medical-dental]] |
| (46) 公務員一般開支 | 4 | [[46-general-expenses]] |
| (136) 公務員敍用委員會秘書處 | 1 | [[136-psc-secretariat]] |

沒有總目 120、174，也沒有 source2 那些雜項總目。管制人員：143／46 為公務員事務局常任秘書長林雪麗；37 為衞生署署長；136 為敍用委員會秘書。局長欄仍是[[scs|公務員事務局局長]]。

## 提問重心（主分類）

編制／招聘 [[establishment]]（19）· AI／創科 [[ai-in-government]]（15）· 醫療牙科 [[civil-service-medical]]（9）· 實習 [[internship]]（6）· 房屋 [[housing-benefits]]（6）· NCSC [[ncsc]]（5）· 紀律 [[discipline]]（5）· 學院 [[civil-service-college]]（4）。其餘見 [[year-2026]]。

這批才是 2026-27 預算週期的主問題。先前 wiki 把 2026 年讀成「只有 9 條跟進」，那是收錄缺口，不是那年沒有主問題。

## 形式

- 與 source1 同一套欄位：年份、問題編號、總目、分目、綱領、管制人員、局長、問題、提問人、答覆
- 答覆內大量 HTML `<table>`（編制按部門、NCSC 限額、房屋津貼、就診人次）
- 兩條缺「提問人」行：[[2026-0167]]、[[2026-0685]]（仍有問題與答覆）
- 跟進編號不在本檔

解析由 `scripts/ingest_source3.py` 增量切檔（不重寫 source1／source2 chunk）。主分類標在 chunk 的 `tags`／`primary_topic`，人工編譯時以原文為準。
