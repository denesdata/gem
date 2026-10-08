"""Pull public GEM Romania LinkedIn posts into public/linkedin-posts.json."""

import json
import re
import urllib.request
from pathlib import Path

URL = "https://www.linkedin.com/organization-guest/company/gem-romania"
OUT = Path("public/linkedin-posts.json")


def plain(text: str) -> str:
    chars = []
    for ch in text:
        code = ord(ch)
        if 0x1D5D4 <= code <= 0x1D5ED:
            chars.append(chr(ord("A") + code - 0x1D5D4))
        elif 0x1D5EE <= code <= 0x1D607:
            chars.append(chr(ord("a") + code - 0x1D5EE))
        elif 0x1D7EC <= code <= 0x1D7F5:
            chars.append(chr(ord("0") + code - 0x1D7EC))
        else:
            chars.append(ch)
    return "".join(chars)


def headline(text: str) -> str:
    line = next((part.strip() for part in plain(text).splitlines() if part.strip()), "")
    line = re.sub(r"\s+", " ", line)
    return line[:140]


def main() -> None:
    request = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0"})
    html = urllib.request.urlopen(request, timeout=40).read().decode("utf-8", "replace")
    posts = []
    seen = set()
    for blob in re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
        data = json.loads(blob)
        graph = data.get("@graph") or []
        for node in graph:
            if node.get("@type") != "SocialMediaPosting":
                continue
            link = node.get("mainEntityOfPage") or ""
            if not link or link in seen:
                continue
            seen.add(link)
            posts.append(
                {
                    "date": str(node.get("datePublished") or "")[:10],
                    "media": "LinkedIn",
                    "desc": headline(node.get("text") or ""),
                    "link": link,
                }
            )
    posts.sort(key=lambda item: item["date"], reverse=True)
    OUT.write_text(json.dumps(posts, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(posts)} posts -> {OUT}")


if __name__ == "__main__":
    main()
