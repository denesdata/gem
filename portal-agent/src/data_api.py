"""
Data sources for the new GEM site.

Static panel JSON (html/panels) for UI-sized payloads.
SQLite (gem.sqlite) for larger tables and agent-style filters.
"""
from __future__ import annotations

import json
import os
import re
import sqlite3
from pathlib import Path
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse, JSONResponse

router = APIRouter(prefix="/api/data", tags=["data"])

PANELS_DIR = Path(os.getenv("PANELS_PATH", "/html/panels"))
SQLITE_PATH = Path(os.getenv("SQLITE_PATH", "/data/db/gem.sqlite"))

_FORBIDDEN = re.compile(
    r"\b(INSERT|UPDATE|DELETE|DROP|ALTER|ATTACH|PRAGMA|REPLACE|CREATE|VACUUM)\b",
    re.I,
)

# Prefer static files for these (small / UI-shaped). Others can come from SQLite.
STATIC_PREFERRED = {
    "news.json",
    "upcoming.json",
    "scatter.json",
    "aps_def.json",
    "nes_def.json",
    "legal_def.json",
    "rostats_def.json",
    "regio_def.json",
    "iso_counties.json",
}


def _safe_panel_name(name: str) -> str:
    base = Path(name).name
    if not base.endswith(".json"):
        base = f"{base}.json"
    if ".." in base or "/" in base or "\\" in base:
        raise HTTPException(400, "invalid panel name")
    return base


@router.get("/health")
def data_health():
    return {
        "panels_dir": str(PANELS_DIR),
        "panels_ok": PANELS_DIR.is_dir(),
        "sqlite": str(SQLITE_PATH),
        "sqlite_ok": SQLITE_PATH.is_file(),
        "sqlite_bytes": SQLITE_PATH.stat().st_size if SQLITE_PATH.is_file() else 0,
    }


@router.get("/panels")
def list_panels():
    if not PANELS_DIR.is_dir():
        raise HTTPException(503, "panels directory missing")
    files = sorted(p.name for p in PANELS_DIR.glob("*.json"))
    return {"count": len(files), "panels": files}


@router.get("/panels/{name}")
def get_panel(name: str):
    """Serve a panel JSON file from gem-html panels (static source of truth for UI)."""
    fname = _safe_panel_name(name)
    path = PANELS_DIR / fname
    if not path.is_file():
        raise HTTPException(404, f"panel not found: {fname}")
    return FileResponse(path, media_type="application/json")


@router.get("/tables")
def list_tables():
    if not SQLITE_PATH.is_file():
        raise HTTPException(503, "sqlite missing")
    conn = sqlite3.connect(f"file:{SQLITE_PATH}?mode=ro", uri=True)
    try:
        rows = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        ).fetchall()
        out = {}
        for (name,) in rows:
            out[name] = conn.execute(f"SELECT COUNT(1) FROM {name}").fetchone()[0]
        return {"tables": out}
    finally:
        conn.close()


@router.get("/indicators")
def indicators(
    dataset: str = Query("aps", pattern="^(aps|nes)$"),
    country: Optional[str] = None,
    type: Optional[str] = Query(None, alias="type"),
    lang: str = Query("EN"),
    year: Optional[int] = None,
    limit: int = Query(500, ge=1, le=5000),
):
    """Filtered APS/NES rows from SQLite (large store)."""
    if not SQLITE_PATH.is_file():
        raise HTTPException(503, "sqlite missing")
    clauses = ["dataset = ?", "lang = ?"]
    params: list[Any] = [dataset, lang.upper()]
    if country:
        clauses.append("country = ?")
        params.append(country.upper())
    if type:
        clauses.append("type = ?")
        params.append(type)
    if year is not None:
        clauses.append("year = ?")
        params.append(year)
    sql = (
        "SELECT year, country, type, value, langtype, lang, langcountry, iso3, id "
        f"FROM indicators WHERE {' AND '.join(clauses)} "
        "ORDER BY year, country, type LIMIT ?"
    )
    params.append(limit)
    conn = sqlite3.connect(f"file:{SQLITE_PATH}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    try:
        rows = [dict(r) for r in conn.execute(sql, params)]
    finally:
        conn.close()
    return {"count": len(rows), "rows": rows}


@router.get("/upcoming")
def upcoming(cat: Optional[str] = None, limit: int = Query(50, ge=1, le=500)):
    if not SQLITE_PATH.is_file():
        # fallback static
        path = PANELS_DIR / "upcoming.json"
        if path.is_file():
            data = json.loads(path.read_text(encoding="utf-8"))
            if cat:
                data = [r for r in data if cat in str(r.get("cat", ""))]
            return {"count": len(data[:limit]), "rows": data[:limit], "source": "static"}
        raise HTTPException(503, "no upcoming source")
    clauses = []
    params: list[Any] = []
    if cat:
        clauses.append("cat LIKE ?")
        params.append(f"%{cat}%")
    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    sql = f"SELECT date, cat, close, desc, link FROM upcoming {where} ORDER BY date LIMIT ?"
    params.append(limit)
    conn = sqlite3.connect(f"file:{SQLITE_PATH}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    try:
        rows = [dict(r) for r in conn.execute(sql, params)]
    finally:
        conn.close()
    return {"count": len(rows), "rows": rows, "source": "sqlite"}


@router.get("/news")
def news(lang: Optional[str] = None, limit: int = Query(50, ge=1, le=500)):
    path = PANELS_DIR / "news.json"
    if path.is_file() and (lang is None or True):
        data = json.loads(path.read_text(encoding="utf-8"))
        if lang:
            wanted = lang.upper()
            filtered = [r for r in data if str(r.get("lang", "")).upper() == wanted]
            data = filtered or data
        return {"count": len(data[:limit]), "rows": data[:limit], "source": "static"}
    raise HTTPException(404, "news.json missing")


@router.post("/sql")
def run_sql(body: dict):
    """Read-only SELECT against SQLite (for tooling / agent)."""
    sql = (body.get("sql") or "").strip().rstrip(";")
    if not sql.lower().startswith("select") or _FORBIDDEN.search(sql):
        raise HTTPException(400, "only SELECT allowed")
    if not SQLITE_PATH.is_file():
        raise HTTPException(503, "sqlite missing")
    conn = sqlite3.connect(f"file:{SQLITE_PATH}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    try:
        rows = [dict(r) for r in conn.execute(sql)]
    except sqlite3.Error as e:
        raise HTTPException(400, str(e)) from e
    finally:
        conn.close()
    return JSONResponse({"count": len(rows), "rows": rows[:2000]})
