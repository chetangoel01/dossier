# Research Dossier Platform

## MVP Ticket Backlog

Version: 1.0

Date: March 2, 2026

This backlog turns the product spec into daily-sized implementation tickets. Each ticket is intentionally scoped to fit into one focused day of work for a single engineer. Some days carry one substantial ticket; some carry two smaller tickets that pair naturally.

---

## 1. Ticket Sizing Rules

Use these rules to keep the backlog honest:

- a ticket should usually fit in 4 to 8 hours
- a ticket should produce a visible or testable increment
- a ticket should have one primary concern only
- a ticket can touch multiple layers only if the change is narrow and coherent
- if a ticket needs deep schema work and a large UI build, split it
- if a ticket creates a new object type, keep follow-up polish in later tickets

Each ticket below includes:

- `Goal`: what the ticket accomplishes
- `Scope`: what should be built in this ticket
- `Done When`: acceptance criteria
- `Depends On`: required earlier work

---

## 2. Suggested Daily Cadence

This is the recommended day-by-day sequence. It is sized so each day has at least one ticket and sometimes two smaller, naturally paired tickets.

### Day 1

- `DOS-001` Bootstrap the app repo and engineering defaults
- `DOS-002` Implement design tokens, fonts, and global shell styles

### Day 2

- `DOS-003` Model the core database schema

### Day 3

- `DOS-004` Add fixture data, seeds, and demo factories
- `DOS-005` Add auth and user ownership boundaries

### Day 4

- `DOS-006` Build dossier list and create flow

### Day 5

- `DOS-007` Build dossier workspace shell and tab routing

### Day 6

- `DOS-008` Build source CRUD APIs and persistence
- `DOS-009` Build source capture modal for URL, paste, and manual note

### Day 7

- `DOS-010` Add file upload ingestion for PDF and text sources

### Day 8

- `DOS-011` Build the sources index with filters and review state

### Day 9

- `DOS-012` Build the source reader layout with evidence gutter scaffold

### Day 10

- `DOS-013` Add text selection and highlight persistence
- `DOS-014` Add highlight annotation, labels, and inspector list

### Day 11

- `DOS-015` Build claims persistence and create-from-highlight flow

### Day 12

- `DOS-016` Build the claims page and status views

### Day 13

- `DOS-017` Build entity CRUD and linking flows

### Day 14

- `DOS-018` Build entity drawer and mention backlinks
- `DOS-019` Build event CRUD and link-to-evidence flow

### Day 15

- `DOS-020` Build the dossier timeline view

### Day 16

- `DOS-021` Build brief persistence and editor shell

### Day 17

- `DOS-022` Add citation tokens and evidence insertion in the brief editor

### Day 18

- `DOS-023` Build global search across core objects
- `DOS-024` Build Markdown and PDF export

### Day 19

- `DOS-025` Build command bar and keyboard shortcuts
- `DOS-026` Add empty states, loading states, and motion polish

### Day 20

- `DOS-027` Hardening pass: autosave, validation, and failure handling
- `DOS-028` Demo data polish and MVP handoff documentation

---

## 3. Ticket Definitions

### DOS-001: Bootstrap the app repo and engineering defaults

Goal:

- establish the baseline project so later tickets are building product, not repeatedly rebuilding infrastructure

Scope:

- initialize the Next.js app with TypeScript
- add linting, formatting, and typecheck scripts
- add test runner scaffolding
- define environment variable loading
- create a clean base folder structure for app, server, components, and lib

Done When:

- the app runs locally
- `lint`, `typecheck`, and test commands exist and pass
- the repo has a clean README with setup steps
- the initial folder structure supports future tickets without rework

Depends On:

- none

### DOS-002: Implement design tokens, fonts, and global shell styles

Goal:

- lock in the visual foundation early so the product keeps a consistent identity

Scope:

- add global CSS variables for colors, spacing, borders, shadows, animation, and texture
- wire in `Newsreader`, `IBM Plex Sans`, and `IBM Plex Mono`
- implement app-level background, paper texture, and core layout primitives
- create base styles for buttons, inputs, panels, chips, and tables

Done When:

- the app visibly matches the spec's editorial direction
- tokens are defined in one clear location
- there is a reusable `SectionFrame` or equivalent base layout primitive
- no default browser or generic framework styles dominate the UI

