// pick-issues.js
// Dependency-aware issue picker for the Dossier MVP backlog.
// Runs in GitHub Actions via actions/github-script.
//
// Reads the dependency graph from deps.json, checks which issues are already
// closed, and returns the next 1-2 eligible issues in ticket order.
// Selection is sequential (lowest ticket number first), not random.

const fs = require("fs");
const path = require("path");

module.exports = async ({ github, context, core }) => {
  const owner = context.repo.owner;
  const repo = context.repo.repo;

  // Load dependency graph
  const depsPath = path.join(
    process.env.GITHUB_WORKSPACE,
    ".github",
    "scripts",
    "deps.json"
  );
  const deps = JSON.parse(fs.readFileSync(depsPath, "utf8"));

  // Fetch all issues (open and closed) with the "mvp" label
  const allIssues = [];
  let page = 1;
  while (true) {
    const { data } = await github.rest.issues.listForRepo({
      owner,
      repo,
      labels: "mvp",
      state: "all",
      per_page: 100,
      page,
    });
    if (data.length === 0) break;
    allIssues.push(...data);
    page++;
  }

  // Build a map: ticket ID (e.g., "DOS-001") -> issue object
  const ticketMap = {};
  for (const issue of allIssues) {
    const match = issue.title.match(/\[DOS-(\d+)\]/);
    if (match) {
      const ticketId = `DOS-${match[1]}`;
      ticketMap[ticketId] = issue;
    }
  }

  // Find closed ticket IDs
  const closedTickets = new Set();
  for (const [ticketId, issue] of Object.entries(ticketMap)) {
    if (issue.state === "closed") {
      closedTickets.add(ticketId);
    }
  }

  core.info(`Closed tickets: ${[...closedTickets].join(", ") || "none"}`);

  // Find eligible tickets: open, all dependencies closed, not already assigned
  // DOS-FIX issues (from reviews) get highest priority — no dependency check needed
  const fixes = [];
  const features = [];

  for (const issue of allIssues) {
    if (issue.state === "closed") continue;
    if (issue.assignee) continue;
    const hasInProgressLabel = issue.labels.some(
      (l) => l.name === "in-progress"
    );
    if (hasInProgressLabel) continue;

    // DOS-FIX: always eligible, sorted by issue number
    if (issue.title.match(/\[DOS-FIX\]/)) {
      fixes.push({ ticketId: "DOS-FIX", issue });
      continue;
    }
  }

  for (const [ticketId, depList] of Object.entries(deps)) {
    const issue = ticketMap[ticketId];
    if (!issue) continue;
    if (issue.state === "closed") continue;
    if (issue.assignee) continue;
    const hasInProgressLabel = issue.labels.some(
      (l) => l.name === "in-progress"
    );
    if (hasInProgressLabel) continue;

    const allDepsMet = depList.every((dep) => closedTickets.has(dep));
    if (allDepsMet) {
      features.push({ ticketId, issue });
    }
  }

  // Fixes first (by issue number), then features in ticket order
  fixes.sort((a, b) => a.issue.number - b.issue.number);
  features.sort((a, b) => {
    const numA = parseInt(a.ticketId.replace("DOS-", ""), 10);
    const numB = parseInt(b.ticketId.replace("DOS-", ""), 10);
    return numA - numB;
  });
  const eligible = [...fixes, ...features];

  core.info(
    `Eligible tickets: ${eligible.map((e) => `${e.ticketId}(#${e.issue.number})`).join(", ") || "none"}`
  );

  if (eligible.length === 0) {
    core.info("No eligible issues found. Skipping.");
    core.setOutput("issues", "[]");
    core.setOutput("count", "0");
    return;
  }

  // Determine how many issues to pick (1 or 2)
  const inputCount = parseInt(process.env.INPUT_ISSUE_COUNT || "0", 10);
  let pickCount;
  if (inputCount > 0) {
    pickCount = Math.min(inputCount, eligible.length);
  } else {
    // Default: pick 1, but pick 2 if the next two share the same "day"
    // in the backlog (e.g., DOS-001 + DOS-002 are both Day 1)
    pickCount = Math.min(2, eligible.length);
  }

  // Take the first N in order
  const picked = eligible.slice(0, pickCount);

  const result = picked.map((p) => ({
    number: p.issue.number,
    ticketId: p.ticketId,
    title: p.issue.title,
  }));

  core.info(`Picked: ${result.map((r) => r.ticketId).join(", ")}`);
  core.setOutput("issues", JSON.stringify(result));
  core.setOutput("count", String(result.length));
};
