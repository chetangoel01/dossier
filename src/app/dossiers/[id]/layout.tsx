import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getDossier } from "@/server/queries/dossiers";
import { WorkspaceTabBar } from "@/components/dossiers/WorkspaceTabBar";
import { GlobalSearchBar } from "@/components/search/GlobalSearchBar";

interface DossierLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function DossierLayout({
  children,
  params,
}: DossierLayoutProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const dossier = await getDossier(id, session.user.id);

  if (!dossier) {
    notFound();
  }

  return (
    <div
      className="flex flex-col min-h-dvh"
      style={{ backgroundColor: "var(--color-bg-canvas)" }}
    >
      {/* Workspace header */}
      <header
        className="flex items-center gap-4 shrink-0"
        style={{
          backgroundColor: "var(--color-bg-panel)",
          borderBottom: "var(--border-thin) solid var(--color-border)",
          padding: "0.75rem var(--space-gutter)",
        }}
      >
        <Link
          href="/dossiers"
          className="shrink-0 no-underline"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--color-ink-secondary)",
          }}
          aria-label="Back to all dossiers"
        >
          ← Dossiers
        </Link>

        <div
          className="h-4 shrink-0"
          style={{
            width: "var(--border-thin)",
            backgroundColor: "var(--color-border)",
          }}
          aria-hidden
        />

        <div className="flex items-baseline gap-3 min-w-0">
          <h1
            className="overflow-hidden text-ellipsis whitespace-nowrap"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.0625rem",
              fontWeight: 600,
              color: "var(--color-ink-primary)",
              letterSpacing: "-0.01em",
            }}
          >
            {dossier.title}
          </h1>

          <span
            className="chip shrink-0"
          >
            {dossier.status}
          </span>
        </div>

        <div className="flex-1 flex justify-end min-w-0">
          <GlobalSearchBar dossierId={id} />
        </div>
      </header>

      {/* Tab navigation */}
      <WorkspaceTabBar dossierId={id} />

      {/* Content + inspector region */}
      <div className="flex flex-1 min-h-0">
        {/* Main content region */}
        <main className="flex flex-col flex-1 min-h-0">
          {children}
        </main>

        {/* Right inspector slot — collapsed by default, populated per-tab */}
        <aside
          data-slot="inspector"
          className="hidden w-[22rem] shrink-0 overflow-y-auto"
          style={{
            borderLeft: "var(--border-thin) solid var(--color-border)",
            backgroundColor: "var(--color-bg-panel)",
          }}
        />
      </div>
    </div>
  );
}
