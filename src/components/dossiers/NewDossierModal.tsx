"use client";

import { useEffect, useRef, useActionState } from "react";
import { createDossier } from "@/server/actions/dossiers";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NewDossierModal({ open, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, formAction, isPending] = useActionState(createDossier, null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  // Close on backdrop click
  function handleDialogClick(e: React.MouseEvent<HTMLDialogElement>) {
    const rect = dialogRef.current?.getBoundingClientRect();
    if (!rect) return;
    const { clientX, clientY } = e;
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      onClose();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={handleDialogClick}
      style={{
        padding: 0,
        border: "var(--border-thin) solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        backgroundColor: "var(--color-bg-panel)",
        boxShadow: "var(--shadow-float)",
        width: "min(480px, 92vw)",
        maxHeight: "90vh",
        overflowY: "auto",
      }}
    >
      <div style={{ padding: "1.75rem 2rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "1.5rem",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.25rem",
                color: "var(--color-ink-primary)",
                marginBottom: "0.25rem",
              }}
            >
              New Dossier
            </h2>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                color: "var(--color-ink-secondary)",
                maxWidth: "none",
              }}
            >
              Start a new research workspace
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: "0.25rem 0.5rem", marginTop: "-0.25rem" }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* key resets the form and its useActionState error each time the modal opens */}
        <form key={open ? "open" : "closed"} action={formAction}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label
                htmlFor="dossier-title"
                style={{
                  display: "block",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  color: "var(--color-ink-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "0.375rem",
                }}
              >
                Title <span style={{ color: "var(--color-accent-alert)" }}>*</span>
              </label>
              <input
                id="dossier-title"
                name="title"
                type="text"
                required
                autoFocus
                placeholder="e.g. Northgate Pharma FDA Review"
                className="input"
                style={{ fontSize: "0.9375rem" }}
              />
            </div>

            <div>
              <label
                htmlFor="dossier-summary"
                style={{
                  display: "block",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  color: "var(--color-ink-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "0.375rem",
                }}
              >
                Summary{" "}
                <span style={{ color: "var(--color-ink-secondary)", fontWeight: 400 }}>
                  (optional)
                </span>
              </label>
              <textarea
                id="dossier-summary"
                name="summary"
                rows={2}
                placeholder="Brief description of what this dossier covers"
                className="input"
                style={{ minHeight: "3.5rem" }}
              />
            </div>

            <div>
              <label
                htmlFor="dossier-goal"
                style={{
                  display: "block",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  color: "var(--color-ink-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "0.375rem",
                }}
              >
                Research Goal{" "}
                <span style={{ color: "var(--color-ink-secondary)", fontWeight: 400 }}>
                  (optional)
                </span>
              </label>
              <input
                id="dossier-goal"
                name="research_goal"
                type="text"
                placeholder="What question does this research answer?"
                className="input"
              />
            </div>

            {error && (
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.8125rem",
                  color: "var(--color-accent-alert)",
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "#f0dede",
                  border: "var(--border-thin) solid #d4a8a8",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                {error}
              </p>
            )}

            <div
              style={{
                display: "flex",
                gap: "0.625rem",
                justifyContent: "flex-end",
                paddingTop: "0.25rem",
                borderTop: "var(--border-thin) solid var(--color-border)",
                marginTop: "0.25rem",
              }}
            >
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onClose}
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isPending}
              >
                {isPending ? "Creating…" : "Create Dossier"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </dialog>
  );
}
