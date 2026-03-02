# Research Dossier Platform

## Product Spec

Version: 1.0

Date: March 2, 2026

Working name: Dossier

---

## 1. Product Thesis

Dossier is a research workspace for turning scattered sources into defensible, reusable briefs.

The product sits between a notes app, a lightweight case-management system, and an analyst workbench. The core problem it solves is not "taking notes." The core problem is that serious research work usually breaks down across too many disconnected surfaces:

- links saved in one place
- PDFs sitting in downloads
- raw notes in another tool
- key quotes lost inside long sources
- timelines tracked manually
- people, companies, and events repeated across notes
- final summaries written without a clean chain back to evidence

Dossier should make that workflow feel structured, rigorous, and calm. It should help a user capture material quickly, extract the parts that matter, connect facts across sources, and produce a brief that is visibly grounded in evidence.

This should feel like a real product for analysts, investors, founders, operators, journalists, policy researchers, and high-agency knowledge workers who need to build a coherent view of a topic.

---

## 2. Research-Informed Positioning

The product direction should borrow the best parts of existing tools without becoming a generic clone.

### What comparable products get right

- Notion demonstrates the value of structured objects with multiple views. Their database model treats each item as its own page and supports table, board, list, timeline, calendar, and gallery views. That is useful because research work benefits from viewing the same underlying object set through different lenses.
- Obsidian Web Clipper shows how important low-friction capture is. The main lesson is that if saving source material is slow or awkward, users fall back to copy-paste chaos.
- Heptabase shows the value of cards, whiteboards, deep links, and private-by-default collaboration. The main takeaway is that users want to spatially organize complex ideas, but they also need precise links back into specific artifacts.

### What Dossier should do differently

- It should be evidence-first, not notes-first.
- It should treat sources, claims, entities, and events as first-class records.
- It should bias toward traceability and citation, not endless freeform writing.
- It should use spatial or visual organization as a secondary tool, not as the primary data model.
- It should not be "AI magic first." The trust layer has to come from explicit source linkage.

### Product position in one line

Dossier is a private analyst workspace for capturing evidence, connecting entities and events, and producing source-backed briefs.

---

## 3. Product Principles

These principles should constrain every product and engineering decision.

### 3.1 Evidence before opinion

Every claim in the system should be attachable to one or more source excerpts. Users should never feel like the product is asking them to write unsupported summaries.

### 3.2 Structured where it matters, flexible where it helps

Raw notes need room for ambiguity, but sources, entities, events, claims, and briefs should be structured enough to filter, sort, and relate.

### 3.3 Fast capture, deep synthesis

Saving a source should take seconds. Making sense of it can take longer. The app should optimize both stages without forcing heavyweight setup during capture.

### 3.4 Private by default

Research can be sensitive. Default privacy should be strict. Sharing should be explicit, scoped, and reversible.

### 3.5 Citation is part of the product, not a formatting afterthought

Citations should be woven into the reading, claiming, and briefing workflows.

### 3.6 Calm, serious interface

This should look like a professional thinking tool, not a toy dashboard and not a generic SaaS clone.

---

## 4. Target Users

### Primary users

- independent researchers
- founders researching markets, competitors, or customers
- investors building market or company dossiers
- journalists building background files
- job seekers preparing deep company and role dossiers
- graduate students or thesis writers organizing source-heavy work

### Secondary users

- small teams doing internal strategy research
- recruiters and sourcers mapping people and company context
- consultants building client briefing packs

### User sophistication assumptions

These users are comfortable with tabs, documents, spreadsheets, and note-taking tools. They are not necessarily technical, but they are detail-oriented and willing to learn a more structured workflow if it clearly improves quality.

---

## 5. Core Jobs To Be Done

### Capture

"When I find relevant material, I want to save it immediately with enough metadata that I can find and trust it later."

### Extract

"When I review a source, I want to pull out the exact passages, facts, and signals that matter without losing context."

### Connect

"When the same people, companies, and events show up across multiple sources, I want to see those relationships clearly."

### Synthesize

"When I need to form a view, I want to turn evidence into structured findings and then into a concise brief."

### Defend

"When I share or revisit my conclusions, I want to know exactly what evidence supports them."

---

## 6. MVP Scope

The MVP should feel complete for one-person use on real research tasks. It should not attempt full enterprise collaboration, broad AI automation, or heavy document intelligence on day one.

### In scope for MVP

