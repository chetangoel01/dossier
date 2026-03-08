import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getDossier } from "@/server/queries/dossiers";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return { title: "Dossier" };
  const dossier = await getDossier(id, session.user.id);
  return { title: dossier ? `${dossier.title} — Dossier` : "Dossier" };
}

export default async function DossierWorkspacePage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const dossier = await getDossier(id, session.user.id);
  if (!dossier) notFound();

  return (
    <main
      style={{
        minHeight: "100dvh",
        backgroundColor: "var(--color-bg-canvas)",
        padding: "2rem var(--space-gutter)",
      }}
    >
      <div style={{ maxWidth: "var(--space-content-max)", marginInline: "auto" }}>
        {/* Breadcrumb */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "2rem",
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--color-ink-secondary)",
          }}
          aria-label="Breadcrumb"
        >
          <Link
            href="/dossiers"
            style={{
              color: "var(--color-accent-ink)",
              textDecoration: "none",
            }}
          >
            Dossiers
          </Link>
          <span aria-hidden>›</span>
          <span>{dossier.title}</span>
        </nav>

        {/* Dossier header */}
        <div
          style={{
            marginBottom: "2rem",
            paddingBottom: "1.25rem",
            borderBottom: "var(--border-thin) solid var(--color-border)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "1rem",
              marginBottom: "0.5rem",
            }}
          >
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.75rem",
                color: "var(--color-ink-primary)",
                lineHeight: 1.2,
              }}
            >
              {dossier.title}
            </h1>
            <span
              className="chip"
              style={{ marginTop: "0.375rem", flexShrink: 0 }}
            >
              {dossier.status}
            </span>
          </div>

          {dossier.summary && (
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.9375rem",
                color: "var(--color-ink-secondary)",
                lineHeight: 1.6,
                maxWidth: "56ch",
                marginBottom: "0.75rem",
              }}
            >
              {dossier.summary}
            </p>
          )}

          {dossier.research_goal && (
            <div
              className="rule-left"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.875rem",
                color: "var(--color-ink-secondary)",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.6875rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  display: "block",
                  marginBottom: "0.125rem",
                  color: "var(--color-accent-ink)",
                }}
              >
                Research Goal
              </span>
              {dossier.research_goal}
            </div>
          )}
        </div>

        {/* Workspace placeholder */}
        <div
          className="panel"
          style={{ padding: "3rem 2rem", textAlign: "center" }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.8125rem",
              color: "var(--color-ink-secondary)",
              maxWidth: "none",
            }}
          >
            Workspace coming in the next release — sources, highlights, and
            evidence management.
          </p>
        </div>
      </div>
    </main>
  );
}
