#!/usr/bin/env python3
"""One-shot host install: compose mount, token seed, cron, deps."""
from __future__ import annotations

import re
import subprocess
from pathlib import Path

COMPOSE = Path("/home/ec2-user/gem/docker-compose.yml")
AUTH = Path("/home/ec2-user/gem/jupyter/auth")
GITHUB = Path("/home/ec2-user/gem/jupyter/github")
TOKEN_FILE = AUTH / "gembott_token.txt"
PIPELINE = Path("/home/ec2-user/gem/pipeline")


def seed_token() -> None:
    if TOKEN_FILE.exists() and TOKEN_FILE.stat().st_size > 10:
        print("token file already present")
        return
    url = subprocess.check_output(
        ["git", "remote", "get-url", "origin"], cwd=str(GITHUB), text=True
    ).strip()
    m = re.search(r"https://[^:]+:([^@]+)@", url)
    if not m:
        raise SystemExit(
            "could not seed token from git remote — write auth/gembott_token.txt manually"
        )
    TOKEN_FILE.write_text(m.group(1) + "\n", encoding="utf-8")
    TOKEN_FILE.chmod(0o600)
    print("seeded gembott_token.txt from existing remote (chmod 600)")


def patch_compose() -> None:
    text = COMPOSE.read_text(encoding="utf-8")
    if "./pipeline:/home/jovyan/pipeline" in text:
        print("compose already mounts pipeline")
        return
    old = """    volumes:
      - ./jupyter:/home/jovyan/work
      - ./html:/home/jovyan/html    
      - ./data:/home/jovyan/data
"""
    new = """    volumes:
      - ./jupyter:/home/jovyan/work
      - ./html:/home/jovyan/html    
      - ./data:/home/jovyan/data
      - ./pipeline:/home/jovyan/pipeline
"""
    if old not in text:
        raise SystemExit("jupyter volumes block not found for patch")
    COMPOSE.write_text(text.replace(old, new, 1), encoding="utf-8")
    print("compose patched — recreating jupyter…")
    subprocess.run(
        ["sudo", "docker-compose", "up", "-d", "jupyter"],
        cwd="/home/ec2-user/gem",
        check=True,
    )


def install_cron() -> None:
    try:
        existing = subprocess.check_output(["crontab", "-l"], text=True)
    except subprocess.CalledProcessError:
        existing = ""
    lines = [
        ln
        for ln in existing.splitlines()
        if "data-updater.sh" not in ln
        and "gem/pipeline/run.sh" not in ln
        and "gem/db/after_update" not in ln
    ]
    # Old updater left on disk; pipeline owns schedule.
    # Daily 03:00, weekly Sunday 04:00. after_update folded into pipeline publish.
    lines.append(
        "0 3 * * * /home/ec2-user/gem/pipeline/run.sh daily "
        ">> /home/ec2-user/gem/pipeline/logs/cron-daily.log 2>&1"
    )
    lines.append(
        "0 4 * * 0 /home/ec2-user/gem/pipeline/run.sh weekly "
        ">> /home/ec2-user/gem/pipeline/logs/cron-weekly.log 2>&1"
    )
    body = "\n".join(lines) + "\n"
    subprocess.run(["crontab", "-"], input=body, text=True, check=True)
    print("crontab installed:")
    print(body)


def host_deps() -> None:
    subprocess.run(
        ["python3", "-m", "pip", "install", "--user", "-q", "PyYAML"],
        check=False,
    )
    print("host PyYAML ok")


def main() -> None:
    assert PIPELINE.is_dir(), PIPELINE
    (PIPELINE / "logs").mkdir(exist_ok=True)
    host_deps()
    seed_token()
    patch_compose()
    install_cron()
    print("install complete")


if __name__ == "__main__":
    main()
