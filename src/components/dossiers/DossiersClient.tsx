"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { NewDossierModal } from "./NewDossierModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusChip } from "@/components/ui/StatusChip";
import { WorkflowStrip } from "@/components/ui/WorkflowStrip";
import { archiveDossier } from "@/server/actions/dossiers";
import { seedSampleDossier } from "@/server/actions/sample-dossier";
import type { DossierListItem } from "@/server/queries/dossiers";

interface DossiersClientProps {
  dossiers: DossierListItem[];
}

export function DossiersClient({ dossiers }: DossiersClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<DossierListItem | null>(
    null,
  );
  const [isSeeding, startSeeding] = useTransition();
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

  function handleLoadSample() {
    startSeeding(() => seedSampleDossier());
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "1.25rem",
        }}
      >
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setModalOpen(true)}
        >
          New Dossier
        </button>
      </div>

      {dossiers.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
          <EmptyState
            eyebrow="No dossiers yet."
            message="Start your first dossier — or load a sample to see how the pieces fit."
            action={
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setModalOpen(true)}
                  disabled={isSeeding}
                >
                  Start a dossier
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleLoadSample}
                  disabled={isSeeding}
                >
                  {isSeeding ? "Loading sample…" : "Load sample dossier"}
                </button>
              </div>
            }
          />
          <WorkflowStrip />
        </div>
      ) : (
        <div className="panel" style={{ overflow: "hidden" }}>
          {dossiers.map((dossier, i) => (
            <DossierRow
              key={dossier.id}
              dossier={dossier}
              isLast={i === dossiers.length - 1}
              onArchive={() => setArchiveTarget(dossier)}
            />
          ))}
        </div>
      )}

      <NewDossierModal
        key={modalOpen ? "open" : "closed"}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />

      <ArchiveConfirmDialog
        target={archiveTarget}
        onClose={() => setArchiveTarget(null)}
      />
    </>
  );
}

interface DossierRowProps {
  dossier: DossierListItem;
  isLast: boolean;
  onArchive: () => void;
}

function DossierRow({ dossier, isLast, onArchive }: DossierRowProps) {
  return (
    <Link
      href={`/dossiers/${dossier.id}/overview`}
      className="dossier-row-link"
      style={{
        padding: "1rem 1.25rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        borderBottom: !isLast
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

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              aria-label={`More actions for ${dossier.title}`}
              className="btn btn-ghost"
              onClick={(e) => {
                // Stop the row Link from navigating when the trigger is clicked.
                e.preventDefault();
                e.stopPropagation();
              }}
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
              <DropdownMenu.Item
                onSelect={(e) => {
                  e.preventDefault();
                  onArchive();
                }}
                className="source-status-menu-item"
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "0.375rem 0.75rem",
                  fontSize: "0.8125rem",
                  fontFamily: "var(--font-sans)",
                  color: "var(--color-ink-primary)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  outline: "none",
                  transition: "background-color var(--duration-fast)",
                }}
              >
                Archive
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </Link>
  );
}

interface ArchiveConfirmDialogProps {
  target: DossierListItem | null;
  onClose: () => void;
}

function ArchiveConfirmDialog({ target, onClose }: ArchiveConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (target) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [target]);

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

  function handleArchive() {
    if (!target) return;
    const id = target.id;
    startTransition(async () => {
      await archiveDossier(id);
      onClose();
    });
  }

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
        width: "min(440px, 92vw)",
      }}
    >
      <div style={{ padding: "1.5rem 1.75rem" }}>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--color-ink-secondary)",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            marginBottom: "0.75rem",
          }}
        >
          Archive dossier
        </p>
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "0.9375rem",
            color: "var(--color-ink-primary)",
            lineHeight: 1.5,
            marginBottom: "1.25rem",
          }}
        >
          Archive{" "}
          <strong style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>
            {target?.title ?? ""}
          </strong>
          ? It&rsquo;ll be hidden from your workspace. Data is kept and can be
          restored later.
        </p>

        <div
          style={{
            display: "flex",
            gap: "0.625rem",
            justifyContent: "flex-end",
            paddingTop: "0.75rem",
            borderTop: "var(--border-thin) solid var(--color-border)",
          }}
        >
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleArchive}
            disabled={isPending}
          >
            {isPending ? "Archiving…" : "Archive"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
