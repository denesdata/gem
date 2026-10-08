#!/usr/bin/env python3
"""Export SQLite tables back to panel JSON files the frontend already consumes."""
from __future__ import annotations

import argparse
import json
import sqlite3
import sys
from collections import defaultdict
from pathlib import Path


def dump(path: Path, payload) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))


def export_indicators(conn: sqlite3.Connection, panels: Path, dataset: str) -> dict:
    counts = {}
    cur = conn.execute(
        """SELECT year, country, type, value, langtype, lang, langcountry, iso3, id
           FROM indicators WHERE dataset = ? ORDER BY year, country, type""",
        (dataset,),
    )
    by_lang: dict[str, list] = defaultdict(list)
    for year, country, typ, value, langtype, lang, langcountry, iso3, id_ in cur:
        lang = lang or "EN"
        by_lang[lang].append(
            {
                "year": year,
                "country": country,
                "type": typ,
                "value": value,
                "langtype": langtype,
                "lang": lang,
                "langcountry": langcountry,
                "iso3": iso3,
                "id": id_,
            }
        )
    for lang, rows in by_lang.items():
        dump(panels / f"{dataset}_{lang}.json", rows)
        counts[f"{dataset}_{lang}"] = len(rows)

    # Unstacked wide form (one row per year/country, metrics as columns)
    for lang, rows in by_lang.items():
        wide: dict[tuple, dict] = {}
        meta = {}
        for r in rows:
            key = (r["year"], r["country"], r["lang"])
            if key not in wide:
                wide[key] = {
                    "year": r["year"],
                    "country": r["country"],
                    "lang": r["lang"],
                    "langcountry": r["langcountry"],
                    "iso3": r["iso3"],
                    "id": r["id"],
                }
            wide[key][r["type"]] = r["value"]
            if r["type"] and r["langtype"]:
                meta[r["type"]] = r["langtype"]
        dump(
            panels / f"{dataset}_unstacked_{lang}.json",
            {"data": list(wide.values()), "meta": meta},
        )
        counts[f"{dataset}_unstacked_{lang}"] = len(wide)
    return counts


def export_simple(conn: sqlite3.Connection, panels: Path, table: str, columns: list[str]) -> int:
    cur = conn.execute(f"SELECT {', '.join(columns)} FROM {table}")
    rows = [dict(zip(columns, row)) for row in cur]
    dump(panels / f"{table}.json", rows)
    return len(rows)


def export_legal(conn: sqlite3.Connection, panels: Path) -> dict:
    counts = {}
    cur = conn.execute(
        "SELECT date, county, id, lang, langcounty, metric, value FROM legal"
    )
    by_lang: dict[str, dict[tuple, dict]] = defaultdict(dict)
    meta_by_lang: dict[str, dict] = defaultdict(dict)
    for date, county, id_, lang, langcounty, metric, value in cur:
        lang = lang or "EN"
        key = (date, county, id_, lang)
        if key not in by_lang[lang]:
            by_lang[lang][key] = {
                "year": date,
                "country": county,
                "id": id_,
                "lang": lang,
                "langcountry": langcounty,
            }
        by_lang[lang][key][metric] = value
        meta_by_lang[lang][metric] = metric
    for lang, wide in by_lang.items():
        payload = {"data": list(wide.values()), "meta": meta_by_lang[lang]}
        dump(panels / f"legal_unstacked_{lang}.json", payload)
        counts[f"legal_unstacked_{lang}"] = len(wide)
    return counts


def export_rostats(conn: sqlite3.Connection, panels: Path) -> dict:
    counts = {}
    cur = conn.execute(
        "SELECT year, county, id, lang, langcounty, metric, value FROM rostats"
    )
    by_lang: dict[str, dict[tuple, dict]] = defaultdict(dict)
    meta_by_lang: dict[str, dict] = defaultdict(dict)
    for year, county, id_, lang, langcounty, metric, value in cur:
        lang = lang or "EN"
        key = (year, county, id_, lang)
        if key not in by_lang[lang]:
            by_lang[lang][key] = {
                "year": year,
                "county": county,
                "id": id_,
                "lang": lang,
                "langcounty": langcounty,
            }
        by_lang[lang][key][metric] = value
        meta_by_lang[lang][metric] = metric
    for lang, wide in by_lang.items():
        payload = {"data": list(wide.values()), "meta": meta_by_lang[lang]}
        dump(panels / f"rostats_{lang}.json", payload)
        counts[f"rostats_{lang}"] = len(wide)
    return counts


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", default="/home/ec2-user/gem/db/gem.sqlite")
    parser.add_argument("--panels", default="/home/ec2-user/gem/html/panels")
    args = parser.parse_args()
    db_path = Path(args.db)
    panels = Path(args.panels)
    if not db_path.exists():
        print(f"db missing: {db_path}", file=sys.stderr)
        return 1

    conn = sqlite3.connect(str(db_path))
    counts = {}
    try:
        counts.update(export_indicators(conn, panels, "aps"))
        counts.update(export_indicators(conn, panels, "nes"))
        counts["upcoming"] = export_simple(
            conn, panels, "upcoming", ["date", "cat", "close", "desc", "link"]
        )
        counts["news"] = export_simple(
            conn, panels, "news", ["date", "type", "media", "desc", "lang", "link"]
        )
        counts.update(export_legal(conn, panels))
        counts.update(export_rostats(conn, panels))
    finally:
        conn.close()

    print(f"OK exported → {panels}")
    for k, v in sorted(counts.items()):
        print(f"  {k}: {v}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
