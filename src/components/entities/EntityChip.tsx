"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import type { EntityType } from "@prisma/client";
import { ENTITY_TYPE_LABELS } from "@/lib/entities";

interface EntityChipEntity {
  id: string;
  name: string;
  type: EntityType;
}

interface EntityChipProps {
  entity: EntityChipEntity;
  href?: string;
  onClick?: () => void;
  compact?: boolean;
}

function getChipStyles(compact: boolean) {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: compact ? "0.375rem" : "0.5rem",
    padding: compact ? "0.1875rem 0.4375rem" : "0.25rem 0.5rem",
    borderRadius: "var(--radius-sm)",
    border: "var(--border-thin) solid var(--color-border)",
    backgroundColor: "var(--color-bg-panel)",
    color: "var(--color-ink-primary)",
    boxShadow: "0 1px 0 rgba(31, 41, 51, 0.04)",
    textDecoration: "none",
    cursor: "default",
  } satisfies CSSProperties;
}

function EntityChipContent({
  entity,
  compact = false,
}: {
  entity: EntityChipEntity;
  compact?: boolean;
}) {
  return (
    <>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: compact ? "0.5625rem" : "0.625rem",
          color: "var(--color-accent-ink)",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        {ENTITY_TYPE_LABELS[entity.type]}
      </span>
      <span
        style={{
          width: "1px",
          alignSelf: "stretch",
          backgroundColor: "var(--color-border)",
        }}
      />
      <span
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: compact ? "0.75rem" : "0.8125rem",
          fontWeight: 500,
          lineHeight: 1.2,
          whiteSpace: "nowrap",
        }}
      >
        {entity.name}
      </span>
    </>
  );
}

export function EntityChip({
  entity,
  href,
  onClick,
  compact = false,
}: EntityChipProps) {
  const style = getChipStyles(compact);

  if (href) {
    return (
      <Link href={href} style={style}>
        <EntityChipContent entity={entity} compact={compact} />
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          ...style,
          cursor: "pointer",
        }}
      >
        <EntityChipContent entity={entity} compact={compact} />
      </button>
    );
  }

  return (
    <span style={style}>
      <EntityChipContent entity={entity} compact={compact} />
    </span>
  );
}
