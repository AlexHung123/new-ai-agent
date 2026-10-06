#!/usr/bin/env python3
"""Ingest source3.md (2026 初步問題書面答覆) without rewriting source1/source2 chunks.

Copies the MinerU drop file to sfc/source3.md if needed, writes new chunks,
merges wiki/catalog.json, regenerates wiki/catalog/year-2026.md, and writes
an ingest pack under wiki/_ingest/source3.md.
"""
from __future__ import annotations

import json
import shutil
import sys
from collections import Counter, defaultdict
from pathlib import Path

# Reuse the existing chunker.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from chunk_qas import (  # noqa: E402
    CHUNKS_DIR,
    CATALOG_DIR,
    PACKS_DIR,
    ROOT,
    parse_one,
    split_qas,
    write_chunk,
)

DROP = ROOT / "wiki" / "new add" / "MinerU_2026_SFC_初步問題的書面答覆.md"
SOURCE3 = ROOT / "source3.md"
CREATED = "2026-10-06"


def write_chunk_dated(rec: dict) -> None:
    """Same as write_chunk but with today's created/updated."""
    original = write_chunk.__globals__
    # Patch dates by wrapping the file after write.
    write_chunk(rec)
    path = CHUNKS_DIR / f"{rec['slug']}.md"
    text = path.read_text(encoding="utf-8")
    text = text.replace("created: 2026-08-24", f"created: {CREATED}")
    text = text.replace("updated: 2026-08-24", f"updated: {CREATED}")
    path.write_text(text, encoding="utf-8")


def year_catalog_lines(year: str, items: list[dict], sources: list[str]) -> str:
    src = ", ".join(sources)
    lines = [
        "---",
        f"title: {year} 年問題目錄",
        f"created: 2026-08-24",
        f"updated: {CREATED}",
        "type: catalog",
        "tags: [catalog]",
        f"sources: [{src}]",
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
        head = rec.get("head_no") or "—"
        topic = rec.get("primary_topic") or "—"
        asker = rec.get("asker") or "—"
        summary = (rec.get("summary") or "").replace("|", "\\|")
        lines.append(f"| [[{rec['slug']}]] | {head} | {topic} | {asker} | {summary} |")
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    if not SOURCE3.exists():
        if not DROP.exists():
            raise SystemExit(f"missing source3 and drop file: {DROP}")
        SOURCE3.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(DROP, SOURCE3)
        print("copied drop ->", SOURCE3)
    else:
        print("using existing", SOURCE3)

    text = SOURCE3.read_text(encoding="utf-8")
    recs: list[dict] = []
    seen_new: dict[str, int] = {}
    for raw in split_qas(text):
        rec = parse_one(raw, "source3.md")
        slug = rec["slug"]
        if slug in seen_new:
            seen_new[slug] += 1
            rec["slug"] = f"{slug}-{seen_new[slug]}"
            rec["qno"] = f"{rec['qno']}-{seen_new[slug]}"
        else:
            seen_new[slug] = 1
        recs.append(rec)

    catalog_path = ROOT / "wiki" / "catalog.json"
    existing = json.loads(catalog_path.read_text(encoding="utf-8"))
    existing_slugs = {r["slug"] for r in existing}
    overlap = [r["slug"] for r in recs if r["slug"] in existing_slugs]
    if overlap:
        raise SystemExit(f"slug overlap with existing catalog: {overlap}")

    CHUNKS_DIR.mkdir(parents=True, exist_ok=True)
    for rec in recs:
        write_chunk_dated(rec)

    slim_new = []
    for rec in recs:
        slim_new.append(
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
    merged = existing + slim_new
    catalog_path.write_text(
        json.dumps(merged, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    # Year 2026 catalog: keep prior S-follow-ups, then new main questions.
    y2026 = [r for r in merged if r["year"] == "2026"]
    sources = sorted({r["source"] for r in y2026})
    CATALOG_DIR.mkdir(parents=True, exist_ok=True)
    (CATALOG_DIR / "year-2026.md").write_text(
        year_catalog_lines("2026", y2026, sources), encoding="utf-8"
    )

    PACKS_DIR.mkdir(parents=True, exist_ok=True)
    blocks = [
        f"# Topic pack: source3 2026 main QAs ({len(recs)} QAs)\n",
        "Scratch pack for ingest. Not a published wiki page.\n",
    ]
    by_topic: dict[str, list[dict]] = defaultdict(list)
    for r in recs:
        by_topic[r["primary_topic"]].append(r)
    for topic, items in sorted(by_topic.items(), key=lambda kv: -len(kv[1])):
        blocks.append(f"\n# {topic} ({len(items)})\n")
        for r in items:
            q = (r.get("question") or "")[:1600]
            a = (r.get("answer") or "")[:2400]
            blocks.append(
                f"## {r['slug']} | head {r.get('head_no')} | {r.get('programme')} | {r.get('asker')}\n"
                f"SUMMARY: {r.get('summary')}\n\n"
                f"QUESTION:\n{q}\n\nANSWER:\n{a}\n\n---\n"
            )
    (PACKS_DIR / "source3.md").write_text("\n".join(blocks), encoding="utf-8")

    print("new chunks", len(recs))
    print("catalog total", len(merged))
    print("year 2026", len(y2026))
    print("missing qno", sum(1 for r in recs if r["qno"] == "UNKNOWN"))
    print("missing asker", [(r["slug"], r.get("summary")) for r in recs if not r.get("asker")])
    print("missing question", [r["slug"] for r in recs if not r.get("question")])
    print("missing answer", [r["slug"] for r in recs if not r.get("answer")])
    print("heads", dict(Counter(r.get("head_no") or "?" for r in recs).most_common()))
    print("topics", dict(Counter(r["primary_topic"] for r in recs).most_common()))
    print("programmes", dict(Counter((r.get("programme") or "?")[:50] for r in recs).most_common()))


if __name__ == "__main__":
    main()
