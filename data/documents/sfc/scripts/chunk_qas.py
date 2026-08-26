#!/usr/bin/env python3
"""Split SFC source Q&As into one markdown chunk per question and emit catalogs.

Raw sources (source1.md, source2.md) are never modified.
"""
from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCES = [("source1.md", ROOT / "source1.md"), ("source2.md", ROOT / "source2.md")]
CHUNKS_DIR = ROOT / "wiki" / "chunks"
CATALOG_DIR = ROOT / "wiki" / "catalog"
PACKS_DIR = ROOT / "wiki" / "_ingest"

YEAR_RE = re.compile(r"^年份:\s*(\d{4})\s*$", re.M)
HEAD_RE = re.compile(r"^總\s*目\s*[:：]\s*(.+)$", re.M)
SUBHEAD_RE = re.compile(r"^分\s*目\s*[:：]\s*(.+)$", re.M)
PROG_RE = re.compile(r"^綱\s*領\s*[:：]\s*(.+)$", re.M)
CTRL_RE = re.compile(r"^管制人員\s*[:：]\s*(.+)$", re.M)
SEC_RE = re.compile(r"^局\s*長\s*[:：]\s*(.+)$", re.M)

# Fullwidth / spaced 問題編號 variants, including S / SV follow-ups.
QNO_RE = re.compile(
    r"問\s*題\s*編\s*號\s*[:：]\s*([A-Za-z]*\s*\d+)",
)
ASKER_RE = re.compile(r"^(?:提問人|問人)\s*[:：]\s*(.+)$", re.M)
QUESTION_RE = re.compile(
    r"^#?\s*問\s*題\s*[:：]?\s*\n(.*?)(?=^(?:提問人|問人)\s*[:：]|^答\s*覆\s*[:：])",
    re.S | re.M,
)
ANSWER_RE = re.compile(r"^答\s*覆\s*[:：]\s*\n(.*)", re.S | re.M)

HEAD_NAMES = {
    "143": "政府總部：公務員事務局",
    "46": "公務員一般開支",
    "120": "退休金",
    "37": "衞生署",
    "136": "公務員敍用委員會秘書處",
    "174": "公務及司法人員薪俸及服務條件諮詢委員會聯合秘書處",
    "144": "政府總部：政制及內地事務局",
    "44": "環境保護署",
    "92": "律政司",
    "55": "政府總部：商務及經濟發展局",
    "47": "政府總部：數字政策辦公室",
    "142": "政府總部：政務司司長辦公室及財政司司長辦公室",
}

# (tag, keywords) — first hit is primary topic
TOPIC_RULES: list[tuple[str, list[str]]] = [
    ("basic-law", ["基本法", "一國兩制", "一國兩制"]),
    ("national-security", ["國家安全", "國安法", "香港國安法", "效忠", "宣誓", "誓言"]),
    ("national-studies", ["國家事務", "內地交流", "交流計劃", "公務員交流", "国情", "國情"]),
    ("ai-digital", ["人工智能", "AI", "創新科技", "數字政策", "電子假期", "電子政府", "智慧政府"]),
    ("ethnic-minorities", ["少數族裔", "非華語", "種族平等", "融匯"]),
    ("ncsc", ["非公務員合約", "NCSC", "合約僱員", "約滿酬金"]),
    ("post-retirement", ["退休後服務", "退休後合約", "PRSC"]),
    ("discipline", ["紀律", "停職", "第12條", "《命令》第12", "品行", "不當行為", "革職", "訓斥"]),
    ("medical", ["牙科", "診所", "醫療", "門診", "病假", "醫生證明"]),
    ("pension", ["退休金", "長俸", "公積金", "CSPF", "退休福利"]),
    ("housing", ["房屋津貼", "宿舍", "非實報實銷現金津貼", "NACS", "居所資助", "自行租屋"]),
    ("overtime", ["逾時工作", "超時工作", "逾時津貼"]),
    ("five-day-week", ["五天工作"]),
    ("language", ["兩文三語", "普通話", "翻譯", "傳譯", "法定語文", "中文語文"]),
    ("records", ["檔案管理", "檔案處", "檔案"]),
    ("internship", ["實習計劃", "實習名額", "學生實習"]),
    ("award", ["嘉許", "獎勵計劃", "長期優良服務", "公費旅行"]),
    ("outsourcing", ["外判"]),
    ("recreation", ["度假別墅", "康樂設施"]),
    ("directorate-visit", ["外訪", "公務訪問", "出訪"]),
    ("pay", ["薪酬調整", "薪金", "增薪", "頂薪", "薪常會", "薪酬趨勢"]),
    ("psc", ["敍用委員會", "敘用委員會", "殺用委員會"]),
    ("college", ["公務員學院", "持續進修", "培訓資助"]),
    ("establishment", ["編制", "空缺", "人手", "招聘", "職位", "流失", "辭職", "離職"]),
    ("training", ["培訓", "講座", "課程", "研習"]),
    ("directorate", ["局長辦公室", "政治助理", "副局長", "政治委任"]),
    ("design-creative", ["設計思維", "創意智優", "創意產業"]),
    ("environment", ["販賣機", "飲水機", "廢物"]),
]


