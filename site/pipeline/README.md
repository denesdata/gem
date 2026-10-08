# GEM data pipeline (new site)

Clean runner around the **existing** Jupyter notebooks. Google Sheets pulls and `gem_functions` stay as they are. Grafana API updates are **not** part of this path.

Old site stays fed: notebook stages still call `push2influx` → Influx → Grafana @ `gem.csaladen.es`.  
New site is fed from the same run via panel JSON + SQLite.

## Layout

```
~/gem/pipeline/          # this package (on the gem VM)
~/gem/jupyter/           # notebooks + auth + gem_functions (unchanged)
~/gem/html/panels/       # live JSON for gem-html.csaladen.es
~/gem/db/gem.sqlite      # Ask GEM + larger tables
~/gem/jupyter/github/    # sparse clone of denesdata/gem (gembot commits)
```

## Schedules

| Job | Cron (Europe/Bucharest ≈ server local) | Notebook stages |
|-----|----------------------------------------|-----------------|
| Daily | `0 3 * * *` | `formatter_daily` — setup → news → opportunities → legal |
| Weekly | `0 4 * * 0` (Sunday) | `long_term` — surveys → maps/rostats → regio/reports/exec |

The legacy `data-updater.sh` (02:00) is left on disk for rollback but is **removed from crontab** once this pipeline is installed, so notebooks are not executed twice.

## What each run does

1. Execute notebook **cell ranges** inside the `jupyter` container (shared kernel per job).
2. Skip `update_grafana` / playground / zip export cells.
3. Panel JSON already written by the notebooks under `html/panels/`.
4. Copy selected JSON → `jupyter/github/data/panels/` (git trace).
5. `migrate_panels.py` → `~/gem/db/gem.sqlite`.
6. Gembot commit + push to `denesdata/gem` (`data/` sparse checkout).

## Data stores (judgment)

| Dataset | Static JSON on gem-html | SQLite |
|---------|-------------------------|--------|
| `news.json`, `upcoming.json` | primary (small, hot) | yes (agent) |
| `*_unstacked_*.json`, `*_def.json`, geo | primary for Next UI | — |
| stacked `aps_*.json` / `nes_*.json` | kept for compatibility | **primary** for agent / bulk |
| `legal_*`, `rostats_*` | maps/UI | yes (agent) |

## Commands

```bash
# on gem VM
cd ~/gem/pipeline
./run.sh daily                 # full daily job
./run.sh weekly                # full weekly job
./run.sh daily --stage news    # one stage only
./run.sh daily --dry-run       # print stages, no execute
./run.sh publish               # sync JSON + sqlite + git only
```

Logs: `~/gem/pipeline/logs/<job>-<timestamp>.log`

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
