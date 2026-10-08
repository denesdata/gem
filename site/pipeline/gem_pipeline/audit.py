"""Post-publish audit: Influx + panel JSON + SQLite stay in sync where expected."""
from __future__ import annotations

import json
import logging
import sqlite3
import subprocess
from pathlib import Path


def _influx_count(measurement: str) -> int | None:
    cmd = [
        "sudo",
        "docker",
        "exec",
        "influxdb",
        "influx",
        "-database",
        "base",
        "-format",
        "csv",
        "-execute",
        f'SELECT COUNT(value) FROM "{measurement}"',
    ]
    try:
        out = subprocess.check_output(cmd, stderr=subprocess.DEVNULL, text=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        return None
    lines = [ln.strip() for ln in out.splitlines() if ln.strip()]
    if len(lines) < 2:
        return None
    # csv: name,time,count\naps,0,35397
    parts = lines[-1].split(",")
    try:
        return int(parts[-1])
    except ValueError:
        return None


def _json_len(path: Path) -> int | None:
    if not path.is_file():
        return None
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, list):
        return len(data)
    if isinstance(data, dict) and "data" in data:
        return len(data["data"])
    return None


def audit_stores(
    html_panels: Path,
    db_path: Path,
    logger: logging.Logger,
) -> dict:
    report: dict = {"ok": True, "checks": []}

    def check(name: str, ok: bool, detail: str) -> None:
        report["checks"].append({"name": name, "ok": ok, "detail": detail})
        level = logging.INFO if ok else logging.ERROR
        logger.log(level, "audit %s — %s — %s", name, "OK" if ok else "FAIL", detail)
        if not ok:
            report["ok"] = False

    # Panel files that daily/weekly must leave behind
    required = [
        "news.json",
        "upcoming.json",
        "aps_EN.json",
        "nes_EN.json",
        "legal_unstacked_EN.json",
        "rostats_unstacked_EN.json",
    ]
    for name in required:
        path = html_panels / name
        n = _json_len(path)
        check(f"panel:{name}", n is not None and n > 0, f"rows={n}")

    if not db_path.is_file():
        check("sqlite:exists", False, "missing")
        return report

    conn = sqlite3.connect(str(db_path))
    try:
        tables = {
            t: conn.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
            for (t,) in conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
            )
        }
        meta = dict(conn.execute("SELECT key, value FROM meta").fetchall())
    finally:
        conn.close()

    check("sqlite:indicators", tables.get("indicators", 0) > 1000, f"n={tables.get('indicators')}")
    check("sqlite:news", tables.get("news", 0) > 0, f"n={tables.get('news')}")
    check("sqlite:upcoming", tables.get("upcoming", 0) > 0, f"n={tables.get('upcoming')}")
    check("sqlite:legal", tables.get("legal", 0) > 0, f"n={tables.get('legal')}")
    check("sqlite:rostats", tables.get("rostats", 0) > 500, f"n={tables.get('rostats')}")
    check("sqlite:meta.migrated_at", "migrated_at" in meta, meta.get("migrated_at", ""))

    # APS/NES: Influx count should match stacked panel / SQLite indicators slice
    for ds in ("aps", "nes"):
        influx_n = _influx_count(ds)
        panel_n = 0
        for lang in ("EN", "RO", "HU"):
            panel_n += _json_len(html_panels / f"{ds}_{lang}.json") or 0
        conn = sqlite3.connect(str(db_path))
        try:
            sql_n = conn.execute(
                "SELECT COUNT(*) FROM indicators WHERE dataset=?", (ds,)
            ).fetchone()[0]
        finally:
            conn.close()
        if influx_n is None:
            check(f"parity:{ds}:influx", False, "could not query influx")
        else:
            check(
                f"parity:{ds}:influx_vs_json",
                influx_n == panel_n,
                f"influx={influx_n} json={panel_n}",
            )
            check(
                f"parity:{ds}:json_vs_sqlite",
                panel_n == sql_n,
                f"json={panel_n} sqlite={sql_n}",
            )

    exec_n = _influx_count("exec")
    conn = sqlite3.connect(str(db_path))
    try:
        sql_exec = conn.execute(
            "SELECT COUNT(*) FROM indicators WHERE dataset IN ('exec','exec3')"
        ).fetchone()[0]
    finally:
        conn.close()
    check(
        "parity:exec_in_sqlite",
        sql_exec > 0,
        f"influx_exec={exec_n} sqlite_exec+exec3={sql_exec}",
    )

    return report
