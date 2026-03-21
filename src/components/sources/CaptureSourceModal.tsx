"use client";

import { useEffect, useRef, useState, useActionState } from "react";
import { createSource } from "@/server/actions/sources";
import type { SourceType } from "@prisma/client";

interface Props {
  dossierId: string;
  open: boolean;
  onClose: () => void;
}

type CaptureTab = "url" | "paste" | "note";

const TAB_CONFIG: { key: CaptureTab; label: string; sourceType: SourceType }[] = [
  { key: "url", label: "URL", sourceType: "web_link" },
  { key: "paste", label: "Paste Text", sourceType: "pasted_text" },
  { key: "note", label: "Note", sourceType: "manual_note" },
];

async function captureAction(
  _prev: string | null,
  formData: FormData,
): Promise<string | null> {
  const dossierId = formData.get("dossierId") as string;
  const type = formData.get("type") as SourceType;
  const title = formData.get("title") as string;
  const url = formData.get("url") as string | null;
  const rawText = formData.get("rawText") as string | null;

  const result = await createSource({
    dossierId,
    type,
    title,
    url: url || null,
    rawText: rawText || null,
  });

  if ("error" in result) return result.error;
  return null;
}

export function CaptureSourceModal({ dossierId, open, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [activeTab, setActiveTab] = useState<CaptureTab>("url");
  const [error, formAction, isPending] = useActionState(captureAction, null);
  const [modalKey, setModalKey] = useState(0);

  // Track the previous pending state to detect successful submission
  const prevPendingRef = useRef(isPending);
  useEffect(() => {
    // Transition from pending → not pending with no error = success
    if (prevPendingRef.current && !isPending && error === null && open) {
      onClose();
    }
    prevPendingRef.current = isPending;
  }, [isPending, error, open, onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      setModalKey((k) => k + 1);
      setActiveTab("url");
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

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

  const currentConfig = TAB_CONFIG.find((t) => t.key === activeTab)!;

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
        width: "min(520px, 92vw)",
        maxHeight: "90vh",
        overflowY: "auto",
      }}
    >
      <div style={{ padding: "1.75rem 2rem" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "1.25rem",
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
              Add Source
            </h2>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                color: "var(--color-ink-secondary)",
                maxWidth: "none",
              }}
            >
              Capture a URL, paste text, or write a note
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

        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Source capture type"
          style={{
            display: "flex",
            gap: 0,
            borderBottom: "var(--border-thin) solid var(--color-border)",
            marginBottom: "1.25rem",
          }}
        >
          {TAB_CONFIG.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={activeTab === key}
              onClick={() => setActiveTab(key)}
              style={{
                padding: "0.5rem 1rem",
                fontFamily: "var(--font-sans)",
                fontSize: "0.875rem",
                fontWeight: activeTab === key ? 500 : 400,
                color: activeTab === key
                  ? "var(--color-ink-primary)"
                  : "var(--color-ink-secondary)",
                background: "none",
                border: "none",
                borderBottom:
                  activeTab === key
                    ? "var(--border-rule) solid var(--color-accent-ink)"
                    : "var(--border-rule) solid transparent",
                marginBottom: "-1px",
                cursor: "pointer",
                transition:
                  "color var(--duration-fast) ease, border-color var(--duration-fast) ease",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form action={formAction} key={modalKey}>
          <input type="hidden" name="dossierId" value={dossierId} />
          <input type="hidden" name="type" value={currentConfig.sourceType} />

          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {/* Title */}
            <div>
              <label
                htmlFor="source-title"
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
                Title{" "}
                <span style={{ color: "var(--color-accent-alert)" }}>*</span>
              </label>
              <input
                id="source-title"
                name="title"
                type="text"
                required
                autoFocus
                placeholder={
                  activeTab === "url"
                    ? "e.g. SEC Filing — Northgate Pharma Q3 2025"
                    : activeTab === "paste"
                      ? "e.g. Reuters article on supply chain disruptions"
                      : "e.g. Interview notes — Jane Doe, March 2026"
                }
                className="input"
                style={{ fontSize: "0.9375rem" }}
              />
            </div>

            {/* URL field */}
            {activeTab === "url" && (
              <div>
                <label
                  htmlFor="source-url"
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
                  URL{" "}
                  <span style={{ color: "var(--color-accent-alert)" }}>*</span>
                </label>
                <input
                  id="source-url"
                  name="url"
                  type="url"
                  required
                  placeholder="https://..."
                  className="input"
                />
              </div>
            )}

            {/* Pasted text field */}
            {activeTab === "paste" && (
              <div>
                <label
                  htmlFor="source-paste"
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
                  Content{" "}
                  <span style={{ color: "var(--color-accent-alert)" }}>*</span>
                </label>
                <textarea
                  id="source-paste"
                  name="rawText"
                  required
                  rows={6}
                  placeholder="Paste article text or content here..."
                  className="input"
                  style={{ minHeight: "8rem" }}
                />
              </div>
            )}

            {/* Note field */}
            {activeTab === "note" && (
              <div>
                <label
                  htmlFor="source-note"
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
                  Note{" "}
                  <span style={{ color: "var(--color-accent-alert)" }}>*</span>
                </label>
                <textarea
                  id="source-note"
                  name="rawText"
                  required
                  rows={6}
                  placeholder="Write your research note..."
                  className="input"
                  style={{ minHeight: "8rem" }}
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.8125rem",
                  color: "var(--color-accent-alert)",
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "var(--color-error-bg)",
                  border: "var(--border-thin) solid var(--color-error-border)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                {error}
              </p>
            )}

            {/* Actions */}
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
                {isPending ? "Saving…" : "Add Source"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </dialog>
  );
}
