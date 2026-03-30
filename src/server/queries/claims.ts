import { db } from "@/lib/db";

export async function getClaims(dossierId: string, userId: string) {
  return db.claim.findMany({
    where: {
      dossier_id: dossierId,
      dossier: { owner_id: userId },
    },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      dossier_id: true,
      statement: true,
      confidence: true,
      status: true,
      notes: true,
      created_at: true,
      updated_at: true,
      _count: {
        select: { highlights: true, entities: true },
      },
      highlights: {
        select: {
          highlight: {
            select: {
              id: true,
              quote_text: true,
              label: true,
              source: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      },
      entities: {
        select: {
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
  });
}

export type ClaimListItem = Awaited<ReturnType<typeof getClaims>>[number];

export async function getClaimsForSource(
  sourceId: string,
  dossierId: string,
  userId: string,
) {
  return db.claim.findMany({
    where: {
      dossier_id: dossierId,
      dossier: { owner_id: userId },
      highlights: {
        some: {
          highlight: { source_id: sourceId },
        },
      },
    },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      statement: true,
      status: true,
      confidence: true,
      created_at: true,
      _count: {
        select: { highlights: true },
      },
      highlights: {
        select: {
          highlight: {
            select: {
              id: true,
              quote_text: true,
              label: true,
            },
          },
        },
      },
      entities: {
        select: {
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
  });
}

export type SourceClaimItem = Awaited<
  ReturnType<typeof getClaimsForSource>
>[number];
