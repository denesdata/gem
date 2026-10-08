# GEM SQLite data layer

Source of truth on the VM: `~/gem/db/gem.sqlite`.

| Path | Role |
|------|------|
| `schema.sql` | Tables: indicators, upcoming, news, legal, rostats |
| `migrate_panels.py` | `html/panels/*.json` → SQLite |
| `export_panels.py` | SQLite → panel JSON (frontend / httpd) |

## Daily flow

1. Jupyter `formatter_daily` refreshes panel JSON (existing cron).
2. `migrate_panels.py` reloads SQLite from those panels.
3. Ask GEM (`portal-agent`) queries SQLite.
4. Optional: `export_panels.py` if the DB was edited directly.

Frontend (Next / GH Pages) keeps reading JSON from `gem-html.csaladen.es/panels`.
