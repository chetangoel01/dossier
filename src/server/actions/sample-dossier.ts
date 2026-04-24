"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { buildSampleDossier } from "@/server/lib/sample-dossier";

/**
 * Server action invoked from the empty `/dossiers` state when the user clicks
 * "Load sample dossier." Creates a curated demo dossier owned by the current
 * user, then redirects to its overview.
 */
export async function seedSampleDossier(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const { dossierId } = await buildSampleDossier(db, session.user.id);

  revalidatePath("/dossiers");
  redirect(`/dossiers/${dossierId}/overview`);
}
