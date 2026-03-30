"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { EntityListItem } from "@/server/queries/entities";
import { deleteEntity } from "@/server/actions/entities";
import { EntityChip } from "./EntityChip";
import { EntityEditorModal } from "./EntityEditorModal";
import { formatEntityAliases } from "@/lib/entities";

interface EntitiesClientProps {
  dossierId: string;
  entities: EntityListItem[];
}

export function EntitiesClient({ dossierId, entities }: EntitiesClientProps) {
  const router = useRouter();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEntityId, setEditingEntityId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const editingEntity = useMemo(
    () => entities.find((entity) => entity.id === editingEntityId) ?? null,
    [editingEntityId, entities],
  );

  function handleDelete(id: string) {
    if (!window.confirm("Delete this entity? Linked references will be removed.")) {
      return;
    }

    startTransition(async () => {
      await deleteEntity(id);
      router.refresh();
    });
  }

  return (
    <>
      <div
        className="w-full max-w-[960px] mx-auto py-8"
        style={{ paddingInline: "var(--space-gutter)" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.125rem",
                color: "var(--color-ink-primary)",
                marginBottom: "0.25rem",
              }}
            >
              Entities
            </h2>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                color: "var(--color-ink-secondary)",
                maxWidth: "none",
              }}
            >
              {entities.length} reusable reference{entities.length === 1 ? "" : "s"}
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setEditingEntityId(null);
              setEditorOpen(true);
            }}
          >
            + New Entity
          </button>
        </div>

        {entities.length === 0 ? (
          <div className="panel py-12 px-8 text-center">
            <p
              className="mb-2 max-w-none"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.8125rem",
                color: "var(--color-ink-secondary)",
              }}
            >
              No entities identified.
            </p>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.875rem",
                color: "var(--color-ink-secondary)",
                fontStyle: "italic",
                marginBottom: "1rem",
              }}
            >
              Promote the people, companies, products, locations, institutions, and topics that recur across your research.
            </p>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEditorOpen(true)}
            >
              Create First Entity
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            {entities.map((entity) => (
              <div
                key={entity.id}
                className="panel-raised"
                style={{ padding: "1rem 1.125rem" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "1rem",
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
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
                          marginTop: "0.625rem",
                          fontFamily: "var(--font-sans)",
                          fontSize: "0.875rem",
                          color: "var(--color-ink-primary)",
                          lineHeight: 1.55,
                          maxWidth: "none",
                        }}
                      >
                        {entity.description}
                      </p>
                    )}

                    {entity.aliases.length > 0 && (
                      <p
                        style={{
                          marginTop: "0.5rem",
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.6875rem",
                          color: "var(--color-ink-secondary)",
                          maxWidth: "none",
                        }}
                      >
                        Aliases: {formatEntityAliases(entity.aliases)}
                      </p>
                    )}

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.5rem 0.75rem",
                        marginTop: "0.75rem",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.6875rem",
                        color: "var(--color-ink-secondary)",
                      }}
                    >
                      <span>{entity._count.mentions} mention{entity._count.mentions === 1 ? "" : "s"}</span>
                      <span>{entity._count.claims} claim{entity._count.claims === 1 ? "" : "s"}</span>
                      <span>
                        Updated{" "}
                        {new Date(entity.updated_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => {
                        setEditingEntityId(entity.id);
                        setEditorOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => handleDelete(entity.id)}
                      disabled={isPending}
                      style={{ color: "var(--color-accent-alert)" }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <EntityEditorModal
        dossierId={dossierId}
        entity={editingEntity}
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditingEntityId(null);
        }}
      />
    </>
  );
}
