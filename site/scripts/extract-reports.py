import json
import re
import urllib.request
from pathlib import Path
from urllib.parse import urljoin

ROOT = Path(__file__).resolve().parents[1]
LOCAL = ROOT / "public" / "server-export" / "panels" / "reports" / "index.html"
OUT = ROOT / "public" / "server-export" / "panels" / "reports.json"
BASE = "https://gem-html.csaladen.es/panels/reports/"


def load_html() -> str:
    try:
        with urllib.request.urlopen(urljoin(BASE, "index.html"), timeout=20) as resp:
            html = resp.read().decode("utf-8", "replace")
            print("fetched live html", len(html))
            return html
    except Exception as exc:
        print("live fetch failed", exc)
        return LOCAL.read_text(encoding="utf-8")


def parse(html: str) -> list[dict]:
    chunks = re.split(r'<div data-number="', html)[1:]
    items = []
    for chunk in chunks:
        head = re.match(r'(\d+)"\s+class="mix ([^"]+)">(.*)$', chunk, re.S)
        if not head:
            continue
        sort_key, classes, inner = head.groups()
        tokens = classes.split()
        kind = next((t for t in tokens if t != "glow"), tokens[0] if tokens else "report")
        href_match = re.search(r'href="([^"]+)"', inner)
        img_match = re.search(r'<img[^>]+src="([^"]+)"', inner)
        href = href_match.group(1) if href_match else ""
        img = img_match.group(1) if img_match else ""
        titles = {}
        for lang in ("HU", "RO", "EN"):
            match = re.search(
                rf'class="card {lang}"[\s\S]*?<div class="card-title">([\s\S]*?)</div>',
                inner,
            )
            titles[lang] = re.sub(r"\s+", " ", match.group(1)).strip() if match else ""
        items.append(
            {
                "year": int(str(sort_key)[:4]),
                "sort": int(sort_key),
                "kind": kind,
                "featured": "glow" in tokens,
                "href": urljoin(BASE, href) if href else "",
                "img": urljoin(BASE, img) if img else "",
                "title": titles,
            }
        )
    items.sort(key=lambda item: (-item["sort"], item["kind"]))
    return items


if __name__ == "__main__":
    items = parse(load_html())
    OUT.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")
    print("wrote", OUT.name, "n=", len(items))
    if items:
        print("years", min(i["year"] for i in items), max(i["year"] for i in items))
        print("kinds", sorted({i["kind"] for i in items}))
