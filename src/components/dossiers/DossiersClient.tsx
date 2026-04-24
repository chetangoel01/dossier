"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { NewDossierModal } from "./NewDossierModal";
import { StatusChip } from "@/components/ui/StatusChip";
import type { DossierListItem } from "@/server/queries/dossiers";

interface DossiersClientProps {
  dossiers: DossierListItem[];
}

export function DossiersClient({ dossiers }: DossiersClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // Open the modal when the command bar navigates here with ?new=1, then
  // strip the query so reloads don't reopen it.
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setModalOpen(true);
      router.replace(pathname);
    }
  }, [searchParams, pathname, router]);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.25rem" }}>
        <button
          className="btn btn-primary"
          onClick={() => setModalOpen(true)}
        >
          New Dossier
        </button>
      </div>

      {dossiers.length === 0 ? (
        <div className="panel" style={{ padding: "3rem 2rem", textAlign: "center" }}>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.8125rem",
              color: "var(--color-ink-secondary)",
            }}
          >
            No dossiers yet. Create one to start building your research workspace.
          </p>
        </div>
      ) : (
        <div
          className="panel"
          style={{ overflow: "hidden" }}
        >
          {dossiers.map((dossier, i) => (
            <Link
              key={dossier.id}
              href={`/dossiers/${dossier.id}/overview`}
              className="dossier-row-link"
              style={{
                padding: "1rem 1.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                borderBottom:
                  i < dossiers.length - 1
                    ? "var(--border-thin) solid var(--color-border)"
                    : undefined,
                textDecoration: "none",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1rem",
                    color: "var(--color-ink-primary)",
                    marginBottom: dossier.summary ? "0.25rem" : 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "none",
                  }}
                >
                  {dossier.title}
                </p>
                {dossier.summary && (
                  <p
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "0.8125rem",
                      color: "var(--color-ink-secondary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: "none",
                    }}
                  >
                    {dossier.summary}
                  </p>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6875rem",
                    color: "var(--color-ink-secondary)",
                  }}
                >
                  {dossier._count.sources} source
                  {dossier._count.sources !== 1 ? "s" : ""}
                </span>
                <StatusChip status={dossier.status} />
              </div>
            </Link>
          ))}
        </div>
      )}

      <NewDossierModal
        key={modalOpen ? "open" : "closed"}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
