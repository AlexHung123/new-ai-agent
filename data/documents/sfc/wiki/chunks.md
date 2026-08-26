---
title: Chunk 規則
created: 2026-08-24
updated: 2026-08-24
type: source
tags: [catalog, qa]
sources: [source1.md, source2.md]
confidence: high
contested: false
---

# Chunk 規則

原料 `source1.md`、`source2.md` 是兩份連寫的答問彙編。每一條獨立問答都切成一個 markdown 檔，放在 `wiki/chunks/`。編譯頁（章、概念、實體）只摘要、交叉引用，不重貼全文。

## 切法

源文以這個 pattern 起頭：

```
年份: 2016

(問題編號：1140)
```

同一年、同一個問題編號 = 一個 chunk。slug 是 `{年份}-{問題編號}`，例如 [[2016-1140]]、[[2016-S0002]]、[[2018-SV001]]。

跟進問題（`S…`、`SV…`）也是獨立 chunk，因為它們有自己的提問與答覆；概念頁要把它們連回主體答覆。

## 檔案裡有什麼

每條 chunk 的 YAML 含：`year`、`question_no`、`head`（總目號）、`programme`、`asker`、主題 tags。正文保留該條原文（含 HTML 表）。

機器可讀總表：`wiki/catalog.json`。按年人讀目錄：[[catalog]]。

## 怎麼引用

- 問「2016 年基本法講座辦了多少場」→ 打開 [[2016-1140]]，不要憑記憶填數字。
- 問「編制十年怎麼變」→ 先讀 [[establishment]] 和 [[compare-years]]，再按該頁所列 chunk 核對當年數字。
- 切勿把 2016 年的津貼額寫成現行數字。

重新切檔用 `sfc/scripts/chunk_qas.py`。不要手改 chunk 去「潤色」原文。
