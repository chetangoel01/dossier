"use client";

import { useState, useMemo, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import { deleteClaim, updateClaim } from "@/server/actions/claims";
import type { ClaimListItem } from "@/server/queries/claims";
import type { ClaimStatus } from "@prisma/client";
import { useRouter } from "next/navigation";

interface Props {
  dossierId: string;
  claims: ClaimListItem[];
}

type ViewMode = "list" | "board";

const STATUS_OPTIONS: { value: ClaimStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "supported", label: "Supported" },
  { value: "contested", label: "Contested" },
  { value: "deprecated", label: "Deprecated" },
];

const STATUS_CHIP_CLASS: Record<ClaimStatus, string> = {
  open: "chip",
  supported: "chip chip-success",
  contested: "chip chip-alert",
  deprecated: "chip chip-warning",
};

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ConfidenceIndicator({ value }: { value: number | null }) {
  if (value == null) {
    return (
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.6875rem",
          color: "var(--color-ink-secondary)",
          opacity: 0.5,
        }}
      >
        —
      </span>
    );
  }

  let color = "var(--color-ink-secondary)";
  if (value >= 70) color = "var(--color-accent-success)";
  else if (value >= 40) color = "var(--color-accent-warning)";
  else color = "var(--color-accent-alert)";

  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.6875rem",
        fontWeight: 500,
        color,
      }}
    >
      {value}%
    </span>
  );
}

/* ─── Inline Edit Form ──────────────────────────────────────────── */

function InlineEditForm({
  claim,
  onSave,
  onCancel,
}: {
  claim: ClaimListItem;
  onSave: (data: {
    statement: string;
    confidence: number | null;
    notes: string | null;
  }) => void;
  onCancel: () => void;
}) {
  const [statement, setStatement] = useState(claim.statement);
  const [confidence, setConfidence] = useState(
    claim.confidence != null ? String(claim.confidence) : "",
  );
  const [notes, setNotes] = useState(claim.notes ?? "");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSubmit = () => {
    if (!statement.trim()) return;
    const conf = confidence.trim()
      ? Math.max(0, Math.min(100, parseInt(confidence, 10)))
      : null;
    onSave({
      statement: statement.trim(),
      confidence: Number.isNaN(conf) ? null : conf,
      notes: notes.trim() || null,
    });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
      }}
    >
      <textarea
        ref={inputRef}
        className="input"
        value={statement}
        onChange={(e) => setStatement(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
          if (e.key === "Escape") onCancel();
        }}
        rows={2}
        style={{ minHeight: "2.5rem", fontSize: "0.9375rem" }}
      />
      <div className="flex items-center gap-3">
        <label
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6875rem",
            color: "var(--color-ink-secondary)",
          }}
        >
          Confidence
          <input
            type="number"
            className="input"
            min={0}
            max={100}
            value={confidence}
            onChange={(e) => setConfidence(e.target.value)}
            placeholder="0–100"
            style={{
              width: "5rem",
              fontSize: "0.75rem",
              padding: "0.125rem 0.375rem",
              marginLeft: "0.375rem",
              display: "inline-block",
            }}
          />
        </label>
      </div>
      <textarea
        className="input"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        rows={2}
        style={{ minHeight: "2rem", fontSize: "0.8125rem" }}
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSubmit}
          style={{ fontSize: "0.75rem", padding: "0.25rem 0.625rem" }}
        >
          Save
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onCancel}
          style={{ fontSize: "0.75rem", padding: "0.25rem 0.625rem" }}
        >
          Cancel
        </button>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.625rem",
            color: "var(--color-ink-secondary)",
            marginLeft: "auto",
          }}
        >
          ⌘+Enter to save
        </span>
      </div>
    </div>
  );
}

/* ─── Claim Card (shared between list & board) ──────────────────── */

