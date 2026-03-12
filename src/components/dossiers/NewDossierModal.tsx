"use client";

import { useEffect, useRef, useState } from "react";
import { createDossier } from "@/server/actions/dossiers";

interface NewDossierModalProps {
  userId: string;
  open: boolean;
  onClose: () => void;
}

export function NewDossierModal({ userId, open, onClose }: NewDossierModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setTimeout(() => titleRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await createDossier(userId, formData);

    setLoading(false);

    if ("error" in result) {
      setError(result.error);
    } else {
      onClose();
    }
  }

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-dossier-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(31, 41, 51, 0.4)",
        backdropFilter: "blur(2px)",
      }}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className="panel"
        style={{
          width: "100%",
          maxWidth: "480px",
          margin: "1rem",
          padding: "1.75rem",
          boxShadow: "var(--shadow-float)",
        }}
      >
        <h2
          id="new-dossier-title"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.25rem",
            color: "var(--color-ink-primary)",
            marginBottom: "1.25rem",
          }}
        >
          New Dossier
        </h2>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {error && (
            <p
              role="alert"
              style={{
                fontSize: "0.875rem",
                fontFamily: "var(--font-sans)",
                color: "var(--color-accent-alert)",
              }}
            >
              {error}
            </p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            <label
              htmlFor="dossier-title"
              style={{
                fontSize: "0.8125rem",
                fontFamily: "var(--font-sans)",
                color: "var(--color-ink-secondary)",
              }}
            >
              Title
            </label>
            <input
              ref={titleRef}
              id="dossier-title"
              name="title"
              type="text"
              required
              className="input"
              placeholder="e.g. Regulatory filing review"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            <label
              htmlFor="dossier-summary"
              style={{
                fontSize: "0.8125rem",
                fontFamily: "var(--font-sans)",
                color: "var(--color-ink-secondary)",
              }}
            >
              Summary{" "}
              <span style={{ color: "var(--color-ink-secondary)", opacity: 0.6 }}>
                (optional)
              </span>
            </label>
            <textarea
              id="dossier-summary"
              name="summary"
              className="input"
              placeholder="Brief description of what this dossier covers"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            <label
              htmlFor="dossier-goal"
              style={{
                fontSize: "0.8125rem",
                fontFamily: "var(--font-sans)",
                color: "var(--color-ink-secondary)",
              }}
            >
              Research goal{" "}
              <span style={{ color: "var(--color-ink-secondary)", opacity: 0.6 }}>
                (optional)
              </span>
            </label>
            <textarea
              id="dossier-goal"
              name="research_goal"
              className="input"
              placeholder="What question are you trying to answer?"
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.5rem",
              marginTop: "0.25rem",
            }}
          >
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? "Creating…" : "Create dossier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
