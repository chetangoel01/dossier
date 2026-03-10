import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getDossier } from "@/server/queries/dossiers";
import { WorkspaceTabBar } from "@/components/dossiers/WorkspaceTabBar";

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
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        backgroundColor: "var(--color-bg-canvas)",
      }}
    >
      {/* Workspace header */}
      <header
        style={{
          backgroundColor: "var(--color-bg-panel)",
          borderBottom: "var(--border-thin) solid var(--color-border)",
          padding: "0.75rem var(--space-gutter)",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          flexShrink: 0,
        }}
      >
        <Link
          href="/dossiers"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--color-ink-secondary)",
            textDecoration: "none",
            flexShrink: 0,
          }}
          aria-label="Back to all dossiers"
        >
          ← Dossiers
        </Link>

        <div
          style={{
            width: "var(--border-thin)",
            height: "1rem",
            backgroundColor: "var(--color-border)",
            flexShrink: 0,
          }}
          aria-hidden
        />

        <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", minWidth: 0 }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.0625rem",
              fontWeight: 600,
              color: "var(--color-ink-primary)",
              letterSpacing: "-0.01em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {dossier.title}
          </h1>

          <span
            className="chip"
            style={{ flexShrink: 0 }}
          >
            {dossier.status}
          </span>
        </div>
      </header>

      {/* Tab navigation */}
      <WorkspaceTabBar dossierId={id} />

      {/* Main content region */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        {children}
      </main>
    </div>
  );
}
