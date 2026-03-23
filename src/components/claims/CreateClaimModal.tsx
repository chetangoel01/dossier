"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClaim } from "@/server/actions/claims";
import type { ClaimStatus } from "@prisma/client";

interface HighlightOption {
  id: string;
  quote_text: string;
  label: string;
}

interface CreateClaimModalProps {
  dossierId: string;
  highlights: HighlightOption[];
  preselectedHighlightIds?: string[];
  open: boolean;
  onClose: () => void;
}

const STATUS_OPTIONS: { value: ClaimStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "supported", label: "Supported" },
  { value: "contested", label: "Contested" },
  { value: "deprecated", label: "Deprecated" },
];

const LABEL_LABELS: Record<string, string> = {
  evidence: "Evidence",
  question: "Question",
  counterpoint: "Counterpoint",
  stat: "Stat",
  quote: "Quote",
};

export function CreateClaimModal({
  dossierId,
  highlights,
  preselectedHighlightIds,
  open,
  onClose,
}: CreateClaimModalProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [statement, setStatement] = useState("");
  const [status, setStatus] = useState<ClaimStatus>("open");
  const [confidence, setConfidence] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedHighlightIds, setSelectedHighlightIds] = useState<Set<string>>(
    new Set(preselectedHighlightIds ?? []),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync preselected highlights when modal opens
  useEffect(() => {
    if (open) {
      setSelectedHighlightIds(new Set(preselectedHighlightIds ?? []));
      setStatement("");
      setStatus("open");
      setConfidence("");
      setNotes("");
      setError(null);
    }
  }, [open, preselectedHighlightIds]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const toggleHighlight = (id: string) => {
    setSelectedHighlightIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setError(null);
    setSaving(true);

    const highlightIds = Array.from(selectedHighlightIds);
    const result = await createClaim({
      dossierId,
      statement,
      status,
      confidence: confidence ? Number(confidence) : null,
      notes: notes || null,
      highlightIds,
    });

    setSaving(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    router.refresh();
    onClose();
  };

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        border: "none",
        borderRadius: "var(--radius-md)",
        backgroundColor: "var(--color-bg-panel)",
        boxShadow: "var(--shadow-overlay)",
        padding: 0,
        width: "min(560px, 90vw)",
        maxHeight: "85vh",
        overflow: "hidden",
      }}
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", maxHeight: "85vh" }}>
        {/* Header */}
        <div
          style={{
            padding: "1rem 1.25rem",
            borderBottom: "var(--border-thin) solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.125rem",
              fontWeight: 600,
              color: "var(--color-ink-primary)",
            }}
          >
            Create Claim
          </h3>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "1.25rem", overflowY: "auto", flex: 1 }}>
          {error && (
            <div
              style={{
                padding: "0.5rem 0.75rem",
                marginBottom: "1rem",
                backgroundColor: "rgba(139, 58, 58, 0.08)",
                border: "var(--border-thin) solid var(--color-accent-alert)",
                borderRadius: "var(--radius-sm)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                color: "var(--color-accent-alert)",
              }}
            >
              {error}
            </div>
          )}

          {/* Statement */}
          <label
            style={{
              display: "block",
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              color: "var(--color-ink-secondary)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              marginBottom: "0.375rem",
            }}
          >
            Statement *
          </label>
          <textarea
            className="input"
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            placeholder="A clear, defensible assertion drawn from evidence..."
            required
            rows={3}
            style={{
              width: "100%",
              resize: "vertical",
              marginBottom: "1rem",
            }}
          />

          {/* Status + Confidence row */}
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.6875rem",
                  color: "var(--color-ink-secondary)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  marginBottom: "0.375rem",
                }}
              >
                Status
              </label>
              <select
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value as ClaimStatus)}
                style={{ width: "100%" }}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.6875rem",
                  color: "var(--color-ink-secondary)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  marginBottom: "0.375rem",
                }}
              >
                Confidence (0–100)
              </label>
              <input
                className="input"
                type="number"
                min={0}
                max={100}
                value={confidence}
                onChange={(e) => setConfidence(e.target.value)}
                placeholder="—"
                style={{ width: "100%" }}
              />
            </div>
          </div>

          {/* Notes */}
          <label
            style={{
              display: "block",
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              color: "var(--color-ink-secondary)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              marginBottom: "0.375rem",
            }}
          >
            Notes
          </label>
          <textarea
            className="input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional context or reasoning..."
            rows={2}
            style={{
              width: "100%",
              resize: "vertical",
              marginBottom: "1rem",
            }}
          />

          {/* Linked Highlights */}
          <label
            style={{
              display: "block",
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              color: "var(--color-ink-secondary)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              marginBottom: "0.375rem",
            }}
          >
            Evidence ({selectedHighlightIds.size} selected) *
          </label>
          <div
            style={{
              maxHeight: "180px",
              overflowY: "auto",
              border: "var(--border-thin) solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "var(--color-bg-canvas)",
            }}
          >
            {highlights.length === 0 ? (
              <p
                style={{
                  padding: "1rem",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.75rem",
                  color: "var(--color-ink-secondary)",
                  opacity: 0.6,
                  textAlign: "center",
                  maxWidth: "none",
                }}
              >
                No highlights available. Highlight source text first.
              </p>
            ) : (
              highlights.map((h) => {
                const isSelected = selectedHighlightIds.has(h.id);
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => toggleHighlight(h.id)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "0.5rem 0.625rem",
                      backgroundColor: isSelected
                        ? "var(--color-highlight-wash)"
                        : "transparent",
                      border: "none",
                      borderBlockEnd:
                        "var(--border-hairline) solid var(--color-border)",
                      cursor: "pointer",
                      transition:
                        "background-color var(--duration-fast) ease",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.5rem",
                      }}
                    >
                      <span
                        style={{
                          flexShrink: 0,
                          width: "1rem",
                          height: "1rem",
                          border:
                            "var(--border-thin) solid var(--color-border)",
                          borderRadius: "var(--radius-xs)",
                          backgroundColor: isSelected
                            ? "var(--color-accent-ink)"
                            : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginTop: "0.0625rem",
                          fontSize: "0.625rem",
                          color: isSelected
                            ? "var(--color-bg-panel)"
                            : "transparent",
                        }}
                      >
                        ✓
                      </span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p
                          style={{
                            fontFamily: "var(--font-sans)",
                            fontSize: "0.8125rem",
                            color: "var(--color-ink-primary)",
                            lineHeight: 1.4,
                            fontStyle: "italic",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            maxWidth: "none",
                          }}
                        >
                          &ldquo;{h.quote_text}&rdquo;
                        </p>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.6875rem",
                            color: "var(--color-ink-secondary)",
                          }}
                        >
                          {LABEL_LABELS[h.label] ?? h.label}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "0.75rem 1.25rem",
            borderTop: "var(--border-thin) solid var(--color-border)",
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.5rem",
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving || !statement.trim() || selectedHighlightIds.size === 0}
          >
            {saving ? "Creating…" : "Create Claim"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
