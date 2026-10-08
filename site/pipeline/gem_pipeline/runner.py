"""Execute notebook cell ranges inside one shared kernel (in-process).

Designed to run *inside* the jupyter container, cwd = /home/jovyan/work.
"""
from __future__ import annotations

import json
import logging
import traceback
from pathlib import Path
from typing import Iterable

from nbclient import NotebookClient
from nbformat import read as nb_read
from nbformat.v4 import new_notebook


def load_stages(path: Path) -> dict:
    import yaml

    with path.open(encoding="utf-8") as f:
        return yaml.safe_load(f)


def _should_skip_source(src: str) -> bool:
    s = src.lstrip()
    if s.startswith("!git "):
        return True
    if "git push origin" in src or "git commit --all" in src:
        return True
    return False


def build_stage_notebook(nb, stages: list[dict], logger: logging.Logger):
    """Assemble selected code/markdown cells into one executable notebook."""
    cells = []
    for stage in stages:
        start, end = stage["cells"]
        if start < 0 or end >= len(nb.cells) or start > end:
            raise IndexError(
                f"stage {stage['id']}: bad range [{start}, {end}] "
                f"(notebook has {len(nb.cells)} cells)"
            )
        logger.info(
            "stage %s cells[%s–%s] — %s",
            stage["id"],
            start,
            end,
            stage.get("description", ""),
        )
        for abs_idx in range(start, end + 1):
            cell = nb.cells[abs_idx]
            src = "".join(cell.source) if isinstance(cell.source, list) else (cell.source or "")
            if cell.cell_type == "code" and _should_skip_source(src):
                logger.info("skip cell %s (git shell — publish owns git)", abs_idx)
                continue
            cells.append(cell)
    return new_notebook(cells=cells, metadata=nb.metadata)


def run_stages(
    notebook_path: Path,
    stages: list[dict],
    only: Iterable[str] | None,
    logger: logging.Logger,
    dry_run: bool = False,
) -> None:
    nb = nb_read(notebook_path.open(encoding="utf-8"), as_version=4)
    selected = list(stages)
    if only:
        want = set(only)
        selected = [s for s in stages if s["id"] in want]
        missing = want - {s["id"] for s in selected}
        if missing:
            raise SystemExit(f"unknown stage(s): {sorted(missing)}")

    assembled = build_stage_notebook(nb, selected, logger)
    code_cells = sum(1 for c in assembled.cells if c.cell_type == "code")
    logger.info(
        "assembled %s cells (%s code) from %s",
        len(assembled.cells),
        code_cells,
        notebook_path.name,
    )
    if dry_run:
        logger.info("dry-run complete — not executing")
        return

    client = NotebookClient(
        assembled,
        timeout=60 * 90,
        kernel_name="python3",
        resources={"metadata": {"path": str(notebook_path.parent)}},
        allow_errors=False,
    )
    try:
        client.execute()
    except Exception:
        logger.error("notebook execution failed\n%s", traceback.format_exc())
        raise
    logger.info("notebook stages finished OK")


def main_inside_container(argv: list[str] | None = None) -> int:
    import argparse

    from gem_pipeline.logutil import setup_logger

    p = argparse.ArgumentParser(description="GEM pipeline stage runner (container)")
    p.add_argument("--notebook", required=True)
    p.add_argument("--stages-file", required=True)
    p.add_argument("--job", required=True)
    p.add_argument("--log-dir", required=True)
    p.add_argument("--stage", action="append", default=[])
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args(argv)

    log_dir = Path(args.log_dir)
    logger, _ = setup_logger(log_dir, args.job)
    spec = load_stages(Path(args.stages_file))
    only = args.stage or None
    run_stages(
        notebook_path=Path(args.notebook),
        stages=spec["stages"],
        only=only,
        logger=logger,
        dry_run=args.dry_run,
    )
    receipt = {
        "job": args.job,
        "notebook": args.notebook,
        "stages": [
            s["id"]
            for s in spec["stages"]
            if not only or s["id"] in only
        ],
        "dry_run": args.dry_run,
        "publish": spec.get("publish", {}),
    }
    (log_dir / f"{args.job}-last-receipt.json").write_text(
        json.dumps(receipt, indent=2), encoding="utf-8"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main_inside_container())
