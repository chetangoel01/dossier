import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { getSources, getSourceForReader } from "@/server/queries/sources";
import { SourceReaderClient } from "@/components/sources/SourceReaderClient";

export const metadata: Metadata = {
  title: "Source Reader — Dossier",
};

interface SourceReaderPageProps {
  params: Promise<{ id: string; sourceId: string }>;
}

export default async function SourceReaderPage({
  params,
}: SourceReaderPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id, sourceId } = await params;

  const [source, allSources] = await Promise.all([
    getSourceForReader(sourceId, id, session.user.id),
    getSources(id, session.user.id),
  ]);

  if (!source) {
    notFound();
  }

  return (
    <SourceReaderClient
      dossierId={id}
      source={source}
      allSources={allSources}
    />
  );
}
