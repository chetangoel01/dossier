import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getOrCreateBrief } from "@/server/queries/briefs";
import { BriefEditorClient } from "@/components/briefs/BriefEditorClient";

export const metadata: Metadata = {
  title: "Brief — Dossier",
};

interface BriefPageProps {
  params: Promise<{ id: string }>;
}

export default async function BriefPage({ params }: BriefPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const brief = await getOrCreateBrief(id, session.user.id);

  if (!brief) {
    notFound();
  }

  return (
    <BriefEditorClient
      dossierId={id}
      brief={{
        title: brief.title,
        body_markdown: brief.body_markdown,
        updated_at: brief.updated_at,
      }}
    />
  );
}
