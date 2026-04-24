# Dossier

A private, evidence-first research workspace for turning scattered sources into defensible, source-backed briefs.

## What is this?

Dossier sits between a notes app, a lightweight case-management system, and an analyst workbench. It helps researchers, analysts, journalists, founders, and knowledge workers:

- **Capture** sources quickly (URLs, PDFs, pasted text, notes)
- **Extract** evidence through highlights and annotations
- **Connect** entities, events, and claims across sources
- **Synthesize** findings into structured briefs with citations
- **Defend** conclusions with traceable evidence chains

## Status

MVP complete (DOS-001 → DOS-028). The capture → synthesis → brief arc works end-to-end for a single user on their private data. See [`docs/mvp-handoff.md`](docs/mvp-handoff.md) for the handoff summary and [`docs/demo-script.md`](docs/demo-script.md) for a 10-minute walkthrough.

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript (strict)
- **Styling**: Tailwind CSS + CSS custom properties for design tokens
- **Database**: PostgreSQL + Prisma
- **Search**: PostgreSQL full-text search (no vector store, no embeddings)
- **Auth**: Auth.js (NextAuth v5), credentials provider
- **Testing**: Vitest + Testing Library

## Design Direction

The product feels like an **editorial intelligence desk** — archival, composed, quietly luxurious, dense without feeling busy. Not generic white-card SaaS.

- **Typography**: Newsreader (display), IBM Plex Sans (UI/body), IBM Plex Mono (citations/metadata)
- **Palette**: Warm paper and slate tones, not stark white — see [`CLAUDE.md`](CLAUDE.md) for token values
- **Signature UX**: The evidence gutter in the source reader — highlights appear as thin marked bands in the left reading gutter; selecting one expands a linked evidence card in the right inspector

See the full [product spec](docs/product-spec.md) for details.

## Local Development

### Prerequisites

- Node.js 18.17 or later
- npm
- PostgreSQL 14+ running locally (the default `npm run dev` script starts `postgresql@17` via Homebrew — adjust if you use a different setup)

### Setup

```bash
# Clone the repository
git clone https://github.com/chetangoel/dossier.git
cd dossier

# Install dependencies
npm install

# Copy environment variables and fill them in
cp .env.example .env.local
# Set DATABASE_URL to your local Postgres
# Generate AUTH_SECRET with: openssl rand -base64 32

# Apply migrations
npx prisma migrate deploy

# Seed the demo data (Northgate Pharma investigation)
npm run db:seed

# Start the development server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

**Demo credentials** (after `db:seed`):

- Email: `demo@dossier.local`
- Password: `password`

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run test` | Run tests with Vitest |
| `npm run test:watch` | Run tests in watch mode |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run db:seed` | Seed (or re-seed) the demo data |

## Project Documents

- [Product Spec](docs/product-spec.md) — full product definition
- [MVP Tickets](docs/mvp-tickets.md) — 28-ticket implementation backlog (complete)
- [Demo Script](docs/demo-script.md) — 10-minute walkthrough of the capture → synthesis → brief arc
- [MVP Handoff](docs/mvp-handoff.md) — what the MVP covers, known gaps, next logical tickets
- [Contributing Conventions](CLAUDE.md) — design direction, naming, and the "do not" list

## Architecture

```
dossier/
├── docs/                              # Product spec, backlog, handoff, demo script
├── prisma/
│   ├── schema.prisma                  # Database schema
│   ├── migrations/                    # Migrations
│   └── seed.ts                        # Demo data (Northgate Pharma investigation)
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── (auth)/                    # login, signup
│   │   ├── api/                       # REST endpoints (auth, search, upload, export, prefetch)
│   │   ├── dossiers/                  # Dossier list + workspace tabs
│   │   ├── briefs/[id]/print/         # Print-optimized brief for PDF export
│   │   └── search/                    # Global search results
│   ├── components/                    # React components, grouped by feature
│   │   ├── ui/                        # Base design system primitives
│   │   └── [feature]/                 # sources, claims, entities, briefs, command, …
│   ├── server/
│   │   ├── actions/                   # Server actions (mutations)
│   │   └── queries/                   # Data access
│   ├── lib/                           # Shared: db client, citations, exports, validation, storage
│   ├── types/                         # Shared TypeScript types
│   ├── auth.ts, auth.config.ts        # Auth.js configuration
│   └── middleware.ts                  # Route protection
└── public/                            # Static assets
```

### Data model at a glance

Users → Dossiers → Sources, Claims, Entities, Events, Brief.

- **Highlights** live on sources and are linked many-to-many to claims and events.
- **Mentions** back-link entities to the sources and highlights where they appear.
- **Tags** are cross-object and can be applied to sources, claims, entities, and events.
- Every record is scoped to `owner_id` (private by default).

Full schema in [`prisma/schema.prisma`](prisma/schema.prisma).

### Keyboard shortcuts

- `Cmd/Ctrl + K` — open the command bar and search globally
- `[` / `]` — previous / next tab within a dossier workspace
- `\` — toggle the inspector in the source reader

## License

Private project. All rights reserved.
