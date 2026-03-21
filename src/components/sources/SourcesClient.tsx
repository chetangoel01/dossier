"use client";

import { useState } from "react";
import { CaptureSourceModal } from "./CaptureSourceModal";
import type { SourceListItem } from "@/server/queries/sources";

interface Props {
  dossierId: string;
  sources: SourceListItem[];
}

const TYPE_LABELS: Record<string, string> = {
  web_link: "URL",
  pdf: "PDF",
  pasted_text: "Pasted",
  manual_note: "Note",
  internal_memo: "Memo",
};

const STATUS_CHIP_CLASS: Record<string, string> = {
  unreviewed: "chip",
  reviewing: "chip chip-warning",
  reviewed: "chip chip-success",
  discarded: "chip chip-alert",
};

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function SourcesClient({ dossierId, sources }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

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
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setModalOpen(true)}
        >
          + Add Source
        </button>
      </div>

      {sources.length === 0 ? (
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
              maxWidth: "none",
            }}
          >
            Add a URL, paste text, or write a note to begin building your
            evidence base.
          </p>
        </div>
      ) : (
        <div className="panel" style={{ overflow: "hidden" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Captured</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr key={source.id}>
                  <td
                    style={{
                      fontWeight: 500,
                      maxWidth: "360px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {source.title}
                  </td>
                  <td>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.75rem",
                        color: "var(--color-ink-secondary)",
                      }}
                    >
                      {TYPE_LABELS[source.type] ?? source.type}
                    </span>
                  </td>
                  <td>
                    <span
                      className={
                        STATUS_CHIP_CLASS[source.source_status] ?? "chip"
                      }
                    >
                      {source.source_status}
                    </span>
                  </td>
                  <td
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.75rem",
                      color: "var(--color-ink-secondary)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatDate(source.captured_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CaptureSourceModal
        key={modalOpen ? "open" : "closed"}
        dossierId={dossierId}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
