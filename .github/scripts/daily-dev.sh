#!/bin/bash
set -euo pipefail

# daily-dev.sh — Local daily development automation for Dossier
#
# Picks 1-2 eligible issues from the backlog, runs Claude Code locally
# (using your subscription, not API billing), and opens PRs.
#
# Usage:
#   ./daily-dev.sh              # random 1-2 issues
#   ./daily-dev.sh --count 1    # exactly 1 issue
#   ./daily-dev.sh --issue 5    # specific issue number

REPO_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
REPO="chetangoel01/dossier"
DEPS_FILE="$REPO_DIR/.github/scripts/deps.json"
LOG_DIR="$REPO_DIR/.github/logs"

mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/daily-dev-$(date +%Y%m%d-%H%M%S).log"

log() { echo "[$(date '+%H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

# Parse arguments
PICK_COUNT=0  # 0 = random
SPECIFIC_ISSUE=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --count) PICK_COUNT="$2"; shift 2 ;;
    --issue) SPECIFIC_ISSUE="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

cd "$REPO_DIR"

# Make sure we're on main and up to date
log "Updating main branch..."
git checkout main
git pull origin main

# ─── Issue Picker ───────────────────────────────────────────────

pick_issues() {
  if [[ -n "$SPECIFIC_ISSUE" ]]; then
    echo "$SPECIFIC_ISSUE"
    return
  fi

  # Get all open MVP issues
  local open_issues
  open_issues=$(gh issue list --repo "$REPO" --label mvp --state open --json number,title,labels --limit 100)

  # Get all closed MVP issues to check dependencies
  local closed_issues
  closed_issues=$(gh issue list --repo "$REPO" --label mvp --state closed --json number,title --limit 100)

  # Use node to run the dependency logic
  node -e "
    const fs = require('fs');
    const deps = JSON.parse(fs.readFileSync('$DEPS_FILE', 'utf8'));
    const open = JSON.parse(process.argv[1]);
    const closed = JSON.parse(process.argv[2]);
    const pickCount = parseInt(process.argv[3]) || 0;

    // Map ticket IDs to issue numbers
    const ticketToNumber = {};
    const numberToTicket = {};
    [...open, ...closed].forEach(i => {
      const m = i.title.match(/\[DOS-(\d+)\]/);
      if (m) {
        const tid = 'DOS-' + m[1];
        ticketToNumber[tid] = i.number;
        numberToTicket[i.number] = tid;
      }
    });

    // Closed ticket IDs
    const closedTickets = new Set();
    closed.forEach(i => {
      const m = i.title.match(/\[DOS-(\d+)\]/);
      if (m) closedTickets.add('DOS-' + m[1]);
    });

    // Find eligible: open, deps met, not in-progress
    const eligible = [];
    open.forEach(i => {
      const m = i.title.match(/\[DOS-(\d+)\]/);
      if (!m) return;
      const tid = 'DOS-' + m[1];
      const inProgress = i.labels && i.labels.some(l => l.name === 'in-progress');
      if (inProgress) return;
      const d = deps[tid] || [];
      if (d.every(dep => closedTickets.has(dep))) {
        eligible.push(i.number);
      }
    });

    if (eligible.length === 0) { process.exit(0); }

    // Shuffle
    for (let i = eligible.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [eligible[i], eligible[j]] = [eligible[j], eligible[i]];
    }

    // Pick count
    let n = pickCount > 0 ? pickCount : (Math.random() < 0.6 ? 1 : 2);
    n = Math.min(n, eligible.length);

    console.log(eligible.slice(0, n).join(' '));
  " "$open_issues" "$closed_issues" "$PICK_COUNT"
}

log "Picking eligible issues..."
ISSUES=$(pick_issues)

if [[ -z "$ISSUES" ]]; then
  log "No eligible issues found. Done."
  exit 0
fi

log "Selected issues: $ISSUES"

# ─── Implement Each Issue ───────────────────────────────────────

