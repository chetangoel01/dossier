const STAGES = [
  {
    stamp: "01 / SOURCES",
    copy: "Web pages, PDFs, transcripts. Captured with provenance intact.",
  },
  {
    stamp: "02 / EVIDENCE",
    copy: "Highlights become citations. Citations support claims.",
  },
  {
    stamp: "03 / BRIEFS",
    copy: "Compose defensible memos that point back to every source.",
  },
] as const;

interface WorkflowStripProps {
  /** Reduce inner padding for use inside cards / empty states */
  compact?: boolean;
}

export function WorkflowStrip({ compact = false }: WorkflowStripProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))",
        gap: compact ? "1.5rem" : "2rem",
      }}
    >
      {STAGES.map((stage) => (
        <div key={stage.stamp}>
          <p
            className="text-mono"
            style={{
              fontSize: "0.75rem",
              letterSpacing: "0.08em",
              color: "var(--color-ink-secondary)",
              marginBottom: "0.75rem",
            }}
          >
            {stage.stamp}
          </p>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: compact ? "1rem" : "1.0625rem",
              lineHeight: 1.4,
              color: "var(--color-ink-primary)",
            }}
          >
            {stage.copy}
          </p>
        </div>
      ))}
    </div>
  );
}
