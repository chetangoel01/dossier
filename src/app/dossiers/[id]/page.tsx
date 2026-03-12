import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DossierRootPage({ params }: PageProps) {
  const { id } = await params;
  redirect(`/dossiers/${id}/overview`);
}
