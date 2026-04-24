import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Overview — Dossier",
};

export default function OverviewPage() {
  return (
    <div
      className="w-full max-w-[960px] mx-auto py-8"
      style={{ paddingInline: "var(--space-gutter)" }}
    >
      <div className="grid grid-cols-2 gap-4 mb-4 anim-stagger">
        {/* Summary panel */}
        <div className="panel col-span-full p-6">
          <p
            className="mb-2"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--color-ink-secondary)",
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
    <div className="panel py-5 px-6">
      <p
        className="mb-3"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.6875rem",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--color-ink-secondary)",
        }}
      >
        {label}
      </p>
      <p
        className="max-w-none"
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "0.875rem",
          color: "var(--color-ink-secondary)",
          fontStyle: "italic",
        }}
      >
        {message}
      </p>
    </div>
  );
}
