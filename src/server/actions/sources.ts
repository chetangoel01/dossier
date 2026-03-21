"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { SourceType, SourceStatus } from "@prisma/client";

// ─── Validation ─────────────────────────────────────────────────────────────

const VALID_SOURCE_TYPES: SourceType[] = [
  "web_link",
  "pdf",
  "pasted_text",
  "manual_note",
  "internal_memo",
];

const VALID_SOURCE_STATUSES: SourceStatus[] = [
  "unreviewed",
  "reviewing",
  "reviewed",
  "discarded",
];

interface SourceInput {
  dossierId: string;
  type: SourceType;
  title: string;
  url?: string | null;
  author?: string | null;
  publisher?: string | null;
  publishedAt?: string | null;
  rawText?: string | null;
  summary?: string | null;
  credibilityRating?: number | null;
  sourceStatus?: SourceStatus;
}

/** Validate type-specific required fields given the effective type and field values. */
function validateTypeSpecificFields(
  type: SourceType,
  fields: { url?: string | null; rawText?: string | null },
): string | null {
  if (type === "web_link" && !fields.url?.trim()) {
    return "URL is required for web link sources.";
  }

  if (type === "pasted_text" && !fields.rawText?.trim()) {
    return "Text content is required for pasted text sources.";
  }

  if (type === "manual_note" && !fields.rawText?.trim()) {
    return "Note content is required for manual note sources.";
  }

  return null;
}

