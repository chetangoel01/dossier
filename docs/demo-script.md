# Dossier — Demo Walkthrough

A 10-minute guided tour of the MVP that follows the capture → synthesis → brief arc. Use this script for stakeholder demos, engineering walkthroughs, or to validate a fresh environment after `npm run db:seed`.

The demo data is a single investigation — **Northgate Pharma — FDA Warning Letter Investigation** — built to exercise every core object and the evidence chain that ties them together.

---

## 0. Setup (30 seconds, done once)

```bash
# From a clean checkout
cp .env.example .env.local          # fill DATABASE_URL and AUTH_SECRET
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Demo credentials:**

- Email: `demo@dossier.local`
- Password: `password`

---

## 1. The Dossier List (30 seconds)

**Route:** `/dossiers`

**Narration:**

> Dossier is an analyst workbench built around structured evidence — not a notes app. Every piece of work lives inside a _dossier_, a single investigation with a research goal.

**Show:**

- The list page with the Northgate investigation, its summary, status, and priority.
- Click the dossier to enter the workspace.

---

## 2. The Workspace Shell (20 seconds)

**Route:** `/dossiers/[id]/overview`

**Narration:**

> Each dossier is a durable workspace with seven tabs — Overview, Sources, Claims, Entities, Timeline, Brief, Activity. The tabs preserve context as you move between them.

**Show:**

- Tab bar. Press `]` to move forward through tabs, `[` to move back.
- The overview surfaces research goal, tag facets, and recent activity.

---

## 3. Capture — The Sources Index (1 minute)

**Route:** `/dossiers/[id]/sources`

**Narration:**

> Capture comes first. Sources are typed — web links, PDFs, pasted text, internal memos. Each carries a review state, credibility rating, and tags. The review state turns a pile of raw captures into a triaged workspace.

**Show:**

- Four _reviewed_ sources (FDA letter, Reuters coverage, internal memo, expert interview) and one _unreviewed_ source (a 2023 CEO shareholder letter that was just clipped and still needs attention).
- Filter by review state or tag.
- Open the **New Source** modal to demonstrate the three capture paths (URL, paste, manual). Close without saving.

---

## 4. The Evidence Gutter — Source Reader (2 minutes)

**Route:** `/dossiers/[id]/sources/[sourceId]` — open the **FDA Warning Letter**.

**Narration:**

> This is the signature UX of the product. The reader has three columns: a table of contents on the left, the source text in the middle, and an inspector on the right. Highlights appear as thin marked bands in the left reading gutter.

**Show:**

1. The FDA letter source opens to the full text with two pre-seeded highlights visible in the gutter.
2. Click the highlight on **"47 instances of data backdating"** — the inspector expands with the quote, label (`stat`), annotation, and the claims it supports.
3. Make a new highlight: select any passage in the text, assign a label (`evidence`, `question`, `counterpoint`, `stat`, `quote`), and add an annotation. It persists immediately and appears in the gutter.
4. Press `\` to collapse the inspector. Press `\` again to expand it.

---

## 5. Synthesis — Claims (1 minute)

**Route:** `/dossiers/[id]/claims`

**Narration:**

> Claims are the researcher's thesis statements. Each one carries a confidence score, a status (open, supported, contested, deprecated), and a set of highlights as backing evidence.

**Show:**

- Three seeded claims:
  - **Violations were systemic** — 85% confidence, _supported_, backed by 3 highlights across the FDA letter, Reuters, and the expert interview.
  - **Executive knowledge pre-dated inspection by 21+ months** — 90% confidence, _supported_, anchored on the June 2022 internal memo.
  - **Financial exposure likely exceeds the $40M analyst floor** — 65% confidence, _open_, backed by the expert's pushback.
- Click a claim row — the inspector shows the linked highlights. Click a highlight to jump back to the exact passage in the reader.

---

## 6. The People and Companies — Entities (1 minute)

**Route:** `/dossiers/[id]/entities`

**Narration:**

> Entities are the people, companies, and topics that recur across sources. Mentions are the back-links: every time an entity appears in a source, the mention records where.

**Show:**

- Four seeded entities: Northgate Pharmaceutical Inc., Dr. Sandra Wei (CSO), Raymond Chu (VP QA), David Harrington (CEO).
- Click **David Harrington** — the drawer shows his role plus mentions in the June 2022 escalation memo and the 2023 shareholder letter. These are the two documents that create the most pointed tension in the case.

---

## 7. Timeline (45 seconds)

**Route:** `/dossiers/[id]/timeline`

**Narration:**

> The timeline pulls every dated event across the investigation into one chronology. Events link to claims, so you can trace how the narrative of a claim unfolds over time.

**Show the ordered timeline:**

1. **June 14, 2022** — Internal QA escalation (Chu → Wei + Harrington)
2. **March 22, 2023** — CEO asserts "industry-leading quality culture" in annual letter ← _this is the tension_
3. **October 16, 2023** — FDA inspection begins
4. **January 8, 2024** — FDA issues Warning Letter WL-2024-0108

> Notice the 2023 shareholder letter is sandwiched between the internal escalation and the FDA inspection — it's the kind of pattern you only see when events are arranged on a shared timeline.

---

## 8. Synthesis — The Brief (2 minutes)

**Route:** `/dossiers/[id]/brief`

**Narration:**

> The brief is where findings become a defensible document. The editor supports Markdown with inline citation tokens — every claim in the brief links back to either a highlight or a source.

**Show:**

1. The pre-seeded draft brief opens with three sections, citation chips rendered inline next to the claims they support.
2. Click a citation chip — it navigates back to the exact highlight in the reader. This is the evidence chain the product is built to preserve.
3. Edit a paragraph. Autosave fires in the background.
4. Click **Export** — download as Markdown and PDF. Open the Markdown to show that citation tokens resolve into footnotes.

---

## 9. Global Search (30 seconds)

**Route:** `/search` or press `Cmd/Ctrl + K`

**Narration:**

> Search runs across every object type — sources, claims, entities, events, briefs — scoped to the current user. It's the fastest way to jump back to an artifact when you can only half-remember what you called it.

**Show:**

- Press `Cmd/Ctrl + K` — the command bar opens. Type `chu` — mentions, the memo, and the escalation event all appear grouped by type.
- Press `↵` to jump straight to the memo source.

---

## 10. Close — The Evidence Chain (30 seconds)

**Narration:**

> What you just saw is the product's core loop. A researcher captures scattered sources, pulls out structured evidence as highlights, synthesizes claims backed by those highlights, connects entities and events, and produces a brief where every assertion is clickable back to its primary source. That's what "defensible research" means here.

End on the brief with a citation chip highlighted.

---

## Reset Between Demos

```bash
npm run db:seed
```

The seed script is idempotent: it deletes the demo user and re-creates the full dataset, so you can reset to a clean demo state in about 2 seconds.

## Known Gotchas for Demo Day

- **Cold DB:** Prisma's first query in a fresh Node process has a noticeable latency. Open any dossier page _before_ starting the demo to warm the connection.
- **PDF export:** Renders via a print-optimized route (`/briefs/[id]/print`) — make sure popups aren't blocked in the browser you demo in.
- **Auth:** Sessions are cookie-based via Auth.js. If you sign out mid-demo, you'll land back on `/login`.
