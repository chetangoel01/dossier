"use client";

interface GutterMark {
  id: string;
  label: string;
  offsetPercent: number;
}

interface EvidenceGutterProps {
  marks: GutterMark[];
  onMarkClick?: (id: string) => void;
}

const LABEL_COLORS: Record<string, string> = {
  evidence: "var(--color-accent-ink)",
  question: "var(--color-accent-warning)",
  counterpoint: "var(--color-accent-alert)",
  stat: "var(--color-accent-success)",
  quote: "var(--color-accent-ink)",
};

export function EvidenceGutter({ marks, onMarkClick }: EvidenceGutterProps) {
  return (
    <div
      aria-label="Evidence gutter"
      style={{
        position: "relative",
        width: "28px",
        flexShrink: 0,
        borderRight: "var(--border-thin) solid var(--color-border)",
        backgroundColor: "var(--color-bg-canvas)",
      }}
    >
      {marks.map((mark) => (
        <button
          key={mark.id}
          type="button"
          aria-label={`${mark.label} highlight`}
          onClick={() => onMarkClick?.(mark.id)}
          style={{
            position: "absolute",
            left: "6px",
            top: `${mark.offsetPercent}%`,
            width: "16px",
            height: "4px",
            borderRadius: "var(--radius-xs)",
            backgroundColor: LABEL_COLORS[mark.label] ?? "var(--color-accent-ink)",
            opacity: 0.7,
            border: "none",
            cursor: "pointer",
            padding: 0,
            transition: "opacity var(--duration-fast) ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = "1";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = "0.7";
          }}
        />
      ))}

      {marks.length === 0 && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%) rotate(-90deg)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.5625rem",
            color: "var(--color-ink-secondary)",
            opacity: 0.4,
            whiteSpace: "nowrap",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            pointerEvents: "none",
          }}
        >
          evidence
        </div>
      )}
    </div>
  );
}
