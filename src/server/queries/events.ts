import { db } from "@/lib/db";

const eventDetailSelect = {
  id: true,
  dossier_id: true,
  title: true,
  description: true,
  event_date: true,
  precision: true,
  confidence: true,
  claim_id: true,
  created_at: true,
  updated_at: true,
  highlights: {
    select: {
      highlight: {
        select: {
          id: true,
          quote_text: true,
          page_number: true,
          source: {
            select: { id: true, title: true },
          },
        },
      },
    },
  },
  entities: {
    select: {
      entity: {
        select: { id: true, name: true, type: true },
      },
    },
  },
} as const;

export async function getEvents(dossierId: string, userId: string) {
  return db.event.findMany({
    where: {
      dossier_id: dossierId,
      dossier: { owner_id: userId },
    },
    orderBy: [{ event_date: "asc" }, { precision: "asc" }, { title: "asc" }],
    select: eventDetailSelect,
  });
}

export type EventListItem = Awaited<ReturnType<typeof getEvents>>[number];

export async function getEvent(
  dossierId: string,
  eventId: string,
  userId: string,
) {
  return db.event.findFirst({
    where: {
      id: eventId,
      dossier_id: dossierId,
      dossier: { owner_id: userId },
    },
    select: eventDetailSelect,
  });
}
