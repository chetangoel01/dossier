"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { EvidenceGutter } from "./EvidenceGutter";
import { HighlightedText } from "./HighlightedText";
import { SelectionToolbar } from "./SelectionToolbar";
import { CreateClaimModal } from "@/components/claims/CreateClaimModal";
import type {
  SourceReaderData,
  SourceListItem,
} from "@/server/queries/sources";
import type { SourceClaimItem } from "@/server/queries/claims";
import type {
  EntityBacklinkItem,
  EntityListItem,
} from "@/server/queries/entities";
import { getEntityBacklinkDetail } from "@/server/actions/entities";
import { dedupeById } from "@/lib/entities";
import { EntityChip } from "@/components/entities/EntityChip";
import {
  EntityLinkModal,
  type LinkTarget,
} from "@/components/entities/EntityLinkModal";
import { EntityDetailDrawer } from "@/components/entities/EntityDetailDrawer";

interface Props {
  dossierId: string;
  source: SourceReaderData;
  allSources: SourceListItem[];
  claims: SourceClaimItem[];
  entities: EntityListItem[];
}

interface EntityDrawerPreview {
  id: string;
  name: string;
  type: EntityListItem["type"];
  description?: string | null;
  aliases?: string[];
  importance?: number | null;
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

const LABEL_LABELS: Record<string, string> = {
  evidence: "Evidence",
  question: "Question",
  counterpoint: "Counterpoint",
  stat: "Stat",
  quote: "Quote",
};

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const CLAIM_STATUS_LABELS: Record<string, string> = {
  open: "Open",
  supported: "Supported",
  contested: "Contested",
  deprecated: "Deprecated",
};

const CLAIM_STATUS_CHIP: Record<string, string> = {
  open: "chip",
  supported: "chip chip-success",
  contested: "chip chip-alert",
  deprecated: "chip chip-warning",
};

export function SourceReaderClient({
  dossierId,
  source,
  allSources,
  claims,
  entities,
}: Props) {
  const searchParams = useSearchParams();
  const entityRequestIdRef = useRef(0);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const readingAreaRef = useRef<HTMLDivElement>(null);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [preselectedHighlightIds, setPreselectedHighlightIds] = useState<
    string[]
  >([]);
  const [entityTarget, setEntityTarget] = useState<LinkTarget | null>(null);
  const [selectedEntity, setSelectedEntity] =
    useState<EntityBacklinkItem | null>(null);
  const [selectedEntityPreview, setSelectedEntityPreview] =
    useState<EntityDrawerPreview | null>(null);
  const [isEntityDrawerOpen, setIsEntityDrawerOpen] = useState(false);
  const [isEntityDrawerPending, startEntityDrawerTransition] = useTransition();

  const activeHighlightId = searchParams.get("highlight");

  const openClaimModal = (highlightId?: string) => {
    setPreselectedHighlightIds(highlightId ? [highlightId] : []);
    setClaimModalOpen(true);
  };

  const openSourceEntityModal = () => {
    setEntityTarget({
      kind: "source",
      id: source.id,
      label: source.title,
      contextSnippet: source.summary ?? source.raw_text ?? source.title,
    });
  };

  const openHighlightEntityModal = (highlightId: string, quoteText: string) => {
    setEntityTarget({
      kind: "highlight",
      id: highlightId,
      label: quoteText.length > 180 ? `${quoteText.slice(0, 180)}…` : quoteText,
      contextSnippet: quoteText,
    });
  };

  const gutterMarks = useMemo(() => {
    const textLength = source.raw_text?.length ?? 1;
    return source.highlights.map((h) => ({
      id: h.id,
      label: h.label,
      offsetPercent: Math.min((h.start_offset / textLength) * 100, 98),
    }));
  }, [source.highlights, source.raw_text]);

  const linkedSourceEntities = useMemo(
    () =>
      dedupeById([
        ...source.mentions.map((mention) => mention.entity),
        ...source.highlights.flatMap((highlight) =>
          highlight.mentions.map((mention) => mention.entity)
        ),
      ]),
    [source.highlights, source.mentions]
  );

  function closeEntityDrawer() {
    entityRequestIdRef.current += 1;
    setIsEntityDrawerOpen(false);
    setSelectedEntity(null);
    setSelectedEntityPreview(null);
  }

  function openEntityDrawer(preview: EntityDrawerPreview) {
    const requestId = entityRequestIdRef.current + 1;
    entityRequestIdRef.current = requestId;

    setSelectedEntityPreview(preview);
    setSelectedEntity(null);
    setIsEntityDrawerOpen(true);

    startEntityDrawerTransition(async () => {
      const result = await getEntityBacklinkDetail({
        dossierId,
        entityId: preview.id,
      });

      if (entityRequestIdRef.current !== requestId) {
        return;
      }

      if ("error" in result) {
        setIsEntityDrawerOpen(false);
        setSelectedEntity(null);
        setSelectedEntityPreview(null);
        return;
      }

      setSelectedEntity(result.entity);
    });
  }

  useEffect(() => {
    if (!activeHighlightId) {
      return;
    }

    setInspectorOpen(true);

    const target = readingAreaRef.current?.querySelector<HTMLElement>(
      `[data-highlight-id="${activeHighlightId}"]`
    );

    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeHighlightId]);

  useEffect(() => {
    const handler = () => setInspectorOpen((prev) => !prev);
    window.addEventListener("dossier:toggle-inspector", handler);
    return () =>
      window.removeEventListener("dossier:toggle-inspector", handler);
  }, []);

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
                  transition: "background-color var(--duration-fast) ease",
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
                  {s._count.highlights > 0 && ` · ${s._count.highlights} hl`}
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
        <EvidenceGutter marks={gutterMarks} />

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <article
            id="source-context"
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
                className={STATUS_CHIP_CLASS[source.source_status] ?? "chip"}
              >
                {STATUS_LABELS[source.source_status] ?? source.source_status}
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
                  activeHighlightId={activeHighlightId}
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
          <MetaRow
            label="Type"
            value={TYPE_LABELS[source.type] ?? source.type}
          />
          <MetaRow
            label="Status"
            value={STATUS_LABELS[source.source_status] ?? source.source_status}
          />
          {source.author && <MetaRow label="Author" value={source.author} />}
          {source.publisher && (
            <MetaRow label="Publisher" value={source.publisher} />
          )}
          {source.published_at && (
            <MetaRow
              label="Published"
              value={formatDate(source.published_at)}
            />
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
        <InspectorSection title="Highlights" count={source.highlights.length}>
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
              {source.highlights.map((h) => {
                const isActiveHighlight = activeHighlightId === h.id;

                return (
                  <div
                    key={h.id}
                    id={`highlight-${h.id}`}
                    style={{
                      padding: "0.5rem",
                      borderLeft:
                        "var(--border-rule) solid var(--color-accent-ink)",
                      backgroundColor: "var(--color-highlight-wash)",
                      borderRadius: "0 var(--radius-xs) var(--radius-xs) 0",
                      boxShadow: isActiveHighlight
                        ? "0 0 0 2px rgba(24, 78, 119, 0.14)"
                        : "none",
                      transition: "box-shadow var(--duration-fast) ease",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "0.8125rem",
                        color: "var(--color-ink-primary)",
                        lineHeight: 1.45,
                        fontStyle: "italic",
                        maxWidth: "none",
                      }}
                    >
                      &ldquo;
                      {h.quote_text.length > 120
                        ? h.quote_text.slice(0, 120) + "…"
                        : h.quote_text}
                      &rdquo;
                    </p>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        marginTop: "0.25rem",
                        gap: "0.75rem",
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.6875rem",
                            color: "var(--color-ink-secondary)",
                          }}
                        >
                          {LABEL_LABELS[h.label] ?? h.label}
                        </span>

                        {h.mentions.length > 0 && (
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "0.375rem",
                              marginTop: "0.5rem",
                            }}
                          >
                            {h.mentions.map((mention) => (
                              <EntityChip
                                key={mention.id}
                                entity={mention.entity}
                                compact
                                onClick={() => openEntityDrawer(mention.entity)}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            openHighlightEntityModal(h.id, h.quote_text)
                          }
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.625rem",
                            color: "var(--color-accent-ink)",
                            backgroundColor: "transparent",
                            border: "none",
                            cursor: "pointer",
                            padding: "0.125rem 0.25rem",
                            borderRadius: "var(--radius-xs)",
                            letterSpacing: "0.02em",
                          }}
                        >
                          + Entity
                        </button>
                        <button
                          type="button"
                          onClick={() => openClaimModal(h.id)}
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.625rem",
                            color: "var(--color-accent-ink)",
                            backgroundColor: "transparent",
                            border: "none",
                            cursor: "pointer",
                            padding: "0.125rem 0.25rem",
                            borderRadius: "var(--radius-xs)",
                            letterSpacing: "0.02em",
                            transition:
                              "background-color var(--duration-fast) ease",
                          }}
                          onMouseEnter={(e) => {
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.backgroundColor =
                              "var(--color-bg-selected)";
                          }}
                          onMouseLeave={(e) => {
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.backgroundColor = "transparent";
                          }}
                        >
                          + Claim
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </InspectorSection>

        {/* Linked Claims */}
        <InspectorSection title="Linked Claims" count={claims.length}>
          {claims.length === 0 ? (
            <div>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.75rem",
                  color: "var(--color-ink-secondary)",
                  opacity: 0.6,
                  maxWidth: "none",
                  marginBottom: "0.5rem",
                }}
              >
                No claims yet. Create one from a highlight.
              </p>
              {source.highlights.length > 0 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => openClaimModal()}
                  style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                >
                  + Create Claim
                </button>
              )}
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {claims.map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: "0.5rem",
                    borderLeft:
                      "var(--border-rule) solid var(--color-accent-ink)",
                    backgroundColor: "var(--color-bg-canvas)",
                    borderRadius: "0 var(--radius-xs) var(--radius-xs) 0",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "0.8125rem",
                      color: "var(--color-ink-primary)",
                      lineHeight: 1.4,
                      maxWidth: "none",
                    }}
                  >
                    {c.statement.length > 140
                      ? c.statement.slice(0, 140) + "…"
                      : c.statement}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      marginTop: "0.25rem",
                    }}
                  >
                    <span
                      className={CLAIM_STATUS_CHIP[c.status] ?? "chip"}
                      style={{
                        fontSize: "0.625rem",
                        padding: "0.0625rem 0.375rem",
                      }}
                    >
                      {CLAIM_STATUS_LABELS[c.status] ?? c.status}
                    </span>
                    {c.confidence != null && (
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.625rem",
                          color: "var(--color-ink-secondary)",
                        }}
                      >
                        {c.confidence}%
                      </span>
                    )}
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.625rem",
                        color: "var(--color-ink-secondary)",
                      }}
                    >
                      · {c._count.highlights} hl
                    </span>
                  </div>

                  {c.entities.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.375rem",
                        marginTop: "0.5rem",
                      }}
                    >
                      {c.entities.map((claimEntity) => (
                        <EntityChip
                          key={claimEntity.entity.id}
                          entity={claimEntity.entity}
                          compact
                          onClick={() =>
                            openEntityDrawer(claimEntity.entity)
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => openClaimModal()}
                style={{
                  fontSize: "0.75rem",
                  padding: "0.25rem 0.5rem",
                  alignSelf: "flex-start",
                }}
              >
                + Create Claim
              </button>
            </div>
          )}
        </InspectorSection>

        {/* Linked Entities placeholder */}
        <InspectorSection
          title="Linked Entities"
          count={linkedSourceEntities.length}
        >
          {linkedSourceEntities.length === 0 ? (
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                color: "var(--color-ink-secondary)",
                opacity: 0.6,
                maxWidth: "none",
                marginBottom: "0.5rem",
              }}
            >
              No entity links yet. Attach durable references from the source
              body or a highlight.
            </p>
          ) : (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem",
                marginBottom: "0.75rem",
              }}
            >
              {linkedSourceEntities.map((entity) => (
                <EntityChip
                  key={entity.id}
                  entity={entity}
                  onClick={() => openEntityDrawer(entity)}
                />
              ))}
            </div>
          )}

          <button
            type="button"
            className="btn btn-secondary"
            onClick={openSourceEntityModal}
            style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
          >
            + Link Source Entity
          </button>
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

      {/* Create Claim Modal */}
      <CreateClaimModal
        dossierId={dossierId}
        highlights={source.highlights.map((h) => ({
          id: h.id,
          quote_text: h.quote_text,
          label: h.label,
        }))}
        preselectedHighlightIds={preselectedHighlightIds}
        open={claimModalOpen}
        onClose={() => setClaimModalOpen(false)}
      />

      <EntityLinkModal
        dossierId={dossierId}
        entities={entities}
        open={entityTarget != null}
        target={entityTarget}
        onClose={() => setEntityTarget(null)}
      />

      <EntityDetailDrawer
        dossierId={dossierId}
        open={isEntityDrawerOpen}
        entity={selectedEntity}
        entityPreview={selectedEntityPreview}
        loading={isEntityDrawerPending && selectedEntity == null}
        onClose={closeEntityDrawer}
      />
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

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
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
