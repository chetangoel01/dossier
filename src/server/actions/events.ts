"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { EventPrecision } from "@prisma/client";

const VALID_PRECISIONS: EventPrecision[] = ["day", "month", "year", "unknown"];

interface CreateEventInput {
  dossierId: string;
  title: string;
  description?: string | null;
  eventDate?: string | Date | null;
  precision?: EventPrecision;
  confidence?: number | null;
  claimId?: string | null;
  highlightIds?: string[];
  entityIds?: string[];
}

interface UpdateEventInput {
  id: string;
  title?: string;
  description?: string | null;
  eventDate?: string | Date | null;
  precision?: EventPrecision;
  confidence?: number | null;
  claimId?: string | null;
}

interface LinkEventHighlightInput {
  eventId: string;
  highlightId: string;
}

interface LinkEventEntityInput {
  eventId: string;
  entityId: string;
}

function isValidConfidence(value: number | null | undefined): boolean {
  return value == null || (value >= 0 && value <= 100);
}

function revalidateDossierPaths(dossierId: string) {
  revalidatePath(`/dossiers/${dossierId}`, "layout");
}

/**
 * Normalize a raw date input to a UTC Date anchored to the precision boundary
 * (year → Jan 1, month → day 1, day → as given). Returns null if no date given.
 * For precision "unknown", the stored date is dropped so the event is undated.
 */
function normalizeEventDate(
  raw: string | Date | null | undefined,
  precision: EventPrecision,
): Date | null {
  if (precision === "unknown") return null;
  if (raw == null || raw === "") return null;
  const d = raw instanceof Date ? raw : new Date(raw);
  if (Number.isNaN(d.getTime())) return null;

  if (precision === "year") {
    return new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  }
  if (precision === "month") {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  }
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

export async function createEvent(
  input: CreateEventInput,
): Promise<{ error: string } | { id: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  if (!input.dossierId) return { error: "Dossier ID is required." };
  if (!input.title?.trim()) return { error: "Event title is required." };
  const precision: EventPrecision = input.precision ?? "unknown";
  if (!VALID_PRECISIONS.includes(precision))
    return {
      error: `Invalid precision. Must be one of: ${VALID_PRECISIONS.join(", ")}.`,
    };
  if (precision !== "unknown" && !input.eventDate)
    return { error: "Event date is required for this precision." };
  if (!isValidConfidence(input.confidence))
    return { error: "Confidence must be between 0 and 100." };

  const dossier = await db.dossier.findFirst({
    where: { id: input.dossierId, owner_id: session.user.id },
    select: { id: true },
  });
  if (!dossier) return { error: "Dossier not found." };

  if (input.claimId) {
    const claim = await db.claim.findFirst({
      where: { id: input.claimId, dossier_id: input.dossierId },
      select: { id: true },
    });
    if (!claim) return { error: "Claim not found in this dossier." };
  }

  const eventDate = normalizeEventDate(input.eventDate, precision);
  const highlightIds = [...new Set(input.highlightIds?.filter(Boolean) ?? [])];
  const entityIds = [...new Set(input.entityIds?.filter(Boolean) ?? [])];

  if (highlightIds.length > 0) {
    const count = await db.highlight.count({
      where: {
        id: { in: highlightIds },
        source: { dossier_id: input.dossierId },
      },
    });
    if (count !== highlightIds.length)
      return { error: "One or more highlights not found in this dossier." };
  }

  if (entityIds.length > 0) {
    const count = await db.entity.count({
      where: { id: { in: entityIds }, dossier_id: input.dossierId },
    });
    if (count !== entityIds.length)
      return { error: "One or more entities not found in this dossier." };
  }

  try {
    const event = await db.event.create({
      data: {
        dossier_id: input.dossierId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        event_date: eventDate,
        precision,
        confidence: input.confidence ?? null,
        claim_id: input.claimId ?? null,
        highlights: highlightIds.length
          ? {
              create: highlightIds.map((highlight_id) => ({ highlight_id })),
            }
          : undefined,
        entities: entityIds.length
          ? { create: entityIds.map((entity_id) => ({ entity_id })) }
          : undefined,
      },
      select: { id: true },
    });

    revalidateDossierPaths(input.dossierId);
    return { id: event.id };
  } catch {
    return { error: "Failed to create event. Please try again." };
  }
}

export async function updateEvent(
  input: UpdateEventInput,
): Promise<{ error: string } | { success: true }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  if (!input.id) return { error: "Event ID is required." };
  if (input.title !== undefined && !input.title.trim())
    return { error: "Event title cannot be empty." };
  if (input.precision && !VALID_PRECISIONS.includes(input.precision))
    return {
      error: `Invalid precision. Must be one of: ${VALID_PRECISIONS.join(", ")}.`,
    };
  if (!isValidConfidence(input.confidence))
    return { error: "Confidence must be between 0 and 100." };

  const event = await db.event.findFirst({
    where: { id: input.id, dossier: { owner_id: session.user.id } },
    select: { id: true, dossier_id: true, precision: true },
  });
  if (!event) return { error: "Event not found." };

  const nextPrecision: EventPrecision = input.precision ?? event.precision;

  if (input.claimId) {
    const claim = await db.claim.findFirst({
      where: { id: input.claimId, dossier_id: event.dossier_id },
      select: { id: true },
    });
    if (!claim) return { error: "Claim not found in this dossier." };
  }

  const data: {
    title?: string;
    description?: string | null;
    event_date?: Date | null;
    precision?: EventPrecision;
    confidence?: number | null;
    claim_id?: string | null;
  } = {};

  if (input.title !== undefined) data.title = input.title.trim();
  if (input.description !== undefined)
    data.description = input.description?.trim() || null;
  if (input.precision !== undefined) data.precision = input.precision;
  if (input.confidence !== undefined)
    data.confidence = input.confidence ?? null;
  if (input.claimId !== undefined) data.claim_id = input.claimId ?? null;
  if (input.eventDate !== undefined || input.precision !== undefined) {
    data.event_date = normalizeEventDate(
      input.eventDate ?? undefined,
      nextPrecision,
    );
  }

  try {
    await db.event.update({ where: { id: input.id }, data });
    revalidateDossierPaths(event.dossier_id);
    return { success: true };
  } catch {
    return { error: "Failed to update event. Please try again." };
  }
}

