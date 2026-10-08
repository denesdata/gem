# GEM SQLite data layer

File on the VM: `~/gem/db/gem.sqlite`.

## Triple write (daily / weekly)

```
Google Sheets / surveys / ONRC
        │
        ▼  Jupyter notebooks (formatter_daily / long_term)
   ┌────┴────┐
   ▼         ▼
 Influx    html/panels/*.json     ← Grafana + Next UI
   │              │
   │              ▼  migrate_panels.py (publish step)
   │         gem.sqlite           ← Ask GEM + /api/data filters
   └── exec/exec3 also mirrored into indicators via Influx pull
```

| Store | Consumer |
|-------|----------|
| Influx `base` | Grafana (`gem-new`) |
| `html/panels/*.json` | Next UI, `/api/data/panels/*`, `/news`, `/upcoming` |
| `gem.sqlite` | Ask GEM, `/api/data/indicators|legal|rostats|sql` |

## Scripts

| Path | Role |
|------|------|
| `schema.sql` | indicators, upcoming, news, legal, rostats, meta |
| `migrate_panels.py` | panels JSON → SQLite (+ exec/exec3 from Influx) |
| `export_panels.py` | SQLite → panel JSON (only if DB was edited by hand) |

## Commands

```bash
# after notebooks (or via pipeline publish)
python3 ~/gem/db/migrate_panels.py
~/gem/jupyter/pipeline/run.sh publish   # sync panels + migrate + audit + gembot
```
