#!/bin/bash
set -euo pipefail

# daily-dev.sh — Pick and implement the next issue(s) for Dossier
#
# Usage:
#   ./daily-dev.sh              # next 1-2 issues
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
    const fixes = [];
    const features = [];
    open.forEach(i => {
      const inProgress = i.labels && i.labels.some(l => l.name === 'in-progress');
      if (inProgress) return;

      // DOS-FIX issues: always eligible, highest priority
      if (i.title.match(/\[DOS-FIX\]/)) {
        fixes.push({ number: i.number, ticketNum: -1 });
        return;
      }

      const m = i.title.match(/\[DOS-(\d+)\]/);
      if (!m) return;
      const tid = 'DOS-' + m[1];
      const num = parseInt(m[1], 10);
      const d = deps[tid] || [];
      if (d.every(dep => closedTickets.has(dep))) {
        features.push({ number: i.number, ticketNum: num });
      }
    });

    // Fixes first (by issue number), then features in ticket order
    fixes.sort((a, b) => a.number - b.number);
    features.sort((a, b) => a.ticketNum - b.ticketNum);
    const eligible = [...fixes, ...features];

    if (eligible.length === 0) { process.exit(0); }

    // Pick count: explicit or default to 2
    let n = pickCount > 0 ? pickCount : Math.min(2, eligible.length);
    n = Math.min(n, eligible.length);

    console.log(eligible.slice(0, n).map(e => e.number).join(' '));
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
  ticket_id=$(echo "$title" | grep -oE 'DOS-[A-Z0-9]+' | head -1)
  local ticket_lower
  ticket_lower=$(echo "$ticket_id" | tr '[:upper:]' '[:lower:]')

  # Determine conventional commit prefix from labels
  local cc_prefix="feat"
  local labels
  labels=$(echo "$issue_json" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.labels.map(l=>l.name).join(','))")
  case "$labels" in
    *bug*|*hardening*) cc_prefix="fix" ;;
    *docs*)            cc_prefix="docs" ;;
    *ui*|*design*)     cc_prefix="style" ;;
  esac

  # Build conventional commit title: feat(DOS-001): short description
  local short_title
  short_title=$(echo "$title" | sed 's/\[DOS-[A-Z0-9]*\] *//')
  local cc_title="${cc_prefix}(${ticket_id}): ${short_title}"

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
  if git show-ref --verify --quiet "refs/heads/$branch_name"; then
    log "WARNING: Branch $branch_name already exists. Deleting and recreating."
    git branch -D "$branch_name"
  fi
  git checkout -b "$branch_name"

  # Label as in-progress
  gh issue edit "$issue_number" --repo "$REPO" --add-label "in-progress"

  # Cleanup trap — fires on SIGINT/SIGTERM so label and branch don't get stuck
  trap "log 'Interrupted during ${ticket_id}. Cleaning up.'; git checkout main 2>/dev/null || true; git branch -D '${branch_name}' 2>/dev/null || true; gh issue edit '${issue_number}' --repo '${REPO}' --remove-label 'in-progress' 2>/dev/null || true; trap - INT TERM" INT TERM

  # Write issue body to a temp file (avoids shell escaping issues)
  local body_file
  body_file=$(mktemp)
  echo "$body" > "$body_file"

  # Unset CLAUDECODE to allow spawning from within another session
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
7. Stage and commit all your changes with the message format: ${cc_prefix}(${ticket_id}): <short description of what you built>"

  env -u CLAUDECODE /Users/chetangoel/.local/bin/claude -p "$prompt" --allowedTools "Bash,Read,Write,Edit,Glob,Grep" 2>&1 | tee -a "$LOG_FILE" || true

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
    git commit -m "${cc_title}"
  fi

  # Push and create PR
  log "Pushing branch and creating PR..."
  git push origin "$branch_name"

  local pr_url
  pr_url=$(gh pr create \
    --repo "$REPO" \
    --title "$cc_title" \
    --body "## Summary

${cc_title}

Closes #${issue_number}

## Validation

- [ ] Code builds successfully
- [ ] Lint passes
- [ ] Typecheck passes
- [ ] Tests pass (if applicable)
- [ ] Matches design direction from product spec" \
    --base main \
    --head "$branch_name")

  log "PR created: $pr_url"

  # ─── Code Review (separate Claude session) ──────────────────
  log "Running code review..."
  local pr_number
  pr_number=$(echo "$pr_url" | grep -oE '[0-9]+$')

  local diff
  diff=$(git diff origin/main...HEAD)

  local diff_file
  diff_file=$(mktemp)
  echo "$diff" > "$diff_file"

  local review_prompt
  review_prompt="You are reviewing a pull request for the Dossier project.

Read CLAUDE.md for project conventions and design direction.
Read docs/product-spec.md for the full product specification.

## PR: ${title} (#${pr_number})
## Issue: #${issue_number}

Read the file ${body_file} for the original issue requirements.

The diff is in ${diff_file}. Read it.

## Review Instructions

Review this implementation against:
1. **Issue requirements** — Does it implement what the issue asked for? Anything missing? Anything extra?
2. **CLAUDE.md conventions** — Naming, file organization, styling approach, TypeScript strictness.
3. **Design direction** — Does the UI match the editorial intelligence desk aesthetic? Correct color tokens? Correct fonts?
4. **Code quality** — Obvious bugs, security issues, missing error handling, dead code.
5. **Build health** — If package.json exists, run npm run lint, npm run typecheck, npm run build. Report any failures.

## Output Format

Your output MUST contain two sections separated by the exact delimiter line shown below.

SECTION 1: The review comment in markdown.

### Summary
One paragraph: what was built, overall quality assessment.

### Checklist
- [ ] or [x] for: Meets issue requirements, Follows code conventions, Matches design direction, No obvious bugs, Build passes

### Issues Found
List any problems by severity (critical / warning / nit). If none, say 'No issues found.'

### Suggestions
Optional improvements that aren't blockers.

Then output this exact delimiter line:

---FOLLOW_UP_ISSUES_JSON---

SECTION 2: A JSON array of follow-up issues for any warnings or critical issues found.
Only create issues for concrete, actionable problems — NOT for nits or nice-to-haves.
Each issue object must have: title (string), body (string), labels (array of strings).
The title must start with [DOS-FIX] and reference the original ticket.
If there are no actionable issues, output an empty array: []

Example:
[{\"title\": \"[DOS-FIX] Wire up globals.css import in layout.tsx (from DOS-001 review)\", \"body\": \"## Summary\nThe globals.css file exists but is not imported in layout.tsx, so the CSS reset is not applied.\n\n## Fix\nAdd import in layout.tsx.\n\n## Found During\nReview of #29 (DOS-001)\", \"labels\": [\"bug\", \"mvp\"]}]

Do NOT write any files. Only output the two sections described above."

  local review_output
  review_output=$(env -u CLAUDECODE /Users/chetangoel/.local/bin/claude -p "$review_prompt" --allowedTools "Bash,Read,Glob,Grep" 2>&1) || true

  rm -f "$diff_file"
  rm -f "$body_file"

  if [[ -z "$review_output" ]]; then
    log "WARNING: Review produced no output."
  else
    # Split output on the delimiter
    local review_comment
    local follow_up_json
    review_comment=$(echo "$review_output" | sed -n '/---FOLLOW_UP_ISSUES_JSON---/q;p')
    follow_up_json=$(echo "$review_output" | sed -n '/---FOLLOW_UP_ISSUES_JSON---/,$ { /---FOLLOW_UP_ISSUES_JSON---/d; p; }')

    # Post review as a PR comment
    local review_file
    review_file=$(mktemp)
    cat > "$review_file" <<REVIEWEOF
## Code Review

${review_comment}
REVIEWEOF

    gh pr comment "$pr_number" --repo "$REPO" --body-file "$review_file"
    rm -f "$review_file"
    log "Review posted to PR #${pr_number}."

    # Create follow-up issues from review findings
    if [[ -n "$follow_up_json" ]]; then
      # Extract the JSON array — use node to handle multiline JSON correctly
      local clean_json
      clean_json=$(echo "$follow_up_json" | node -e "
        const input = require('fs').readFileSync('/dev/stdin','utf8');
        const match = input.match(/(\[[\s\S]*\])/);
        if (match) { try { JSON.parse(match[1]); process.stdout.write(match[1]); } catch(e) {} }
      " 2>/dev/null) || clean_json=""

      if [[ -n "$clean_json" && "$clean_json" != "[]" ]]; then
        local issue_count
        issue_count=$(echo "$clean_json" | node -e "
          const json = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
          console.log(json.length);
        " 2>/dev/null) || issue_count=0

        if [[ "$issue_count" -gt 0 ]]; then
          log "Creating ${issue_count} follow-up issue(s) from review..."
          echo "$clean_json" | node -e "
            const json = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
            json.forEach((issue, i) => {
              console.log(JSON.stringify(issue));
            });
          " | while IFS= read -r issue_line; do
            local fu_title fu_body fu_labels
            fu_title=$(echo "$issue_line" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.title)")
            fu_body=$(echo "$issue_line" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.body)")
            fu_labels=$(echo "$issue_line" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.labels.join(','))")

            local fu_body_file
            fu_body_file=$(mktemp)
            echo "$fu_body" > "$fu_body_file"

            local fu_url
            fu_url=$(gh issue create --repo "$REPO" \
              --title "$fu_title" \
              --label "$fu_labels" \
              --body-file "$fu_body_file")
            rm -f "$fu_body_file"
            log "Follow-up issue created: $fu_url"
          done
        else
          log "Review clean — no follow-up issues needed."
        fi
      else
        log "Review clean — no follow-up issues needed."
      fi
    fi
  fi

  # Remove in-progress label and clear the cleanup trap
  trap - INT TERM
  gh issue edit "$issue_number" --repo "$REPO" --remove-label "in-progress"

  log "Done with ${ticket_id}."

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
