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
