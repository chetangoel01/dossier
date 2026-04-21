import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export const SEARCH_OBJECT_TYPES = [
  "dossier",
  "source",
  "highlight",
  "claim",
  "entity",
  "brief",
] as const;

export type SearchObjectType = (typeof SEARCH_OBJECT_TYPES)[number];

export interface SearchResultBase {
  id: string;
  type: SearchObjectType;
  title: string;
  snippet: string | null;
  dossierId: string;
  dossierTitle: string;
  href: string;
  rank: number;
}

export interface SearchResults {
  query: string;
  dossierId: string | null;
  types: SearchObjectType[];
  groups: Record<SearchObjectType, SearchResultBase[]>;
  total: number;
}

export interface SearchOptions {
  dossierId?: string | null;
  types?: SearchObjectType[];
  perTypeLimit?: number;
}

const DEFAULT_PER_TYPE_LIMIT = 8;

type RawRow = {
  id: string;
  title: string;
  snippet: string | null;
  dossier_id: string;
  dossier_title: string;
  rank: number;
};

type RawHighlightRow = RawRow & { source_id: string };

function emptyGroups(): Record<SearchObjectType, SearchResultBase[]> {
  return SEARCH_OBJECT_TYPES.reduce(
    (acc, type) => {
      acc[type] = [];
      return acc;
    },
    {} as Record<SearchObjectType, SearchResultBase[]>,
  );
}

export async function searchWorkspace(
  userId: string,
  rawQuery: string,
  options: SearchOptions = {},
): Promise<SearchResults> {
  const query = rawQuery.trim();
  const groups = emptyGroups();

  const requestedTypes =
    options.types && options.types.length > 0
      ? options.types
      : [...SEARCH_OBJECT_TYPES];

  const empty: SearchResults = {
    query,
    dossierId: options.dossierId ?? null,
    types: requestedTypes,
    groups,
    total: 0,
  };

  if (query.length === 0) return empty;

  const limit = Math.max(1, Math.min(50, options.perTypeLimit ?? DEFAULT_PER_TYPE_LIMIT));
  const dossierFilter = options.dossierId ?? null;

  const tasks = requestedTypes.map((type) =>
    runSearch(type, userId, query, dossierFilter, limit).then((rows) => {
      groups[type] = rows;
    }),
  );
  await Promise.all(tasks);

  const total = SEARCH_OBJECT_TYPES.reduce(
    (sum, type) => sum + groups[type].length,
    0,
  );

  return {
    query,
    dossierId: dossierFilter,
    types: requestedTypes,
    groups,
    total,
  };
}

async function runSearch(
  type: SearchObjectType,
  userId: string,
  query: string,
  dossierId: string | null,
  limit: number,
): Promise<SearchResultBase[]> {
  switch (type) {
    case "dossier":
      return searchDossiers(userId, query, dossierId, limit);
    case "source":
      return searchSources(userId, query, dossierId, limit);
    case "highlight":
      return searchHighlights(userId, query, dossierId, limit);
    case "claim":
      return searchClaims(userId, query, dossierId, limit);
    case "entity":
      return searchEntities(userId, query, dossierId, limit);
    case "brief":
      return searchBriefs(userId, query, dossierId, limit);
  }
}

// ─── Per-type search helpers ─────────────────────────────────────────────────
//
// All queries share the same shape: build a `plainto_tsquery('simple', ...)`
// from the user input, filter by ownership (and optionally dossier), rank by
// `ts_rank`, and extract an HTML-free snippet with `ts_headline`.
//
// `plainto_tsquery` is used rather than `to_tsquery` so untrusted user input
// is parsed safely and never interpreted as query operators.

async function searchDossiers(
  userId: string,
  query: string,
  dossierId: string | null,
  limit: number,
): Promise<SearchResultBase[]> {
  const rows = await db.$queryRaw<RawRow[]>`
    SELECT
      d.id,
      d.title,
      d.id AS dossier_id,
      d.title AS dossier_title,
      ts_headline(
        'simple',
        coalesce(d.summary, '') || ' ' || coalesce(d.research_goal, ''),
        plainto_tsquery('simple', ${query}),
        'StartSel=<<,StopSel=>>,MaxWords=24,MinWords=8,ShortWord=3,MaxFragments=1'
      ) AS snippet,
      ts_rank(
        to_tsvector(
          'simple',
          coalesce(d.title, '') || ' ' ||
          coalesce(d.summary, '') || ' ' ||
          coalesce(d.research_goal, '')
        ),
        plainto_tsquery('simple', ${query})
      ) AS rank
    FROM dossiers d
    WHERE d.owner_id = ${userId}
      ${dossierId ? Prisma.sql`AND d.id = ${dossierId}` : Prisma.empty}
      AND to_tsvector(
        'simple',
        coalesce(d.title, '') || ' ' ||
        coalesce(d.summary, '') || ' ' ||
        coalesce(d.research_goal, '')
      ) @@ plainto_tsquery('simple', ${query})
    ORDER BY rank DESC, d.updated_at DESC
    LIMIT ${limit}
  `;

  return rows.map((row) => ({
    id: row.id,
    type: "dossier",
    title: row.title,
    snippet: cleanSnippet(row.snippet),
    dossierId: row.dossier_id,
    dossierTitle: row.dossier_title,
    href: `/dossiers/${row.id}/overview`,
    rank: Number(row.rank),
  }));
}

