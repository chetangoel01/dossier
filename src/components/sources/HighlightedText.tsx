"use client";

import { useMemo } from "react";

interface Highlight {
  id: string;
  start_offset: number;
  end_offset: number;
  label: string;
}

interface HighlightedTextProps {
  text: string;
  highlights: Highlight[];
}

const LABEL_BG: Record<string, string> = {
  evidence: "var(--color-highlight-wash)",
  question: "rgba(156, 107, 0, 0.12)",
  counterpoint: "rgba(139, 58, 58, 0.12)",
  stat: "rgba(45, 106, 79, 0.12)",
  quote: "var(--color-highlight-wash)",
};

export function HighlightedText({ text, highlights }: HighlightedTextProps) {
  const segments = useMemo(() => {
    if (highlights.length === 0) return [{ text, highlightId: null, label: null }];

    // Sort by start_offset, then by end_offset descending for nesting
    const sorted = [...highlights].sort(
      (a, b) => a.start_offset - b.start_offset || b.end_offset - a.end_offset,
    );

    const result: { text: string; highlightId: string | null; label: string | null }[] = [];
    let cursor = 0;

    for (const hl of sorted) {
      const start = Math.max(hl.start_offset, 0);
      const end = Math.min(hl.end_offset, text.length);
      if (start >= end || start < cursor) continue;

      // Add unhighlighted text before this highlight
      if (cursor < start) {
        result.push({ text: text.slice(cursor, start), highlightId: null, label: null });
      }

      result.push({ text: text.slice(start, end), highlightId: hl.id, label: hl.label });
      cursor = end;
    }

    // Add remaining text after last highlight
    if (cursor < text.length) {
      result.push({ text: text.slice(cursor), highlightId: null, label: null });
    }

    return result;
  }, [text, highlights]);

  return (
    <>
      {segments.map((seg, i) =>
        seg.highlightId ? (
          <mark
            key={seg.highlightId}
            data-highlight-id={seg.highlightId}
            style={{
              backgroundColor: LABEL_BG[seg.label ?? "evidence"] ?? LABEL_BG.evidence,
              borderBottom: "1.5px solid var(--color-accent-ink)",
              borderRadius: "var(--radius-xs)",
              padding: "0.0625rem 0",
              color: "inherit",
            }}
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
}
