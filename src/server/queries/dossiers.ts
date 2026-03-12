import { db } from "@/lib/db";

export async function getDossiers(userId: string) {
  return db.dossier.findMany({
    where: { owner_id: userId },
    orderBy: { updated_at: "desc" },
    include: {
      _count: { select: { sources: true } },
    },
  });
}
