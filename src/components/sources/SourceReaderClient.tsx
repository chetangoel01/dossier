"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { EvidenceGutter } from "./EvidenceGutter";
import { HighlightedText } from "./HighlightedText";
import { HighlightCard } from "./HighlightCard";
import { SelectionToolbar } from "./SelectionToolbar";
import type { SourceReaderData, SourceListItem } from "@/server/queries/sources";

interface Props {
  dossierId: string;
  source: SourceReaderData;
  allSources: SourceListItem[];
}

const TYPE_LABELS: Record<string, string> = {
  web_link: "URL",
  pdf: "PDF",
  pasted_text: "Pasted",
  manual_note: "Note",
  internal_memo: "Memo",
};

const STATUS_LABELS: Record<string, string> = {
  unreviewed: "Unreviewed",
  reviewing: "Reviewing",
  reviewed: "Reviewed",
  discarded: "Discarded",
};

const STATUS_CHIP_CLASS: Record<string, string> = {
  unreviewed: "chip",
  reviewing: "chip chip-warning",
  reviewed: "chip chip-success",
  discarded: "chip chip-alert",
};

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function SourceReaderClient({ dossierId, source, allSources }: Props) {
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [selectedHighlightId, setSelectedHighlightId] = useState<string | null>(null);
  const readingAreaRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToHighlight = useCallback((id: string) => {
    setSelectedHighlightId(id);
    const mark = readingAreaRef.current?.querySelector(
      `[data-highlight-id="${id}"]`,
    );
    if (mark && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const markRect = mark.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const scrollTop =
        container.scrollTop + (markRect.top - containerRect.top) - containerRect.height / 3;
      container.scrollTo({ top: scrollTop, behavior: "smooth" });
    }
  }, []);

  const gutterMarks = useMemo(() => {
    const textLength = source.raw_text?.length ?? 1;
    return source.highlights.map((h) => ({
      id: h.id,
      label: h.label,
      offsetPercent: Math.min((h.start_offset / textLength) * 100, 98),
    }));
  }, [source.highlights, source.raw_text]);

  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {/* ── Left pane: source list ── */}
      <aside
        style={{
          width: "var(--space-rail-width)",
          flexShrink: 0,
          borderRight: "var(--border-thin) solid var(--color-border)",
          backgroundColor: "var(--color-bg-rail)",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "0.75rem 0.75rem 0.5rem",
            borderBottom: "var(--border-thin) solid var(--color-border)",
          }}
        >
          <Link
            href={`/dossiers/${dossierId}/sources`}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              color: "var(--color-ink-secondary)",
              textDecoration: "none",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            ← All Sources
          </Link>
        </div>

        <nav style={{ flex: 1, overflowY: "auto" }}>
          {allSources.map((s) => {
            const isActive = s.id === source.id;
            return (
              <Link
                key={s.id}
                href={`/dossiers/${dossierId}/sources/${s.id}`}
                style={{
                  display: "block",
                  padding: "0.625rem 0.75rem",
                  borderBottom:
                    "var(--border-hairline) solid var(--color-border)",
                  backgroundColor: isActive
                    ? "var(--color-bg-selected)"
                    : "transparent",
                  textDecoration: "none",
                  borderLeft: isActive
                    ? "var(--border-rule) solid var(--color-accent-ink)"
                    : "var(--border-rule) solid transparent",
                  transition:
                    "background-color var(--duration-fast) ease",
                }}
              >
                <span
                  style={{
                    display: "block",
                    fontFamily: "var(--font-sans)",
                    fontSize: "0.8125rem",
                    fontWeight: isActive ? 500 : 400,
                    color: isActive
                      ? "var(--color-ink-primary)"
                      : "var(--color-ink-secondary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.title}
                </span>
                <span
                  style={{
                    display: "block",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6875rem",
                    color: "var(--color-ink-secondary)",
                    opacity: 0.7,
                    marginTop: "0.125rem",
                  }}
                >
                  {TYPE_LABELS[s.type] ?? s.type}
                  {s._count.highlights > 0 &&
                    ` · ${s._count.highlights} hl`}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ── Center pane: evidence gutter + reading area ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <EvidenceGutter marks={gutterMarks} onMarkClick={scrollToHighlight} />

        <div
          ref={scrollContainerRef}
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <article
            style={{
              width: "100%",
              maxWidth: "var(--space-content-max)",
              padding: "2rem 2.5rem",
            }}
          >
            {/* Source title */}
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.5rem",
                fontWeight: 600,
                color: "var(--color-ink-primary)",
                marginBottom: "0.5rem",
                lineHeight: 1.25,
              }}
            >
              {source.title}
            </h2>

            {/* Meta line */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem",
                alignItems: "center",
                marginBottom: "1.5rem",
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                color: "var(--color-ink-secondary)",
              }}
            >
              <span
                className={
                  STATUS_CHIP_CLASS[source.source_status] ?? "chip"
                }
              >
                {STATUS_LABELS[source.source_status] ??
                  source.source_status}
              </span>
              <span>{TYPE_LABELS[source.type] ?? source.type}</span>
              {source.author && <span>by {source.author}</span>}
              {source.publisher && <span>· {source.publisher}</span>}
              <span>· Captured {formatDate(source.captured_at)}</span>
            </div>

            <hr className="divider" style={{ marginBottom: "1.5rem" }} />

            {/* Source body text */}
            {source.raw_text ? (
              <div
                ref={readingAreaRef}
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.9375rem",
                  lineHeight: 1.75,
                  color: "var(--color-ink-primary)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  position: "relative",
                }}
              >
                <HighlightedText
                  text={source.raw_text}
                  highlights={source.highlights}
                  selectedHighlightId={selectedHighlightId}
                  onHighlightClick={setSelectedHighlightId}
                />
                <SelectionToolbar
                  sourceId={source.id}
                  containerRef={readingAreaRef}
                  rawText={source.raw_text}
                />
              </div>
            ) : (
              <div
                style={{
                  padding: "3rem 2rem",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.8125rem",
                    color: "var(--color-ink-secondary)",
                    maxWidth: "none",
                  }}
                >
                  No text content available for this source.
                </p>
                {source.url && (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block",
                      marginTop: "0.5rem",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.75rem",
                    }}
                  >
                    Open original source →
                  </a>
                )}
              </div>
            )}
          </article>
        </div>
      </div>

      {/* ── Right pane: inspector ── */}
      <aside
        style={{
          width: inspectorOpen ? "var(--space-inspector-width)" : "0px",
          flexShrink: 0,
          borderLeft: inspectorOpen
            ? "var(--border-thin) solid var(--color-border)"
            : "none",
          backgroundColor: "var(--color-bg-panel)",
          overflowY: "auto",
          overflowX: "hidden",
          transition: "width var(--duration-slow) ease",
        }}
      >
        {/* Inspector toggle */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 1,
            backgroundColor: "var(--color-bg-panel)",
            borderBottom: "var(--border-thin) solid var(--color-border)",
            padding: "0.5rem 0.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              color: "var(--color-ink-secondary)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Inspector
          </span>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setInspectorOpen(false)}
            aria-label="Close inspector"
            style={{ padding: "0.125rem 0.375rem", fontSize: "0.75rem" }}
          >
            ✕
          </button>
        </div>

        {/* Metadata section */}
        <InspectorSection title="Metadata">
          <MetaRow label="Type" value={TYPE_LABELS[source.type] ?? source.type} />
          <MetaRow label="Status" value={STATUS_LABELS[source.source_status] ?? source.source_status} />
          {source.author && <MetaRow label="Author" value={source.author} />}
          {source.publisher && <MetaRow label="Publisher" value={source.publisher} />}
          {source.published_at && (
            <MetaRow label="Published" value={formatDate(source.published_at)} />
          )}
          <MetaRow label="Captured" value={formatDate(source.captured_at)} />
          {source.credibility_rating != null && (
            <MetaRow
              label="Credibility"
              value={String(source.credibility_rating)}
            />
          )}
          {source.url && (
            <MetaRow
              label="URL"
              value={
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: "0.75rem",
                    wordBreak: "break-all",
                  }}
                >
                  {source.url.length > 50
                    ? source.url.slice(0, 50) + "…"
                    : source.url}
                </a>
              }
            />
          )}
          {source.tags.length > 0 && (
            <div style={{ marginTop: "0.375rem" }}>
              <div
                style={{
                  display: "flex",
                  gap: "0.25rem",
                  flexWrap: "wrap",
                }}
              >
                {source.tags.map((t) => (
                  <span
                    key={t.tag.id}
                    className="chip chip-citation"
                    style={{ fontSize: "0.6875rem" }}
                  >
                    {t.tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </InspectorSection>

        {/* Summary section */}
        {source.summary && (
          <InspectorSection title="Summary">
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.8125rem",
                color: "var(--color-ink-secondary)",
                lineHeight: 1.55,
                maxWidth: "none",
              }}
            >
              {source.summary}
            </p>
          </InspectorSection>
        )}

        {/* Highlights section */}
        <InspectorSection
          title="Highlights"
          count={source.highlights.length}
        >
          {source.highlights.length === 0 ? (
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                color: "var(--color-ink-secondary)",
                opacity: 0.6,
                maxWidth: "none",
              }}
            >
              No highlights yet. Select text to create one.
            </p>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {source.highlights.map((h) => (
                <HighlightCard
                  key={h.id}
                  highlight={h}
                  isSelected={h.id === selectedHighlightId}
                  onClick={() => scrollToHighlight(h.id)}
                />
              ))}
            </div>
          )}
        </InspectorSection>

        {/* Linked Claims placeholder */}
        <InspectorSection title="Linked Claims">
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "var(--color-ink-secondary)",
              opacity: 0.6,
              maxWidth: "none",
            }}
          >
            Claims linked to this source will appear here.
          </p>
        </InspectorSection>

        {/* Linked Entities placeholder */}
        <InspectorSection title="Linked Entities">
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "var(--color-ink-secondary)",
              opacity: 0.6,
              maxWidth: "none",
            }}
          >
            Entities mentioned in this source will appear here.
          </p>
        </InspectorSection>
      </aside>

      {/* Inspector reopen button (when collapsed) */}
      {!inspectorOpen && (
        <button
          type="button"
          onClick={() => setInspectorOpen(true)}
          aria-label="Open inspector"
          style={{
            position: "fixed",
            right: "0.75rem",
            top: "50%",
            transform: "translateY(-50%)",
            backgroundColor: "var(--color-bg-panel)",
            border: "var(--border-thin) solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            padding: "0.5rem 0.375rem",
            cursor: "pointer",
            boxShadow: "var(--shadow-panel)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.6875rem",
            color: "var(--color-ink-secondary)",
            writingMode: "vertical-rl",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Inspector
        </button>
      )}
    </div>
  );
}

/* ── Inspector sub-components ── */

function InspectorSection({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        padding: "0.75rem",
        borderBottom: "var(--border-thin) solid var(--color-border)",
      }}
    >
      <h4
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.6875rem",
          fontWeight: 500,
          color: "var(--color-ink-secondary)",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          marginBottom: "0.5rem",
        }}
      >
        {title}
        {count != null && (
          <span
            style={{
              marginLeft: "0.375rem",
              fontWeight: 400,
              opacity: 0.7,
            }}
          >
            ({count})
          </span>
        )}
      </h4>
      {children}
    </section>
  );
}

function MetaRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        padding: "0.1875rem 0",
        gap: "0.5rem",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.6875rem",
          color: "var(--color-ink-secondary)",
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "0.8125rem",
          color: "var(--color-ink-primary)",
          textAlign: "right",
          minWidth: 0,
        }}
      >
        {value}
      </span>
    </div>
  );
}
