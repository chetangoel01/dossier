"use client";

import { useEffect, useId, useMemo, useRef } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
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

interface EntityDetailPreview {
  id: string;
  name: string;
  type: EntityBacklinkItem["type"];
  description?: string | null;
  aliases?: string[];
  importance?: number | null;
}

interface EntityDetailDrawerProps {
  dossierId: string;
  entity: EntityBacklinkItem | null;
  entityPreview?: EntityDetailPreview | null;
  loading?: boolean;
  open?: boolean;
  onClose: () => void;
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function getFocusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter((element) => !element.hasAttribute("disabled"))
    .filter((element) => element.getAttribute("aria-hidden") !== "true");
}

export function EntityDetailDrawer({
  dossierId,
  entity,
  entityPreview = null,
  loading = false,
  open = entity != null,
  onClose,
}: EntityDetailDrawerProps) {
  const descriptionId = useId();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const displayEntity = entity ?? entityPreview;
  const sortedMentions = useMemo(
    () => (entity ? sortEntityMentions(entity.mentions) : []),
    [entity]
  );

  useEffect(() => {
    if (!open || !displayEntity) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const dialog = dialogRef.current;
      if (!dialog) {
        return;
      }

      const focusableElements = getFocusableElements(dialog);
      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      const isFocusInside = !!activeElement && dialog.contains(activeElement);

      if (event.shiftKey) {
        if (!isFocusInside || activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
        return;
      }

      if (!isFocusInside || activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    window.requestAnimationFrame(() => {
      const dialog = dialogRef.current;
      if (!dialog) {
        return;
      }

      const [firstFocusableElement] = getFocusableElements(dialog);
      (firstFocusableElement ?? dialog).focus();
    });

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      window.requestAnimationFrame(() => {
        restoreFocusRef.current?.focus();
      });
    };
  }, [displayEntity, onClose, open]);

  if (!open || !displayEntity) {
    return null;
  }

  return createPortal(
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(31, 41, 51, 0.18)",
          cursor: "pointer",
          zIndex: 30,
        }}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
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
              id={descriptionId}
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
            <h2 id={titleId} style={{ margin: 0 }}>
              <EntityChip
                entity={{
                  id: displayEntity.id,
                  name: displayEntity.name,
                  type: displayEntity.type,
                }}
              />
            </h2>
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
          {loading ? (
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                color: "var(--color-ink-secondary)",
                maxWidth: "none",
              }}
            >
              Loading entity context...
            </p>
          ) : displayEntity.description ? (
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.875rem",
                color: "var(--color-ink-primary)",
                lineHeight: 1.6,
                maxWidth: "none",
              }}
            >
              {displayEntity.description}
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
              value={ENTITY_TYPE_LABELS[displayEntity.type]}
            />
            <DrawerMetaRow
              label="Aliases"
              value={
                displayEntity.aliases != null && displayEntity.aliases.length > 0
                  ? formatEntityAliases(displayEntity.aliases)
                  : "No aliases recorded"
              }
            />
            <DrawerMetaRow
              label="Importance"
              value={
                displayEntity.importance != null
                  ? `${displayEntity.importance}/10`
                  : "Not ranked"
              }
            />
          </div>
        </DrawerSection>

        <DrawerSection
          title="Backlinks"
          count={loading ? undefined : sortedMentions.length}
        >
          {loading ? (
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                color: "var(--color-ink-secondary)",
                maxWidth: "none",
              }}
            >
              Loading linked source context...
            </p>
          ) : sortedMentions.length === 0 ? (
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
      </div>
    </>,
    document.body
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
