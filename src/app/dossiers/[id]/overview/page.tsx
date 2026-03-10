import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Overview — Dossier",
};

export default function OverviewPage() {
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
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        {/* Summary panel */}
        <div
          className="panel"
          style={{
            gridColumn: "1 / -1",
            padding: "1.5rem",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--color-ink-secondary)",
              marginBottom: "0.5rem",
            }}
          >
            Research Summary
          </p>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "0.9375rem",
              color: "var(--color-ink-secondary)",
              fontStyle: "italic",
            }}
          >
            No summary yet. Add sources and claims to build your research picture.
          </p>
        </div>

        {/* Recent evidence */}
        <EmptyCard
          label="Recent Evidence"
          message="Highlights from sources will surface here as you review."
        />

        {/* Top entities */}
        <EmptyCard
          label="Key Entities"
          message="People, organizations, and topics will appear as they are identified."
        />

        {/* Timeline preview */}
        <EmptyCard
          label="Timeline"
          message="Dated events will populate a timeline preview here."
        />

        {/* Open questions */}
        <EmptyCard
          label="Open Claims"
          message="Claims awaiting evidence will be surfaced here for follow-up."
        />
      </div>
    </div>
  );
}

function EmptyCard({ label, message }: { label: string; message: string }) {
  return (
    <div className="panel" style={{ padding: "1.25rem 1.5rem" }}>
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.6875rem",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--color-ink-secondary)",
          marginBottom: "0.75rem",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "0.875rem",
          color: "var(--color-ink-secondary)",
          fontStyle: "italic",
          maxWidth: "none",
        }}
      >
        {message}
      </p>
    </div>
  );
}
