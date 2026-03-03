#!/bin/bash
# daily-dev-launcher.sh — Wrapper that adds a random delay before running daily-dev.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Random delay: 0 to 3 hours (10800 seconds)
DELAY=$((RANDOM % 10800))
DELAY_MIN=$((DELAY / 60))

echo "[$(date)] Sleeping ${DELAY_MIN} minutes before starting..."
sleep $DELAY

echo "[$(date)] Starting..."
"$SCRIPT_DIR/daily-dev.sh"
