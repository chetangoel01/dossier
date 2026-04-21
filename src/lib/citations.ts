/**
 * Brief citation tokens are stored inline inside `body_markdown` as a compact
 * text marker so they survive plain-text editing and persistence. The marker
 * format:
 *
 *   [[cite:highlight:<highlightId>]]
 *   [[cite:source:<sourceId>]]
 *
 * The client segments the body at these markers to render inline
 * `CitationToken` chips in the editor preview, and exports parse the same
 * format to render human-readable citations.
 */

export type CitationKind = "highlight" | "source";

export interface CitationRef {
  kind: CitationKind;
  id: string;
}

// Matches [[cite:highlight:abc123]] / [[cite:source:abc123]]. IDs are cuid-like
// and contain only letters, digits, underscores and dashes.
const CITATION_TOKEN_PATTERN = /\[\[cite:(highlight|source):([A-Za-z0-9_-]+)\]\]/g;

export function buildCitationToken(ref: CitationRef): string {
  return `[[cite:${ref.kind}:${ref.id}]]`;
}

export type CitationSegment =
  | { type: "text"; text: string }
  | { type: "citation"; ref: CitationRef; raw: string };

/**
 * Split a body string into plain-text segments and citation refs in
 * left-to-right order. Always returns a non-empty array (at minimum a single
 * text segment, which may be empty).
 */
export function segmentCitations(body: string): CitationSegment[] {
  const segments: CitationSegment[] = [];
  let cursor = 0;

  // Use a fresh regex instance so we don't share lastIndex across calls.
  const pattern = new RegExp(CITATION_TOKEN_PATTERN.source, "g");
  for (const match of body.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > cursor) {
      segments.push({ type: "text", text: body.slice(cursor, start) });
    }
    segments.push({
      type: "citation",
      raw: match[0],
      ref: { kind: match[1] as CitationKind, id: match[2] },
    });
    cursor = start + match[0].length;
  }

  if (cursor < body.length) {
    segments.push({ type: "text", text: body.slice(cursor) });
  }
  if (segments.length === 0) {
    segments.push({ type: "text", text: "" });
  }

  return segments;
}

/**
 * Short identifier suitable for display in a citation chip. Prefers visible
 * letters from the source title so the chip stays meaningful without
 * leaking the cuid. Falls back to the trailing characters of the id.
 */
export function formatSourceShortCode(
  source: { id: string; title: string | null },
): string {
  const cleanedTitle = (source.title ?? "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  if (cleanedTitle) {
    const tokens = cleanedTitle.split(/\s+/).filter(Boolean);
    if (tokens.length >= 2) {
      return (tokens[0][0]! + tokens[1][0]!).toUpperCase();
    }
    return tokens[0].slice(0, 3).toUpperCase();
  }
  return source.id.slice(-4).toUpperCase();
}

export function formatHighlightAnchor(highlight: {
  page_number: number | null;
  start_offset: number;
  quote_text?: string | null;
}): string {
  if (typeof highlight.page_number === "number") {
    return `p.${highlight.page_number}`;
  }
  // Rough paragraph approximation: one paragraph per ~400 chars. Stable and
  // useful as a rough anchor even without page data.
  const paragraph = Math.max(1, Math.floor(highlight.start_offset / 400) + 1);
  return `¶${paragraph}`;
}

export function buildCitationHref(
  dossierId: string,
  ref: CitationRef,
  context: {
    highlightSourceId?: string | null;
  } = {},
): string | null {
  if (ref.kind === "source") {
    return `/dossiers/${dossierId}/sources/${ref.id}#source-context`;
  }
  if (ref.kind === "highlight") {
    if (!context.highlightSourceId) return null;
    const params = new URLSearchParams({ highlight: ref.id });
    return `/dossiers/${dossierId}/sources/${context.highlightSourceId}?${params.toString()}#source-context`;
  }
  return null;
}
