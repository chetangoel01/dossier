# Help page — design

**Date:** 2026-04-24
**Scope:** A single static `/help` route serving as the canonical methodology + reference document for Dossier.

## Goal

Give users a place to learn the dossier model and look up keyboard shortcuts without context-switching out of the product. Reads like an editorial methodology document, not a SaaS knowledge base.

## Pieces

### 1. `/help` route

- New `src/app/help/page.tsx`. Public (no auth required) — both prospective and active users benefit.
- Long single-page layout in the editorial aesthetic (Newsreader headlines, IBM Plex Sans body, IBM Plex Mono stamps).
- Sections in order:
  1. **The model** — 5-paragraph essay: dossier, source, highlight, claim, brief, and how they connect.
  2. **The evidence gutter** — what the marks in the source reader mean and how to use them. The signature UX explained in plain language.
  3. **Source statuses** — the unreviewed → reviewing → reviewed → discarded pipeline.
  4. **Citations in briefs** — how `[[cite:highlight:id]]` chips work; how PDF export resolves them to footnotes.
  5. **Keyboard shortcuts** — a table aligned with the actual bindings: `Cmd/Ctrl+K` (command bar), `[` / `]` (tab nav inside dossier), `\` (toggle inspector), `Esc`, arrow keys, Enter.
  6. **Privacy** — short paragraph reaffirming the "your sources stay yours" stance from the landing page.

### 2. Entry points

- **Dossiers header link.** Add a "Help" link next to "Sign out" on `/dossiers`. This is the primary discovery path for logged-in users.
- **Command bar action.** Register a "Help" action under the Navigate group so `Cmd+K` → "help" → Enter opens `/help`. Picks up on the existing CommandBar pattern.

## Decisions

- **Single page, no subroutes.** Help is not a knowledge base; it's a methodology document. One scrollable page is the right shape.
- **No TOC sidebar.** The page is short enough (~1200 words) to scroll comfortably; clear `<h2>` headings serve as natural waypoints.
- **No drawer / no `?` shortcut for MVP.** Dedicated route is enough. Drawer-style help can be layered later if the route gets heavy use.
- **Hardcoded shortcut list, not generated.** The command bar's actions are dynamic (depend on context); a hardcoded canonical list is simpler and equally correct for MVP.
- **Public, not auth-gated.** Letting unauth visitors read the help is harmless and useful for evaluation.

## Out of scope

- Per-feature deep dives (e.g. `/help/sources`).
- Search within help.
- In-product tooltips with `?` icons.
- Video or animated walkthroughs.
- A `?` keyboard shortcut bound globally.

## Files

| File | Change |
|---|---|
| `src/app/help/page.tsx` | New |
| `src/app/dossiers/page.tsx` | Add "Help" link to header |
| `src/components/command/CommandBar.tsx` | Register Help action under Navigate |