- dossier creation and organization
- source ingestion from URL, pasted text, uploaded file, and manual note
- source metadata editing
- source reading view with highlight and note capture
- highlights as reusable evidence snippets
- claims/findings linked to one or more highlights
- entities with backlinks from sources and claims
- events with dates and linked evidence
- dossier timeline view
- dossier brief editor with citation insertion
- global search within the user workspace
- tags, filters, and saved views
- export brief to Markdown and PDF

### Explicitly out of scope for MVP

- live multi-user collaborative editing
- OCR-heavy ingestion pipelines
- browser extension
- automated web crawling
- public sharing
- semantic search as a core dependency
- mobile-native app

### Why this scope is right

This is enough to feel like a legitimate product while staying bounded. It creates a full loop from source intake to final brief, which is the minimum complete value chain.

---

## 7. Key Objects and Data Model

The product should be built around explicit records. This is what gives it long-term product depth.

### 7.1 Dossier

Represents a research project.

Fields:

- `id`
- `title`
- `slug`
- `summary`
- `status` (`active`, `archived`, `on_hold`)
- `research_goal`
- `priority`
- `owner_id`
- `created_at`
- `updated_at`

### 7.2 Source

Represents a single input artifact.

Types:

- web link
- PDF or uploaded file
- pasted article text
- manual note
- internal memo

Fields:

- `id`
- `dossier_id`
- `type`
- `title`
- `url`
- `author`
- `publisher`
- `published_at`
- `captured_at`
- `raw_text`
- `summary`
- `credibility_rating`
- `source_status` (`unreviewed`, `reviewing`, `reviewed`, `discarded`)
- `tags`

### 7.3 Highlight

Represents a selected excerpt from a source.

Fields:

- `id`
- `source_id`
- `quote_text`
- `start_offset`
- `end_offset`
- `page_number` (nullable)
- `annotation`
- `label` (`evidence`, `question`, `counterpoint`, `stat`, `quote`)
- `created_at`

### 7.4 Claim

Represents a reusable finding, assertion, or interpretation.

Fields:

- `id`
- `dossier_id`
- `statement`
- `confidence`
- `status` (`open`, `supported`, `contested`, `deprecated`)
- `notes`
- `created_at`
- `updated_at`

Relations:

- many-to-many with `Highlight`
- many-to-many with `Entity`
- optional one-to-many with `Event`

### 7.5 Entity

Represents a person, company, product, location, institution, or topic.

Fields:

- `id`
- `dossier_id`
- `name`
- `type`
- `description`
- `aliases`
- `importance`

### 7.6 Mention

Join record between source/highlight and entity.

Fields:

- `id`
- `entity_id`
- `source_id` or `highlight_id`
- `context_snippet`

### 7.7 Event

Represents a dated item for timeline analysis.

Fields:

- `id`
- `dossier_id`
- `title`
- `description`
- `event_date`
- `precision` (`day`, `month`, `year`, `unknown`)
- `confidence`

Relations:

- many-to-many with `Highlight`
- many-to-many with `Entity`

### 7.8 Brief

Represents the output artifact.

Fields:

- `id`
- `dossier_id`
- `title`
- `body_markdown`
- `version`
- `status` (`draft`, `ready`, `published`)
- `updated_at`

### 7.9 Tag

Tagging should exist across sources, claims, entities, and events, but should be implemented simply at first. Do not overbuild a complex ontology in v1.

---

## 8. Core User Flows

### 8.1 Create a new dossier

1. User clicks `New Dossier`.
2. They enter a title, optional summary, and research goal.
3. The app creates an empty dossier workspace with a default brief shell and empty views.

Success metric:

- time from click to usable workspace under 20 seconds

### 8.2 Save a source

1. User pastes a URL, uploads a PDF, pastes text, or creates a manual note.
2. The app prompts for minimal metadata, prefilling what it can.
3. The source lands in `Unreviewed`.
4. The source is immediately searchable inside the dossier.

Success metric:

- source capture in under 10 seconds for URL or text paste

### 8.3 Review and highlight a source

1. User opens a source.
2. The app shows readable content in the main pane.
3. User highlights one or more passages.
4. Each highlight can be labeled and optionally annotated.
5. Highlights automatically become reusable evidence units.

Success metric:

- user can create a highlight in one drag plus one click

### 8.4 Turn evidence into claims

1. User selects one or more highlights.
2. User creates a claim.
3. The claim stores the statement and links back to evidence.
4. The claim appears in the dossier findings list.

Success metric:

- a claim can be created from source context without losing reading position

### 8.5 Build entities and timeline

