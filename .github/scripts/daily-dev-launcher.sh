#!/bin/bash
# daily-dev-launcher.sh — Wrapper that adds a random delay before running daily-dev.sh
# This creates organic-feeling timing variation without wasting CI minutes.
#
# Called by launchd at a fixed time; the random sleep makes actual execution vary.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Random delay: 0 to 3 hours (10800 seconds)
DELAY=$((RANDOM % 10800))
DELAY_MIN=$((DELAY / 60))

echo "[$(date)] Daily dev launcher started. Sleeping ${DELAY_MIN} minutes before executing..."
sleep $DELAY

echo "[$(date)] Starting daily development run..."
"$SCRIPT_DIR/daily-dev.sh"
