import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Timeline — Dossier",
};

export default function TimelinePage() {
  return (
    <div
      style={{
        padding: "2rem var(--space-gutter)",
        maxWidth: "760px",
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
          Timeline
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
          No events on record.
        </p>
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "0.875rem",
            color: "var(--color-ink-secondary)",
            fontStyle: "italic",
          }}
        >
          Dated events drawn from sources and claims will be arranged chronologically here.
        </p>
      </div>
    </div>
  );
}
