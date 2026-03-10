import { db } from "@/lib/db";
import type { Dossier } from "@prisma/client";

export type { Dossier };

export async function getDossier(
  id: string,
  userId: string
): Promise<Dossier | null> {
  return db.dossier.findFirst({
    where: { id, owner_id: userId },
  });
}
