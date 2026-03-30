import { db } from "@/lib/db";

export async function getEntities(dossierId: string, userId: string) {
  return db.entity.findMany({
    where: {
      dossier_id: dossierId,
      dossier: { owner_id: userId },
    },
    orderBy: [{ updated_at: "desc" }, { name: "asc" }],
    select: {
      id: true,
      dossier_id: true,
      name: true,
      type: true,
      description: true,
      aliases: true,
      importance: true,
      created_at: true,
      updated_at: true,
      _count: {
        select: {
          mentions: true,
          claims: true,
        },
      },
    },
  });
}

export type EntityListItem = Awaited<ReturnType<typeof getEntities>>[number];

export async function getEntityBacklinks(dossierId: string, userId: string) {
  return db.entity.findMany({
    where: {
      dossier_id: dossierId,
      dossier: { owner_id: userId },
    },
    orderBy: [{ updated_at: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      type: true,
      description: true,
      aliases: true,
      importance: true,
      mentions: {
        select: {
          id: true,
          source_id: true,
          highlight_id: true,
          context_snippet: true,
          source: {
            select: {
              id: true,
              title: true,
              captured_at: true,
            },
          },
          highlight: {
            select: {
              id: true,
              quote_text: true,
              source: {
                select: {
                  id: true,
                  title: true,
                  captured_at: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

export type EntityBacklinkItem = Awaited<
  ReturnType<typeof getEntityBacklinks>
>[number];