1. From a source, highlight, or claim, user creates or links an entity.
2. User creates an event with a date and supporting evidence.
3. The timeline updates automatically.

Success metric:

- cross-source pattern recognition becomes visually obvious after a handful of inputs

### 8.6 Produce a brief

1. User opens the Brief tab.
2. They write sections manually or pull claims into the draft.
3. They insert citations from highlights and sources.
4. They export the brief to Markdown or PDF.

Success metric:

- every important paragraph can be traced back to evidence in two clicks or fewer

---

## 9. Information Architecture

The product should feel like a focused workspace, not a sprawling tool suite.

### 9.1 Global navigation

Left rail:

- Home
- Dossiers
- Search
- Recents
- Templates
- Settings

### 9.2 Dossier workspace navigation

Each dossier should expose these top-level views:

- Overview
- Sources
- Claims
- Entities
- Timeline
- Brief
- Activity

### 9.3 Overview page

Purpose:

- give the user a quick read on research momentum

Content:

- dossier summary
- active research question
- source counts by status
- recent highlights
- top entities
- timeline preview
- latest brief update
- unresolved claims or open questions

### 9.4 Sources page

Primary workbench for intake and review.

Views:

- table
- list
- kanban by review status

Filters:

- type
- tag
- date
- credibility rating
- reviewed state

### 9.5 Source reader

Recommended layout:

- left sidebar: source list and filters
- center pane: source content
- right inspector: metadata, highlights, linked entities, linked claims

This three-pane layout is the center of the product. It should feel fast, dense, and stable.

### 9.6 Claims page

Purpose:

- move from raw evidence to synthesized understanding

Views:

- list
- board by claim status
- grouped by confidence

### 9.7 Entities page

Purpose:

- provide a dossier-level "who/what matters" map

Views:

- table
- card view
- relationship graph (v1.5, not required for first release)

### 9.8 Timeline page

Purpose:

- display events chronologically and make narrative progression legible

Views:

- vertical timeline
- optional compact table

### 9.9 Brief page

Purpose:

- let the user assemble a final output with source-backed confidence

The brief should not feel like a generic doc editor. It should feel like an editor sitting on top of a research graph.

---

## 10. Frontend Product Direction

This section is the product's visual and interaction brief. It should be specific enough that implementation work stays cohesive even when built incrementally.

### 10.1 Visual concept

The product should feel like:

- an editorial intelligence desk
- private, high-trust, and sharply composed
- materially different from the usual white-card startup UI

The right reference point is not "minimal SaaS." The right reference point is a blend of archival research tools, premium desktop software, and financial terminal discipline, but softened into something human and readable.

The chosen aesthetic direction should be:

- editorial
- archival
- quietly luxurious
- dense without feeling busy

This is not meant to look playful, cheerful, or generic. It should look like a product built for serious thinking.

### 10.2 Distinctive design thesis

The frontend should commit to one strong idea:

- every screen should feel like a working dossier spread across a desk

That means:

- layered paper-like surfaces instead of flat white cards
- strong frame lines and gutters
- visible evidence markers in the reading experience
- typography that feels document-grade rather than app-grade
- asymmetric layouts that still preserve reading clarity

The single memorable UI element should be the `evidence gutter` inside the source reader:

- highlights appear as thin marked bands in the left reading gutter
- selecting a highlight expands a linked evidence card in the right inspector
- claims and citations feel physically tied to source locations, not abstractly linked

This is the interaction users should remember after using the product once.

### 10.3 Brand and tone

Keywords:

- rigorous
- composed
- sharp
- private
- evidence-driven

Avoid:

- playful productivity-app energy
- bright gradient branding
- purple-on-white default palettes
- soft, bubbly shapes

### 10.4 Typography

Use a three-tier type system with a clear editorial hierarchy.

Recommended stack:

- Display headings: `Newsreader`
- UI/body: `IBM Plex Sans`
- Evidence snippets / citations / data labels: `IBM Plex Mono`

Reasoning:

- Serif headings make dossier pages feel substantial and document-like.
- IBM Plex Sans gives the app a serious, technical clarity.
- Monospaced citations help source references read as precise artifacts, not decoration.

Usage rules:

- use serif only for page titles, section headings, and major empty states
- keep body copy in a restrained sans serif for long reading comfort
- use mono sparingly but consistently for citations, evidence IDs, timestamps, status metadata, and keyboard hints
- avoid oversized hero text inside the core app; this is a working tool, not a marketing site

### 10.5 Color system

