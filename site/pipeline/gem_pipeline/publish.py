"""Sync panel JSON → github/data/panels, migrate SQLite, gembot commit."""
from __future__ import annotations

import fnmatch
import logging
import os
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path


def _run(cmd: list[str], cwd: Path | None, logger: logging.Logger) -> None:
    logger.info("$ %s", " ".join(cmd))
    subprocess.run(cmd, cwd=str(cwd) if cwd else None, check=True)


def sync_panels(
    html_panels: Path,
    github_panels: Path,
    patterns: list[str],
    logger: logging.Logger,
) -> list[Path]:
    github_panels.mkdir(parents=True, exist_ok=True)
    names = sorted(html_panels.iterdir())
    copied: list[Path] = []
    for path in names:
        if not path.is_file():
            continue
        if not any(fnmatch.fnmatch(path.name, pat) for pat in patterns):
            continue
        dest = github_panels / path.name
        shutil.copy2(path, dest)
        copied.append(dest)
        logger.info("synced %s (%s bytes)", path.name, path.stat().st_size)
    logger.info("synced %s panel files", len(copied))
    return copied


def migrate_sqlite(db_dir: Path, html_panels: Path, logger: logging.Logger) -> None:
    script = db_dir / "migrate_panels.py"
    if not script.exists():
        raise FileNotFoundError(script)
    _run(
        [
            "python3",
            str(script),
            "--panels",
            str(html_panels),
            "--db",
            str(db_dir / "gem.sqlite"),
        ],
        cwd=db_dir,
        logger=logger,
    )


def _token(auth_dir: Path, token_file: str) -> str:
    path = auth_dir / token_file
    if not path.exists():
        raise FileNotFoundError(
            f"missing {path} — write the gembott PAT there (chmod 600)"
        )
    return path.read_text(encoding="utf-8").strip()


def gembot_commit(
    github_dir: Path,
    auth_dir: Path,
    gembot: dict,
    message: str,
    logger: logging.Logger,
    dry_run: bool = False,
) -> None:
    token = _token(auth_dir, gembot["token_file"])
    remote = f"https://gembott:{token}@{gembot['remote']}"
    branch = gembot.get("branch", "main")

    env = os.environ.copy()
    # Avoid leaking token via subprocess list logging beyond our scrubbed remote setup
    _run(["git", "config", "user.name", gembot["name"]], github_dir, logger)
    _run(["git", "config", "user.email", gembot["email"]], github_dir, logger)
    _run(["git", "config", "core.sparseCheckout", "true"], github_dir, logger)

    sparse = github_dir / ".git" / "info" / "sparse-checkout"
    sparse.parent.mkdir(parents=True, exist_ok=True)
    wanted = "data\n"
    if sparse.exists():
        cur = sparse.read_text(encoding="utf-8")
        if "data" not in cur.splitlines():
            sparse.write_text(cur.rstrip() + "\n" + wanted, encoding="utf-8")
    else:
        sparse.write_text(wanted, encoding="utf-8")

    # Point origin at tokenized URL without printing it
    subprocess.run(
        ["git", "remote", "set-url", "origin", remote],
        cwd=str(github_dir),
        check=True,
        capture_output=True,
    )
    logger.info("remote origin refreshed (token redacted)")

    # Clear a dirty index left by an interrupted/dry-run publish, then pull.
    subprocess.run(
        ["git", "reset", "HEAD", "--", "data"],
        cwd=str(github_dir),
        check=False,
        capture_output=True,
    )
    _run(["git", "pull", "--rebase", "origin", branch], github_dir, logger)

    stamp = datetime.now(timezone.utc).isoformat()
    (github_dir / "data" / "last_updated.txt").write_text(stamp + "\n", encoding="utf-8")

    status = subprocess.run(
        ["git", "status", "--porcelain", "data"],
        cwd=str(github_dir),
        check=True,
        capture_output=True,
        text=True,
    )
    if not status.stdout.strip():
        logger.info("nothing to commit")
        return
    if dry_run:
        logger.info("dry-run commit skipped:\n%s", status.stdout)
        return
    _run(["git", "add", "--all", "data"], github_dir, logger)
    _run(["git", "commit", "-m", message], github_dir, logger)
    _run(["git", "push", "origin", branch], github_dir, logger)
    logger.info("pushed %s", message)
