# Global Entrepreneurship Monitor Romania

Public entry (UBB iframe): [gem2.csaladen.es](https://gem2.csaladen.es/) → routes to the Next.js site at [gem.csaladen.es](https://gem.csaladen.es/). Legacy Grafana: [gem-new.csaladen.es](https://gem-new.csaladen.es/) via `?engine=old`. Panel JSON / PDFs: [gem-html.csaladen.es](https://gem-html.csaladen.es/). Ask GEM: [gem-agent.csaladen.es](https://gem-agent.csaladen.es/).

## Repo layout

| Path | Role |
|---|---|
| `index.html` | gem2 mother router (PDF shortcuts + child iframe) |
| `site/` | Next.js 14 source (deployed to `gem.csaladen.es`) |
| `portal-agent/` | Ask GEM FastAPI agent + `/api/data` (SQLite) |
| `site/pipeline/` | Daily / weekly notebook runner |
| `site/db/` | SQLite schema + panel migrate/export |
| `data/` | gembot-published data snapshots |
| `html/` | Small static helpers (live panels live on the VM) |
| `docker-compose.yml` | Server stack reference (secrets stay on the VM `.env`) |

## Deploy notes

- Mother page is GitHub Pages (`CNAME` → `gem2.csaladen.es`).
- Next prod image builds from `site/Dockerfile.prod` on the gem VM.
- Grafana + Influx + `html/panels` stay on the VM; not fully mirrored here.
- Archives of old redesigns / zips / portal-frontend live outside this repo (`GEM/_archive`, `~/gem-archive` on the server).

## Contact

Technical: [mail@csaladen.es](mailto:mail@csaladen.es). Content: [petra.szabo@econ.ubbcluj.ro](mailto:petra.szabo@econ.ubbcluj.ro).

Cite: UBB-FSEGA — Global Entrepreneurship Monitor Romania, https://econ.ubbcluj.ro/entrepreneurship/