Use a warm-light theme first. This product should feel like paper, slate, and ink, not stark white UI.

Recommended palette:

- background base: `#F4F1EA`
- raised panel: `#FBF8F2`
- border: `#D8D1C4`
- primary text: `#1F2933`
- secondary text: `#52606D`
- accent ink: `#184E77`
- accent alert: `#8B3A3A`
- success: `#2D6A4F`
- warning: `#9C6B00`

Use subtle gradients in shell backgrounds, like warm parchment to cool cream. Avoid pure white large surfaces.

Secondary structural colors:

- left rail background: `#E8E1D4`
- command bar background: `rgba(251, 248, 242, 0.88)`
- selected row fill: `#EEE6D8`
- active citation chip: `#E0EBF5`
- evidence highlight wash: `rgba(24, 78, 119, 0.12)`

Color rules:

- most of the UI should live in neutrals
- blue ink is the primary "intelligence" accent
- red is reserved for contested evidence, destructive actions, and warnings
- green should signal verified or complete states only
- do not scatter accent colors evenly across the interface; use them as signals, not decoration

### 10.6 Spatial composition and layout

The app should be dense but not cramped.

Guidelines:

- desktop-first with excellent laptop ergonomics
- strong panel structure
- narrow gutters
- careful line lengths for readable source text
- sticky context bars for filters and source metadata
- intentionally asymmetric compositions where useful

For reading-heavy screens, aim for document-like proportions:

- source content width around 680 to 760px
- inspector width around 320 to 360px

Shell composition:

- fixed left rail with strong visual weight
- slim top command/search bar that feels like a control strip, not a bulky header
- content region with restrained max width and clear sectional framing
- right inspector that can collapse without breaking the main reading rhythm

Avoid perfectly symmetrical dashboard layouts. The product should feel more like a designed workspace than a grid of interchangeable cards.

### 10.7 Component style

Core components:

- split panes
- filter chips
- structured data tables
- inline citation tokens
- evidence cards
- timeline rows
- metadata side panels

Interaction details:

- selected items should feel pinned and grounded, not neon-highlighted
- hover states should be subtle, mostly border and background shifts
- evidence cards should use a left rule or citation marker, not loud drop shadows
- rows and cards should have structural edges, not soft "floating" blobs
- important controls should feel mechanical and precise, more like tools than toys

Signature component treatments:

- `CitationToken`: small mono chip with muted fill, source ID, and page or paragraph anchor
- `EvidenceCard`: paper strip with a vertical ink rule, quote text, source stamp, and optional confidence badge
- `ClaimCard`: denser card with status, linked evidence count, and entity pills
- `EntityChip`: restrained outlined chip, never bright or candy-like
- `TimelineEvent`: left-aligned marker on a vertical rule, with linked evidence shown inline as compact chips

### 10.8 Signature screens

The product needs a few standout screens that make it feel like a complete product quickly.

#### Overview

The dossier overview should look like a briefing board, not a KPI dashboard.

Use:

- one dominant summary panel
- a recent evidence strip
- a compact timeline preview
- a top-entities list
- an open-questions panel

The overview should prioritize narrative orientation over metrics theater.

#### Sources and reader

This is the hero workflow and should get the most design attention.

Recommended composition:

- left pane: source index with filters and source states
- center pane: long-form readable source content with visible evidence gutter
- right pane: metadata, linked claims, linked entities, and recent highlights

The center pane should feel like reading a high-quality digital document, not reading text inside a generic card.

#### Brief editor

The brief editor should feel like drafting a serious memo.

Use:

- wide editorial writing column
- collapsible evidence drawer
- inline citation insertion flow
- section navigator that stays out of the way

The writing surface should feel cleaner and calmer than the rest of the app so synthesis work has a different energy than evidence collection.

#### Timeline

The timeline should feel investigative, not decorative.

Prefer:

- strong vertical line
- tightly spaced events
- dates in mono
- linked entities and evidence displayed inline

This should read like a chronological chain of proof.

### 10.9 Motion

Use meaningful motion only.

Recommended motion:

- soft slide/fade when changing dossier tabs
- staggered reveal for overview modules on initial load
- gentle expansion for evidence inspector
- timeline focus transition when selecting an event

Avoid:

- bouncy microinteractions
- gratuitous loading shimmer everywhere

Motion rules:

- motion should clarify causality between source, evidence, and claim
- keep durations in the 140ms to 240ms range for most UI transitions
- avoid large parallax or drifting ambient motion in the app shell
- save stronger staged reveals for onboarding and empty-to-filled transitions

