# Onboarding & archive — design

**Date:** 2026-04-24
**Scope:** First-run experience at `/dossiers` plus archive UI on dossier rows.

## Goal

Make the first-run experience at `/dossiers` legible without a tutorial. New users should immediately understand what dossiers are for and have two ways to start: blank slate, or pre-loaded sample they can poke through. They should also be able to dismiss the sample (or any dossier) when done.

## Pieces

### 1. Richer empty state at `/dossiers`

Currently a one-line `EmptyState`. Becomes:

- The same `EmptyState` component (unchanged ornament, mono eyebrow, serif italic body) with refreshed copy:
  - eyebrow: *"No dossiers yet."*
  - message: *"Start your first dossier — or load a sample to see how the pieces fit."*
  - `action`: two buttons — "Start a dossier" (primary, opens `NewDossierModal`) and "Load sample dossier" (ghost, calls `seedSampleDossier`).
- Beneath the EmptyState, a 3-column workflow strip (extracted into `<WorkflowStrip />`, shared with the landing page):
  - `01 / SOURCES` — *"Web pages, PDFs, transcripts. Captured with provenance intact."*
  - `02 / EVIDENCE` — *"Highlights become citations. Citations support claims."*
  - `03 / BRIEFS` — *"Compose defensible memos that point back to every source."*

### 2. Sample dossier seeder

- New helper `buildSampleDossier(client, ownerId)` in `src/server/lib/sample-dossier.ts`. Takes a Prisma client and the user id; builds the curated content (currently inlined in `prisma/seed.ts`); returns `{ dossierId }`.
- New server action `seedSampleDossier()` in `src/server/actions/sample-dossier.ts` — auth-gates the helper, calls it with the app's `db`, then redirects the user to the new dossier's overview page.
- `prisma/seed.ts` refactored to consume the same helper so the curated content has one source of truth (no drift between CLI seed and user-facing seed).
- Sample dossier title: *"Northgate Pharma — FDA Warning Letter Investigation"* (same as current seed). Same scenario gives a real-feeling demo with sources, highlights, claims, entities, events, and a brief.

### 3. Archive UI on dossier rows

- Per-row `…` dropdown trigger at the right edge of each row in `DossiersClient.tsx` (uses Radix `DropdownMenu`, already a dep).
- Single menu item: "Archive".
- Selecting it opens a native `<dialog>` confirm (matches `NewDossierModal` pattern):
  - *"Archive **<title>**? It'll be hidden from your workspace. Data is kept and can be restored later."*
  - Cancel / Archive buttons.
- Confirm calls existing `archiveDossier(id)` server action. The existing `getDossiers()` query already filters `status: "active"`, so the row disappears via `revalidatePath`.

## Decisions

- **Soft-delete via archive, not hard delete.** User explicitly chose this; it matches CLAUDE.md's "soft-delete where appropriate" guidance.
- **No undo toast.** Confirmation dialog is enough; archive is reversible at the DB level.
- **Empty state shows whenever the list is empty**, not just on first session. Simpler than tracking `user.hasOnboarded`, and serves the "user archived everything" recovery case.
- **WorkflowStrip is extracted and shared** between the landing page and the empty state. Same vocabulary builds visual continuity from signup through first use.
- **Sample dossier reuses the existing seed content** (Northgate Pharma scenario) rather than inventing new content. One source of truth.

## Out of scope

- Archive view / restore UI (data is preserved; restoration is DB-only for now).
- Hard delete.
- Bulk archive.
- First-session detection.
- Tooltips, tours, modals.
- Help page (separate phase).

## Files

| File | Change |
|---|---|
| `src/components/ui/WorkflowStrip.tsx` | New shared component |
| `src/app/page.tsx` | Replace inline strip with `WorkflowStrip` |
| `src/server/lib/sample-dossier.ts` | New helper |
| `src/server/actions/sample-dossier.ts` | New server action |
| `prisma/seed.ts` | Refactor to use helper |
| `src/components/dossiers/DossiersClient.tsx` | New empty state + archive dropdown + confirm dialog |
| `src/server/actions/dossiers.ts` | Unchanged (`archiveDossier` already exists) |
