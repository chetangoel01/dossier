"use client";

import { useState, useRef, useEffect } from "react";
import { updateHighlight } from "@/server/actions/highlights";
import { useRouter } from "next/navigation";
import type { HighlightLabel } from "@prisma/client";

interface HighlightCardProps {
  highlight: {
    id: string;
    quote_text: string;
    label: string;
    annotation: string | null;
  };
  isSelected: boolean;
  onClick: () => void;
}

const LABEL_LABELS: Record<string, string> = {
  evidence: "Evidence",
  question: "Question",
  counterpoint: "Counterpoint",
  stat: "Stat",
  quote: "Quote",
};

const LABEL_COLORS: Record<string, string> = {
  evidence: "var(--color-accent-ink)",
  question: "var(--color-accent-warning)",
  counterpoint: "var(--color-accent-alert)",
  stat: "var(--color-accent-success)",
  quote: "var(--color-accent-ink)",
};

const ALL_LABELS: HighlightLabel[] = [
  "evidence",
  "question",
  "counterpoint",
  "stat",
  "quote",
];

export function HighlightCard({
  highlight,
  isSelected,
  onClick,
}: HighlightCardProps) {
  const router = useRouter();
  const [editingAnnotation, setEditingAnnotation] = useState(false);
  const [annotationValue, setAnnotationValue] = useState(
    highlight.annotation ?? "",
  );
  const [showLabelMenu, setShowLabelMenu] = useState(false);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const labelMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showLabelMenu) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (
        labelMenuRef.current &&
        !labelMenuRef.current.contains(e.target as Node)
      ) {
        setShowLabelMenu(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [showLabelMenu]);

  const labelColor =
    LABEL_COLORS[highlight.label] ?? "var(--color-accent-ink)";

  const handleSaveAnnotation = async () => {
    const trimmed = annotationValue.trim();
    if (trimmed === (highlight.annotation ?? "")) {
      setEditingAnnotation(false);
      return;
    }
    setSaving(true);
    const result = await updateHighlight({
      id: highlight.id,
      annotation: trimmed || null,
    });
    setSaving(false);
    if ("success" in result) {
      setEditingAnnotation(false);
      router.refresh();
    }
  };

  const handleLabelChange = async (label: HighlightLabel) => {
    setShowLabelMenu(false);
    if (label === highlight.label) return;
    setSaving(true);
    const result = await updateHighlight({
      id: highlight.id,
      label,
    });
    setSaving(false);
    if ("success" in result) {
      router.refresh();
    }
  };

  return (
    <div
      onClick={onClick}
      style={{
        padding: "0.5rem",
        borderLeft: `var(--border-rule) solid ${labelColor}`,
        backgroundColor: isSelected
          ? "var(--color-bg-selected)"
          : "var(--color-highlight-wash)",
        borderRadius: "0 var(--radius-xs) var(--radius-xs) 0",
        cursor: "pointer",
        transition: "background-color var(--duration-fast) ease",
        opacity: saving ? 0.7 : 1,
      }}
    >
      {/* Quote text */}
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
        {highlight.quote_text.length > 120
          ? highlight.quote_text.slice(0, 120) + "…"
          : highlight.quote_text}
        &rdquo;
      </p>

      {/* Label chip */}
      <div
        ref={labelMenuRef}
        style={{
          marginTop: "0.375rem",
          display: "flex",
          alignItems: "center",
          gap: "0.375rem",
          position: "relative",
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowLabelMenu(!showLabelMenu);
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            fontFamily: "var(--font-mono)",
            fontSize: "0.625rem",
            color: labelColor,
            backgroundColor: "transparent",
            border: `1px solid ${labelColor}`,
            borderRadius: "var(--radius-xs)",
            padding: "0.125rem 0.375rem",
            cursor: "pointer",
            letterSpacing: "0.03em",
            textTransform: "uppercase",
            fontWeight: 500,
            lineHeight: 1.4,
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: labelColor,
              flexShrink: 0,
            }}
          />
          {LABEL_LABELS[highlight.label] ?? highlight.label}
        </button>

        {/* Label dropdown */}
        {showLabelMenu && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              marginTop: "0.25rem",
              backgroundColor: "var(--color-bg-panel)",
              border: "var(--border-thin) solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              boxShadow: "var(--shadow-panel)",
              zIndex: 10,
              overflow: "hidden",
            }}
          >
            {ALL_LABELS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => handleLabelChange(l)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  width: "100%",
                  padding: "0.375rem 0.625rem",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.6875rem",
                  color:
                    l === highlight.label
                      ? LABEL_COLORS[l]
                      : "var(--color-ink-secondary)",
                  backgroundColor:
                    l === highlight.label
                      ? "var(--color-highlight-wash)"
                      : "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  letterSpacing: "0.02em",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: LABEL_COLORS[l],
                    flexShrink: 0,
                  }}
                />
                {LABEL_LABELS[l]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Annotation */}
      {isSelected && (
        <div
          style={{ marginTop: "0.375rem" }}
          onClick={(e) => e.stopPropagation()}
        >
          {editingAnnotation ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <textarea
                ref={textareaRef}
                value={annotationValue}
                onChange={(e) => setAnnotationValue(e.target.value)}
                placeholder="Add a note…"
                rows={2}
                autoFocus
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.75rem",
                  color: "var(--color-ink-primary)",
                  backgroundColor: "var(--color-bg-panel)",
                  border: "var(--border-thin) solid var(--color-border)",
                  borderRadius: "var(--radius-xs)",
                  padding: "0.375rem",
                  resize: "vertical",
                  lineHeight: 1.45,
                  width: "100%",
                  outline: "none",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    handleSaveAnnotation();
                  }
                  if (e.key === "Escape") {
                    setAnnotationValue(highlight.annotation ?? "");
                    setEditingAnnotation(false);
                  }
                }}
              />
              <div style={{ display: "flex", gap: "0.25rem", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setAnnotationValue(highlight.annotation ?? "");
                    setEditingAnnotation(false);
                  }}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.625rem",
                    padding: "0.125rem 0.375rem",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAnnotation}
                  disabled={saving}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.625rem",
                    padding: "0.125rem 0.375rem",
                    color: "var(--color-accent-ink)",
                    backgroundColor: "var(--color-highlight-wash)",
                    border: "var(--border-thin) solid var(--color-accent-ink)",
                    borderRadius: "var(--radius-xs)",
                    cursor: saving ? "wait" : "pointer",
                  }}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditingAnnotation(true)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                fontFamily: "var(--font-sans)",
                fontSize: "0.75rem",
                color: highlight.annotation
                  ? "var(--color-ink-secondary)"
                  : "var(--color-ink-secondary)",
                opacity: highlight.annotation ? 1 : 0.6,
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "0.25rem 0",
                lineHeight: 1.45,
                fontStyle: highlight.annotation ? "normal" : "italic",
              }}
            >
              {highlight.annotation ?? "Add annotation…"}
            </button>
          )}
        </div>
      )}

      {/* Show annotation preview when not selected */}
      {!isSelected && highlight.annotation && (
        <p
          style={{
            marginTop: "0.25rem",
            fontFamily: "var(--font-sans)",
            fontSize: "0.75rem",
            color: "var(--color-ink-secondary)",
            lineHeight: 1.4,
            maxWidth: "none",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {highlight.annotation}
        </p>
      )}
    </div>
  );
}
