# GEM Romania Next.js site

Static Next.js 14 rebuild of the live Grafana dashboard. Charts are native D3. The 02:00 Jupyter job on the GEM server keeps feeding data. Grafana at `gem.csaladen.es` stays up in the background.

**Beta (show this):** https://gem2.csaladen.es/v3/?lang=en&mode=expert&theme=dark&colors=colorful

Simple mode: https://gem2.csaladen.es/v3/?lang=en&mode=simple

## Live hosts

| URL | What |
|---|---|
| https://gem.csaladen.es | Grafana 8.3.5 (current public site) |
| https://gem-html.csaladen.es | Apache `~/gem/html` — legal form, funding carousel, reports, maps JSON |
| https://gem2.csaladen.es/v3/ | This Next.js export (GitHub Pages, `denesdata/gem`) |
| https://gem-new.csaladen.es | Older portal-frontend, not this app |
| https://gem-jupyter.csaladen.es | Jupyter (daily updater) |

SSH: host `gem` (`ec2-18-198-26-183`), compose in `~/gem/docker-compose.yml`.

## What is native vs embedded

Native D3 (from JSON under `public/server-export/panels/`):

- World choropleths (APS, NES)
- Romania county map (ROSTATS, legal requests)
- NUTS2 region map (regio / new enterprises)
- GDP scatter, TEA vs NECI scatter
- EFC radar, rates bars, peer bars, time series, bubbles

Still iframes from `gem-html.csaladen.es` (interactive HTML the daily job writes):

- `legal.html` Test / PFA / SRL
- `content-filter/index.html` funding cards
- `reports/index.html` reports carousel
- `like.html` / `like2.html`

## Data pipeline (keep running)

Cron on the server: `0 2 * * * sudo docker exec jupyter bash /home/jovyan/work/data-updater.sh`

That runs `formatter_daily.ipynb`:

1. Google Sheet **sajto** → Influx `news` **and** `html/panels/news.json`
2. Sheet **opport** → funding `content-filter/index.html` + Influx `upcoming` + `upcoming.json`
3. ONRC weekly Excel → CSV in `jupyter/github/data/ONRC_legal/` → `legal_unstacked_{EN,RO,HU}.json`
4. Papermill `update_grafana.ipynb` — clones template dashboard `x` into HU/EN/RO + light themes (i18n + colours). Needed while Grafana is public. Not used by this Next app.
5. Git push `data/last_updated.txt` to `denesdata/gem`

**Keep Influx 1.8.** Measurements in `base`: `news`, `upcoming`, `aps`, `nes`, `rostats`, `exec`, `exec3`. Grafana tables and `portal-agent` read them. The Next app reads the JSON dumps next to them, not Influx directly.

`long_term.ipynb` is **manual** (last run 19 Mar 2026). It rebuilds APS / NES / ROSTATS / regio JSON, reports HTML, `legal.html`, scatter, Flourish xlsx, and the big Influx series. Do not put it on the nightly cron.

## Local source vs published copy

| | Path |
|---|---|
| Editable Next app | `E:\OneDrive\2 Academics\22 UBB\223 Research\Projects\GEM\gem-site` (not a git repo) |
| Published static export | `E:\OneDrive\5 Github\52 denesdata\gem\v3` → `main` → GitHub Pages |
| Server HTML + JSON | `~/gem/html/panels` |

## Dev

```bash
cd gem-site
npm install
npm run dev
```

http://localhost:3000

URL params: `lang` (`ro`/`en`/`hu`), `theme` (`dark`/`light`), `colors` (`colorful`/`green`), `layout` (`compact`/`airy`), `mode` (`simple`/`expert`), `aps`, `nes`, `rostats`.

## Republish beta

From `gem-site`:

```powershell
powershell -File scripts/publish-v3.ps1
```

That builds with `NEXT_PUBLIC_BASE_PATH=/v3` (so CSS/JS/JSON load under `/v3/`, not the domain root), drops bulky snapshots (`panels-legacy` PDFs, promo/media/test), writes `.nojekyll` so GitHub Pages serves `_next`, and copies `out/` onto `denesdata/gem/v3`. Then commit and push `main` in that repo.

GitHub Pages serves the repo root; this app is the `/v3/` folder. CNAME is `gem2.csaladen.es`.

## Stack

Next.js 14 static export, Tailwind, `d3-scale` / `d3-geo`, `react-simple-maps`.
