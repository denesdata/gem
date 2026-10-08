#!/usr/bin/env python3
"""Load ~/gem/html/panels JSON into ~/gem/db/gem.sqlite (source of truth bootstrap)."""
from __future__ import annotations

import argparse
import json
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

SCHEMA = Path(__file__).with_name("schema.sql").read_text(encoding="utf-8")

STACKED_DATASETS = ("aps", "nes")
ID_KEYS = {
    "year",
    "country",
    "county",
    "lang",
    "langcountry",
    "langcounty",
    "iso3",
    "id",
    "date",
    "type",
    "value",
    "langtype",
    "cat",
    "close",
    "desc",
    "link",
    "media",
}


def connect(db_path: Path) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path))
    conn.executescript(SCHEMA)
    return conn


def load_json(path: Path):
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def migrate_stacked(conn: sqlite3.Connection, panels: Path, dataset: str) -> int:
    rows = []
    for lang in ("EN", "RO", "HU"):
        path = panels / f"{dataset}_{lang}.json"
        if not path.exists():
            continue
        for row in load_json(path):
            rows.append(
                (
                    dataset,
                    row.get("year"),
                    row.get("country"),
                    row.get("type"),
                    row.get("value"),
                    row.get("lang") or lang,
                    row.get("langtype"),
                    row.get("langcountry"),
                    row.get("iso3"),
                    str(row.get("id")) if row.get("id") is not None else None,
                )
            )
    conn.execute("DELETE FROM indicators WHERE dataset = ?", (dataset,))
    conn.executemany(
        """INSERT INTO indicators
           (dataset, year, country, type, value, lang, langtype, langcountry, iso3, id)
           VALUES (?,?,?,?,?,?,?,?,?,?)""",
        rows,
    )
    return len(rows)


def melt_wide(rows: list, metric_skip: set) -> list[tuple]:
    melted = []
    for row in rows:
        base = {k: row.get(k) for k in row if k in metric_skip or k in ID_KEYS}
        for key, val in row.items():
            if key in ID_KEYS or key in metric_skip:
                continue
            if val is None:
                continue
            melted.append((base, key, val))
    return melted


def migrate_legal(conn: sqlite3.Connection, panels: Path) -> int:
    rows = []
    for lang in ("EN", "RO", "HU"):
        path = panels / f"legal_unstacked_{lang}.json"
        if not path.exists():
            path = panels / f"legal_{lang}.json"
        if not path.exists():
            continue
        payload = load_json(path)
        data = payload["data"] if isinstance(payload, dict) else payload
        for base, metric, value in melt_wide(data, set()):
            rows.append(
                (
                    str(base.get("date") or base.get("year") or ""),
                    base.get("county") or base.get("country"),
                    int(base["id"]) if base.get("id") is not None else None,
                    base.get("lang") or lang,
                    base.get("langcounty") or base.get("langcountry"),
                    metric,
                    float(value) if value is not None else None,
                )
            )
    conn.execute("DELETE FROM legal")
    conn.executemany(
        """INSERT INTO legal (date, county, id, lang, langcounty, metric, value)
           VALUES (?,?,?,?,?,?,?)""",
        rows,
    )
    return len(rows)


def migrate_rostats(conn: sqlite3.Connection, panels: Path) -> int:
    rows = []
    for lang in ("EN", "RO", "HU"):
        path = panels / f"rostats_{lang}.json"
        if not path.exists():
            path = panels / f"ro_stats_{lang}.json"
        if not path.exists():
            continue
        payload = load_json(path)
        data = payload["data"] if isinstance(payload, dict) else payload
        for base, metric, value in melt_wide(data, set()):
            year = base.get("year")
            try:
                year = int(year) if year is not None else None
            except (TypeError, ValueError):
                year = None
            rows.append(
                (
                    year,
                    base.get("county") or base.get("country"),
                    base.get("id"),
                    base.get("lang") or lang,
                    base.get("langcounty") or base.get("langcountry"),
                    metric,
                    float(value) if value is not None else None,
                )
            )
    conn.execute("DELETE FROM rostats")
    conn.executemany(
        """INSERT INTO rostats (year, county, id, lang, langcounty, metric, value)
           VALUES (?,?,?,?,?,?,?)""",
        rows,
    )
    return len(rows)


def migrate_list(conn: sqlite3.Connection, table: str, path: Path, columns: list[str]) -> int:
    if not path.exists():
        return 0
    data = load_json(path)
    if not isinstance(data, list):
        data = data.get("data", [])
    rows = [tuple(item.get(c) for c in columns) for item in data]
    conn.execute(f"DELETE FROM {table}")
    placeholders = ",".join("?" * len(columns))
    cols = ",".join(columns)
    conn.executemany(f"INSERT INTO {table} ({cols}) VALUES ({placeholders})", rows)
    return len(rows)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--panels",
        default="/home/ec2-user/gem/html/panels",
        help="Panel JSON directory",
    )
    parser.add_argument(
        "--db",
        default="/home/ec2-user/gem/db/gem.sqlite",
        help="SQLite database path",
    )
    args = parser.parse_args()
    panels = Path(args.panels)
    db_path = Path(args.db)
    if not panels.is_dir():
        print(f"panels dir missing: {panels}", file=sys.stderr)
        return 1

    conn = connect(db_path)
    counts = {}
    try:
        for dataset in STACKED_DATASETS:
            counts[dataset] = migrate_stacked(conn, panels, dataset)
        counts["upcoming"] = migrate_list(
            conn, "upcoming", panels / "upcoming.json", ["date", "cat", "close", "desc", "link"]
        )
        counts["news"] = migrate_list(
            conn, "news", panels / "news.json", ["date", "type", "media", "desc", "lang", "link"]
        )
        counts["legal"] = migrate_legal(conn, panels)
        counts["rostats"] = migrate_rostats(conn, panels)
        conn.execute(
            "INSERT OR REPLACE INTO meta(key, value) VALUES (?, ?)",
            ("migrated_at", datetime.now(timezone.utc).isoformat()),
        )
        conn.execute(
            "INSERT OR REPLACE INTO meta(key, value) VALUES (?, ?)",
            ("panels_path", str(panels)),
        )
        conn.commit()
    finally:
        conn.close()

    print(f"OK {db_path}")
    for k, v in counts.items():
        print(f"  {k}: {v}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
