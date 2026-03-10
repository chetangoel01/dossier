"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "dossier"
  );
}

async function uniqueSlug(ownerId: string, title: string): Promise<string> {
  const base = slugify(title);
  let slug = base;
  let n = 1;
  while (await db.dossier.findFirst({ where: { owner_id: ownerId, slug } })) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

export async function createDossier(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return "You must be signed in.";

  const title = (formData.get("title") as string)?.trim();
  if (!title) return "Title is required.";

  const summary = (formData.get("summary") as string)?.trim() || null;
  const research_goal =
    (formData.get("research_goal") as string)?.trim() || null;

  let dossierId: string;
  try {
    const slug = await uniqueSlug(session.user.id, title);
    const dossier = await db.dossier.create({
      data: {
        owner_id: session.user.id,
        title,
        slug,
        summary,
        research_goal,
      },
    });
    dossierId = dossier.id;
  } catch {
    return "Failed to create dossier. Please try again.";
  }

  redirect(`/dossiers/${dossierId}`);
}

export async function renameDossier(id: string, title: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const trimmed = title.trim();
  if (!trimmed) throw new Error("Title is required");

  const dossier = await db.dossier.findFirst({
    where: { id, owner_id: session.user.id },
  });
  if (!dossier) throw new Error("Not found");

  const slug =
    dossier.title === trimmed
      ? dossier.slug
      : await uniqueSlug(session.user.id, trimmed);

  await db.dossier.update({
    where: { id },
    data: { title: trimmed, slug },
  });

  revalidatePath("/dossiers");
}

export async function archiveDossier(id: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const dossier = await db.dossier.findFirst({
    where: { id, owner_id: session.user.id },
  });
  if (!dossier) throw new Error("Not found");

  await db.dossier.update({
    where: { id },
    data: { status: "archived" },
  });

  revalidatePath("/dossiers");
}