### 10.10 Memorable visual details

The app should include a few subtle but distinctive touches:

- faint paper grain on major surfaces
- thin border framing rather than heavy shadows
- source "stamps" for metadata blocks and citations
- small ruled separators that resemble annotation margins
- lightly tinted section backplates behind grouped content

These details should create atmosphere without turning the UI into cosplay.

### 10.11 Mobile

Mobile is not a primary surface for v1, but the web app must still be usable on phones.

Minimum mobile behavior:

- dossiers list is usable
- source list is readable
- brief viewer works
- quick capture of note or URL works

Deep source review and full editing can remain best on desktop.

On mobile, do not try to preserve the desktop three-pane layout. Collapse into:

- source list
- source reading view
- slide-up inspector panels

The mobile experience should be intentionally reduced rather than awkwardly compressed.

---

## 11. Functional Requirements

### 11.1 Capture and ingestion

The app must support:

- adding a URL with metadata fields
- uploading a PDF or text file
- pasting raw article text
- creating a freeform note source

System behavior:

- source record exists immediately after creation
- metadata can be edited later
- source status defaults to `unreviewed`

### 11.2 Reading and annotation

The app must support:

- inline text highlighting
- attaching annotation text to a highlight
- categorizing a highlight
- jumping from highlight back to source context

### 11.3 Claims

The app must support:

- creating claims manually
- creating claims from selected highlights
- linking multiple highlights to one claim
- setting a claim status and confidence

### 11.4 Entities

The app must support:

- manual entity creation
- linking entities to sources, highlights, and claims
- showing all mentions of an entity inside the dossier

### 11.5 Timeline

The app must support:

- manual event creation
- optional linking to entities
- sorting by date with uncertain precision support

### 11.6 Briefs

The app must support:

- rich Markdown editing
- inserting source citations
- browsing linked claims and evidence while writing
- exporting to Markdown and PDF

### 11.7 Search

The app must support:

- global search across dossier titles, sources, highlights, claims, entities, and brief content
- filtering by object type and dossier

---

## 12. Non-Functional Requirements

### 12.1 Performance

- core dossier pages should feel instantaneous at small scale
- page transition target: under 200ms after cached data is available
- search results target: under 500ms for typical single-user datasets

### 12.2 Reliability

- auto-save for notes, claims, and brief editor
- no data loss on refresh
- file uploads should fail gracefully with visible retry states

### 12.3 Privacy and security

- private by default
- row-level authorization from the start
- file access scoped to owning user
- audit-friendly change history on briefs and claims in v1.5

### 12.4 Accessibility

- keyboard-first navigation for core flows
- visible focus states
- semantic headings
- contrast levels above typical startup baseline

---

## 13. Technical Architecture Recommendation

For a new sandbox product that may later support autonomous iteration, the architecture should be monolithic, boring, and explicit.

### Recommended stack

- Frontend: Next.js with React and TypeScript
- Styling: Tailwind plus CSS variables for the design tokens
- Component primitives: Radix or headless primitives only where necessary
- Backend: Next.js server routes or a small app-layer inside the same codebase
- Database: PostgreSQL
- ORM: Prisma
- Search: PostgreSQL full-text search first
- File storage: local dev storage first, S3-compatible storage for hosted environments
- Auth: Clerk, Auth.js, or a simple email auth layer

### Why this stack

- one repo
- predictable deployment
- easy local development
- enough structure for serious product work
- compatible with future background task automation

### Important restraint

Do not make embeddings, agents, or vector search central to the first version. They can become optional enhancements later, but the core product should stand on explicit structured data and full-text search.

---

## 14. Suggested Frontend Architecture

### Shell

- persistent left rail
- top command/search bar
- dossier-scoped content region
- optional right-side inspector reused across views

The shell should be implemented as a stable frame so only the content panes shift during navigation. Preserve a strong sense of place as users move between evidence, claims, entities, and briefs.

### State model

- server state: React Query or built-in data fetching
- local UI state: lightweight store such as Zustand
- editor state: isolated per page to avoid global re-renders

### Component families

- `AppShell`
- `DossierHeader`
- `ObjectTable`
- `FilterBar`
- `SourceReader`
- `HighlightList`
- `ClaimComposer`
- `EntityDrawer`
- `TimelineView`
- `BriefEditor`
- `CitationToken`

Add these implementation-critical UI pieces early:

- `EvidenceGutter`
- `EvidenceCard`
- `ClaimCard`
- `EntityChip`
- `SourceStamp`
- `CommandBar`
- `SectionFrame`