def nf(s: str) -> str:
    return (
        s.replace("（", "(")
        .replace("）", ")")
        .replace("：", ":")
        .replace("－", "-")
        .replace("—", "-")
        .replace("\u3000", " ")
    )


def collapse(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def split_qas(text: str) -> list[str]:
    parts = re.split(r"(?=^年份:\s*\d{4}\s*$)", text, flags=re.M)
    return [p.strip() for p in parts if p.strip()]


def extract_head_no(head: str | None) -> str | None:
    if not head:
        return None
    m = re.search(r"\((\d+)\)", nf(head))
    return m.group(1) if m else None


def extract_qno(raw: str) -> str | None:
    m = QNO_RE.search(nf(raw[:800]))
    if not m:
        m = QNO_RE.search(nf(raw))
    if not m:
        return None
    return re.sub(r"\s+", "", m.group(1)).upper()


def extract_asker(raw: str) -> str | None:
    m = ASKER_RE.search(raw)
    if not m:
        return None
    name = m.group(1).strip()
    name = re.split(r"[（(]", name, maxsplit=1)[0].strip()
    return name or None


def extract_block(raw: str, regex: re.Pattern[str]) -> str | None:
    m = regex.search(raw)
    if not m:
        return None
    return m.group(1).strip() or None


def first_line(text: str | None, limit: int = 90) -> str:
    if not text:
        return ""
    # drop markdown headings / tables
    for line in text.splitlines():
        t = line.strip()
        if not t or t.startswith("<") or t.startswith("#") or t.startswith("|"):
            continue
        t = collapse(t)
        t = re.sub(r"^[\d一二三四五六七八九十]+[\.、．\)]\s*", "", t)
        if len(t) > limit:
            t = t[: limit - 1] + "…"
        return t
    return collapse(text)[:limit]


def classify(rec: dict) -> list[str]:
    blob = " ".join(
        filter(
            None,
            [rec.get("programme"), rec.get("question"), rec.get("head")],
        )
    )
    tags: list[str] = []
    for tag, kws in TOPIC_RULES:
        if any(k in blob for k in kws):
            tags.append(tag)
    head = rec.get("head_no")
    prog = rec.get("programme") or ""
    if not tags:
        if head == "37" or "醫療" in prog:
            tags.append("medical")
        elif head == "120" or "退休金" in prog:
            tags.append("pension")
        elif head == "46":
            tags.append("housing")
        elif "培訓" in prog:
            tags.append("training")
        elif "人力資源" in prog:
            tags.append("establishment")
        elif "語文" in prog or "翻譯" in prog or "編譯" in prog:
            tags.append("language")
        elif "局長辦公室" in prog:
            tags.append("directorate")
        else:
            tags.append("other")
    # de-dupe preserving order
    seen = set()
    out = []
    for t in tags:
        if t not in seen:
            seen.add(t)
            out.append(t)
    return out[:6]


def slug_for(year: str, qno: str) -> str:
    return f"{year}-{qno}"


def yaml_escape(s: str) -> str:
    if s is None:
        return ""
    if any(c in s for c in ":#{}[]&*?|-<>=!%@`'\""):
        return json.dumps(s, ensure_ascii=False)
    return s


def write_chunk(rec: dict) -> None:
    slug = rec["slug"]
    tags = rec["topics"]
    tag_yaml = "[" + ", ".join(tags) + "]"
    sources = "[" + rec["source"] + "]"
    fm = [
        "---",
        f"title: {rec['year']} · 問題 {rec['qno']}",
        "created: 2026-08-24",
        "updated: 2026-08-24",
        "type: source",
        f"tags: {tag_yaml}",
        f"sources: {sources}",
        f"year: {rec['year']}",
        f"question_no: {yaml_escape(rec['qno'])}",
        f"head: {yaml_escape(rec['head_no'] or '')}",
        f"programme: {yaml_escape(rec.get('programme') or '')}",
        f"asker: {yaml_escape(rec.get('asker') or '')}",
        "confidence: high",
        "contested: false",
        "---",
        "",
        f"# {rec['year']} · 問題 {rec['qno']}",
        "",
        f"> 來源：`{rec['source']}`　總目：{rec.get('head') or '—'}　綱領：{rec.get('programme') or '—'}　提問人：{rec.get('asker') or '—'}",
        "",
        rec["raw"].rstrip(),
        "",
    ]
    (CHUNKS_DIR / f"{slug}.md").write_text("\n".join(fm), encoding="utf-8")


def parse_one(raw: str, source: str) -> dict:
    year_m = YEAR_RE.search(raw)
    year = year_m.group(1) if year_m else "unknown"
    qno = extract_qno(raw) or "UNKNOWN"
    rec = {
        "source": source,
        "year": year,
        "qno": qno,
        "slug": slug_for(year, qno),
        "head": extract_block(raw, HEAD_RE),
        "subhead": extract_block(raw, SUBHEAD_RE),
        "programme": extract_block(raw, PROG_RE),
        "controlling_officer": extract_block(raw, CTRL_RE),
        "secretary": extract_block(raw, SEC_RE),
        "asker": extract_asker(raw),
        "question": extract_block(raw, QUESTION_RE),
        "answer": extract_block(raw, ANSWER_RE),
        "raw": raw,
        "chars": len(raw),
    }
    rec["head_no"] = extract_head_no(rec["head"])
    rec["summary"] = first_line(rec["question"])
    rec["topics"] = classify(rec)
    rec["primary_topic"] = rec["topics"][0]
    return rec


def main() -> None:
    CHUNKS_DIR.mkdir(parents=True, exist_ok=True)
    CATALOG_DIR.mkdir(parents=True, exist_ok=True)
    PACKS_DIR.mkdir(parents=True, exist_ok=True)

    recs: list[dict] = []
    seen: dict[str, int] = {}
    for source, path in SOURCES:
        text = path.read_text(encoding="utf-8")
        for raw in split_qas(text):
            rec = parse_one(raw, source)
            slug = rec["slug"]
            if slug in seen:
                seen[slug] += 1
                rec["slug"] = f"{slug}-{seen[slug]}"
                rec["qno"] = f"{rec['qno']}-{seen[slug]}"
            else:
                seen[slug] = 1
            recs.append(rec)

    for rec in recs:
        write_chunk(rec)

    # JSON catalog (no raw body)
    slim = []
    for rec in recs:
        slim.append(
            {
                k: rec[k]
                for k in (
                    "source",
                    "year",
                    "qno",
                    "slug",
                    "head",
                    "head_no",
                    "subhead",
                    "programme",
                    "controlling_officer",
                    "secretary",
                    "asker",
                    "summary",
                    "topics",
                    "primary_topic",
                    "chars",
                )
            }
        )
    (ROOT / "wiki" / "catalog.json").write_text(
        json.dumps(slim, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    # Year catalogs
    by_year: dict[str, list[dict]] = defaultdict(list)
    for rec in recs:
        by_year[rec["year"]].append(rec)

    for year, items in sorted(by_year.items()):
        lines = [
            "---",
            f"title: {year} 年問題目錄",
            "created: 2026-08-24",
            "updated: 2026-08-24",
            "type: source",
            "tags: [catalog]",
            "sources: [source1.md, source2.md]",
            "confidence: high",
            "contested: false",
            "---",
            "",
            f"# {year} 年問題目錄",
            "",
            f"共 {len(items)} 條獨立問答。每條是一個 chunk，見 [[chunks]]。",
            "",
            "| 問題編號 | 總目 | 主題 | 提問人 | 摘要 |",
            "| --- | --- | --- | --- | --- |",
        ]
        for rec in items:
            head = rec["head_no"] or "—"
            topic = rec["primary_topic"]
            asker = rec.get("asker") or "—"
            summary = (rec.get("summary") or "").replace("|", "\\|")
            lines.append(
                f"| [[{rec['slug']}]] | {head} | {topic} | {asker} | {summary} |"
            )
        lines.append("")
        (CATALOG_DIR / f"{year}.md").write_text("\n".join(lines), encoding="utf-8")

    # Topic packs for ingest (excerpts, not wiki pages)
    by_topic: dict[str, list[dict]] = defaultdict(list)
    for rec in recs:
        by_topic[rec["primary_topic"]].append(rec)

    for topic, items in by_topic.items():
        # pick spread: first 4, some from middle years, last 4, plus extra if small
        items_sorted = sorted(items, key=lambda r: (r["year"], r["qno"]))
        pick = items_sorted[:]
        if len(pick) > 18:
            pick = (
                items_sorted[:5]
                + items_sorted[len(items_sorted) // 3 : len(items_sorted) // 3 + 4]
                + items_sorted[2 * len(items_sorted) // 3 : 2 * len(items_sorted) // 3 + 4]
                + items_sorted[-5:]
            )
            # unique
            seen_s = set()
            uniq = []
            for r in pick:
                if r["slug"] not in seen_s:
                    seen_s.add(r["slug"])
                    uniq.append(r)
            pick = uniq
        blocks = [f"# Topic pack: {topic} ({len(items)} QAs)\n"]
        for r in pick:
            q = (r.get("question") or "")[:1800]
            a = (r.get("answer") or "")[:2200]
            blocks.append(
                f"## {r['slug']} | {r['year']} Q{r['qno']} | head {r.get('head_no')} | {r.get('asker')}\n"
                f"SUMMARY: {r.get('summary')}\n"
                f"PROGRAMME: {r.get('programme')}\n\n"
                f"QUESTION:\n{q}\n\nANSWER:\n{a}\n\n---\n"
            )
        (PACKS_DIR / f"{topic}.md").write_text("\n".join(blocks), encoding="utf-8")

    # stats
    print("chunks", len(recs))
    print("missing qno", sum(1 for r in recs if r["qno"] == "UNKNOWN"))
    print("missing asker", sum(1 for r in recs if not r.get("asker")))
    print("missing question", sum(1 for r in recs if not r.get("question")))
    print("missing answer", sum(1 for r in recs if not r.get("answer")))
    print("years", dict(sorted(Counter(r["year"] for r in recs).items())))
    print("heads", dict(Counter(r.get("head_no") or "?" for r in recs).most_common()))
    print("topics", dict(Counter(r["primary_topic"] for r in recs).most_common()))
    print("dup slugs handled", sum(1 for n in seen.values() if n > 1))


if __name__ == "__main__":
    main()
