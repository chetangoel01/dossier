"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import type { EntityBacklinkItem } from "@/server/queries/entities";
import {
  ENTITY_TYPE_LABELS,
  buildEntityMentionHref,
  formatEntityAliases,
  getEntityMentionSnippet,
  getEntityMentionSource,
  sortEntityMentions,
} from "@/lib/entities";
import { EntityChip } from "./EntityChip";

interface EntityDetailDrawerProps {
  dossierId: string;
  entity: EntityBacklinkItem | null;
  onClose: () => void;
}

export function EntityDetailDrawer({
  dossierId,
  entity,
  onClose,
}: EntityDetailDrawerProps) {
  const sortedMentions = useMemo(
    () => (entity ? sortEntityMentions(entity.mentions) : []),
    [entity]
  );

  useEffect(() => {
    if (!entity) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [entity, onClose]);

  if (!entity) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close entity context"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          border: "none",
          backgroundColor: "rgba(31, 41, 51, 0.18)",
          cursor: "pointer",
          zIndex: 30,
        }}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`${entity.name} context`}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(30rem, 100vw)",
          backgroundColor: "var(--color-bg-panel)",
          borderLeft: "var(--border-thin) solid var(--color-border)",
          boxShadow: "var(--shadow-float)",
          zIndex: 40,
          overflowY: "auto",
        }}
      >
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 1,
            backgroundColor: "var(--color-bg-panel)",
            borderBottom: "var(--border-thin) solid var(--color-border)",
            padding: "0.75rem 1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.6875rem",
                color: "var(--color-ink-secondary)",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                marginBottom: "0.25rem",
                maxWidth: "none",
              }}
            >
              Entity Context
            </p>
            <EntityChip
              entity={{
                id: entity.id,
                name: entity.name,
                type: entity.type,
              }}
            />
          </div>

          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            aria-label="Close entity drawer"
            style={{ padding: "0.125rem 0.375rem", fontSize: "0.75rem" }}
          >
            ✕
          </button>
        </div>

        <DrawerSection title="Profile">
          {entity.description ? (
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.875rem",
                color: "var(--color-ink-primary)",
                lineHeight: 1.6,
                maxWidth: "none",
              }}
            >
              {entity.description}
            </p>
          ) : (
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                color: "var(--color-ink-secondary)",
                opacity: 0.75,
                maxWidth: "none",
              }}
            >
              No description recorded yet.
            </p>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr)",
              gap: "0.5rem",
              marginTop: "0.875rem",
            }}
          >
            <DrawerMetaRow
              label="Type"
              value={ENTITY_TYPE_LABELS[entity.type]}
            />
            <DrawerMetaRow
              label="Aliases"
              value={
                entity.aliases.length > 0
                  ? formatEntityAliases(entity.aliases)
                  : "No aliases recorded"
              }
            />
            <DrawerMetaRow
              label="Importance"
              value={
                entity.importance != null
                  ? `${entity.importance}/10`
                  : "Not ranked"
              }
            />
          </div>
        </DrawerSection>

        <DrawerSection title="Backlinks" count={sortedMentions.length}>
          {sortedMentions.length === 0 ? (
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                color: "var(--color-ink-secondary)",
                opacity: 0.75,
                maxWidth: "none",
              }}
            >
              No source context linked yet.
            </p>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.625rem",
              }}
            >
              {sortedMentions.map((mention) => {
                const mentionHref = buildEntityMentionHref(dossierId, mention);
                const source = getEntityMentionSource(mention);
                const snippet = getEntityMentionSnippet(mention);
                const mentionKind = mention.highlight_id
                  ? "Highlight"
                  : "Source";

                const content = (
                  <>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "0.75rem",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          minWidth: 0,
                        }}
                      >
                        <span
                          className="chip"
                          style={{
                            fontSize: "0.625rem",
                            padding: "0.0625rem 0.375rem",
                          }}
                        >
                          {mentionKind}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-sans)",
                            fontSize: "0.8125rem",
                            color: "var(--color-ink-primary)",
                            fontWeight: 500,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {source?.title ?? "Linked source"}
                        </span>
                      </div>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.6875rem",
                          color: "var(--color-accent-ink)",
                          flexShrink: 0,
                        }}
                      >
                        Open →
                      </span>
                    </div>

                    {snippet && (
                      <p
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: "0.8125rem",
                          color: "var(--color-ink-primary)",
                          lineHeight: 1.55,
                          maxWidth: "none",
                        }}
                      >
                        {snippet}
                      </p>
                    )}

                    {mention.highlight?.quote_text && (
                      <p
                        style={{
                          marginTop: "0.5rem",
                          fontFamily: "var(--font-sans)",
                          fontSize: "0.75rem",
                          color: "var(--color-ink-secondary)",
                          fontStyle: "italic",
                          lineHeight: 1.5,
                          maxWidth: "none",
                        }}
                      >
                        &ldquo;
                        {mention.highlight.quote_text.length > 160
                          ? `${mention.highlight.quote_text.slice(0, 160)}…`
                          : mention.highlight.quote_text}
                        &rdquo;
                      </p>
                    )}
                  </>
                );

                if (!mentionHref) {
                  return (
                    <div
                      key={mention.id}
                      className="panel-raised"
                      style={{ padding: "0.875rem 0.9375rem" }}
                    >
                      {content}
                    </div>
                  );
                }

                return (
                  <Link
                    key={mention.id}
                    href={mentionHref}
                    onClick={onClose}
                    className="panel-raised"
                    style={{
                      display: "block",
                      padding: "0.875rem 0.9375rem",
                      textDecoration: "none",
                    }}
                  >
                    {content}
                  </Link>
                );
              })}
            </div>
          )}
        </DrawerSection>
      </aside>
    </>
  );
}

function DrawerSection({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        padding: "1rem",
        borderBottom: "var(--border-thin) solid var(--color-border)",
      }}
    >
      <h3
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.6875rem",
          fontWeight: 500,
          color: "var(--color-ink-secondary)",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          marginBottom: "0.75rem",
        }}
      >
        {title}
        {count != null && (
          <span
            style={{
              marginLeft: "0.375rem",
              opacity: 0.7,
              fontWeight: 400,
            }}
          >
            ({count})
          </span>
        )}
      </h3>
      {children}
    </section>
  );
}

function DrawerMetaRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: "0.75rem",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.6875rem",
          color: "var(--color-ink-secondary)",
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "0.8125rem",
          color: "var(--color-ink-primary)",
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}
