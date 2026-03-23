"use client";

import { useState, useRef, useEffect } from "react";
import type { SourceStatus } from "@prisma/client";

interface Props {
  sourceId: string;
  currentStatus: SourceStatus;
  onStatusChange: (sourceId: string, status: SourceStatus) => void;
}

const STATUS_ACTIONS: { value: SourceStatus; label: string }[] = [
  { value: "unreviewed", label: "Mark unreviewed" },
  { value: "reviewing", label: "Mark reviewing" },
  { value: "reviewed", label: "Mark reviewed" },
  { value: "discarded", label: "Discard" },
];

export function SourceStatusMenu({
  sourceId,
  currentStatus,
  onStatusChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  const availableActions = STATUS_ACTIONS.filter(
    (a) => a.value !== currentStatus,
  );

  return (
    <div ref={menuRef} style={{ position: "relative" }}>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => setOpen(!open)}
        aria-label="Change source status"
        aria-expanded={open}
        style={{
          padding: "0.25rem 0.375rem",
          fontSize: "0.8125rem",
          lineHeight: 1,
        }}
      >
        ···
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "100%",
            marginTop: "0.25rem",
            zIndex: 20,
            minWidth: "160px",
            backgroundColor: "var(--color-bg-panel)",
            border: "var(--border-thin) solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-float)",
            padding: "0.25rem 0",
          }}
          role="menu"
        >
          {availableActions.map((action) => (
            <button
              key={action.value}
              type="button"
              role="menuitem"
              onClick={() => {
                onStatusChange(sourceId, action.value);
                setOpen(false);
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "0.375rem 0.75rem",
                fontSize: "0.8125rem",
                fontFamily: "var(--font-sans)",
                color:
                  action.value === "discarded"
                    ? "var(--color-accent-alert)"
                    : "var(--color-ink-primary)",
                background: "none",
                border: "none",
                cursor: "pointer",
                transition: "background-color var(--duration-fast)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor =
                  "var(--color-bg-selected)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
