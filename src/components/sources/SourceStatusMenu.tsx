"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
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
  const availableActions = STATUS_ACTIONS.filter(
    (a) => a.value !== currentStatus,
  );

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="btn btn-ghost"
          aria-label="Change source status"
          style={{
            padding: "0.25rem 0.375rem",
            fontSize: "0.8125rem",
            lineHeight: 1,
          }}
        >
          ···
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          style={{
            minWidth: "160px",
            backgroundColor: "var(--color-bg-panel)",
            border: "var(--border-thin) solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-float)",
            padding: "0.25rem 0",
            zIndex: 20,
          }}
        >
          {availableActions.map((action) => (
            <DropdownMenu.Item
              key={action.value}
              onSelect={() => onStatusChange(sourceId, action.value)}
              className="source-status-menu-item"
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
                outline: "none",
                transition: "background-color var(--duration-fast)",
              }}
            >
              {action.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