function validateSourceInput(
  input: SourceInput,
): string | null {
  if (!input.dossierId) return "Dossier ID is required.";
  if (!input.title?.trim()) return "Title is required.";

  if (!VALID_SOURCE_TYPES.includes(input.type)) {
    return `Invalid source type. Must be one of: ${VALID_SOURCE_TYPES.join(", ")}.`;
  }

  if (
    input.sourceStatus &&
    !VALID_SOURCE_STATUSES.includes(input.sourceStatus)
  ) {
    return `Invalid source status. Must be one of: ${VALID_SOURCE_STATUSES.join(", ")}.`;
  }

  const typeError = validateTypeSpecificFields(input.type, {
    url: input.url,
    rawText: input.rawText,
  });
  if (typeError) return typeError;

  if (input.credibilityRating != null) {
    if (
      !Number.isInteger(input.credibilityRating) ||
      input.credibilityRating < 0 ||
      input.credibilityRating > 100
    ) {
      return "Credibility rating must be an integer between 0 and 100.";
    }
  }

  if (input.publishedAt) {
    const date = new Date(input.publishedAt);
    if (isNaN(date.getTime())) {
      return "Published date is invalid.";
    }
  }

  return null;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function verifyDossierOwnership(
  dossierId: string,
  userId: string,
): Promise<boolean> {
  const dossier = await db.dossier.findFirst({
    where: { id: dossierId, owner_id: userId },
    select: { id: true },
  });
  return !!dossier;
}

async function verifySourceOwnership(
  sourceId: string,
  userId: string,
): Promise<{
  id: string;
  dossier_id: string;
  type: SourceType;
  url: string | null;
  raw_text: string | null;
} | null> {
  return db.source.findFirst({
    where: {
      id: sourceId,
      dossier: { owner_id: userId },
    },
    select: { id: true, dossier_id: true, type: true, url: true, raw_text: true },
  });
}

// ─── Actions ────────────────────────────────────────────────────────────────

export async function createSource(
  input: SourceInput,
): Promise<{ error: string } | { id: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  const validationError = validateSourceInput(input);
  if (validationError) return { error: validationError };

  const ownsDoser = await verifyDossierOwnership(
    input.dossierId,
    session.user.id,
  );
  if (!ownsDoser) return { error: "Dossier not found." };

  try {
    const source = await db.source.create({
      data: {
        dossier_id: input.dossierId,
        type: input.type,
        title: input.title.trim(),
        url: input.url?.trim() || null,
        author: input.author?.trim() || null,
        publisher: input.publisher?.trim() || null,
        published_at: input.publishedAt ? new Date(input.publishedAt) : null,
        raw_text: input.rawText || null,
        summary: input.summary?.trim() || null,
        credibility_rating: input.credibilityRating ?? null,
        source_status: input.sourceStatus ?? "unreviewed",
      },
    });

    revalidatePath(`/dossiers/${input.dossierId}/sources`);
    return { id: source.id };
  } catch {
    return { error: "Failed to create source. Please try again." };
  }
}

export async function updateSource(
  id: string,
  input: Partial<Omit<SourceInput, "dossierId">>,
): Promise<{ error: string } | { success: true }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  const source = await verifySourceOwnership(id, session.user.id);
  if (!source) return { error: "Source not found." };

  // Validate type-specific requirements if type is being changed
  if (input.type && !VALID_SOURCE_TYPES.includes(input.type)) {
    return {
      error: `Invalid source type. Must be one of: ${VALID_SOURCE_TYPES.join(", ")}.`,
    };
  }

  if (
    input.sourceStatus &&
    !VALID_SOURCE_STATUSES.includes(input.sourceStatus)
  ) {
    return {
      error: `Invalid source status. Must be one of: ${VALID_SOURCE_STATUSES.join(", ")}.`,
    };
  }

  if (input.title !== undefined && !input.title?.trim()) {
    return { error: "Title is required." };
  }

  if (input.credibilityRating != null) {
    if (
      !Number.isInteger(input.credibilityRating) ||
      input.credibilityRating < 0 ||
      input.credibilityRating > 100
    ) {
      return {
        error: "Credibility rating must be an integer between 0 and 100.",
      };
    }
  }

  if (input.publishedAt) {
    const date = new Date(input.publishedAt);
    if (isNaN(date.getTime())) {
      return { error: "Published date is invalid." };
    }
  }

  // Enforce type-specific required fields against the effective (merged) state
  const effectiveType = input.type ?? source.type;
  const effectiveUrl = input.url !== undefined ? input.url : source.url;
  const effectiveRawText = input.rawText !== undefined ? input.rawText : source.raw_text;

  const typeError = validateTypeSpecificFields(effectiveType, {
    url: effectiveUrl,
    rawText: effectiveRawText,
  });
  if (typeError) return { error: typeError };

  try {
    await db.source.update({
      where: { id },
      data: {
        ...(input.type !== undefined && { type: input.type }),
        ...(input.title !== undefined && { title: input.title.trim() }),
        ...(input.url !== undefined && {
          url: input.url?.trim() || null,
        }),
        ...(input.author !== undefined && {
          author: input.author?.trim() || null,
        }),
        ...(input.publisher !== undefined && {
          publisher: input.publisher?.trim() || null,
        }),
        ...(input.publishedAt !== undefined && {
          published_at: input.publishedAt
            ? new Date(input.publishedAt)
            : null,
        }),
        ...(input.rawText !== undefined && {
          raw_text: input.rawText || null,
        }),
        ...(input.summary !== undefined && {
          summary: input.summary?.trim() || null,
        }),
        ...(input.credibilityRating !== undefined && {
          credibility_rating: input.credibilityRating,
        }),
        ...(input.sourceStatus !== undefined && {
          source_status: input.sourceStatus,
        }),
      },
    });

    revalidatePath(`/dossiers/${source.dossier_id}/sources`);
    return { success: true };
  } catch {
    return { error: "Failed to update source. Please try again." };
  }
}

export async function deleteSource(
  id: string,
): Promise<{ error: string } | { success: true }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  const source = await verifySourceOwnership(id, session.user.id);
  if (!source) return { error: "Source not found." };

  try {
    await db.source.delete({ where: { id } });

    revalidatePath(`/dossiers/${source.dossier_id}/sources`);
    return { success: true };
  } catch {
    return { error: "Failed to delete source. Please try again." };
  }
}