Depends On:

- `DOS-001`

### DOS-003: Model the core database schema

Goal:

- define the real data backbone for the MVP

Scope:

- implement schema models for users, dossiers, sources, highlights, claims, entities, mentions, events, briefs, and tags
- encode the important enums and relations
- generate the initial migration

Done When:

- the schema cleanly matches the product spec
- migrations run successfully on a local database
- relations for source-to-highlight, claim-to-highlight, entity mentions, and timeline events are represented
- there are no obvious placeholder models that will force a redesign two days later

Depends On:

- `DOS-001`

### DOS-004: Add fixture data, seeds, and demo factories

Goal:

- make the product easy to develop visually and functionally without manual hand-entry every time

Scope:

- create a seed script for one demo user
- create one realistic sample dossier with sources, highlights, claims, entities, events, and a brief
- add lightweight factory helpers for tests

Done When:

- a fresh database can be seeded into a believable sample state
- the sample data exercises the main object relationships
- future UI tickets can be built against realistic data immediately

Depends On:

- `DOS-003`

### DOS-005: Add auth and user ownership boundaries

Goal:

- establish private-by-default behavior early

Scope:

- add login or local dev auth flow
- enforce user ownership on dossiers and related records
- add route protection for authenticated views

Done When:

- unauthenticated users cannot access dossier routes
- records are scoped to the current user
- core APIs reject cross-user access

Depends On:

- `DOS-003`

### DOS-006: Build dossier list and create flow

Goal:

- let a user create and enter real research workspaces

Scope:

- build the dossiers index page
- show existing dossiers with title, summary, status, and updated time
- implement `New Dossier` modal or page
- support create, rename, and archive actions

Done When:

- a user can create a dossier and land in it
- the list view is usable, polished, and not a placeholder table
- dossier updates reflect immediately in the list

Depends On:

- `DOS-002`
- `DOS-005`

### DOS-007: Build dossier workspace shell and tab routing

Goal:

- create the permanent frame for all dossier work

Scope:

- implement dossier-level layout with header, top tabs, main content region, and optional inspector slot
- add routes or state for Overview, Sources, Claims, Entities, Timeline, Brief, and Activity
- implement empty states for tabs with no content yet

Done When:

- a dossier opens into a stable workspace shell
- tab changes feel coherent and preserve context
- later feature tickets can drop their views into a stable structure

Depends On:

- `DOS-006`

### DOS-008: Build source CRUD APIs and persistence

Goal:

- make sources first-class records in the backend

Scope:

- add create, read, update, and delete APIs for sources
- support source types: URL, pasted text, manual note, file placeholder
- persist core metadata including title, author, publisher, dates, and status

Done When:

- sources can be created and edited programmatically
- validation exists for required fields by source type
- source records are scoped to a dossier and user

Depends On:

- `DOS-003`
- `DOS-005`

### DOS-009: Build source capture modal for URL, paste, and manual note

Goal:

- make source intake fast enough to feel like a real capture workflow

Scope:

- implement a capture modal or drawer
- support URL entry, pasted article text, and manual note creation
- prefill obvious metadata where possible
- set initial source status to `unreviewed`

Done When:

- a user can add a source in under 10 seconds
- all three non-file capture paths work end to end
- the new source appears immediately in the current dossier

Depends On:

- `DOS-007`
- `DOS-008`

### DOS-010: Add file upload ingestion for PDF and text sources

Goal:

- support the core non-web source formats needed for research workflows

Scope:

- implement upload handling for PDF and plain text
- store the file pointer and extracted text placeholder
- create a source record tied to the uploaded artifact
- handle upload errors cleanly

Done When:

- a user can attach a PDF or text file to a dossier
- uploaded files create usable source records
- failed uploads surface clear UI feedback

Depends On:

- `DOS-008`

### DOS-011: Build the sources index with filters and review state

Goal:

- turn sources into a workable queue rather than a raw list

Scope:

- implement list or table view for dossier sources
- show source type, title, status, credibility, capture date, and tags
- add filtering by type and review state
- allow quick status changes

Done When:

- the sources page is usable for triage
- filters work without full page churn
- the page visually matches the product's structured editorial style

Depends On:

- `DOS-007`
- `DOS-009`
- `DOS-010`

