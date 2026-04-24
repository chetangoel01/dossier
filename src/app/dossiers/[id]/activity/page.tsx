import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";

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

      <EmptyState
        eyebrow="No activity recorded."
        message="Changes to sources, claims, and entities will be logged here as a research audit trail."
      />
    </div>
  );
}
