"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { LIMITS, overLimit } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import type { ClaimStatus } from "@prisma/client";

const VALID_STATUSES: ClaimStatus[] = [
  "open",
  "supported",
  "contested",
  "deprecated",
];

interface CreateClaimInput {
  dossierId: string;
  statement: string;
  status?: ClaimStatus;
  confidence?: number | null;
  notes?: string | null;
  highlightIds: string[];
}

export async function createClaim(
  input: CreateClaimInput,
): Promise<{ error: string } | { id: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  if (!input.dossierId) return { error: "Dossier ID is required." };
  if (!input.statement?.trim()) return { error: "Statement is required." };
  if (overLimit(input.statement, LIMITS.claimStatement))
    return {
      error: `Statement must be under ${LIMITS.claimStatement} characters.`,
    };
  if (overLimit(input.notes, LIMITS.claimNotes))
    return { error: `Notes must be under ${LIMITS.claimNotes} characters.` };
  if (input.status && !VALID_STATUSES.includes(input.status))
    return { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}.` };
  if (
    input.confidence != null &&
    (input.confidence < 0 || input.confidence > 100)
  )
    return { error: "Confidence must be between 0 and 100." };
  if (!input.highlightIds || input.highlightIds.length === 0)
    return { error: "At least one highlight is required." };

  // Verify dossier ownership
  const dossier = await db.dossier.findFirst({
    where: { id: input.dossierId, owner_id: session.user.id },
    select: { id: true },
  });
  if (!dossier) return { error: "Dossier not found." };

  // Verify all highlights belong to this dossier
  const highlights = await db.highlight.findMany({
    where: {
      id: { in: input.highlightIds },
      source: {
        dossier_id: input.dossierId,
        dossier: { owner_id: session.user.id },
      },
    },
    select: { id: true },
  });
  if (highlights.length !== input.highlightIds.length)
    return { error: "One or more highlights not found in this dossier." };

  try {
    const claim = await db.claim.create({
      data: {
        dossier_id: input.dossierId,
        statement: input.statement.trim(),
        status: input.status ?? "open",
        confidence: input.confidence ?? null,
        notes: input.notes?.trim() || null,
        highlights: {
          create: input.highlightIds.map((hId) => ({
            highlight_id: hId,
          })),
        },
      },
    });

    revalidatePath(`/dossiers/${input.dossierId}/claims`);
    revalidatePath(`/dossiers/${input.dossierId}/sources`);
    return { id: claim.id };
  } catch {
    return { error: "Failed to create claim. Please try again." };
  }
}

interface UpdateClaimInput {
  id: string;
  statement?: string;
  status?: ClaimStatus;
  confidence?: number | null;
  notes?: string | null;
}

export async function updateClaim(
  input: UpdateClaimInput,
): Promise<{ error: string } | { success: true }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  if (!input.id) return { error: "Claim ID is required." };
  if (input.statement !== undefined && !input.statement.trim())
    return { error: "Statement cannot be empty." };
  if (overLimit(input.statement, LIMITS.claimStatement))
    return {
      error: `Statement must be under ${LIMITS.claimStatement} characters.`,
    };
  if (overLimit(input.notes, LIMITS.claimNotes))
    return { error: `Notes must be under ${LIMITS.claimNotes} characters.` };
  if (input.status && !VALID_STATUSES.includes(input.status))
    return { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}.` };
  if (
    input.confidence != null &&
    (input.confidence < 0 || input.confidence > 100)
  )
    return { error: "Confidence must be between 0 and 100." };

  const claim = await db.claim.findFirst({
    where: {
      id: input.id,
      dossier: { owner_id: session.user.id },
    },
    select: { id: true, dossier_id: true },
  });
  if (!claim) return { error: "Claim not found." };

  try {
    await db.claim.update({
      where: { id: input.id },
      data: {
        ...(input.statement !== undefined && {
          statement: input.statement.trim(),
        }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.confidence !== undefined && {
          confidence: input.confidence,
        }),
        ...(input.notes !== undefined && {
          notes: input.notes?.trim() || null,
        }),
      },
    });

    revalidatePath(`/dossiers/${claim.dossier_id}/claims`);
    revalidatePath(`/dossiers/${claim.dossier_id}/sources`);
    return { success: true };
  } catch {
    return { error: "Failed to update claim. Please try again." };
  }
}

export async function deleteClaim(
  id: string,
): Promise<{ error: string } | { success: true }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  const claim = await db.claim.findFirst({
    where: {
      id,
      dossier: { owner_id: session.user.id },
    },
    select: { id: true, dossier_id: true },
  });
  if (!claim) return { error: "Claim not found." };

  try {
    await db.claim.delete({ where: { id } });

    revalidatePath(`/dossiers/${claim.dossier_id}/claims`);
    revalidatePath(`/dossiers/${claim.dossier_id}/sources`);
    return { success: true };
  } catch {
    return { error: "Failed to delete claim. Please try again." };
  }
}
