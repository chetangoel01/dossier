import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { EntitiesClient } from "@/components/entities/EntitiesClient";
import { getEntities } from "@/server/queries/entities";

export const metadata: Metadata = {
  title: "Entities — Dossier",
};

interface EntitiesPageProps {
  params: Promise<{ id: string }>;
}

export default async function EntitiesPage({ params }: EntitiesPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const entities = await getEntities(id, session.user.id);

  return <EntitiesClient dossierId={id} entities={entities} />;
}
