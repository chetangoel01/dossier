import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Activity — Dossier",
};

export default function ActivityPage() {
  return (
    <div
      className="w-full max-w-[760px] mx-auto py-8"
      style={{ paddingInline: "var(--space-gutter)" }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.125rem",
            color: "var(--color-ink-primary)",
          }}
        >
          Activity
        </h2>
      </div>

      <div className="panel py-12 px-8 text-center">
        <p
          className="mb-2 max-w-none"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.8125rem",
            color: "var(--color-ink-secondary)",
          }}
        >
          No activity recorded.
        </p>
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "0.875rem",
            color: "var(--color-ink-secondary)",
            fontStyle: "italic",
          }}
        >
          Changes to sources, claims, and entities will be logged here as a research audit trail.
        </p>
      </div>
    </div>
  );
}
