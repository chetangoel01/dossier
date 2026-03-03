# Dossier — Claude Code Instructions

You are working on **Dossier**, a research dossier platform. Read this file completely before every task.

## Product Context

Dossier is a private, evidence-first workspace for turning scattered sources into defensible, source-backed briefs. It is NOT a generic notes app. It is an analyst workbench built around structured evidence.

Core object model: dossiers, sources, highlights, claims, entities, mentions, events, briefs, tags.

Full product spec: `docs/product-spec.md`
MVP backlog: `docs/mvp-tickets.md`

## Tech Stack

- Next.js 15 (App Router)
- React 19
- TypeScript (strict mode)
- Tailwind CSS + CSS custom properties for design tokens
- PostgreSQL
- Prisma ORM
- Full-text search via PostgreSQL (no vector/embedding dependencies)
- Component primitives: Radix UI only where needed

## Design Direction

The product should feel like an **editorial intelligence desk** — archival, composed, quietly luxurious, dense without feeling busy. NOT generic white-card SaaS UI.

### Typography
- Display headings: `Newsreader` (serif)
- UI/body: `IBM Plex Sans`
- Citations/metadata/mono: `IBM Plex Mono`

### Color Palette
- Background base: `#F4F1EA`
- Raised panel: `#FBF8F2`
- Border: `#D8D1C4`
- Primary text: `#1F2933`
- Secondary text: `#52606D`
- Accent ink (primary): `#184E77`
- Accent alert: `#8B3A3A`
- Success: `#2D6A4F`
- Warning: `#9C6B00`
- Left rail background: `#E8E1D4`
- Selected row: `#EEE6D8`
- Citation chip: `#E0EBF5`
- Evidence highlight wash: `rgba(24, 78, 119, 0.12)`

### Signature UX Element
The **evidence gutter** in the source reader — highlights appear as thin marked bands in the left reading gutter, selecting a highlight expands a linked evidence card in the right inspector.

## Code Conventions

### File Organization
```
src/
  app/                    # Next.js App Router pages and layouts
    (auth)/               # Auth-required routes
    api/                  # API routes
  components/
    ui/                   # Base design system components
    [feature]/            # Feature-specific components
  lib/
    db.ts                 # Prisma client
    utils.ts              # Shared utilities
  server/
    actions/              # Server actions
    queries/              # Data access functions
  types/                  # Shared TypeScript types
prisma/
  schema.prisma           # Database schema
  migrations/             # Migration files
  seed.ts                 # Seed data
```

### Naming
- React components: PascalCase (`EvidenceCard.tsx`)
- Utilities and hooks: camelCase (`useHighlights.ts`)
- CSS variable tokens: kebab-case (`--color-bg-canvas`)
- Database fields: snake_case (Prisma maps to camelCase in code)
- API routes: kebab-case (`/api/dossiers/[id]/sources`)

### TypeScript
- Strict mode always
- Prefer explicit types over `any`
- Use Prisma-generated types for database models
- Define shared interface types in `src/types/`

### Components
- Use functional components with hooks
- Co-locate component-specific types in the same file
- Keep components focused — one primary responsibility
- Use Radix UI primitives for accessible interactions (dialogs, dropdowns, tooltips)
- Do NOT install large component libraries (no shadcn, no MUI, no Ant)

### Styling
- Tailwind classes for layout and spacing
- CSS custom properties (`var(--color-*)`) for design tokens
- Define all tokens in a single `globals.css` or `tokens.css` file
- No inline hex colors — always reference token variables
- Paper texture via subtle CSS background patterns, not image assets

### Database
- All records scoped to `userId` (private by default)
- Use Prisma relations — do not hand-write SQL joins
- Enums for status fields (`source_status`, `claim_status`, etc.)
- Soft-delete where appropriate, hard-delete for user-facing "remove"

### Testing
- Test commands: `npm run test`, `npm run lint`, `npm run typecheck`
- Write tests for API routes and critical business logic
- UI components: test user-visible behavior, not implementation details

## How To Work On Issues

When implementing a GitHub issue:

1. **Read the issue carefully.** Understand the Goal, Scope, and Acceptance Criteria.
2. **Check dependencies.** Make sure prerequisite work exists in the codebase.
3. **Read relevant existing code** before writing new code.
4. **Follow the design direction.** Every UI change should match the editorial aesthetic.
5. **Keep scope tight.** Do exactly what the issue asks. Do not add unrelated improvements.
6. **Test your work.** Run `npm run lint`, `npm run typecheck`, and `npm run test` before committing.
7. **Write a clear commit message.** Reference the issue number.

## Do NOT

- Add AI/ML features, embeddings, or vector search
- Install large UI libraries (shadcn, MUI, Ant Design, Chakra)
- Use pure white (`#fff`) as a large surface color
- Add social/collaboration features
- Over-engineer — no premature abstractions, no feature flags for MVP
- Skip linting or type checking
- Add "Co-Authored-By" lines to commit messages

## Git Conventions

- Branch naming: `dos-XXX-short-description` (e.g., `dos-001-bootstrap`)
- Commit messages use [Conventional Commits](https://www.conventionalcommits.org/):
  - `feat(DOS-XXX): short description` — new feature work
  - `fix(DOS-XXX): short description` — bug fixes and hardening
  - `style(DOS-XXX): short description` — UI/design work
  - `docs(DOS-XXX): short description` — documentation
- One logical commit per issue when possible
- Always create a PR — do not push directly to main
