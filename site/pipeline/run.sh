#!/bin/bash
# Host wrapper for cron / manual runs
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p logs
export PYTHONUNBUFFERED=1
exec python3 run.py "$@"
