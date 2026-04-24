import { db } from "@/lib/db";

/**
 * Overview query helpers — cheap, read-only selects that power the
 * dossier Overview tab panels. Each helper is scoped to the owning user
 * so RLS-style isolation is enforced at the query layer.
 */

export async function getRecentHighlights(
  dossierId: string,
  userId: string,
  limit = 5,
) {
  return db.highlight.findMany({
    where: {
      source: {
        dossier_id: dossierId,
        dossier: { owner_id: userId },
      },
    },
    orderBy: { created_at: "desc" },
    take: limit,
    select: {
      id: true,
      quote_text: true,
      label: true,
      created_at: true,
      source: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });
}

export type OverviewHighlight = Awaited<
  ReturnType<typeof getRecentHighlights>
>[number];

export async function getTopEntitiesByMentions(
  dossierId: string,
  userId: string,
  limit = 5,
) {
  const entities = await db.entity.findMany({
    where: {
      dossier_id: dossierId,
      dossier: { owner_id: userId },
    },
    select: {
      id: true,
      name: true,
      type: true,
      _count: {
        select: { mentions: true },
      },
    },
  });

  return entities
    .sort((a, b) => b._count.mentions - a._count.mentions)
    .slice(0, limit);
}

export type OverviewEntity = Awaited<
  ReturnType<typeof getTopEntitiesByMentions>
>[number];

export async function getTimelinePreview(
  dossierId: string,
  userId: string,
  limit = 4,
) {
  const now = new Date();
  const upcoming = await db.event.findMany({
    where: {
      dossier_id: dossierId,
      dossier: { owner_id: userId },
      event_date: { gte: now },
    },
    orderBy: { event_date: "asc" },
    take: limit,
    select: {
      id: true,
      title: true,
      event_date: true,
      precision: true,
    },
  });

  if (upcoming.length >= limit) return upcoming;

  const recent = await db.event.findMany({
    where: {
      dossier_id: dossierId,
      dossier: { owner_id: userId },
      event_date: { lt: now },
    },
    orderBy: { event_date: "desc" },
    take: limit - upcoming.length,
    select: {
      id: true,
      title: true,
      event_date: true,
      precision: true,
    },
  });

  return [...upcoming, ...recent];
}

export type OverviewEvent = Awaited<
  ReturnType<typeof getTimelinePreview>
>[number];

export async function getOpenClaims(
  dossierId: string,
  userId: string,
  limit = 5,
) {
  return db.claim.findMany({
    where: {
      dossier_id: dossierId,
      dossier: { owner_id: userId },
      status: { in: ["open", "contested"] },
    },
    orderBy: { updated_at: "desc" },
    take: limit,
    select: {
      id: true,
      statement: true,
      status: true,
      confidence: true,
    },
  });
}

export type OverviewClaim = Awaited<ReturnType<typeof getOpenClaims>>[number];
