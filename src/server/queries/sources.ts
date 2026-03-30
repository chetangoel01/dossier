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
      tags: {
        select: {
          tag: { select: { id: true, name: true } },
        },
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

export async function getSourceForReader(id: string, dossierId: string, userId: string) {
  return db.source.findFirst({
    where: {
      id,
      dossier_id: dossierId,
      dossier: { owner_id: userId },
    },
    include: {
      highlights: {
        orderBy: { start_offset: "asc" },
        select: {
          id: true,
          quote_text: true,
          start_offset: true,
          end_offset: true,
          annotation: true,
          label: true,
          created_at: true,
          mentions: {
            select: {
              id: true,
              context_snippet: true,
              entity: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
            },
          },
        },
      },
      mentions: {
        select: {
          id: true,
          context_snippet: true,
          entity: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      },
      tags: {
        select: {
          tag: { select: { id: true, name: true } },
        },
      },
      _count: {
        select: { highlights: true, mentions: true },
      },
    },
  });
}

export type SourceReaderData = NonNullable<
  Awaited<ReturnType<typeof getSourceForReader>>
>;
