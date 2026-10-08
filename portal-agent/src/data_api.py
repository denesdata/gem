"""
GEM /api/data — explicit source routing.

Static JSON (html/panels) — UI-shaped / small / geo / defs / news / upcoming / unstacked charts
SQLite (gem.sqlite)       — APS/NES indicators, legal, rostats filters, exec mirrors, agent SQL
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

# Always served from static panel files (Next UI + lightweight lists).
STATIC_ONLY = {
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


def _sqlite_ro() -> sqlite3.Connection:
    if not SQLITE_PATH.is_file():
        raise HTTPException(503, "sqlite missing")
    conn = sqlite3.connect(f"file:{SQLITE_PATH}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    return conn


def _load_static(name: str) -> Any:
    path = PANELS_DIR / _safe_panel_name(name)
    if not path.is_file():
        raise HTTPException(404, f"panel not found: {path.name}")
    return json.loads(path.read_text(encoding="utf-8"))


@router.get("/health")
def data_health():
    tables = {}
    meta = {}
    if SQLITE_PATH.is_file():
        conn = sqlite3.connect(f"file:{SQLITE_PATH}?mode=ro", uri=True)
        try:
            for (name,) in conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
            ):
                tables[name] = conn.execute(f"SELECT COUNT(1) FROM {name}").fetchone()[0]
            meta = dict(conn.execute("SELECT key, value FROM meta").fetchall())
        finally:
            conn.close()
    panels = sorted(p.name for p in PANELS_DIR.glob("*.json")) if PANELS_DIR.is_dir() else []
    return {
        "routing": {
            "static_json": sorted(STATIC_ONLY) + ["panels/{name}", "aps|nes|rostats|legal *_unstacked_*.json"],
            "sqlite": ["/indicators", "/legal", "/rostats", "/sql", "/tables", "Ask GEM /api/query"],
        },
        "panels_dir": str(PANELS_DIR),
        "panels_ok": PANELS_DIR.is_dir(),
        "panels_count": len(panels),
        "sqlite": str(SQLITE_PATH),
        "sqlite_ok": SQLITE_PATH.is_file(),
        "sqlite_bytes": SQLITE_PATH.stat().st_size if SQLITE_PATH.is_file() else 0,
        "sqlite_tables": tables,
        "meta": meta,
    }


@router.get("/panels")
def list_panels():
    if not PANELS_DIR.is_dir():
        raise HTTPException(503, "panels directory missing")
    files = sorted(p.name for p in PANELS_DIR.glob("*.json"))
    return {"count": len(files), "panels": files, "source": "static"}


@router.get("/panels/{name}")
def get_panel(name: str):
    """Always static — UI charts / defs / geo."""
    fname = _safe_panel_name(name)
    path = PANELS_DIR / fname
    if not path.is_file():
        raise HTTPException(404, f"panel not found: {fname}")
    return FileResponse(path, media_type="application/json")


@router.get("/tables")
def list_tables():
    conn = _sqlite_ro()
    try:
        out = {}
        for (name,) in conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
        ):
            out[name] = conn.execute(f"SELECT COUNT(1) FROM {name}").fetchone()[0]
        return {"tables": out, "source": "sqlite"}
    finally:
        conn.close()


@router.get("/indicators")
def indicators(
    dataset: str = Query("aps", pattern="^(aps|nes|exec|exec3)$"),
    country: Optional[str] = None,
    type: Optional[str] = Query(None, alias="type"),
    lang: str = Query("EN"),
    year: Optional[int] = None,
    limit: int = Query(500, ge=1, le=5000),
):
    """APS / NES / exec from SQLite (large / filterable)."""
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
        "SELECT dataset, year, country, type, value, langtype, lang, langcountry, iso3, id "
        f"FROM indicators WHERE {' AND '.join(clauses)} "
        "ORDER BY year, country, type LIMIT ?"
    )
    params.append(limit)
    conn = _sqlite_ro()
    try:
        rows = [dict(r) for r in conn.execute(sql, params)]
    finally:
        conn.close()
    return {"count": len(rows), "rows": rows, "source": "sqlite"}


@router.get("/upcoming")
def upcoming(cat: Optional[str] = None, limit: int = Query(50, ge=1, le=500)):
    """Funding list — static JSON (same file the Next UI uses)."""
    data = _load_static("upcoming.json")
    if not isinstance(data, list):
        data = data.get("data", [])
    if cat:
        data = [r for r in data if cat in str(r.get("cat", ""))]
    return {"count": len(data[:limit]), "rows": data[:limit], "source": "static"}


@router.get("/news")
def news(lang: Optional[str] = None, limit: int = Query(50, ge=1, le=500)):
    """Press list — static JSON."""
    data = _load_static("news.json")
    if not isinstance(data, list):
        data = data.get("data", [])
    if lang:
        wanted = lang.upper()
        filtered = [r for r in data if str(r.get("lang", "")).upper() == wanted]
        data = filtered or data
    return {"count": len(data[:limit]), "rows": data[:limit], "source": "static"}


@router.get("/legal")
def legal(
    county: Optional[str] = None,
    lang: str = Query("EN"),
    metric: Optional[str] = None,
    limit: int = Query(500, ge=1, le=5000),
):
    """County legal metrics — SQLite (melted from legal_unstacked)."""
    clauses = ["lang = ?"]
    params: list[Any] = [lang.upper()]
    if county:
        clauses.append("county = ?")
        params.append(county)
    if metric:
        clauses.append("metric = ?")
        params.append(metric)
    sql = (
        "SELECT date, county, id, lang, langcounty, metric, value "
        f"FROM legal WHERE {' AND '.join(clauses)} "
        "ORDER BY county, metric LIMIT ?"
    )
    params.append(limit)
    conn = _sqlite_ro()
    try:
        rows = [dict(r) for r in conn.execute(sql, params)]
    finally:
        conn.close()
    return {"count": len(rows), "rows": rows, "source": "sqlite"}


@router.get("/rostats")
def rostats(
    county: Optional[str] = None,
    lang: str = Query("EN"),
    metric: Optional[str] = None,
    year: Optional[int] = None,
    limit: int = Query(500, ge=1, le=5000),
):
    """County enterprise stats — SQLite (melted from rostats_unstacked)."""
    clauses = ["lang = ?"]
    params: list[Any] = [lang.upper()]
    if county:
        clauses.append("county = ?")
        params.append(county)
    if metric:
        clauses.append("metric = ?")
        params.append(metric)
    if year is not None:
        clauses.append("year = ?")
        params.append(year)
    sql = (
        "SELECT year, county, id, lang, langcounty, metric, value "
        f"FROM rostats WHERE {' AND '.join(clauses)} "
        "ORDER BY year, county, metric LIMIT ?"
    )
    params.append(limit)
    conn = _sqlite_ro()
    try:
        rows = [dict(r) for r in conn.execute(sql, params)]
    finally:
        conn.close()
    return {"count": len(rows), "rows": rows, "source": "sqlite"}


@router.post("/sql")
def run_sql(body: dict):
    """Read-only SELECT against SQLite (tooling / agent)."""
    sql = (body.get("sql") or "").strip().rstrip(";")
    if not sql.lower().startswith("select") or _FORBIDDEN.search(sql):
        raise HTTPException(400, "only SELECT allowed")
    conn = _sqlite_ro()
    try:
        rows = [dict(r) for r in conn.execute(sql)]
    except sqlite3.Error as e:
        raise HTTPException(400, str(e)) from e
    finally:
        conn.close()
    return JSONResponse({"count": len(rows), "rows": rows[:2000], "source": "sqlite"})
