import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Claims — Dossier",
};

export default function ClaimsPage() {
  return (
    <div
      style={{
        padding: "2rem var(--space-gutter)",
        maxWidth: "960px",
        marginInline: "auto",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.125rem",
            color: "var(--color-ink-primary)",
          }}
        >
          Claims
        </h2>
      </div>

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
          Claims are defensible assertions linked to source evidence. They will appear here once added.
        </p>
      </div>
    </div>
  );
}
