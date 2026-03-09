/**
 * Lightweight factory helpers for tests.
 * These return plain objects matching Prisma model shapes — no DB interaction.
 * Use with prisma.$transaction or a test DB as needed.
 */

import type {
  User,
  Dossier,
  Source,
  Highlight,
  Claim,
  Entity,
  Mention,
  Event,
  Brief,
} from "@prisma/client";

// ─── User ─────────────────────────────────────────────────────────────────────

export function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-test-id",
    email: "test@dossier.local",
    name: "Test User",
    password_hash: null,
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-01-01"),
    ...overrides,
  };
}

// ─── Dossier ──────────────────────────────────────────────────────────────────

export function buildDossier(overrides: Partial<Dossier> = {}): Dossier {
  return {
    id: "dossier-test-id",
    owner_id: "user-test-id",
    title: "Test Dossier",
    slug: "test-dossier",
    summary: null,
    status: "active",
    research_goal: null,
    priority: null,
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-01-01"),
    ...overrides,
  };
}

// ─── Source ───────────────────────────────────────────────────────────────────

export function buildSource(overrides: Partial<Source> = {}): Source {
  return {
    id: "source-test-id",
    dossier_id: "dossier-test-id",
    type: "web_link",
    title: "Test Source",
    url: null,
    author: null,
    publisher: null,
    published_at: null,
    captured_at: new Date("2024-01-01"),
    raw_text: null,
    summary: null,
    credibility_rating: null,
    source_status: "unreviewed",
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-01-01"),
    ...overrides,
  };
}

// ─── Highlight ────────────────────────────────────────────────────────────────

export function buildHighlight(overrides: Partial<Highlight> = {}): Highlight {
  return {
    id: "highlight-test-id",
    source_id: "source-test-id",
    quote_text: "This is a test highlight quote.",
    start_offset: 0,
    end_offset: 32,
    page_number: null,
    annotation: null,
    label: "evidence",
    created_at: new Date("2024-01-01"),
    ...overrides,
  };
}

// ─── Claim ────────────────────────────────────────────────────────────────────

export function buildClaim(overrides: Partial<Claim> = {}): Claim {
  return {
    id: "claim-test-id",
    dossier_id: "dossier-test-id",
    statement: "This is a test claim statement.",
    confidence: null,
    status: "open",
    notes: null,
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-01-01"),
    ...overrides,
  };
}

// ─── Entity ───────────────────────────────────────────────────────────────────

export function buildEntity(overrides: Partial<Entity> = {}): Entity {
  return {
    id: "entity-test-id",
    dossier_id: "dossier-test-id",
    name: "Test Entity",
    type: "person",
    description: null,
    aliases: [],
    importance: null,
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-01-01"),
    ...overrides,
  };
}

// ─── Mention ──────────────────────────────────────────────────────────────────

export function buildMention(overrides: Partial<Mention> = {}): Mention {
  return {
    id: "mention-test-id",
    entity_id: "entity-test-id",
    source_id: null,
    highlight_id: null,
    context_snippet: null,
    ...overrides,
  };
}

// ─── Event ────────────────────────────────────────────────────────────────────

export function buildEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: "event-test-id",
    dossier_id: "dossier-test-id",
    title: "Test Event",
    description: null,
    event_date: null,
    precision: "unknown",
    confidence: null,
    claim_id: null,
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-01-01"),
    ...overrides,
  };
}

// ─── Brief ────────────────────────────────────────────────────────────────────

export function buildBrief(overrides: Partial<Brief> = {}): Brief {
  return {
    id: "brief-test-id",
    dossier_id: "dossier-test-id",
    title: "Test Brief",
    body_markdown: null,
    version: 1,
    status: "draft",
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-01-01"),
    ...overrides,
  };
}
