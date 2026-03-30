"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { EntityType } from "@prisma/client";
import { createEntity, linkEntity } from "@/server/actions/entities";
import { ENTITY_TYPE_OPTIONS, parseEntityAliases } from "@/lib/entities";
import type { EntityListItem } from "@/server/queries/entities";
import { EntityChip } from "./EntityChip";

type LinkTarget =
  | {
      kind: "source";
      id: string;
      label: string;
      contextSnippet?: string | null;
    }
  | {
      kind: "highlight";
      id: string;
      label: string;
      contextSnippet?: string | null;
    }
  | {
      kind: "claim";
      id: string;
      label: string;
      contextSnippet?: string | null;
    };

interface EntityLinkModalProps {
  dossierId: string;
  entities: EntityListItem[];
  open: boolean;
  onClose: () => void;
  target: LinkTarget | null;
}

type Mode = "existing" | "new";

export function EntityLinkModal({
  dossierId,
  entities,
  open,
  onClose,
  target,
}: EntityLinkModalProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<Mode>("existing");
  const [search, setSearch] = useState("");
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<EntityType>("person");
  const [description, setDescription] = useState("");
  const [aliases, setAliases] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setMode(entities.length > 0 ? "existing" : "new");
    setSearch("");
    setSelectedEntityId(entities[0]?.id ?? null);
    setName("");
    setType("person");
    setDescription("");
    setAliases("");
    setSaving(false);
    setError(null);
  }, [entities, open, target]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const filteredEntities = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return entities;

    return entities.filter((entity) => {
      const haystacks = [
        entity.name,
        entity.type,
        entity.description ?? "",
        ...entity.aliases,
      ];

      return haystacks.some((value) => value.toLowerCase().includes(needle));
    });
  }, [entities, search]);

  function handleDialogClick(e: React.MouseEvent<HTMLDialogElement>) {
    const rect = dialogRef.current?.getBoundingClientRect();
    if (!rect) return;

    const { clientX, clientY } = e;
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      onClose();
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!target || saving) return;

    setSaving(true);
    setError(null);

    let entityId = selectedEntityId;

    if (mode === "new") {
      const createResult = await createEntity({
        dossierId,
        name,
        type,
        description,
        aliases: parseEntityAliases(aliases),
      });

      if ("error" in createResult) {
        setSaving(false);
        setError(createResult.error);
        return;
      }

      entityId = createResult.id;
    }

    if (!entityId) {
      setSaving(false);
      setError("Select an entity to link.");
      return;
    }

    const result = await linkEntity({
      entityId,
      ...(target.kind === "source" && { sourceId: target.id }),
      ...(target.kind === "highlight" && { highlightId: target.id }),
      ...(target.kind === "claim" && { claimId: target.id }),
      contextSnippet: target.contextSnippet ?? null,
    });

    setSaving(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    router.refresh();
    onClose();
  }

  if (!open || !target) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={handleDialogClick}
      style={{
        padding: 0,
        border: "var(--border-thin) solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        backgroundColor: "var(--color-bg-panel)",
        boxShadow: "var(--shadow-float)",
        width: "min(620px, 92vw)",
        maxHeight: "90vh",
        overflowY: "auto",
      }}
    >
      <form onSubmit={handleSubmit}>
        <div style={{ padding: "1.5rem 1.75rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: "1.25rem",
            }}
          >
            <div>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.125rem",
                  color: "var(--color-ink-primary)",
                  marginBottom: "0.25rem",
                }}
              >
                Link Entity
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.75rem",
                  color: "var(--color-ink-secondary)",
                  maxWidth: "none",
                }}
              >
                Attach a reusable reference to this {target.kind}.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              style={{ padding: "0.25rem 0.5rem" }}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div
            className="panel"
            style={{
              padding: "0.75rem",
              marginBottom: "1rem",
              backgroundColor: "var(--color-bg-canvas)",
            }}
          >
            <span
              style={{
                display: "block",
                fontFamily: "var(--font-mono)",
                fontSize: "0.625rem",
                color: "var(--color-ink-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "0.25rem",
              }}
            >
              Target
            </span>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.875rem",
                color: "var(--color-ink-primary)",
                maxWidth: "none",
              }}
            >
              {target.label}
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            <button
              type="button"
              className={mode === "existing" ? "btn btn-primary" : "btn btn-secondary"}
              onClick={() => setMode("existing")}
              disabled={entities.length === 0}
            >
              Reuse Existing
            </button>
            <button
              type="button"
              className={mode === "new" ? "btn btn-primary" : "btn btn-secondary"}
              onClick={() => setMode("new")}
            >
              Create New
            </button>
          </div>

          {mode === "existing" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div>
                <label
                  htmlFor="entity-search"
                  style={{
                    display: "block",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6875rem",
                    color: "var(--color-ink-secondary)",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    marginBottom: "0.375rem",
                  }}
                >
                  Search Entities
                </label>
                <input
                  id="entity-search"
                  className="input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Find a person, company, product, or topic…"
                />
              </div>

              <div
                style={{
                  maxHeight: "280px",
                  overflowY: "auto",
                  border: "var(--border-thin) solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--color-bg-canvas)",
                }}
              >
                {filteredEntities.length === 0 ? (
                  <p
                    style={{
                      padding: "1rem",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.75rem",
                      color: "var(--color-ink-secondary)",
                      opacity: 0.7,
                      maxWidth: "none",
                    }}
                  >
                    No entities match the current search.
                  </p>
                ) : (
                  filteredEntities.map((entity) => {
                    const selected = selectedEntityId === entity.id;

                    return (
                      <button
                        key={entity.id}
                        type="button"
                        onClick={() => setSelectedEntityId(entity.id)}
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          padding: "0.75rem",
                          border: "none",
                          borderBottom:
                            "var(--border-hairline) solid var(--color-border)",
                          backgroundColor: selected
                            ? "var(--color-bg-selected)"
                            : "transparent",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            gap: "0.75rem",
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <EntityChip
                              entity={{
                                id: entity.id,
                                name: entity.name,
                                type: entity.type,
                              }}
                            />
                            {entity.description && (
                              <p
                                style={{
                                  marginTop: "0.375rem",
                                  fontFamily: "var(--font-sans)",
                                  fontSize: "0.8125rem",
                                  color: "var(--color-ink-secondary)",
                                  lineHeight: 1.45,
                                  maxWidth: "none",
                                }}
                              >
                                {entity.description}
                              </p>
                            )}
                          </div>

                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "0.6875rem",
                              color: selected
                                ? "var(--color-accent-ink)"
                                : "var(--color-ink-secondary)",
                              flexShrink: 0,
                            }}
                          >
                            {selected ? "Selected" : "Select"}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label
                  htmlFor="new-entity-name"
                  style={{
                    display: "block",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6875rem",
                    color: "var(--color-ink-secondary)",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    marginBottom: "0.375rem",
                  }}
                >
                  Name *
                </label>
                <input
                  id="new-entity-name"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Entity name"
                  required={mode === "new"}
                />
              </div>

              <div>
                <label
                  htmlFor="new-entity-type"
                  style={{
                    display: "block",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6875rem",
                    color: "var(--color-ink-secondary)",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    marginBottom: "0.375rem",
                  }}
                >
                  Type *
                </label>
                <select
                  id="new-entity-type"
                  className="input"
                  value={type}
                  onChange={(e) => setType(e.target.value as EntityType)}
                >
                  {ENTITY_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="new-entity-description"
                  style={{
                    display: "block",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6875rem",
                    color: "var(--color-ink-secondary)",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    marginBottom: "0.375rem",
                  }}
                >
                  Description
                </label>
                <textarea
                  id="new-entity-description"
                  className="input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional context"
                  rows={3}
                />
              </div>

              <div>
                <label
                  htmlFor="new-entity-aliases"
                  style={{
                    display: "block",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6875rem",
                    color: "var(--color-ink-secondary)",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    marginBottom: "0.375rem",
                  }}
                >
                  Aliases
                </label>
                <textarea
                  id="new-entity-aliases"
                  className="input"
                  value={aliases}
                  onChange={(e) => setAliases(e.target.value)}
                  placeholder="One alias per line or comma-separated."
                  rows={3}
                />
              </div>
            </div>
          )}

          {error && (
            <p
              style={{
                marginTop: "1rem",
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                color: "var(--color-accent-alert)",
                padding: "0.5rem 0.75rem",
                backgroundColor: "var(--color-error-bg)",
                border: "var(--border-thin) solid var(--color-error-border)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              {error}
            </p>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.625rem",
              paddingTop: "1rem",
              borderTop: "var(--border-thin) solid var(--color-border)",
              marginTop: "1rem",
            }}
          >
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={
                saving ||
                (mode === "existing" && !selectedEntityId) ||
                (mode === "new" && !name.trim())
              }
            >
              {saving
                ? mode === "existing"
                  ? "Linking…"
                  : "Creating…"
                : mode === "existing"
                  ? "Link Entity"
                  : "Create & Link"}
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
}

export type { LinkTarget };