### DOS-012: Build the source reader layout with evidence gutter scaffold

Goal:

- create the product's hero screen before the fine-grained highlighting logic lands

Scope:

- implement the three-pane reader layout
- build left source list, center reading pane, and right inspector shell
- implement the `EvidenceGutter` visual scaffold in the reader
- add source metadata and placeholder inspector sections

Done When:

- opening a source feels like entering the main research workflow
- the evidence gutter is visibly part of the layout
- the reader handles long text gracefully

Depends On:

- `DOS-011`

### DOS-013: Add text selection and highlight persistence

Goal:

- convert reading into reusable evidence capture

Scope:

- support text selection inside the reader
- create highlight records with quote text and offsets
- render saved highlights back into the source content
- mark the evidence gutter when highlights exist

Done When:

- selecting text creates a persistent highlight
- refreshing the page preserves highlights
- saved highlights reappear in the correct source context

Depends On:

- `DOS-003`
- `DOS-012`

### DOS-014: Add highlight annotation, labels, and inspector list

Goal:

- make highlights useful as evidence, not just colored text

Scope:

- add annotation text to highlights
- support labels like evidence, question, counterpoint, stat, and quote
- show highlight list in the inspector
- allow selecting a highlight from the inspector and jumping to its source location

Done When:

- each highlight can be annotated and labeled
- the inspector acts as a usable evidence sidebar
- selecting a highlight links source context and inspector state cleanly

Depends On:

- `DOS-013`

### DOS-015: Build claims persistence and create-from-highlight flow

Goal:

- let users turn evidence into explicit findings

Scope:

- add claim APIs and persistence
- support creating a claim from one or more highlights
- store claim statement, status, confidence, and notes
- link claims back to highlights

Done When:

- a user can select highlights and create a claim
- claims remain traceable to their evidence
- the create flow does not force the user to leave the reader

Depends On:

- `DOS-014`

### DOS-016: Build the claims page and status views

Goal:

- give claims a dedicated synthesis workspace

Scope:

- build claims list view
- add grouping or board by claim status
- show linked evidence counts, confidence, and related entities
- support claim editing from the page

Done When:

- claims are easy to scan and manage at dossier level
- the page can serve as a lightweight findings board
- status and confidence are visible without drilling into each claim

Depends On:

- `DOS-015`

### DOS-017: Build entity CRUD and linking flows

Goal:

- make people, companies, products, and topics first-class references

Scope:

- add entity APIs and persistence
- support creating entities manually
- link entities from sources, highlights, and claims
- show linked entity pills in the reader and claims UI

Done When:

- users can create and reuse entities across the dossier
- entity linking works from the places users actually do research
- entity chips look and behave like durable references, not tags

Depends On:

- `DOS-015`

### DOS-018: Build entity drawer and mention backlinks

Goal:

- make entities navigable and useful for cross-source synthesis

Scope:

- build entity detail drawer or side panel
- show description, type, aliases, and importance
- list all source and highlight mentions tied to the entity
- support navigating from entity back to source context

Done When:

- selecting an entity shows meaningful dossier context
- backlinks make cross-source patterns visible
- users can jump from entity context back into raw evidence

Depends On:

- `DOS-017`

### DOS-019: Build event CRUD and link-to-evidence flow

Goal:

- let users capture dated facts before the full timeline UI exists

Scope:

- add event APIs and persistence
- support manual event creation
- link events to highlights and entities
- support date precision values like day, month, year, and unknown

Done When:

- events can be created and attached to supporting evidence
- partial date precision is represented correctly
- the data is ready for timeline rendering

Depends On:

- `DOS-017`

### DOS-020: Build the dossier timeline view

Goal:

- turn events into a readable chronological chain

Scope:

- implement the timeline page
- sort events by date and precision
- render linked entities and evidence chips inline
- support clicking from a timeline event into the linked record context

Done When:

- the timeline reads as a useful research artifact, not just a decorative list
- partial dates are displayed sensibly
- timeline navigation reinforces the evidentiary model

Depends On:

- `DOS-019`

### DOS-021: Build brief persistence and editor shell

Goal:

- create the final synthesis surface for the dossier

Scope:

- add brief persistence and one current brief per dossier
- build the brief editor layout
- add section navigation and autosave-ready editor state
- show a collapsible evidence drawer shell

