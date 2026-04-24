"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { LIMITS } from "@/lib/validation";

interface SaveBriefInput {
  dossierId: string;
  title: string;
  bodyMarkdown: string;
}

interface SaveBriefSuccess {
  success: true;
  updatedAt: string;
}

const MAX_TITLE_LENGTH = LIMITS.briefTitle;
const MAX_BODY_LENGTH = LIMITS.briefBody;

export async function saveBrief(
  input: SaveBriefInput,
): Promise<{ error: string } | SaveBriefSuccess> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  if (!input.dossierId) return { error: "Dossier ID is required." };

  const title = input.title?.trim() ?? "";
  if (!title) return { error: "Brief title is required." };
  if (title.length > MAX_TITLE_LENGTH)
    return { error: `Brief title must be under ${MAX_TITLE_LENGTH} characters.` };

  const body = input.bodyMarkdown ?? "";
  if (body.length > MAX_BODY_LENGTH)
    return { error: "Brief is too long to save." };

  const dossier = await db.dossier.findFirst({
    where: { id: input.dossierId, owner_id: session.user.id },
    select: { id: true },
  });
  if (!dossier) return { error: "Dossier not found." };

  try {
    const brief = await db.brief.upsert({
      where: { dossier_id: dossier.id },
      update: { title, body_markdown: body },
      create: {
        dossier_id: dossier.id,
        title,
        body_markdown: body,
      },
      select: { updated_at: true },
    });
    return { success: true, updatedAt: brief.updated_at.toISOString() };
  } catch {
    return { error: "Failed to save brief. Please try again." };
  }
}