implement_issue() {
  local issue_number=$1

  # Fetch issue details
  local issue_json
  issue_json=$(gh issue view "$issue_number" --repo "$REPO" --json title,body,labels)
  local title
  title=$(echo "$issue_json" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.title)")
  local body
  body=$(echo "$issue_json" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.body)")

  # Extract ticket ID
  local ticket_id
  ticket_id=$(echo "$title" | grep -oE 'DOS-[0-9]+' | head -1)
  local ticket_lower
  ticket_lower=$(echo "$ticket_id" | tr '[:upper:]' '[:lower:]')

  # Branch name
  local branch_slug
  branch_slug=$(echo "$title" | sed "s/\[DOS-[0-9]*\] //" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '-' | head -c 40 | sed 's/-$//')
  local branch_name="${ticket_lower}-${branch_slug}"

  log "═══════════════════════════════════════════════════"
  log "Implementing: #${issue_number} — ${title}"
  log "Branch: ${branch_name}"
  log "═══════════════════════════════════════════════════"

  # Create branch from latest main
  git checkout main
  git pull origin main
  git checkout -b "$branch_name"

  # Label as in-progress
  gh issue edit "$issue_number" --repo "$REPO" --add-label "in-progress"

  # Write issue body to a temp file (avoids shell escaping issues)
  local body_file
  body_file=$(mktemp)
  echo "$body" > "$body_file"

  # Run Claude Code (uses local subscription, not API billing)
  # Unset CLAUDECODE to allow spawning from within another session or automation
  log "Running Claude Code..."
  local prompt
  prompt="You are implementing a GitHub issue for the Dossier project.

Read CLAUDE.md first for project context and conventions.
Read docs/product-spec.md for the full product specification.

## Issue #${issue_number}: ${title}

$(cat "$body_file")

## Instructions

1. Read the existing codebase to understand what already exists.
2. Implement exactly what the issue asks for — no more, no less.
3. Follow the code conventions in CLAUDE.md strictly.
4. Follow the design direction in CLAUDE.md and docs/product-spec.md.
5. If package.json exists, run: npm run lint, npm run typecheck, npm run test. Fix any failures.
6. If package.json exists, make sure npm run build succeeds.
7. Stage and commit all your changes with the message: [${ticket_id}] <short description of what you built>"

  env -u CLAUDECODE claude -p "$prompt" --allowedTools "Bash,Read,Write,Edit,Glob,Grep" 2>&1 | tee -a "$LOG_FILE" || true

  rm -f "$body_file"

  # Check if there are changes
  if [[ -z "$(git status --porcelain)" && -z "$(git log origin/main..HEAD --oneline 2>/dev/null)" ]]; then
    log "WARNING: No changes produced. Skipping PR."
    git checkout main
    git branch -D "$branch_name"
    gh issue edit "$issue_number" --repo "$REPO" --remove-label "in-progress"
    return 1
  fi

  # Commit any uncommitted changes
  if [[ -n "$(git status --porcelain)" ]]; then
    git add -A
    git commit -m "[${ticket_id}] Implement ${title}"
  fi

  # Push and create PR
  log "Pushing branch and creating PR..."
  git push origin "$branch_name"

  gh pr create \
    --repo "$REPO" \
    --title "$title" \
    --body "## Summary

Automated implementation of ${ticket_id}.

Closes #${issue_number}

## Validation

- [ ] Code builds successfully
- [ ] Lint passes
- [ ] Typecheck passes
- [ ] Tests pass (if applicable)
- [ ] Matches design direction from product spec" \
    --base main \
    --head "$branch_name"

  # Remove in-progress label
  gh issue edit "$issue_number" --repo "$REPO" --remove-label "in-progress"

  log "PR created for ${ticket_id}."

  # Go back to main
  git checkout main
}

# Process each issue
FAIL_COUNT=0
for issue_num in $ISSUES; do
  if ! implement_issue "$issue_num"; then
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
done

log "Done. Issues attempted: $(echo $ISSUES | wc -w | tr -d ' '). Failures: $FAIL_COUNT"
