#!/usr/bin/env python3
"""Host-side entry: orchestrate container notebook stages + publish."""
from __future__ import annotations

import argparse
import subprocess
import sys
from datetime import date
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from gem_pipeline.logutil import setup_logger  # noqa: E402
from gem_pipeline.publish import gembot_commit, migrate_sqlite, sync_panels  # noqa: E402


def load_config() -> dict:
    with (ROOT / "config.yaml").open(encoding="utf-8") as f:
        return yaml.safe_load(f)


def docker_exec(
    container: str,
    args: list[str],
    logger,
    env: dict[str, str] | None = None,
) -> None:
    cmd = ["sudo", "docker", "exec", "-w", "/home/jovyan/work"]
    if env:
        for k, v in env.items():
            cmd.extend(["-e", f"{k}={v}"])
    cmd.append(container)
    cmd.extend(args)
    # Redact nothing here — args must not contain secrets
    logger.info("$ %s", " ".join(cmd))
    subprocess.run(cmd, check=True)


def ensure_container_deps(container: str, logger) -> None:
    """nbclient/pyyaml may already be present; install quietly if missing."""
    docker_exec(
        container,
        [
            "python",
            "-c",
            "import importlib,subprocess,sys;need=[];"
            "mods=[('nbclient','nbclient'),('nbformat','nbformat'),('yaml','pyyaml')];"
            "[need.append(pkg) for mod,pkg in mods if not importlib.util.find_spec(mod)];"
            "need and subprocess.check_call([sys.executable,'-m','pip','install','-q',*need]);"
            "print('deps ok')",
        ],
        logger,
    )


def run_job(job: str, stages_only: list[str], dry_run: bool, publish_only: bool) -> int:
    cfg = load_config()
    logs = Path(cfg["host_logs"])
    logger, log_path = setup_logger(logs, job if not publish_only else f"{job}-publish")
    logger.info("config root %s", ROOT)

    stages_file = ROOT / "stages" / f"{job}.yaml"
    if not stages_file.exists() and job not in ("publish",):
        raise SystemExit(f"unknown job: {job}")

    container = cfg["jupyter_container"]
    panel_set = "daily"

    if not publish_only and job in ("daily", "weekly"):
        spec = yaml.safe_load(stages_file.read_text(encoding="utf-8"))
        panel_set = spec.get("publish", {}).get("panel_set", job)
        notebook = spec["notebook"]
        ensure_container_deps(container, logger)

        cmd = [
            "python",
            "-m",
            "gem_pipeline.runner",
            "--notebook",
            f"{cfg['container_work']}/{notebook}",
            "--stages-file",
            f"{cfg['container_pipeline']}/stages/{job}.yaml",
            "--job",
            job,
            "--log-dir",
            f"{cfg['container_pipeline']}/logs",
        ]
        for s in stages_only:
            cmd.extend(["--stage", s])
        if dry_run:
            cmd.append("--dry-run")

        docker_exec(
            container,
            cmd,
            logger,
            env={"PYTHONPATH": cfg["container_pipeline"]},
        )
        publish_cfg = spec.get("publish", {})
    else:
        # publish-only: default panel set from --job alias
        panel_set = "weekly" if job == "weekly" else "daily"
        publish_cfg = {"panel_set": panel_set, "sqlite": True, "github": True}
        if job in ("daily", "weekly"):
            spec = yaml.safe_load(stages_file.read_text(encoding="utf-8"))
            publish_cfg = spec.get("publish", publish_cfg)
            panel_set = publish_cfg.get("panel_set", panel_set)

    if dry_run and not publish_only:
        logger.info("skip publish (dry-run)")
        logger.info("done — %s", log_path)
        return 0

    patterns = cfg[f"panels_{panel_set}"]
    html_panels = Path(cfg["host_html_panels"])
    github_panels = Path(cfg["host_github"]) / "data" / "panels"

    if publish_cfg.get("sqlite") or publish_cfg.get("github"):
        sync_panels(html_panels, github_panels, patterns, logger)

    if publish_cfg.get("sqlite"):
        migrate_sqlite(Path(cfg["host_db"]), html_panels, logger)

    if publish_cfg.get("github"):
        msg = f"automated data update {date.today().isoformat()} ({panel_set})"
        gembot_commit(
            github_dir=Path(cfg["host_github"]),
            auth_dir=Path(cfg["host_auth"]),
            gembot=cfg["gembot"],
            message=msg,
            logger=logger,
            dry_run=dry_run,
        )

    logger.info("done — %s", log_path)
    return 0


def main() -> int:
    p = argparse.ArgumentParser(description="GEM data pipeline")
    p.add_argument("job", choices=["daily", "weekly", "publish"])
    p.add_argument("--stage", action="append", default=[], help="Run only these stage ids")
    p.add_argument("--dry-run", action="store_true")
    p.add_argument(
        "--publish-only",
        action="store_true",
        help="Skip notebooks; sync panels + sqlite + git",
    )
    args = p.parse_args()
    job = "daily" if args.job == "publish" else args.job
    publish_only = args.publish_only or args.job == "publish"
    return run_job(job, args.stage, args.dry_run, publish_only)


if __name__ == "__main__":
    raise SystemExit(main())