async function searchSources(
  userId: string,
  query: string,
  dossierId: string | null,
  limit: number,
): Promise<SearchResultBase[]> {
  const rows = await db.$queryRaw<RawRow[]>`
    SELECT
      s.id,
      s.title,
      s.dossier_id,
      d.title AS dossier_title,
      ts_headline(
        'simple',
        coalesce(s.summary, '') || ' ' || coalesce(s.raw_text, ''),
        plainto_tsquery('simple', ${query}),
        'StartSel=<<,StopSel=>>,MaxWords=24,MinWords=8,ShortWord=3,MaxFragments=1'
      ) AS snippet,
      ts_rank(
        to_tsvector(
          'simple',
          coalesce(s.title, '') || ' ' ||
          coalesce(s.author, '') || ' ' ||
          coalesce(s.publisher, '') || ' ' ||
          coalesce(s.summary, '') || ' ' ||
          coalesce(s.raw_text, '')
        ),
        plainto_tsquery('simple', ${query})
      ) AS rank
    FROM sources s
    JOIN dossiers d ON d.id = s.dossier_id
    WHERE d.owner_id = ${userId}
      ${dossierId ? Prisma.sql`AND s.dossier_id = ${dossierId}` : Prisma.empty}
      AND to_tsvector(
        'simple',
        coalesce(s.title, '') || ' ' ||
        coalesce(s.author, '') || ' ' ||
        coalesce(s.publisher, '') || ' ' ||
        coalesce(s.summary, '') || ' ' ||
        coalesce(s.raw_text, '')
      ) @@ plainto_tsquery('simple', ${query})
    ORDER BY rank DESC, s.captured_at DESC
    LIMIT ${limit}
  `;

  return rows.map((row) => ({
    id: row.id,
    type: "source",
    title: row.title,
    snippet: cleanSnippet(row.snippet),
    dossierId: row.dossier_id,
    dossierTitle: row.dossier_title,
    href: `/dossiers/${row.dossier_id}/sources/${row.id}`,
    rank: Number(row.rank),
  }));
}

async function searchHighlights(
  userId: string,
  query: string,
  dossierId: string | null,
  limit: number,
): Promise<SearchResultBase[]> {
  const rows = await db.$queryRaw<RawHighlightRow[]>`
    SELECT
      h.id,
      h.quote_text AS title,
      s.id AS source_id,
      s.dossier_id,
      d.title AS dossier_title,
      ts_headline(
        'simple',
        coalesce(h.quote_text, '') || ' ' || coalesce(h.annotation, ''),
        plainto_tsquery('simple', ${query}),
        'StartSel=<<,StopSel=>>,MaxWords=24,MinWords=8,ShortWord=3,MaxFragments=1'
      ) AS snippet,
      ts_rank(
        to_tsvector(
          'simple',
          coalesce(h.quote_text, '') || ' ' ||
          coalesce(h.annotation, '')
        ),
        plainto_tsquery('simple', ${query})
      ) AS rank
    FROM highlights h
    JOIN sources s ON s.id = h.source_id
    JOIN dossiers d ON d.id = s.dossier_id
    WHERE d.owner_id = ${userId}
      ${dossierId ? Prisma.sql`AND s.dossier_id = ${dossierId}` : Prisma.empty}
      AND to_tsvector(
        'simple',
        coalesce(h.quote_text, '') || ' ' ||
        coalesce(h.annotation, '')
      ) @@ plainto_tsquery('simple', ${query})
    ORDER BY rank DESC, h.created_at DESC
    LIMIT ${limit}
  `;

  return rows.map((row) => ({
    id: row.id,
    type: "highlight",
    title: truncate(row.title, 80),
    snippet: cleanSnippet(row.snippet),
    dossierId: row.dossier_id,
    dossierTitle: row.dossier_title,
    href: `/dossiers/${row.dossier_id}/sources/${row.source_id}#highlight-${row.id}`,
    rank: Number(row.rank),
  }));
}

