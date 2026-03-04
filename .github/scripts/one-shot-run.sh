#!/bin/bash
# One-shot wrapper: runs daily-dev.sh, then resets plist to normal schedule (6 AM + delay)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLIST="$HOME/Library/LaunchAgents/com.dossier.daily-dev.plist"
REPO_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Run the actual dev script
"$SCRIPT_DIR/daily-dev.sh"

# Reset plist back to 6 AM with the launcher (delay wrapper)
launchctl unload "$PLIST" 2>/dev/null || true

cat > "$PLIST" <<PLISTEOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.dossier.daily-dev</string>

    <key>ProgramArguments</key>
    <array>
        <string>${REPO_DIR}/.github/scripts/daily-dev-launcher.sh</string>
    </array>

    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>6</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>

    <key>StandardOutPath</key>
    <string>${REPO_DIR}/.github/logs/launchd-stdout.log</string>

    <key>StandardErrorPath</key>
    <string>${REPO_DIR}/.github/logs/launchd-stderr.log</string>

    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/Users/chetangoel/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    </dict>
</dict>
</plist>
PLISTEOF

launchctl load "$PLIST"
echo "[$(date)] Plist reset to 6:00 AM with delay launcher."
