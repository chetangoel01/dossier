"use client";

import { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

interface Props {
  dossierId: string;
  disabled?: boolean;
}

export function BriefExportMenu({ dossierId, disabled }: Props) {
  const [error, setError] = useState<string | null>(null);

  async function handleMarkdown() {
    setError(null);
    try {
      const response = await fetch(
        `/api/dossiers/${dossierId}/brief/export`,
        { method: "GET" },
      );
      if (!response.ok) {
        const message = await safeErrorMessage(response);
        setError(message);
        return;
      }
      const blob = await response.blob();
      const filename = parseContentDispositionFilename(
        response.headers.get("Content-Disposition"),
      );
      triggerDownload(blob, filename);
    } catch {
      setError("Markdown export failed. Please try again.");
    }
  }

  function handlePdf() {
    setError(null);
    if (typeof window === "undefined") return;
    // Opens a print-styled page that auto-triggers the browser's print
    // dialog; users save as PDF from there.
    const printed = window.open(
      `/briefs/${dossierId}/print`,
      "_blank",
      "noopener",
    );
    if (!printed) {
      setError("Enable pop-ups to export a PDF.");
    }
  }

  return (
    <div className="flex items-center" style={{ gap: "0.5rem" }}>
      {error ? (
        <span
          role="alert"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6875rem",
            color: "var(--color-accent-alert)",
          }}
        >
          {error}
        </span>
      ) : null}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={disabled}
            aria-label="Export brief"
            style={{
              padding: "0.25rem 0.625rem",
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Export ▾
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={4}
            style={{
              minWidth: "180px",
              backgroundColor: "var(--color-bg-panel)",
              border: "var(--border-thin) solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-float)",
              padding: "0.25rem 0",
              zIndex: 20,
            }}
          >
            <DropdownMenu.Item
              onSelect={() => {
                void handleMarkdown();
              }}
              className="source-status-menu-item"
              style={menuItemStyle}
            >
              Download Markdown (.md)
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => handlePdf()}
              className="source-status-menu-item"
              style={menuItemStyle}
            >
              Export as PDF…
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}

const menuItemStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: "0.375rem 0.75rem",
  fontSize: "0.8125rem",
  fontFamily: "var(--font-sans)",
  color: "var(--color-ink-primary)",
  background: "none",
  border: "none",
  cursor: "pointer",
  outline: "none",
  transition: "background-color var(--duration-fast)",
};

async function safeErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error ?? "Export failed. Please try again.";
  } catch {
    return "Export failed. Please try again.";
  }
}

function parseContentDispositionFilename(header: string | null): string {
  if (!header) return "brief.md";
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header);
  return match?.[1] ?? "brief.md";
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