export async function deleteEvent(
  id: string,
): Promise<{ error: string } | { success: true }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  const event = await db.event.findFirst({
    where: { id, dossier: { owner_id: session.user.id } },
    select: { id: true, dossier_id: true },
  });
  if (!event) return { error: "Event not found." };

  try {
    await db.event.delete({ where: { id } });
    revalidateDossierPaths(event.dossier_id);
    return { success: true };
  } catch {
    return { error: "Failed to delete event. Please try again." };
  }
}

export async function linkEventHighlight(
  input: LinkEventHighlightInput,
): Promise<{ error: string } | { success: true }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  if (!input.eventId) return { error: "Event ID is required." };
  if (!input.highlightId) return { error: "Highlight ID is required." };

  const event = await db.event.findFirst({
    where: { id: input.eventId, dossier: { owner_id: session.user.id } },
    select: { id: true, dossier_id: true },
  });
  if (!event) return { error: "Event not found." };

  const highlight = await db.highlight.findFirst({
    where: {
      id: input.highlightId,
      source: { dossier_id: event.dossier_id },
    },
    select: { id: true },
  });
  if (!highlight) return { error: "Highlight not found in this dossier." };

  try {
    await db.eventHighlight.upsert({
      where: {
        event_id_highlight_id: {
          event_id: event.id,
          highlight_id: highlight.id,
        },
      },
      update: {},
      create: { event_id: event.id, highlight_id: highlight.id },
    });
    revalidateDossierPaths(event.dossier_id);
    return { success: true };
  } catch {
    return { error: "Failed to link highlight. Please try again." };
  }
}

export async function unlinkEventHighlight(
  input: LinkEventHighlightInput,
): Promise<{ error: string } | { success: true }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  const event = await db.event.findFirst({
    where: { id: input.eventId, dossier: { owner_id: session.user.id } },
    select: { id: true, dossier_id: true },
  });
  if (!event) return { error: "Event not found." };

  try {
    await db.eventHighlight.delete({
      where: {
        event_id_highlight_id: {
          event_id: input.eventId,
          highlight_id: input.highlightId,
        },
      },
    });
    revalidateDossierPaths(event.dossier_id);
    return { success: true };
  } catch {
    return { error: "Failed to unlink highlight. Please try again." };
  }
}

export async function linkEventEntity(
  input: LinkEventEntityInput,
): Promise<{ error: string } | { success: true }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  if (!input.eventId) return { error: "Event ID is required." };
  if (!input.entityId) return { error: "Entity ID is required." };

  const event = await db.event.findFirst({
    where: { id: input.eventId, dossier: { owner_id: session.user.id } },
    select: { id: true, dossier_id: true },
  });
  if (!event) return { error: "Event not found." };

  const entity = await db.entity.findFirst({
    where: { id: input.entityId, dossier_id: event.dossier_id },
    select: { id: true },
  });
  if (!entity) return { error: "Entity not found in this dossier." };

  try {
    await db.eventEntity.upsert({
      where: {
        event_id_entity_id: {
          event_id: event.id,
          entity_id: entity.id,
        },
      },
      update: {},
      create: { event_id: event.id, entity_id: entity.id },
    });
    revalidateDossierPaths(event.dossier_id);
    return { success: true };
  } catch {
    return { error: "Failed to link entity. Please try again." };
  }
}

export async function unlinkEventEntity(
  input: LinkEventEntityInput,
): Promise<{ error: string } | { success: true }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  const event = await db.event.findFirst({
    where: { id: input.eventId, dossier: { owner_id: session.user.id } },
    select: { id: true, dossier_id: true },
  });
  if (!event) return { error: "Event not found." };

  try {
    await db.eventEntity.delete({
      where: {
        event_id_entity_id: {
          event_id: input.eventId,
          entity_id: input.entityId,
        },
      },
    });
    revalidateDossierPaths(event.dossier_id);
    return { success: true };
  } catch {
    return { error: "Failed to unlink entity. Please try again." };
  }
}
