# GEM Romania Next.js site

Static Next.js 14 rebuild of the GEM Romania dashboard. Charts are native D3 reading panel JSON from `gem-html`. Live at the root of `gem.csaladen.es`; UBB still iframes `gem2.csaladen.es`, which routes to this site by default.

**Public (via UBB / gem2):** https://gem2.csaladen.es/?lang=en&mode=expert  
**Direct:** https://gem.csaladen.es/?lang=en&mode=expert  

Simple mode: `?mode=simple`

## Live hosts

| URL | What |
|---|---|
| https://gem2.csaladen.es | Mother router (UBB iframe). Default → Next; `?engine=old` → Grafana; `?url=Raport*` → PDFs |
| https://gem.csaladen.es | This Next.js site (`Dockerfile.prod`) |
| https://gem-new.csaladen.es | Grafana 8.3.5 (legacy engine) |
| https://gem-html.csaladen.es | Apache `~/gem/html` — panel JSON, PDFs, like counters |
| https://gem-agent.csaladen.es | Ask GEM agent + `/api/data` (SQLite + panel mirror) |
| https://gem-jupyter.csaladen.es | Jupyter (notebook runners) |

SSH: host `gem` (`ec2-18-198-26-183`), compose in `~/gem/docker-compose.yml`.

## What is native vs embedded

Native (panel JSON via `panelHost.ts` → `gem-html.csaladen.es/panels`):

- World choropleths (APS, NES)
- Romania county map (ROSTATS, legal requests)
- NUTS2 region map (regio / new enterprises)
- GDP scatter, TEA vs NECI scatter
- EFC radar, rates bars, peer bars, time series, bubbles
- Funding cards (`upcoming.json`)
- Reports / news rail
- Legal quiz + county map

Still iframes from `gem-html` (daily job HTML):

- `like.html` / `like2.html` (footer counters)

## Ask GEM (AI assistant)

Live at https://gem-agent.csaladen.es (`portal-agent`). The site POSTs `{ query }` to `/api/query`. The agent reads **SQLite** (`~/gem/db/gem.sqlite`) for APS, NES, funding, news. Influx 1.8 remains for Grafana dual-write only.

Example: “What is the TEA rate in Romania?”

## Data pipeline

Cron on the server (not the old `data-updater.sh`):

```
0 3 * * *   pipeline/run.sh daily
0 4 * * 0   pipeline/run.sh weekly
```

- **Daily:** `formatter_daily` stages → news, opportunities, legal → publish panels + SQLite migrate + gembot
- **Weekly:** `long_term` stages → surveys, maps, regio/reports → publish
- Notebooks still `push2influx` so Grafana stays fed; Next UI does not query Influx

See `pipeline/README.md` and `db/README.md`.

## Local source vs deploy

| | Path |
|---|---|
| Editable Next app | `E:\OneDrive\2 Academics\22 UBB\223 Research\Projects\GEM\gem-site` |
| Prod on VM | `~/gem/gem-site` → Traefik Host `gem.csaladen.es` |
| Panel JSON | `~/gem/html/panels` → `gem-html.csaladen.es` |
| Legacy GH Pages copy | `denesdata/gem/v3` (optional; public entry is gem2 → gem) |

## Dev

```bash
cd gem-site
npm install
npm run dev
```

http://localhost:3000

URL params: `lang` (`ro`/`en`/`hu`), `theme` (`dark`/`light`), `colors` (`colorful`/`green`), `layout` (`compact`/`airy`), `mode` (`simple`/`expert`), `aps`, `nes`, `rostats`.

## Redeploy prod

Sync this tree to `gem:~/gem/gem-site`, then:

```bash
cd ~/gem && sudo docker-compose build gem-site && sudo docker-compose up -d --no-deps gem-site
```

`Dockerfile.prod` builds with empty `NEXT_PUBLIC_BASE_PATH` (root host).

Optional GH Pages beta under `/v3/`:

```powershell
powershell -File scripts/publish-v3.ps1
```

## Stack

Next.js 14 static export, Tailwind, `d3-scale` / `d3-geo`, `react-simple-maps`.
