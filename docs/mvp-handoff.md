# Dossier — MVP Handoff

This document closes out the 28-ticket MVP cadence (DOS-001 through DOS-028). It's the orientation an engineer needs to pick up the project and keep moving without reverse-engineering the backlog.

Read this alongside:

- [`product-spec.md`](./product-spec.md) — the full product definition
- [`mvp-tickets.md`](./mvp-tickets.md) — the completed ticket backlog
- [`demo-script.md`](./demo-script.md) — the 10-minute walkthrough
- [`../CLAUDE.md`](../CLAUDE.md) — code conventions and design direction

---

## 1. What the MVP Covers

The product is an evidence-first research workspace. The capture → synthesis → brief arc works end-to-end for a single user on their private data.

### Core object model (all implemented)

| Object | Status | Notes |
|---|---|---|
| Users | ✅ | Auth.js (NextAuth v5) with credentials provider, password hashing via bcryptjs |
| Dossiers | ✅ | List, create, rename, archive; owner-scoped |
| Sources | ✅ | Five types (web link, PDF, pasted text, manual note, internal memo); URL prefetch, PDF text extraction, file upload, review states, credibility ratings |
| Highlights | ✅ | Text selection, labels, annotations, persistent offsets, evidence gutter rendering |
| Claims | ✅ | Confidence, status, notes; create-from-highlight flow; highlight backing |
| Entities | ✅ | Types (person, company, product, location, institution, topic), aliases, importance |
| Mentions | ✅ | Backlink from entity → source/highlight with context snippet |
| Events | ✅ | Date + precision, optional claim link, highlight and entity associations |
| Briefs | ✅ | One per dossier, Markdown body with inline citation tokens, version field, autosave |
| Tags | ✅ | Cross-object: applied to sources, claims, entities, events |

### Features delivered

