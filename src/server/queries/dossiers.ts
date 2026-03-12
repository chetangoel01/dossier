import { db } from "@/lib/db";

export async function getDossiers(userId: string) {
  return db.dossier.findMany({
    where: {
      owner_id: userId,
      status: "active",
    },
    orderBy: { updated_at: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      status: true,
      research_goal: true,
      updated_at: true,
      _count: {
        select: { sources: true },
      },
    },
  });
}

export async function getDossier(id: string, userId: string) {
  return db.dossier.findFirst({
    where: { id, owner_id: userId },
  });
}

export type DossierListItem = Awaited<ReturnType<typeof getDossiers>>[number];
