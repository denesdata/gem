# GEM data pipeline (new site)

Clean runner around the **existing** Jupyter notebooks. Google Sheets pulls and `gem_functions` stay as they are. Grafana API updates are **not** part of this path.

Old site stays fed: notebook stages still call `push2influx` → Influx → Grafana @ `gem.csaladen.es`.  
New site is fed from the same run via panel JSON + SQLite.

## Layout

Lives under the Jupyter `/work` tree (easy to open in the Jupyter file browser):

```
~/gem/jupyter/                 # = /home/jovyan/work  (Jupyter-visible)
  formatter_daily.ipynb        # daily stages
  long_term.ipynb              # weekly stages
  gem_functions.ipynb          # shared helpers (imported by notebooks)
  run_daily.sh / run_weekly.sh
  pipeline/                    # runner
  logs/
  auth/                        # tokens (never commit)
~/gem/gembot/                  # sparse clone for publish (NOT in /work)
~/gem/html/panels/             # live JSON for gem-html
~/gem/db/gem.sqlite
```

## Schedules

| Job | Cron (Europe/Bucharest ≈ server local) | Notebook stages |
|-----|----------------------------------------|-----------------|
| Daily | `0 3 * * *` | `formatter_daily` — setup → news → opportunities → legal |
| Weekly | `0 4 * * 0` (Sunday) | `long_term` — surveys → maps/rostats → regio/reports/exec |

The legacy `data-updater.sh` (02:00) is left on disk for rollback but is **removed from crontab** once this pipeline is installed, so notebooks are not executed twice.

## What each run does

1. Execute notebook **cell ranges** inside the `jupyter` container (shared kernel per job).
2. Notebooks dual-write: **Influx** (`push2influx`) + **`html/panels/*.json`**.
3. Skip `update_grafana` / playground / zip export cells.
4. Copy selected JSON → `~/gem/gembot/data/panels/` (git trace).
5. `migrate_panels.py` → `~/gem/db/gem.sqlite` (plus exec/exec3 from Influx).
6. **Audit** Influx ↔ JSON ↔ SQLite parity; fail the job if stores diverge.
7. Gembot commit + push to `denesdata/gem` (`data/` sparse checkout).

## Data stores (judgment)

| Dataset | Static JSON on gem-html | SQLite |
|---------|-------------------------|--------|
| `news.json`, `upcoming.json` | primary (small, hot) | yes (agent) |
| `*_unstacked_*.json`, `*_def.json`, geo | primary for Next UI | — |
| stacked `aps_*.json` / `nes_*.json` | kept for compatibility | **primary** for agent / bulk |
| `legal_*`, `rostats_*` | maps/UI | yes (agent) |

## Commands

```bash
# on gem VM (or from Jupyter terminal under /home/jovyan/work)
~/gem/jupyter/run_daily.sh              # full daily job
~/gem/jupyter/run_weekly.sh             # full weekly job
~/gem/jupyter/pipeline/run.sh daily --stage news
~/gem/jupyter/pipeline/run.sh daily --dry-run
~/gem/jupyter/pipeline/run.sh publish   # sync JSON + sqlite + git only
```

Logs: `~/gem/jupyter/logs/` (same path as `/home/jovyan/work/logs` in Jupyter).

## Gembot

Repo-local git identity (not global):

- name: `GEM databot`
- email: `csaladenes.gembot@outlook.com`

Credentials live in `~/gem/jupyter/auth/gembott_token.txt` (gitignored patterns). Never commit tokens. The runner configures the `github/` remote from that file at publish time.

## Non-goals

- Rewriting Google Sheets fetch logic
- Replacing `gem_functions.ipynb`
- Grafana dashboard API (`update_grafana.ipynb`)
- UI work (separate phase)
