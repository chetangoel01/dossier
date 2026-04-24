"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { deleteClaim, updateClaim } from "@/server/actions/claims";
import type { ClaimListItem } from "@/server/queries/claims";
import type { EntityListItem } from "@/server/queries/entities";
import type { ClaimStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { EntityChip } from "@/components/entities/EntityChip";
import {
  EntityLinkModal,
  type LinkTarget,
} from "@/components/entities/EntityLinkModal";
import { EmptyState } from "@/components/ui/EmptyState";

interface Props {
  dossierId: string;
  claims: ClaimListItem[];
  entities: EntityListItem[];
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

type InlineSaveStatus = "saved" | "dirty" | "saving" | "error";

const CLAIM_AUTOSAVE_DELAY_MS = 800;

interface InlineEditPayload {
  statement: string;
  confidence: number | null;
  notes: string | null;
}

function InlineEditForm({
  claim,
  onPersist,
  onDone,
}: {
  claim: ClaimListItem;
  onPersist: (
    id: string,
    data: InlineEditPayload,
  ) => Promise<{ error?: string }>;
  onDone: () => void;
}) {
  const [statement, setStatement] = useState(claim.statement);
  const [confidence, setConfidence] = useState(
    claim.confidence != null ? String(claim.confidence) : "",
  );
  const [notes, setNotes] = useState(claim.notes ?? "");
  const [status, setStatus] = useState<InlineSaveStatus>("saved");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const initialSnapshot = useRef<InlineEditPayload>({
    statement: claim.statement,
    confidence: claim.confidence ?? null,
    notes: claim.notes ?? null,
  });
  // Track the last successfully persisted values so the autosave effect
  // can ignore re-renders that carry no real user edit.
  const lastPersistedRef = useRef<InlineEditPayload>({
    statement: claim.statement,
    confidence: claim.confidence ?? null,
    notes: claim.notes ?? null,
  });

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const parseConfidence = (raw: string): number | null => {
    if (!raw.trim()) return null;
    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed)) return null;
    return Math.max(0, Math.min(100, parsed));
  };

  const persist = useCallback(
    async (payload: InlineEditPayload) => {
      setStatus("saving");
      setError(null);
      const result = await onPersist(claim.id, payload);
      if (result?.error) {
        setStatus("error");
        setError(result.error);
        return;
      }
      lastPersistedRef.current = payload;
      setStatus("saved");
    },
    [claim.id, onPersist],
  );

  // Debounced autosave: only fires on a genuine drift from the last save.
  useEffect(() => {
    const trimmedStatement = statement.trim();
    const parsedConfidence = parseConfidence(confidence);
    const trimmedNotes = notes.trim() || null;

    const snapshot = lastPersistedRef.current;
    if (
      trimmedStatement === snapshot.statement &&
      parsedConfidence === snapshot.confidence &&
      trimmedNotes === snapshot.notes
    ) {
      return;
    }

    if (!trimmedStatement) {
      setStatus("error");
      setError("Statement is required.");
      return;
    }

    setStatus("dirty");
    setError(null);
    const handle = window.setTimeout(() => {
      persist({
        statement: trimmedStatement,
        confidence: parsedConfidence,
        notes: trimmedNotes,
      });
    }, CLAIM_AUTOSAVE_DELAY_MS);

    return () => window.clearTimeout(handle);
  }, [statement, confidence, notes, persist]);

  // Warn before leaving the page if the user has unsaved edits.
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (status === "saved") return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [status]);

  const handleDone = () => {
    if (status !== "saved") {
      const initial = initialSnapshot.current;
      const warning =
        status === "error"
          ? "Discard unsaved changes? The last save failed."
          : "Changes are still saving. Close anyway?";
      if (!window.confirm(warning)) return;
      // Reset to the last persisted snapshot so an incoming parent refresh
      // doesn't show stale edits.
      setStatement(initial.statement);
      setConfidence(initial.confidence != null ? String(initial.confidence) : "");
      setNotes(initial.notes ?? "");
    }
    onDone();
  };

  const statusLabel = (() => {
    switch (status) {
      case "saving":
        return "Saving…";
      case "dirty":
        return "Unsaved…";
      case "error":
        return error ?? "Save failed";
      case "saved":
      default:
        return "Saved";
    }
  })();

  return (
    <div className="flex flex-col gap-2">
      <textarea
        ref={inputRef}
        className="input"
        value={statement}
        onChange={(e) => setStatement(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") handleDone();
        }}
        rows={2}
        style={{ minHeight: "2.5rem", fontSize: "0.9375rem" }}
        aria-invalid={status === "error" || undefined}
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
            className="input inline-block ml-1.5 py-0.5 px-1.5"
            min={0}
            max={100}
            value={confidence}
            onChange={(e) => setConfidence(e.target.value)}
            placeholder="0–100"
            style={{
              width: "5rem",
              fontSize: "0.75rem",
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
          onClick={handleDone}
          style={{ fontSize: "0.75rem", padding: "0.25rem 0.625rem" }}
          disabled={status === "saving" || status === "dirty"}
        >
          Done
        </button>
        <span
          role="status"
          aria-live="polite"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.625rem",
            color:
              status === "error"
                ? "var(--color-accent-alert)"
                : "var(--color-ink-secondary)",
          }}
        >
          {statusLabel}
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
  onLinkEntity,
  editingId,
  onPersistEdit,
  onFinishEdit,
}: {
  claim: ClaimListItem;
  dossierId: string;
  compact?: boolean;
  onStatusChange: (id: string, status: ClaimStatus) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onLinkEntity: (claim: ClaimListItem) => void;
  editingId: string | null;
  onPersistEdit: (
    id: string,
    data: InlineEditPayload,
  ) => Promise<{ error?: string }>;
  onFinishEdit: () => void;
}) {
  const isEditing = editingId === claim.id;
  const linkedEntities = claim.entities.map((claimEntity) => claimEntity.entity);

  return (
    <div
      id={`claim-${claim.id}`}
      className={`panel ${compact ? "py-3 px-4" : "py-4 px-5"}`}
      style={{
        borderLeft: "var(--border-rule) solid var(--color-accent-ink)",
      }}
    >
      {isEditing ? (
        <InlineEditForm
          claim={claim}
          onPersist={onPersistEdit}
          onDone={onFinishEdit}
        />
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p
              className="mb-2 max-w-none cursor-pointer"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: compact ? "0.8125rem" : "0.9375rem",
                color: "var(--color-ink-primary)",
                lineHeight: 1.5,
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
                  className="input py-0.5 px-1.5 w-auto"
                  style={{
                    fontSize: "0.6875rem",
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
                className="mt-2 max-w-none"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.8125rem",
                  color: "var(--color-ink-secondary)",
                  lineHeight: 1.45,
                  fontStyle: "italic",
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
                    className="block py-1.5 px-2"
                    style={{
                      backgroundColor: "var(--color-highlight-wash)",
                      borderRadius: "var(--radius-xs)",
                      textDecoration: "none",
                      transition:
                        "background-color var(--duration-fast) ease",
                    }}
                  >
                    <p
                      className="max-w-none"
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "0.75rem",
                        color: "var(--color-ink-primary)",
                        fontStyle: "italic",
                        lineHeight: 1.35,
                      }}
                    >
                      &ldquo;
                      {ch.highlight.quote_text.length > 100
                        ? ch.highlight.quote_text.slice(0, 100) + "…"
                        : ch.highlight.quote_text}
                      &rdquo;
                    </p>
                    <span
                      className="mt-0.5 block"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.625rem",
                        color: "var(--color-ink-secondary)",
                      }}
                    >
                      {ch.highlight.source.title}
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {linkedEntities.length > 0 && (
              <div
                className="mt-2.5 flex flex-wrap gap-1.5"
                style={{ alignItems: "center" }}
              >
                {linkedEntities.map((entity) => (
                  <EntityChip
                    key={entity.id}
                    entity={entity}
                    compact={compact}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => onLinkEntity(claim)}
              style={{
                fontSize: "0.6875rem",
                padding: "0.25rem 0.375rem",
                color: "var(--color-ink-secondary)",
              }}
              aria-label="Link entity"
            >
              Entity
            </button>
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
  onLinkEntity,
  editingId,
  onPersistEdit,
  onFinishEdit,
}: {
  claims: ClaimListItem[];
  dossierId: string;
  onStatusChange: (id: string, status: ClaimStatus) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onLinkEntity: (claim: ClaimListItem) => void;
  editingId: string | null;
  onPersistEdit: (
    id: string,
    data: InlineEditPayload,
  ) => Promise<{ error?: string }>;
  onFinishEdit: () => void;
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
    <div className="grid grid-cols-4 gap-3 items-start">
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
                className="py-6 px-3 text-center"
                style={{
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
                  onLinkEntity={onLinkEntity}
                  editingId={editingId}
                  onPersistEdit={onPersistEdit}
                  onFinishEdit={onFinishEdit}
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

export function ClaimsClient({ dossierId, claims, entities }: Props) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [linkTargetClaimId, setLinkTargetClaimId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  const flashError = useCallback((message: string) => {
    setActionError(message);
    window.setTimeout(() => {
      setActionError((current) => (current === message ? null : current));
    }, 4000);
  }, []);

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

  const linkTarget = useMemo<LinkTarget | null>(() => {
    const claim = claims.find((item) => item.id === linkTargetClaimId);
    if (!claim) return null;

    return {
      kind: "claim",
      id: claim.id,
      label:
        claim.statement.length > 180
          ? `${claim.statement.slice(0, 180)}…`
          : claim.statement,
      contextSnippet: claim.statement,
    };
  }, [claims, linkTargetClaimId]);

  const handleStatusChange = (claimId: string, newStatus: ClaimStatus) => {
    startTransition(async () => {
      const result = await updateClaim({ id: claimId, status: newStatus });
      if ("error" in result) {
        flashError(result.error);
        return;
      }
      router.refresh();
    });
  };

  const handleDelete = (claimId: string) => {
    if (!window.confirm("Delete this claim? This cannot be undone.")) return;
    startTransition(async () => {
      const result = await deleteClaim(claimId);
      if ("error" in result) {
        flashError(result.error);
        return;
      }
      router.refresh();
    });
  };

  // Called by the inline editor on every debounced autosave. Returning
  // `{ error }` lets the editor surface the message inline while the
  // list-level banner keeps track of the last failure too.
  const handlePersistEdit = useCallback(
    async (
      claimId: string,
      data: InlineEditPayload,
    ): Promise<{ error?: string }> => {
      const result = await updateClaim({
        id: claimId,
        statement: data.statement,
        confidence: data.confidence,
        notes: data.notes,
      });
      if ("error" in result) {
        flashError(result.error);
        return { error: result.error };
      }
      router.refresh();
      return {};
    },
    [flashError, router],
  );

  const handleFinishEdit = useCallback(() => setEditingId(null), []);

  return (
    <div
      className="mx-auto w-full"
      style={{
        padding: "2rem var(--space-gutter)",
        maxWidth: viewMode === "board" ? "1200px" : "960px",
        opacity: isPending ? 0.7 : 1,
        transition: "opacity var(--duration-fast) ease",
      }}
    >
      {actionError && (
        <div
          role="alert"
          style={{
            padding: "0.75rem 1rem",
            marginBottom: "1rem",
            backgroundColor: "var(--color-error-bg)",
            border: "var(--border-thin) solid var(--color-error-border)",
            borderRadius: "var(--radius-sm)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.8125rem",
            color: "var(--color-accent-alert)",
          }}
        >
          {actionError}
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2
            className="mb-1"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.125rem",
              color: "var(--color-ink-primary)",
            }}
          >
            Claims
          </h2>
          <p
            className="max-w-none"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "var(--color-ink-secondary)",
            }}
          >
            {claims.length} claim{claims.length !== 1 ? "s" : ""}
            {statusCounts.open ? ` · ${statusCounts.open} open` : ""}
          </p>
        </div>

        {/* View toggle */}
        <div
          className="flex gap-0.5 p-0.5"
          style={{
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
        <EmptyState
          eyebrow="No claims recorded."
          message="Claims are defensible assertions linked to source evidence. Draft them from highlights in the source reader."
        />
      ) : viewMode === "board" ? (
        <BoardView
          claims={claims}
          dossierId={dossierId}
          onStatusChange={handleStatusChange}
          onEdit={setEditingId}
          onDelete={handleDelete}
          onLinkEntity={(claim) => setLinkTargetClaimId(claim.id)}
          editingId={editingId}
          onPersistEdit={handlePersistEdit}
          onFinishEdit={handleFinishEdit}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          eyebrow="No claims match this filter."
          message="Clear the filter above to see every claim in this dossier."
          compact
        />
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
              onLinkEntity={(claim) => setLinkTargetClaimId(claim.id)}
              editingId={editingId}
              onPersistEdit={handlePersistEdit}
              onFinishEdit={handleFinishEdit}
            />
          ))}
        </div>
      )}

      <EntityLinkModal
        dossierId={dossierId}
        entities={entities}
        open={linkTarget != null}
        target={linkTarget}
        onClose={() => setLinkTargetClaimId(null)}
      />
    </div>
  );
}
