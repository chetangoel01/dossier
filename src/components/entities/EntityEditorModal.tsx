"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { EntityType } from "@prisma/client";
import { parseEntityAliases, ENTITY_TYPE_OPTIONS } from "@/lib/entities";
import { createEntity, updateEntity } from "@/server/actions/entities";

interface EditableEntity {
  id: string;
  name: string;
  type: EntityType;
  description: string | null;
  aliases: string[];
}

interface EntityEditorModalProps {
  dossierId: string;
  entity?: EditableEntity | null;
  open: boolean;
  onClose: () => void;
}

export function EntityEditorModal({
  dossierId,
  entity,
  open,
  onClose,
}: EntityEditorModalProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<EntityType>("person");
  const [description, setDescription] = useState("");
  const [aliases, setAliases] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setName(entity?.name ?? "");
    setType(entity?.type ?? "person");
    setDescription(entity?.description ?? "");
    setAliases(entity?.aliases.join("\n") ?? "");
    setSaving(false);
    setError(null);
  }, [entity, open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

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
    if (saving) return;

    setSaving(true);
    setError(null);

    const payload = {
      name,
      type,
      description,
      aliases: parseEntityAliases(aliases),
    };

    const result = entity
      ? await updateEntity({
          id: entity.id,
          ...payload,
        })
      : await createEntity({
          dossierId,
          ...payload,
        });

    setSaving(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    router.refresh();
    onClose();
  }

  if (!open) return null;

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
        width: "min(540px, 92vw)",
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
                {entity ? "Edit Entity" : "New Entity"}
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.75rem",
                  color: "var(--color-ink-secondary)",
                  maxWidth: "none",
                }}
              >
                Durable references for people, companies, products, places, and topics.
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

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label
                htmlFor="entity-name"
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
                id="entity-name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Northgate Pharma"
                required
                autoFocus
              />
            </div>

            <div>
              <label
                htmlFor="entity-type"
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
                id="entity-type"
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
                htmlFor="entity-description"
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
                id="entity-description"
                className="input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional context for why this entity matters in the dossier."
                rows={3}
              />
            </div>

            <div>
              <label
                htmlFor="entity-aliases"
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
                id="entity-aliases"
                className="input"
                value={aliases}
                onChange={(e) => setAliases(e.target.value)}
                placeholder="One alias per line or comma-separated."
                rows={3}
              />
            </div>

            {error && (
              <p
                style={{
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
                paddingTop: "0.75rem",
                borderTop: "var(--border-thin) solid var(--color-border)",
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
                disabled={saving || !name.trim()}
              >
                {saving
                  ? entity
                    ? "Saving…"
                    : "Creating…"
                  : entity
                    ? "Save Entity"
                    : "Create Entity"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </dialog>
  );
}