- **Dossier workspace shell** with tab routing: Overview, Sources, Claims, Entities, Timeline, Brief, Activity. Keyboard navigation via `[` / `]` and inspector toggle via `\`.
- **Source reader** with the signature **evidence gutter** — highlight bands in the left reading gutter, expanding an evidence card in the right inspector.
- **Source capture** flows for URL prefetch, paste, manual note, and PDF/text file upload.
- **Global search** (`/search` and `Cmd/Ctrl + K` command bar) across sources, claims, entities, events, and briefs — PostgreSQL full-text search, no vector store.
- **Brief editor** with inline citation tokens (`[[cite:highlight:<id>]]`, `[[cite:source:<id>]]`) that render as chips and resolve to footnotes in exports.
- **Exports**: Markdown (direct download) and PDF (via print-optimized `/briefs/[id]/print` route).
- **Autosave, validation, and failure handling** across notes, claims, and briefs (DOS-027 hardening pass).
- **Empty states, loading states, and motion rules** (DOS-026 polish pass).
- **Design system tokens** in `globals.css`: paper palette, Newsreader / IBM Plex Sans / IBM Plex Mono typography, editorial layout primitives.

### Security / ownership

- All records scoped to `owner_id = userId`. Cross-user reads and writes are rejected at the query layer.
- Server-side route protection via `middleware.ts` plus per-route session checks.
- SSRF protection on URL prefetch (`src/lib/ssrf.ts`).
- File uploads hit a size-bounded handler at `/api/sources/upload` and go to local disk under `storage/` (see `src/lib/storage.ts`).

### Tests

- Vitest with jsdom for components and unit logic. 23 test files covering auth config, citations parsing, brief export, highlight actions, factories, and key query paths.
- Tests are illustrative, not exhaustive. See "Known Gaps" below.

---

## 2. Known Gaps

These are the honest edges of the MVP. None of them block the demo.

### Data / storage

- **File storage is local disk.** `src/lib/storage.ts` writes uploads under a `storage/` directory relative to the working directory. Fine for local dev and single-host deploys; needs S3 or equivalent before multi-host hosting.
- **Brief has no version history.** The `version` column exists on `briefs` but is never incremented — old drafts are overwritten by autosave. Listed in the spec's "natural post-MVP tickets."
- **No soft delete.** Destructive actions (remove source, delete highlight, archive dossier) either hard-delete or toggle a status field. Archival is a status change on dossiers only; sources and highlights hard-delete with cascade.
- **Tag management is minimal.** Tags are created by name; there is no UI to rename, merge, or delete tags globally.

### Capture

- **URL prefetch is naive.** Uses a simple HTML fetch + readability-style extraction. Paywalled, JS-heavy, or bot-protected pages will fall back to pasted text. No browser clipping extension.
- **PDF extraction uses `pdf-parse`.** Works well for digital-native PDFs; scanned PDFs with no embedded text come through empty. There is no OCR path.

### Synthesis

- **Claims do not detect contradictions automatically.** A claim can be marked `contested` manually, but the product does not flag when two claims conflict.
- **Entities have no relationship graph.** Co-mention counts exist implicitly via the mention table but there is no entity graph view.
- **No AI-assisted drafting.** The product is intentionally non-AI: no source summarization, no suggested highlights, no auto-draft brief. This is a product stance, not a gap — but it's the first thing most viewers ask about.

### UX polish

- **No saved views / filters.** Sources index and claims index have per-visit filters; the chosen filter state does not persist across sessions or as named views.
- **Command bar results are flat.** Grouped by object type, but no fuzzy matching and no recent-items section.
- **Keyboard shortcut help is implicit.** Shortcuts exist (`Cmd/Ctrl + K`, `[` / `]`, `\`) but there is no `?` cheat-sheet dialog.
- **Mobile is unsupported.** The app is designed for desktop research workflows; narrow viewports will reflow but the three-column reader is not built for touch.

### Operational

- **No deployment pipeline.** `npm run build` succeeds; there is no hosting configured. `Dockerfile` and CI/CD are not part of the MVP.
- **No observability.** No structured logging, no error reporting, no metrics. Server errors print to stdout.
- **No email delivery.** Auth is password-based and does not send verification, password reset, or magic-link emails.

---

## 3. Next Logical Tickets

These are the tickets the spec identifies as the cleanest next work, ordered roughly by leverage-to-effort.

| # | Ticket | Why it's next |
|---|---|---|
| 1 | Saved views for Sources and Claims | The index pages already accept filter params; persistence and naming is a small step on top and immediately improves day-to-day workflow. |
| 2 | Brief version history | Data column exists; needs a snapshot-on-publish flow and a diff viewer. High value for "defensible research" positioning. |
| 3 | Richer tag filtering and tag management | Tags are first-class but under-surfaced. A tag admin page plus multi-tag filter in indices unlocks power-user behavior. |
| 4 | Entity relationship graph | The mention table already contains the co-occurrence data. A force-directed or timeline-based graph view turns it into a visible product capability. |
| 5 | Browser-based web clipping | The current URL prefetch is server-side. A browser extension that can capture from authenticated pages would close the biggest capture gap. |
| 6 | AI-assisted source summary draft | The spec notes this as a future option, not a default. If pursued, scope it tightly: suggest a summary, require user accept; never auto-write into a brief. |
| 7 | Contradiction detection between claims | Natural extension of the `contested` status; could be rule-based (shared entity + opposing confidence) before any ML. |

### Not in the backlog (on purpose)

- **Collaboration / sharing.** Dossier is private-by-default. Sharing flows change the auth model and the UI, and were out of MVP scope.
- **Embeddings / vector search.** Explicit spec decision: search is PostgreSQL FTS only.

---

## 4. Project Layout Reference

```
src/
  app/                         # Next.js App Router
    (auth)/                    # login, signup
    api/
      auth/[...nextauth]/      # Auth.js handlers
      search/                  # Global search endpoint
      sources/
        prefetch-url/          # URL capture
        upload/                # File upload handler
      dossiers/[id]/brief/export/
    dossiers/                  # List + workspace tabs
    briefs/[dossierId]/print/  # Print-optimized brief for PDF export
    search/                    # /search results page
  components/
    auth/ briefs/ claims/ command/ dossiers/ entities/ search/ sources/ ui/
  lib/
    db.ts citations.ts briefExport.ts validation.ts
    ssrf.ts storage.ts entities.ts events.ts
  server/
    actions/                   # Server actions (mutations)
    queries/                   # Data access
  types/
  test/                        # Vitest setup
  auth.ts auth.config.ts middleware.ts

prisma/
  schema.prisma
  migrations/                  # 4 migrations (init, password, file fields, search indexes)
  seed.ts                      # Demo data

docs/
  product-spec.md
  mvp-tickets.md
  demo-script.md
  mvp-handoff.md               # this file
```

---

## 5. How to Pick Up the Project

1. **Read `CLAUDE.md`.** It encodes the design direction, naming conventions, and the hard "do not" list (no AI features, no large UI libs, no pure white surfaces).
2. **Run the demo.** Follow `demo-script.md` end-to-end. If something feels wrong in the walkthrough, that's a real bug.
3. **Read the product spec.** The editorial aesthetic and the evidence-first product stance are load-bearing. Features that violate them are out of scope by default.
4. **Pick a ticket from Section 3.** Open a branch following the `dos-XXX-short-description` convention.
5. **Commit with Conventional Commits.** `feat(DOS-XXX): …`, `fix(DOS-XXX): …`, `style(DOS-XXX): …`. One logical commit per ticket when possible.
