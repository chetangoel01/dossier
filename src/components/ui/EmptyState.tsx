import type { ReactNode } from "react";

interface EmptyStateProps {
  /** Short mono-style eyebrow label (e.g. "No sources yet.") */
  eyebrow: string;
  /** Supporting sentence in serif italic voice */
  message: string;
  /** Optional single-character glyph rendered as an ornament above the copy */
  glyph?: string;
  /** Optional call-to-action slot (e.g. a primary button) */
  action?: ReactNode;
  /** Dense version for narrow inspector columns and cards */
  compact?: boolean;
}

/**
 * EmptyState — editorial "no data" primitive used across workspace tabs.
 *
 * The form imitates a printed masthead: ruled ornament, mono eyebrow,
 * serif-italic voice. Use for any view that can be entirely empty.
 */
export function EmptyState({
  eyebrow,
  message,
  glyph = "§",
  action,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className="panel anim-tab-enter"
      style={{
        padding: compact ? "1.75rem 1.25rem" : "3rem 2rem",
        textAlign: "center",
      }}
    >
      <div
        aria-hidden
        style={{
          fontFamily: "var(--font-display)",
          fontSize: compact ? "1.125rem" : "1.375rem",
          color: "var(--color-border)",
          letterSpacing: "0.12em",
          marginBottom: compact ? "0.625rem" : "0.875rem",
        }}
      >
        {glyph}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{glyph}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{glyph}
      </div>

      <p
        className="max-w-none"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: compact ? "0.75rem" : "0.8125rem",
          color: "var(--color-ink-secondary)",
          letterSpacing: "0.02em",
          marginBottom: "0.5rem",
        }}
      >
        {eyebrow}
      </p>

      <p
        className="mx-auto"
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: compact ? "0.8125rem" : "0.875rem",
          color: "var(--color-ink-secondary)",
          fontStyle: "italic",
          lineHeight: 1.55,
          maxWidth: "36ch",
        }}
      >
        {message}
      </p>

      {action && (
        <div style={{ marginTop: "1.125rem", display: "inline-flex" }}>
          {action}
        </div>
      )}
    </div>
  );
}
