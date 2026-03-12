import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sources — Dossier",
};

export default function SourcesPage() {
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
          Sources
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
          No sources yet.
        </p>
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "0.875rem",
            color: "var(--color-ink-secondary)",
            fontStyle: "italic",
          }}
        >
          Add a URL, paste text, or attach a document to begin building your evidence base.
        </p>
      </div>
    </div>
  );
}