async function searchClaims(
  userId: string,
  query: string,
  dossierId: string | null,
  limit: number,
): Promise<SearchResultBase[]> {
  const rows = await db.$queryRaw<RawRow[]>`
    SELECT
      c.id,
      c.statement AS title,
      c.dossier_id,
      d.title AS dossier_title,
      ts_headline(
        'simple',
        coalesce(c.statement, '') || ' ' || coalesce(c.notes, ''),
        plainto_tsquery('simple', ${query}),
        'StartSel=<<,StopSel=>>,MaxWords=24,MinWords=8,ShortWord=3,MaxFragments=1'
      ) AS snippet,
      ts_rank(
        to_tsvector(
          'simple',
          coalesce(c.statement, '') || ' ' ||
          coalesce(c.notes, '')
        ),
        plainto_tsquery('simple', ${query})
      ) AS rank
    FROM claims c
    JOIN dossiers d ON d.id = c.dossier_id
    WHERE d.owner_id = ${userId}
      ${dossierId ? Prisma.sql`AND c.dossier_id = ${dossierId}` : Prisma.empty}
      AND to_tsvector(
        'simple',
        coalesce(c.statement, '') || ' ' ||
        coalesce(c.notes, '')
      ) @@ plainto_tsquery('simple', ${query})
    ORDER BY rank DESC, c.updated_at DESC
    LIMIT ${limit}
  `;

  return rows.map((row) => ({
    id: row.id,
    type: "claim",
    title: truncate(row.title, 120),
    snippet: cleanSnippet(row.snippet),
    dossierId: row.dossier_id,
    dossierTitle: row.dossier_title,
    href: `/dossiers/${row.dossier_id}/claims#claim-${row.id}`,
    rank: Number(row.rank),
  }));
}

async function searchEntities(
  userId: string,
  query: string,
  dossierId: string | null,
  limit: number,
): Promise<SearchResultBase[]> {
  const rows = await db.$queryRaw<RawRow[]>`
    SELECT
      e.id,
      e.name AS title,
      e.dossier_id,
      d.title AS dossier_title,
      ts_headline(
        'simple',
        coalesce(e.description, '') || ' ' || array_to_string(e.aliases, ' '),
        plainto_tsquery('simple', ${query}),
        'StartSel=<<,StopSel=>>,MaxWords=24,MinWords=8,ShortWord=3,MaxFragments=1'
      ) AS snippet,
      ts_rank(
        to_tsvector(
          'simple',
          coalesce(e.name, '') || ' ' ||
          coalesce(e.description, '') || ' ' ||
          array_to_string(e.aliases, ' ')
        ),
        plainto_tsquery('simple', ${query})
      ) AS rank
    FROM entities e
    JOIN dossiers d ON d.id = e.dossier_id
    WHERE d.owner_id = ${userId}
      ${dossierId ? Prisma.sql`AND e.dossier_id = ${dossierId}` : Prisma.empty}
      AND to_tsvector(
        'simple',
        coalesce(e.name, '') || ' ' ||
        coalesce(e.description, '') || ' ' ||
        array_to_string(e.aliases, ' ')
      ) @@ plainto_tsquery('simple', ${query})
    ORDER BY rank DESC, e.updated_at DESC
    LIMIT ${limit}
  `;

  return rows.map((row) => ({
    id: row.id,
    type: "entity",
    title: row.title,
    snippet: cleanSnippet(row.snippet),
    dossierId: row.dossier_id,
    dossierTitle: row.dossier_title,
    href: `/dossiers/${row.dossier_id}/entities#entity-row-${row.id}`,
    rank: Number(row.rank),
  }));
}

async function searchBriefs(
  userId: string,
  query: string,
  dossierId: string | null,
  limit: number,
): Promise<SearchResultBase[]> {
  const rows = await db.$queryRaw<RawRow[]>`
    SELECT
      b.id,
      b.title,
      b.dossier_id,
      d.title AS dossier_title,
      ts_headline(
        'simple',
        coalesce(b.body_markdown, ''),
        plainto_tsquery('simple', ${query}),
        'StartSel=<<,StopSel=>>,MaxWords=24,MinWords=8,ShortWord=3,MaxFragments=1'
      ) AS snippet,
      ts_rank(
        to_tsvector(
          'simple',
          coalesce(b.title, '') || ' ' ||
          coalesce(b.body_markdown, '')
        ),
        plainto_tsquery('simple', ${query})
      ) AS rank
    FROM briefs b
    JOIN dossiers d ON d.id = b.dossier_id
    WHERE d.owner_id = ${userId}
      ${dossierId ? Prisma.sql`AND b.dossier_id = ${dossierId}` : Prisma.empty}
      AND to_tsvector(
        'simple',
        coalesce(b.title, '') || ' ' ||
        coalesce(b.body_markdown, '')
      ) @@ plainto_tsquery('simple', ${query})
    ORDER BY rank DESC, b.updated_at DESC
    LIMIT ${limit}
  `;

  return rows.map((row) => ({
    id: row.id,
    type: "brief",
    title: row.title,
    snippet: cleanSnippet(row.snippet),
    dossierId: row.dossier_id,
    dossierTitle: row.dossier_title,
    href: `/dossiers/${row.dossier_id}/brief`,
    rank: Number(row.rank),
  }));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cleanSnippet(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.replace(/\s+/g, " ").trim();
  return trimmed.length > 0 ? trimmed : null;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}
