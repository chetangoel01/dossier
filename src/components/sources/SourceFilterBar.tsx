"use client";

import type { SourceType, SourceStatus } from "@prisma/client";

interface Props {
  typeFilter: SourceType | "all";
  statusFilter: SourceStatus | "all";
  onTypeChange: (value: SourceType | "all") => void;
  onStatusChange: (value: SourceStatus | "all") => void;
  statusCounts: Record<string, number>;
}

const TYPE_OPTIONS: { value: SourceType | "all"; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "web_link", label: "URL" },
  { value: "pdf", label: "PDF" },
  { value: "pasted_text", label: "Pasted" },
  { value: "manual_note", label: "Note" },
  { value: "internal_memo", label: "Memo" },
];

const STATUS_OPTIONS: { value: SourceStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "unreviewed", label: "Unreviewed" },
  { value: "reviewing", label: "Reviewing" },
  { value: "reviewed", label: "Reviewed" },
  { value: "discarded", label: "Discarded" },
];

export function SourceFilterBar({
  typeFilter,
  statusFilter,
  onTypeChange,
  onStatusChange,
  statusCounts,
}: Props) {
  const hasFilters = typeFilter !== "all" || statusFilter !== "all";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        marginBottom: "1rem",
        flexWrap: "wrap",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.6875rem",
          color: "var(--color-ink-secondary)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginRight: "0.25rem",
        }}
      >
        Filter
      </span>

      <select
        className="input"
        value={typeFilter}
        onChange={(e) =>
          onTypeChange(e.target.value as SourceType | "all")
        }
        style={{
          width: "auto",
          padding: "0.25rem 0.5rem",
          fontSize: "0.8125rem",
          fontFamily: "var(--font-sans)",
        }}
      >
        {TYPE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <select
        className="input"
        value={statusFilter}
        onChange={(e) =>
          onStatusChange(e.target.value as SourceStatus | "all")
        }
        style={{
          width: "auto",
          padding: "0.25rem 0.5rem",
          fontSize: "0.8125rem",
          fontFamily: "var(--font-sans)",
        }}
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
            {statusCounts[opt.value] != null
              ? ` (${statusCounts[opt.value]})`
              : ""}
          </option>
        ))}
      </select>

      {hasFilters && (
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            onTypeChange("all");
            onStatusChange("all");
          }}
          style={{ fontSize: "0.8125rem", padding: "0.25rem 0.5rem" }}
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