function ClaimCard({
  claim,
  dossierId,
  compact,
  onStatusChange,
  onEdit,
  onDelete,
  editingId,
  onSaveEdit,
  onCancelEdit,
}: {
  claim: ClaimListItem;
  dossierId: string;
  compact?: boolean;
  onStatusChange: (id: string, status: ClaimStatus) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  editingId: string | null;
  onSaveEdit: (
    id: string,
    data: {
      statement: string;
      confidence: number | null;
      notes: string | null;
    },
  ) => void;
  onCancelEdit: () => void;
}) {
  const isEditing = editingId === claim.id;

  return (
    <div
      className="panel"
      style={{
        padding: compact ? "0.75rem 1rem" : "1rem 1.25rem",
        borderLeft: "var(--border-rule) solid var(--color-accent-ink)",
      }}
    >
      {isEditing ? (
        <InlineEditForm
          claim={claim}
          onSave={(data) => onSaveEdit(claim.id, data)}
          onCancel={onCancelEdit}
        />
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "0.75rem",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: compact ? "0.8125rem" : "0.9375rem",
                color: "var(--color-ink-primary)",
                lineHeight: 1.5,
                marginBottom: "0.5rem",
                maxWidth: "none",
                cursor: "pointer",
              }}
              onClick={() => onEdit(claim.id)}
              title="Click to edit"
            >
              {claim.statement}
            </p>

            {/* Meta row */}
            <div className="flex items-center gap-2 flex-wrap">
              {!compact && (
                <select
                  value={claim.status}
                  onChange={(e) =>
                    onStatusChange(claim.id, e.target.value as ClaimStatus)
                  }
                  className="input"
                  style={{
                    fontSize: "0.6875rem",
                    padding: "0.125rem 0.375rem",
                    width: "auto",
                  }}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}

              {compact && (
                <ConfidenceIndicator value={claim.confidence} />
              )}
              {!compact && claim.confidence != null && (
                <span
                  className="chip chip-citation"
                  style={{ fontSize: "0.625rem" }}
                >
                  {claim.confidence}% confidence
                </span>
              )}

              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.6875rem",
                  color: "var(--color-ink-secondary)",
                }}
              >
                {claim._count.highlights} highlight
                {claim._count.highlights !== 1 ? "s" : ""}
              </span>

              {claim._count.entities > 0 && (
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6875rem",
                    color: "var(--color-ink-secondary)",
                  }}
                >
                  · {claim._count.entities} entit
                  {claim._count.entities !== 1 ? "ies" : "y"}
                </span>
              )}

              {!compact && (
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6875rem",
                    color: "var(--color-ink-secondary)",
                  }}
                >
                  · {formatDate(claim.created_at)}
                </span>
              )}
            </div>

            {/* Notes */}
            {!compact && claim.notes && (
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.8125rem",
                  color: "var(--color-ink-secondary)",
                  lineHeight: 1.45,
                  marginTop: "0.5rem",
                  fontStyle: "italic",
                  maxWidth: "none",
                }}
              >
                {claim.notes}
              </p>
            )}

            {/* Linked highlights */}
            {!compact && claim.highlights.length > 0 && (
              <div className="mt-2.5 flex flex-col gap-1">
                {claim.highlights.map((ch) => (
                  <Link
                    key={ch.highlight.id}
                    href={`/dossiers/${dossierId}/sources/${ch.highlight.source.id}`}
                    style={{
                      display: "block",
                      padding: "0.375rem 0.5rem",
                      backgroundColor: "var(--color-highlight-wash)",
                      borderRadius: "var(--radius-xs)",
                      textDecoration: "none",
                      transition:
                        "background-color var(--duration-fast) ease",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "0.75rem",
                        color: "var(--color-ink-primary)",
                        fontStyle: "italic",
                        lineHeight: 1.35,
                        maxWidth: "none",
                      }}
                    >
                      &ldquo;
                      {ch.highlight.quote_text.length > 100
                        ? ch.highlight.quote_text.slice(0, 100) + "…"
                        : ch.highlight.quote_text}
                      &rdquo;
                    </p>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.625rem",
                        color: "var(--color-ink-secondary)",
                        marginTop: "0.125rem",
                        display: "block",
                      }}
                    >
                      {ch.highlight.source.title}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => onEdit(claim.id)}
              style={{
                fontSize: "0.6875rem",
                padding: "0.25rem 0.375rem",
                color: "var(--color-ink-secondary)",
              }}
              aria-label="Edit claim"
            >
              Edit
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => onDelete(claim.id)}
              style={{
                fontSize: "0.6875rem",
                padding: "0.25rem 0.375rem",
                color: "var(--color-ink-secondary)",
              }}
              aria-label="Delete claim"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Board View ────────────────────────────────────────────────── */

function BoardView({
  claims,
  dossierId,
  onStatusChange,
  onEdit,
  onDelete,
  editingId,
  onSaveEdit,
  onCancelEdit,
}: {
  claims: ClaimListItem[];
  dossierId: string;
  onStatusChange: (id: string, status: ClaimStatus) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  editingId: string | null;
  onSaveEdit: (
    id: string,
    data: {
      statement: string;
      confidence: number | null;
      notes: string | null;
    },
  ) => void;
  onCancelEdit: () => void;
}) {
  const columns = useMemo(() => {
    const grouped: Record<ClaimStatus, ClaimListItem[]> = {
      open: [],
      supported: [],
      contested: [],
      deprecated: [],
    };
    for (const claim of claims) {
      grouped[claim.status].push(claim);
    }
    return grouped;
  }, [claims]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "0.75rem",
        alignItems: "start",
      }}
    >
      {STATUS_OPTIONS.map((col) => (
        <div key={col.value}>
          {/* Column header */}
          <div
            className="flex items-center justify-between mb-3"
            style={{
              padding: "0.375rem 0.5rem",
              backgroundColor: "var(--color-bg-rail)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <span
              className={STATUS_CHIP_CLASS[col.value]}
              style={{ fontSize: "0.6875rem" }}
            >
              {col.label}
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.625rem",
                color: "var(--color-ink-secondary)",
              }}
            >
              {columns[col.value].length}
            </span>
          </div>

          {/* Column cards */}
          <div className="flex flex-col gap-2">
            {columns[col.value].length === 0 ? (
              <div
                style={{
                  padding: "1.5rem 0.75rem",
                  textAlign: "center",
                  borderRadius: "var(--radius-md)",
                  border:
                    "var(--border-thin) dashed var(--color-border)",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6875rem",
                    color: "var(--color-ink-secondary)",
                    opacity: 0.6,
                  }}
                >
                  No claims
                </span>
              </div>
            ) : (
              columns[col.value].map((claim) => (
                <ClaimCard
                  key={claim.id}
                  claim={claim}
                  dossierId={dossierId}
                  compact
                  onStatusChange={onStatusChange}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  editingId={editingId}
                  onSaveEdit={onSaveEdit}
                  onCancelEdit={onCancelEdit}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────────────── */

export function ClaimsClient({ dossierId, claims }: Props) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (filterStatus === "all") return claims;
    return claims.filter((c) => c.status === filterStatus);
  }, [claims, filterStatus]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: claims.length };
    for (const c of claims) {
      counts[c.status] = (counts[c.status] ?? 0) + 1;
    }
    return counts;
  }, [claims]);

  const handleStatusChange = (claimId: string, newStatus: ClaimStatus) => {
    startTransition(async () => {
      await updateClaim({ id: claimId, status: newStatus });
      router.refresh();
    });
  };

  const handleDelete = (claimId: string) => {
    if (!window.confirm("Delete this claim? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteClaim(claimId);
      router.refresh();
    });
  };

  const handleSaveEdit = (
    claimId: string,
    data: {
      statement: string;
      confidence: number | null;
      notes: string | null;
    },
  ) => {
    setEditingId(null);
    startTransition(async () => {
      await updateClaim({
        id: claimId,
        statement: data.statement,
        confidence: data.confidence,
        notes: data.notes,
      });
      router.refresh();
    });
  };

  return (
    <div
      style={{
        padding: "2rem var(--space-gutter)",
        maxWidth: viewMode === "board" ? "1200px" : "960px",
        marginInline: "auto",
        width: "100%",
        opacity: isPending ? 0.7 : 1,
        transition: "opacity var(--duration-fast) ease",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.125rem",
              color: "var(--color-ink-primary)",
              marginBottom: "0.25rem",
            }}
          >
            Claims
          </h2>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "var(--color-ink-secondary)",
              maxWidth: "none",
            }}
          >
            {claims.length} claim{claims.length !== 1 ? "s" : ""}
            {statusCounts.open ? ` · ${statusCounts.open} open` : ""}
          </p>
        </div>

        {/* View toggle */}
        <div
          style={{
            display: "flex",
            gap: "0.125rem",
            padding: "0.125rem",
            backgroundColor: "var(--color-bg-rail)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          {(["list", "board"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.6875rem",
                padding: "0.25rem 0.625rem",
                borderRadius: "var(--radius-xs)",
                border: "none",
                backgroundColor:
                  viewMode === mode
                    ? "var(--color-bg-panel)"
                    : "transparent",
                color:
                  viewMode === mode
                    ? "var(--color-ink-primary)"
                    : "var(--color-ink-secondary)",
                cursor: "pointer",
                boxShadow:
                  viewMode === mode ? "var(--shadow-panel)" : "none",
                transition: "all var(--duration-fast) ease",
              }}
            >
              {mode === "list" ? "List" : "Board"}
            </button>
          ))}
        </div>
      </div>

      {/* Filter bar (list mode only) */}
      {viewMode === "list" && claims.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-4">
          {[{ value: "all", label: "All" }, ...STATUS_OPTIONS].map((opt) => {
            const count = statusCounts[opt.value] ?? 0;
            const isActive = filterStatus === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFilterStatus(opt.value)}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.6875rem",
                  padding: "0.25rem 0.625rem",
                  borderRadius: "var(--radius-sm)",
                  border: "var(--border-thin) solid var(--color-border)",
                  backgroundColor: isActive
                    ? "var(--color-bg-selected)"
                    : "transparent",
                  color: isActive
                    ? "var(--color-ink-primary)"
                    : "var(--color-ink-secondary)",
                  cursor: "pointer",
                  transition: "background-color var(--duration-fast) ease",
                }}
              >
                {opt.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      {claims.length === 0 ? (
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
            No claims recorded.
          </p>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "0.875rem",
              color: "var(--color-ink-secondary)",
              fontStyle: "italic",
            }}
          >
            Claims are defensible assertions linked to source evidence. Create
            them from highlights in the source reader.
          </p>
        </div>
      ) : viewMode === "board" ? (
        <BoardView
          claims={claims}
          dossierId={dossierId}
          onStatusChange={handleStatusChange}
          onEdit={setEditingId}
          onDelete={handleDelete}
          editingId={editingId}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={() => setEditingId(null)}
        />
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
            No claims match the current filter.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((claim) => (
            <ClaimCard
              key={claim.id}
              claim={claim}
              dossierId={dossierId}
              onStatusChange={handleStatusChange}
              onEdit={setEditingId}
              onDelete={handleDelete}
              editingId={editingId}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={() => setEditingId(null)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
