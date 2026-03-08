"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { renameDossier, archiveDossier } from "@/server/actions/dossiers";
import type { DossierListItem } from "@/server/queries/dossiers";

interface Props {
  dossier: DossierListItem;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DossierCard({ dossier }: Props) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(dossier.title);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function startRename() {
    setMenuOpen(false);
    setRenameValue(dossier.title);
    setIsRenaming(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function cancelRename() {
    setIsRenaming(false);
    setRenameValue(dossier.title);
  }

  function submitRename() {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === dossier.title) {
      cancelRename();
      return;
    }
    startTransition(async () => {
      await renameDossier(dossier.id, trimmed);
      setIsRenaming(false);
    });
  }

  function handleArchive() {
    setMenuOpen(false);
    if (
      !window.confirm(
        `Archive "${dossier.title}"?\n\nIt will be removed from your active dossiers.`,
      )
    )
      return;
    startTransition(async () => {
      await archiveDossier(dossier.id);
    });
  }

  return (
    <div
      style={{
        position: "relative",
        backgroundColor: "var(--color-bg-panel)",
        border: "var(--border-thin) solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        opacity: isPending ? 0.6 : 1,
        transition: "opacity var(--duration-fast) ease",
      }}
    >
      {/* Main card content */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "1rem",
          padding: "1rem 1.25rem",
        }}
      >
        {/* Left accent rule */}
        <div
          style={{
            width: "2px",
            alignSelf: "stretch",
            backgroundColor: "var(--color-accent-ink)",
            borderRadius: "1px",
            flexShrink: 0,
            opacity: 0.35,
          }}
        />

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              marginBottom: dossier.summary ? "0.375rem" : "0.5rem",
            }}
          >
            {isRenaming ? (
              <input
                ref={inputRef}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitRename();
                  if (e.key === "Escape") cancelRename();
                }}
                onBlur={submitRename}
                autoFocus
                className="input"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.0625rem",
                  fontWeight: 600,
                  padding: "0.25rem 0.5rem",
                  flex: 1,
                }}
              />
            ) : (
              <Link
                href={`/dossiers/${dossier.id}`}
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.0625rem",
                  fontWeight: 600,
                  color: "var(--color-ink-primary)",
                  textDecoration: "none",
                  letterSpacing: "-0.01em",
                  lineHeight: 1.3,
                }}
                className="dossier-title-link"
              >
                {dossier.title}
              </Link>
            )}
          </div>

          {/* Summary */}
          {dossier.summary && (
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.875rem",
                color: "var(--color-ink-secondary)",
                lineHeight: 1.5,
                marginBottom: "0.625rem",
                maxWidth: "none",
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {dossier.summary}
            </p>
          )}

          {/* Metadata row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                color: "var(--color-ink-secondary)",
              }}
            >
              {dossier._count.sources === 0
                ? "No sources"
                : `${dossier._count.sources} source${dossier._count.sources === 1 ? "" : "s"}`}
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                color: "var(--color-ink-secondary)",
                opacity: 0.7,
              }}
            >
              Updated {formatDate(dossier.updated_at)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setMenuOpen((v) => !v)}
            disabled={isPending || isRenaming}
            style={{
              padding: "0.25rem 0.5rem",
              fontSize: "1rem",
              lineHeight: 1,
              color: "var(--color-ink-secondary)",
            }}
            aria-label="Dossier actions"
            aria-haspopup="true"
            aria-expanded={menuOpen}
          >
            ···
          </button>

          {menuOpen && (
            <>
              {/* Backdrop */}
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 10,
                }}
                onClick={() => setMenuOpen(false)}
              />
              {/* Dropdown */}
              <div
                role="menu"
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  right: 0,
                  zIndex: 20,
                  backgroundColor: "var(--color-bg-panel)",
                  border: "var(--border-thin) solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-float)",
                  minWidth: "8rem",
                  overflow: "hidden",
                }}
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={startRename}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "0.5rem 0.875rem",
                    fontFamily: "var(--font-sans)",
                    fontSize: "0.875rem",
                    color: "var(--color-ink-primary)",
                    background: "none",
                    border: "none",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      "var(--color-bg-selected)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      "transparent";
                  }}
                >
                  Rename
                </button>
                <div
                  style={{
                    height: "var(--border-thin)",
                    backgroundColor: "var(--color-border)",
                  }}
                />
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleArchive}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "0.5rem 0.875rem",
                    fontFamily: "var(--font-sans)",
                    fontSize: "0.875rem",
                    color: "var(--color-accent-alert)",
                    background: "none",
                    border: "none",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      "#f0dede";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      "transparent";
                  }}
                >
                  Archive
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
