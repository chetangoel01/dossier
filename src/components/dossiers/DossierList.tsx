"use client";

import { useState } from "react";
import { DossierCard } from "./DossierCard";
import { NewDossierModal } from "./NewDossierModal";
import type { DossierListItem } from "@/server/queries/dossiers";

interface Props {
  dossiers: DossierListItem[];
}

export function DossierList({ dossiers }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--color-ink-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            maxWidth: "none",
          }}
        >
          {dossiers.length === 0
            ? "No active dossiers"
            : `${dossiers.length} active dossier${dossiers.length === 1 ? "" : "s"}`}
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setModalOpen(true)}
        >
          + New Dossier
        </button>
      </div>

      {/* List or empty state */}
      {dossiers.length === 0 ? (
        <div
          className="panel"
          style={{
            padding: "3.5rem 2rem",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.125rem",
              color: "var(--color-ink-primary)",
              marginBottom: "0.625rem",
              maxWidth: "none",
            }}
          >
            No dossiers yet
          </p>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.8125rem",
              color: "var(--color-ink-secondary)",
              marginBottom: "1.5rem",
              maxWidth: "none",
            }}
          >
            Create your first research workspace to get started.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setModalOpen(true)}
          >
            + New Dossier
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {dossiers.map((dossier) => (
            <DossierCard key={dossier.id} dossier={dossier} />
          ))}
        </div>
      )}

      <NewDossierModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
