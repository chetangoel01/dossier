import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getClaims } from "@/server/queries/claims";
import { ClaimsClient } from "@/components/claims/ClaimsClient";

export const metadata: Metadata = {
  title: "Claims — Dossier",
};

interface ClaimsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClaimsPage({ params }: ClaimsPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const claims = await getClaims(id, session.user.id);

  return <ClaimsClient dossierId={id} claims={claims} />;
}
