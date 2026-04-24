"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { LIMITS, overLimit } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import type { HighlightLabel } from "@prisma/client";

const VALID_LABELS: HighlightLabel[] = [
  "evidence",
  "question",
  "counterpoint",
  "stat",
  "quote",
];

interface CreateHighlightInput {
  sourceId: string;
  quoteText: string;
  startOffset: number;
  endOffset: number;
  label?: HighlightLabel;
  annotation?: string | null;
}

export async function createHighlight(
  input: CreateHighlightInput,
): Promise<{ error: string } | { id: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  if (!input.sourceId) return { error: "Source ID is required." };
  if (!input.quoteText?.trim()) return { error: "Quote text is required." };
  if (overLimit(input.quoteText, LIMITS.highlightQuote))
    return { error: "Selected quote is too long to save." };
  if (overLimit(input.annotation, LIMITS.highlightAnnotation))
    return {
      error: `Annotation must be under ${LIMITS.highlightAnnotation} characters.`,
    };
  if (input.startOffset < 0) return { error: "Invalid start offset." };
  if (input.endOffset <= input.startOffset)
    return { error: "Invalid offset range." };
  if (input.label && !VALID_LABELS.includes(input.label))
    return { error: `Invalid label. Must be one of: ${VALID_LABELS.join(", ")}.` };

  const source = await db.source.findFirst({
    where: {
      id: input.sourceId,
      dossier: { owner_id: session.user.id },
    },
    select: { id: true, dossier_id: true },
  });
  if (!source) return { error: "Source not found." };

  try {
    const highlight = await db.highlight.create({
      data: {
        source_id: input.sourceId,
        quote_text: input.quoteText,
        start_offset: input.startOffset,
        end_offset: input.endOffset,
        label: input.label ?? "evidence",
        annotation: input.annotation?.trim() || null,
      },
    });

    revalidatePath(`/dossiers/${source.dossier_id}/sources/${input.sourceId}`);
    return { id: highlight.id };
  } catch {
    return { error: "Failed to create highlight. Please try again." };
  }
}

export async function deleteHighlight(
  id: string,
): Promise<{ error: string } | { success: true }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  const highlight = await db.highlight.findFirst({
    where: {
      id,
      source: { dossier: { owner_id: session.user.id } },
    },
    select: { id: true, source: { select: { id: true, dossier_id: true } } },
  });
  if (!highlight) return { error: "Highlight not found." };

  try {
    await db.highlight.delete({ where: { id } });

    revalidatePath(
      `/dossiers/${highlight.source.dossier_id}/sources/${highlight.source.id}`,
    );
    return { success: true };
  } catch {
    return { error: "Failed to delete highlight. Please try again." };
  }
}
