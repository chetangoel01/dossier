import { db } from "@/lib/db";
import type { Source } from "@prisma/client";

export type { Source };

export async function getSources(dossierId: string, userId: string) {
  return db.source.findMany({
    where: {
      dossier_id: dossierId,
      dossier: { owner_id: userId },
    },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      dossier_id: true,
      type: true,
      title: true,
      url: true,
      author: true,
      publisher: true,
      published_at: true,
      captured_at: true,
      summary: true,
      credibility_rating: true,
      source_status: true,
      created_at: true,
      updated_at: true,
      _count: {
        select: { highlights: true },
      },
    },
  });
}

export async function getSource(
  id: string,
  userId: string,
): Promise<Source | null> {
  return db.source.findFirst({
    where: {
      id,
      dossier: { owner_id: userId },
    },
  });
}

export type SourceListItem = Awaited<ReturnType<typeof getSources>>[number];