Done When:

- every dossier has a real brief surface
- the editor feels memo-like and calmer than the rest of the app
- the page supports longer writing sessions without feeling fragile

Depends On:

- `DOS-007`
- `DOS-015`

### DOS-022: Add citation tokens and evidence insertion in the brief editor

Goal:

- make brief writing visibly grounded in sources

Scope:

- implement `CitationToken`
- let users insert citations from selected highlights or sources
- render citations inline in the editor and in preview
- keep links from citation back to source context

Done When:

- citations can be inserted without manual copy-paste
- clicking a citation can take the user back to evidence
- the citation treatment matches the design spec and feels native to the product

Depends On:

- `DOS-014`
- `DOS-021`

### DOS-023: Build global search across core objects

Goal:

- make the workspace navigable once real data accumulates

Scope:

- add full-text search across dossiers, sources, highlights, claims, entities, and brief content
- support scoping by dossier and object type
- build a command-bar-ready search result structure

Done When:

- a user can find relevant objects without browsing manually
- search results are grouped clearly by object type
- the first implementation is fast enough for normal single-user datasets

Depends On:

- `DOS-015`
- `DOS-017`
- `DOS-021`

### DOS-024: Build Markdown and PDF export

Goal:

- let users turn briefs into portable deliverables

Scope:

- export the current brief to Markdown
- export the current brief to PDF
- preserve headings, body content, and citation tokens in readable form

Done When:

- exports produce usable output without post-processing
- citations remain legible in exported artifacts
- export errors are handled cleanly

Depends On:

- `DOS-022`

### DOS-025: Build command bar and keyboard shortcuts

Goal:

- make the app feel like a serious power-user tool

Scope:

- implement `CommandBar`
- add shortcuts for create dossier, add source, search, and jump to major tabs
- make command results route into the right view state

Done When:

- the command bar can open quickly from anywhere relevant
- common actions are faster by keyboard than mouse
- keyboard affordances are visible but not noisy

Depends On:

- `DOS-023`

### DOS-026: Add empty states, loading states, and motion polish

Goal:

- make the product feel intentionally designed in both sparse and populated states

Scope:

- add polished empty states for Overview, Sources, Claims, Timeline, and Brief
- add restrained loading states
- implement the core motion rules from the spec
- polish tab transitions, inspector expansion, and overview reveal behavior

Done When:

- the app still feels premium with no data
- there are no jarring UI jumps between the main workflows
- motion supports clarity rather than decoration

Depends On:

- `DOS-012`
- `DOS-016`
- `DOS-020`
- `DOS-021`

### DOS-027: Hardening pass: autosave, validation, and failure handling

Goal:

- make the MVP trustworthy enough for actual use

Scope:

- add autosave for notes, claims, and briefs
- tighten API validation and client-side error states
- handle optimistic updates and rollback where appropriate
- add protection against obvious data-loss cases

Done When:

- users can work without fearing silent data loss
- invalid inputs are blocked with clear feedback
- failure cases are visible and recoverable

Depends On:

- `DOS-021`
- `DOS-022`

### DOS-028: Demo data polish and MVP handoff documentation

Goal:

- leave the project in a usable, legible state for demos and future iteration

Scope:

- improve the demo seed data so the app tells a coherent story
- create a short demo script for the main product flow
- document current capabilities, known gaps, and the next logical backlog after MVP

Done When:

- a fresh setup produces a compelling demo state
- another engineer can understand what the MVP covers
- the next round of work can start from a clean handoff instead of reverse engineering

Depends On:

- `DOS-026`
- `DOS-027`

---

## 4. Natural Post-MVP Follow-On Tickets

These are not part of the 20-day MVP cadence, but they are the cleanest next tickets once the first pass is done:

- saved views for Sources and Claims
- relationship graph for entities
- brief version history
- richer tag filtering and tag management
- AI-assisted source summary draft
- contradiction detection between claims
- browser-based web clipping

---

## 5. Practical Use Notes

If you want to use this backlog for autonomous iteration:

- keep the agent constrained to one ticket at a time
- never let it pick its own ticket order
- require a validation step after each ticket
- require a short implementation note before it moves to the next ticket

If a ticket starts to exceed one day, split it immediately instead of letting scope quietly creep.
