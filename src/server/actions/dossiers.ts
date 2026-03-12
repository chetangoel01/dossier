"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export type CreateDossierResult = { error: string } | { id: string };

export async function createDossier(
  userId: string,
  formData: FormData
): Promise<CreateDossierResult> {
  const title = (formData.get("title") as string | null)?.trim();
  const summary = (formData.get("summary") as string | null)?.trim() || null;
  const research_goal =
    (formData.get("research_goal") as string | null)?.trim() || null;

  if (!title) {
    return { error: "Title is required." };
  }

  const baseSlug = slugify(title) || "dossier";
  const slug = `${baseSlug}-${Date.now()}`;

  const dossier = await db.dossier.create({
    data: {
      title,
      slug,
      summary,
      research_goal,
      owner_id: userId,
    },
  });

  revalidatePath("/dossiers");
  return { id: dossier.id };
}
