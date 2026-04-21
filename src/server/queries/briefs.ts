import { db } from "@/lib/db";
import type { Brief } from "@prisma/client";

export type { Brief };

const briefSelect = {
  id: true,
  dossier_id: true,
  title: true,
  body_markdown: true,
  version: true,
  status: true,
  created_at: true,
  updated_at: true,
} as const;

export type BriefData = Pick<
  Brief,
  | "id"
  | "dossier_id"
  | "title"
  | "body_markdown"
  | "version"
  | "status"
  | "created_at"
  | "updated_at"
>;

/**
 * Return the current brief for a dossier, creating an empty draft the first
 * time it's requested. Scoped by userId so cross-account access returns null.
 */
export async function getOrCreateBrief(
  dossierId: string,
  userId: string,
): Promise<BriefData | null> {
  const dossier = await db.dossier.findFirst({
    where: { id: dossierId, owner_id: userId },
    select: { id: true, title: true, brief: { select: briefSelect } },
  });
  if (!dossier) return null;
  if (dossier.brief) return dossier.brief;

  return db.brief.create({
    data: {
      dossier_id: dossier.id,
      title: dossier.title,
      body_markdown: null,
    },
    select: briefSelect,
  });
}

/**
 * Fetch the evidence pool available to the brief editor: every source in the
 * dossier, each with its highlights. Used to populate the evidence drawer
 * where users pick citations to insert into the brief body.
 */
export async function getBriefEvidence(dossierId: string, userId: string) {
  const sources = await db.source.findMany({
    where: {
      dossier_id: dossierId,
      dossier: { owner_id: userId },
    },
    orderBy: [{ captured_at: "desc" }, { title: "asc" }],
    select: {
      id: true,
      title: true,
      type: true,
      author: true,
      publisher: true,
      captured_at: true,
      highlights: {
        orderBy: { start_offset: "asc" },
        select: {
          id: true,
          source_id: true,
          quote_text: true,
          start_offset: true,
          end_offset: true,
          page_number: true,
          label: true,
          annotation: true,
        },
      },
    },
  });
  return sources;
}

export type BriefEvidenceSource = Awaited<
  ReturnType<typeof getBriefEvidence>
>[number];
export type BriefEvidenceHighlight = BriefEvidenceSource["highlights"][number];
