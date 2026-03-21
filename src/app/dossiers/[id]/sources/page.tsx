import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getSources } from "@/server/queries/sources";
import { SourcesClient } from "@/components/sources/SourcesClient";

export const metadata: Metadata = {
  title: "Sources — Dossier",
};

interface SourcesPageProps {
  params: Promise<{ id: string }>;
}

export default async function SourcesPage({ params }: SourcesPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const sources = await getSources(id, session.user.id);

  return <SourcesClient dossierId={id} sources={sources} />;
}
