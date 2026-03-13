"use client";

import { useState, useTransition, useMemo } from "react";
import { CaptureSourceModal } from "./CaptureSourceModal";
import { SourceFilterBar } from "./SourceFilterBar";
import { SourceStatusMenu } from "./SourceStatusMenu";
import { updateSourceStatus } from "@/server/actions/sources";
import type { SourceListItem } from "@/server/queries/sources";
import type { SourceType, SourceStatus } from "@prisma/client";

interface Props {
  dossierId: string;
  sources: SourceListItem[];
}

const TYPE_LABELS: Record<string, string> = {
  web_link: "URL",
  pdf: "PDF",
  pasted_text: "Pasted",
  manual_note: "Note",
  internal_memo: "Memo",
};

const STATUS_CHIP_CLASS: Record<string, string> = {
  unreviewed: "chip",
  reviewing: "chip chip-warning",
  reviewed: "chip chip-success",
  discarded: "chip chip-alert",
};

const STATUS_LABELS: Record<string, string> = {
  unreviewed: "Unreviewed",
  reviewing: "Reviewing",
  reviewed: "Reviewed",
  discarded: "Discarded",
};

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function CredibilityIndicator({ rating }: { rating: number | null }) {
  if (rating == null) {
    return (
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.75rem",
          color: "var(--color-ink-secondary)",
          opacity: 0.5,
        }}
      >
        —
      </span>
    );
  }

  let color = "var(--color-ink-secondary)";
  if (rating >= 70) color = "var(--color-accent-success)";
  else if (rating >= 40) color = "var(--color-accent-warning)";
  else color = "var(--color-accent-alert)";

  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.75rem",
        fontWeight: 500,
        color,
      }}
    >
      {rating}
    </span>
  );
}

export function SourcesClient({ dossierId, sources }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<SourceType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<SourceStatus | "all">("all");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return sources.filter((s) => {
      if (typeFilter !== "all" && s.type !== typeFilter) return false;
      if (statusFilter !== "all" && s.source_status !== statusFilter)
        return false;
      return true;
    });
  }, [sources, typeFilter, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: sources.length,
      unreviewed: 0,
      reviewing: 0,
      reviewed: 0,
      discarded: 0,
    };
    for (const s of sources) {
      counts[s.source_status] = (counts[s.source_status] ?? 0) + 1;
    }
    return counts;
  }, [sources]);

  const [statusError, setStatusError] = useState<string | null>(null);

  function handleStatusChange(sourceId: string, newStatus: SourceStatus) {
    startTransition(async () => {
      const result = await updateSourceStatus(sourceId, newStatus);
      if ("error" in result) {
        setStatusError(result.error);
        setTimeout(() => setStatusError(null), 4000);
      }
    });
  }

  return (
    <div
      style={{
        padding: "2rem var(--space-gutter)",
        maxWidth: "960px",
        marginInline: "auto",
        width: "100%",
      }}
    >
      {statusError && (
        <div
          role="alert"
          style={{
            padding: "0.75rem 1rem",
            marginBottom: "1rem",
            backgroundColor: "var(--color-accent-alert)",
            color: "#fff",
            borderRadius: "4px",
            fontFamily: "var(--font-ui)",
            fontSize: "0.875rem",
          }}
        >
          {statusError}
        </div>
      )}
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1rem",
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.125rem",
              color: "var(--color-ink-primary)",
              marginBottom: "0.25rem",
            }}
          >
            Sources
          </h2>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "var(--color-ink-secondary)",
              maxWidth: "none",
            }}
          >
            {sources.length} source{sources.length !== 1 ? "s" : ""}
            {statusCounts.unreviewed > 0 && (
              <span>
                {" "}
                · {statusCounts.unreviewed} unreviewed
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setModalOpen(true)}
        >
          + Add Source
        </button>
      </div>

      {/* Filters */}
      {sources.length > 0 && (
        <SourceFilterBar
          typeFilter={typeFilter}
          statusFilter={statusFilter}
          onTypeChange={setTypeFilter}
          onStatusChange={setStatusFilter}
          statusCounts={statusCounts}
        />
      )}

      {/* Content */}
      {sources.length === 0 ? (
        <div
          className="panel"
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
              marginBottom: "0.5rem",
              maxWidth: "none",
            }}
          >
            No sources yet.
          </p>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "0.875rem",
              color: "var(--color-ink-secondary)",
              fontStyle: "italic",
              maxWidth: "none",
            }}
          >
            Add a URL, paste text, or write a note to begin building your
            evidence base.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="panel"
          style={{
            padding: "2rem",
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
            No sources match the current filters.
          </p>
        </div>
      ) : (
        <div
          className="panel"
          style={{ overflow: "hidden", opacity: isPending ? 0.7 : 1, transition: "opacity var(--duration-fast)" }}
        >
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Credibility</th>
                <th>Tags</th>
                <th>Captured</th>
                <th style={{ width: "1%" }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((source) => (
                <tr key={source.id}>
                  <td
                    style={{
                      fontWeight: 500,
                      maxWidth: "280px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {source.title}
                    {source._count.highlights > 0 && (
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.6875rem",
                          color: "var(--color-accent-ink)",
                          marginLeft: "0.5rem",
                        }}
                      >
                        {source._count.highlights} highlight
                        {source._count.highlights !== 1 ? "s" : ""}
                      </span>
                    )}
                  </td>
                  <td>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.75rem",
                        color: "var(--color-ink-secondary)",
                      }}
                    >
                      {TYPE_LABELS[source.type] ?? source.type}
                    </span>
                  </td>
                  <td>
                    <span
                      className={
                        STATUS_CHIP_CLASS[source.source_status] ?? "chip"
                      }
                    >
                      {STATUS_LABELS[source.source_status] ??
                        source.source_status}
                    </span>
                  </td>
                  <td>
                    <CredibilityIndicator rating={source.credibility_rating} />
                  </td>
                  <td>
                    {source.tags.length > 0 ? (
                      <div
                        style={{
                          display: "flex",
                          gap: "0.25rem",
                          flexWrap: "wrap",
                        }}
                      >
                        {source.tags.slice(0, 3).map((t) => (
                          <span
                            key={t.tag.id}
                            className="chip chip-citation"
                            style={{ fontSize: "0.6875rem" }}
                          >
                            {t.tag.name}
                          </span>
                        ))}
                        {source.tags.length > 3 && (
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "0.6875rem",
                              color: "var(--color-ink-secondary)",
                            }}
                          >
                            +{source.tags.length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.75rem",
                          color: "var(--color-ink-secondary)",
                          opacity: 0.5,
                        }}
                      >
                        —
                      </span>
                    )}
                  </td>
                  <td
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.75rem",
                      color: "var(--color-ink-secondary)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatDate(source.captured_at)}
                  </td>
                  <td>
                    <SourceStatusMenu
                      sourceId={source.id}
                      currentStatus={source.source_status}
                      onStatusChange={handleStatusChange}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CaptureSourceModal
        key={modalOpen ? "open" : "closed"}
        dossierId={dossierId}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
