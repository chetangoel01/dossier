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

This project is being built incrementally via automated daily development. Each day, 1-2 issues from the [MVP backlog](docs/mvp-tickets.md) are picked up and implemented by Claude Code.

Track progress in [Issues](../../issues) and [Pull Requests](../../pulls).

## Tech Stack

- **Framework**: Next.js + React + TypeScript
- **Styling**: Tailwind CSS + CSS variables
- **Database**: PostgreSQL + Prisma
- **Search**: PostgreSQL full-text search
- **Auth**: TBD (Clerk, Auth.js, or simple email auth)

## Design Direction

The product feels like an **editorial intelligence desk** — archival, composed, quietly luxurious, dense without feeling busy. Not generic white-card SaaS.

- **Typography**: Newsreader (display), IBM Plex Sans (UI/body), IBM Plex Mono (citations/metadata)
- **Palette**: Warm paper and slate tones, not stark white
- **Signature UX**: The evidence gutter in the source reader

See the full [product spec](docs/product-spec.md) for details.

## Local Development

### Prerequisites

- Node.js 18.17 or later
- npm

### Setup

```bash
# Clone the repository
git clone https://github.com/chetangoel/dossier.git
cd dossier

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start the development server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

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

## Project Documents

- [Product Spec](docs/product-spec.md) — full product definition
- [MVP Tickets](docs/mvp-tickets.md) — 28-ticket implementation backlog

## Architecture

```
dossier/
├── docs/                    # Product spec and backlog
├── .github/
│   ├── ISSUE_TEMPLATE/      # Issue templates
│   ├── workflows/           # GitHub Actions (daily dev automation)
│   └── scripts/             # Automation helpers
├── src/                     # Application code (created by DOS-001)
│   ├── app/                 # Next.js app router
│   ├── components/          # React components
│   ├── lib/                 # Shared utilities
│   └── server/              # Server-side logic
├── prisma/                  # Database schema and migrations
└── public/                  # Static assets
```

## License

Private project. All rights reserved.
