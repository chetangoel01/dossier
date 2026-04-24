import type { DossierStatus } from "@prisma/client";

/**
 * STATUS_LABEL maps raw DossierStatus enum values to their user-facing
 * labels. Exported so callers can display the same phrasing elsewhere
 * (e.g. filter dropdowns) without repeating the mapping.
 */
export const STATUS_LABEL: Record<DossierStatus, string> = {
  active: "Active",
  archived: "Archived",
  on_hold: "On hold",
};

const STATUS_CHIP_CLASS: Record<DossierStatus, string> = {
  active: "chip chip-success",
  on_hold: "chip chip-warning",
  archived: "chip",
};

interface StatusChipProps {
  status: DossierStatus;
}

/**
 * StatusChip — canonical dossier status pill.
 *
 * Uses the shared .chip* token set and an editorial uppercase tracking
 * pattern so the badge reads as quiet metadata in the header and the
 * dossiers index alike.
 */
export function StatusChip({ status }: StatusChipProps) {
  return (
    <span
      className={STATUS_CHIP_CLASS[status] ?? "chip"}
      style={{
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