### Design tokens to define early

- color roles (`bg-canvas`, `bg-panel`, `bg-selected`, `ink-primary`, `ink-muted`, `signal-info`, `signal-danger`)
- type scale
- spacing scale
- border radius
- border widths
- shadow levels
- panel widths
- animation durations
- texture opacity
- gutter widths

This matters because autonomous iteration goes bad fast when UI standards are implicit. The design system has to be explicit early.

---

## 15. AI Features (Not MVP-Critical)

AI should be optional, scoped, and clearly reviewable.

### Good AI additions for later

- draft source summaries
- suggested entities from highlighted text
- suggested events and dates
- duplicate claim detection
- contradiction prompts between claims
- brief outline generation from selected claims

### Hard rule

AI outputs should always remain editable, attributable, and secondary to user-confirmed evidence.

---

## 16. Roadmap

### Phase 1: MVP foundation

- auth
- dossiers CRUD
- sources CRUD
- basic source reader
- highlights
- claims
- entities
- timeline
- brief editor
- search
- export

### Phase 2: product hardening

- saved views
- better keyboard shortcuts
- improved file handling
- richer filters
- version history for briefs and claims
- relationship graph for entities

### Phase 3: intelligence layer

- AI-assisted extraction
- AI-assisted brief assembly
- duplicate and contradiction detection
- improved ranking and relevance

---

## 17. Success Metrics

For MVP, focus on behavior, not vanity traffic.

### Activation

- user creates first dossier
- user adds at least three sources
- user creates first highlight

### Engagement

- number of reviewed sources per active dossier
- claim creation rate
- number of briefs produced

### Product quality

- citation insertion usage
- percentage of claims linked to evidence
- time from first source to first usable brief

### Retention signal

- repeat dossier usage over 7 and 30 days

---

## 18. Major Risks

### Risk: It becomes a generic note app

Mitigation:

- keep sources, claims, entities, and events first-class

### Risk: It becomes too rigid

Mitigation:

- let users add freeform notes everywhere, but store structured links underneath

### Risk: AI undermines trust

Mitigation:

- make AI suggestions opt-in and always tied to visible source context

### Risk: The UI becomes cluttered

Mitigation:

- prioritize a small set of core views and a stable inspector pattern

### Risk: Autonomous iteration produces junk

Mitigation:

- define explicit design tokens, data contracts, and validation tests early

---

## 19. MVP Acceptance Criteria

The product should be considered MVP-ready when a single user can:

1. Create a dossier.
2. Add multiple sources of different types.
3. Highlight and annotate a source.
4. Convert highlights into claims.
5. Link entities and create events.
6. See events on a timeline.
7. Write a brief that includes citations.
8. Export that brief.
9. Return later and still trust the structure and traceability of the work.

If those nine things work well, the product is real.

---

## 20. Recommended MVP Build Order

This order is optimized for building a believable product quickly.

1. App shell, auth, and dossier creation
2. Source model and source list UI
3. Source reader and highlight capture
4. Claims linked to highlights
5. Brief editor with citation tokens
6. Entities and backlinks
7. Timeline and events
8. Search, filters, and export
9. Hardening, polish, keyboard UX

This sequence creates visible product depth early while keeping each layer useful.

---

## 21. Product Name Notes

`Dossier` is a strong internal working name because it immediately signals seriousness and compiled research. If you want a more brandable public name later, keep the tone in the same family:

- Archive
- Ledger
- Casefile
- Briefing
- Signalbook
- Index

The name should suggest trust and structure, not AI novelty.

---

## 22. Sources Used For Product Direction

These were used to anchor the spec in current product patterns:

- Notion Help, "Creating a database" (structured objects, item-as-page model, multiple views): https://www.notion.com/help/guides/creating-a-database
- Obsidian Help, "Introduction to Obsidian Web Clipper" (low-friction capture, local-first clipping workflow): https://help.obsidian.md/web-clipper
- Heptabase Help, "Collaboration Q&A" (private-by-default sharing model) and related help docs on deeplinks and publishing whiteboards (precise linking, whiteboard artifacts): https://support.heptabase.com/en/articles/10510497-collaboration-q-a

---

## 23. Final Recommendation

Build this as a serious single-player product first.

Do not optimize for social features, AI novelty, or broad platform ambition at the start. Optimize for one thing: making it dramatically easier to go from messy research inputs to a credible, source-backed brief.

That is what makes this feel like a real product instead of another note-taking clone.
