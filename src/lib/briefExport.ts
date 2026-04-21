import {
  formatHighlightAnchor,
  segmentCitations,
  type CitationRef,
} from "./citations";

export interface ExportHighlight {
  id: string;
  source_id: string;
  page_number: number | null;
  start_offset: number;
  quote_text: string;
}

export interface ExportSource {
  id: string;
  title: string;
  author: string | null;
  publisher: string | null;
  highlights: ExportHighlight[];
}

export interface ExportBrief {
  title: string;
  body_markdown: string | null;
}

interface ResolvedCitation {
  sourceTitle: string;
  anchor: string | null;
}

function resolveCitation(
  ref: CitationRef,
  sourceById: Map<string, ExportSource>,
  highlightById: Map<string, { highlight: ExportHighlight; source: ExportSource }>,
): ResolvedCitation | null {
  if (ref.kind === "source") {
    const source = sourceById.get(ref.id);
    if (!source) return null;
    return { sourceTitle: source.title, anchor: null };
  }
  const entry = highlightById.get(ref.id);
  if (!entry) return null;
  return {
    sourceTitle: entry.source.title,
    anchor: formatHighlightAnchor(entry.highlight),
  };
}

function formatCitationText(resolved: ResolvedCitation | null): string {
  if (!resolved) return "[missing citation]";
  if (resolved.anchor) {
    return `[${resolved.sourceTitle}, ${resolved.anchor}]`;
  }
  return `[${resolved.sourceTitle}]`;
}

function indexEvidence(evidence: ExportSource[]) {
  const sourceById = new Map<string, ExportSource>();
  const highlightById = new Map<
    string,
    { highlight: ExportHighlight; source: ExportSource }
  >();
  for (const source of evidence) {
    sourceById.set(source.id, source);
    for (const highlight of source.highlights) {
      highlightById.set(highlight.id, { highlight, source });
    }
  }
  return { sourceById, highlightById };
}

/**
 * Render the brief body with inline citation markers rewritten as readable
 * references like "[Source Title, p.12]". Citations that reference removed
 * evidence fall back to "[missing citation]" so the output never leaks a
 * raw marker or a silent gap.
 */
export function renderBriefBodyPlain(
  body: string,
  evidence: ExportSource[],
): string {
  const { sourceById, highlightById } = indexEvidence(evidence);
  return segmentCitations(body)
    .map((segment) => {
      if (segment.type === "text") return segment.text;
      const resolved = resolveCitation(segment.ref, sourceById, highlightById);
      return formatCitationText(resolved);
    })
    .join("");
}

function collectCitedSources(
  body: string,
  evidence: ExportSource[],
): ExportSource[] {
  const { sourceById, highlightById } = indexEvidence(evidence);
  const seen = new Set<string>();
  const ordered: ExportSource[] = [];

  for (const segment of segmentCitations(body)) {
    if (segment.type !== "citation") continue;
    let sourceId: string | null = null;
    if (segment.ref.kind === "source") {
      sourceId = sourceById.has(segment.ref.id) ? segment.ref.id : null;
    } else {
      const entry = highlightById.get(segment.ref.id);
      sourceId = entry ? entry.source.id : null;
    }
    if (!sourceId || seen.has(sourceId)) continue;
    const source = sourceById.get(sourceId);
    if (!source) continue;
    seen.add(sourceId);
    ordered.push(source);
  }

  return ordered;
}

function formatSourceReference(source: ExportSource): string {
  const attribution = [source.author, source.publisher]
    .map((v) => v?.trim())
    .filter((v): v is string => Boolean(v))
    .join(", ");
  return attribution ? `${source.title} — ${attribution}` : source.title;
}

/**
 * Render the full brief as a Markdown document suitable for direct download.
 * The brief title becomes the H1, the body is preserved verbatim (citation
 * tokens are swapped for human-readable references), and a "Sources" section
 * is appended when the brief cites anything.
 */
export function renderBriefMarkdown(
  brief: ExportBrief,
  evidence: ExportSource[],
): string {
  const title = brief.title.trim() || "Untitled brief";
  const body = (brief.body_markdown ?? "").trimEnd();
  const rendered = renderBriefBodyPlain(body, evidence);
  const cited = collectCitedSources(body, evidence);

  const parts: string[] = [`# ${title}`];
  if (rendered.trim().length > 0) parts.push(rendered);
  if (cited.length > 0) {
    const list = cited
      .map((source, index) => `${index + 1}. ${formatSourceReference(source)}`)
      .join("\n");
    parts.push(`## Sources\n\n${list}`);
  }
  return parts.join("\n\n") + "\n";
}

/**
 * Produce a filesystem-friendly slug from the brief title for export
 * filenames. Defaults to `brief` when nothing usable remains.
 */
export function buildExportFilename(title: string, extension: string): string {
  const slug = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  const safe = slug || "brief";
  return `${safe}.${extension}`;
}

export interface RenderedBodyBlock {
  type: "heading" | "paragraph";
  depth?: number;
  nodes: RenderedInline[];
}

export type RenderedInline =
  | { type: "text"; text: string }
  | { type: "citation"; text: string; resolved: boolean };

/**
 * Split the rendered body into heading/paragraph blocks with inline citation
 * nodes preserved. Used by the print page to render semantic HTML with
 * styled citation chips while leaving paragraph structure intact.
 */
export function renderBriefBlocks(
  body: string,
  evidence: ExportSource[],
): RenderedBodyBlock[] {
  const { sourceById, highlightById } = indexEvidence(evidence);
  const lines = (body ?? "").split("\n");
  const blocks: RenderedBodyBlock[] = [];
  let paragraph: RenderedInline[] = [];

  const flush = () => {
    if (paragraph.length === 0) return;
    const hasContent = paragraph.some(
      (node) => node.type !== "text" || node.text.trim().length > 0,
    );
    if (hasContent) blocks.push({ type: "paragraph", nodes: paragraph });
    paragraph = [];
  };

  for (const line of lines) {
    const headingMatch = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (headingMatch) {
      flush();
      const depth = headingMatch[1].length;
      blocks.push({
        type: "heading",
        depth,
        nodes: segmentLine(headingMatch[2], sourceById, highlightById),
      });
      continue;
    }
    if (line.trim() === "") {
      flush();
      continue;
    }
    if (paragraph.length > 0) paragraph.push({ type: "text", text: " " });
    paragraph.push(...segmentLine(line, sourceById, highlightById));
  }
  flush();

  return blocks;
}

function segmentLine(
  line: string,
  sourceById: Map<string, ExportSource>,
  highlightById: Map<string, { highlight: ExportHighlight; source: ExportSource }>,
): RenderedInline[] {
  return segmentCitations(line).map((segment) => {
    if (segment.type === "text") return { type: "text", text: segment.text };
    const resolved = resolveCitation(segment.ref, sourceById, highlightById);
    return {
      type: "citation",
      text: formatCitationText(resolved),
      resolved: resolved !== null,
    };
  });
}

export function renderBriefCitedSources(
  body: string,
  evidence: ExportSource[],
): ExportSource[] {
  return collectCitedSources(body, evidence);
}

export function formatSourceAttribution(source: ExportSource): string {
  return formatSourceReference(source);
}
