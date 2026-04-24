import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LIMITS } from "@/lib/validation";
import { getDossier } from "@/server/queries/dossiers";
import type { SearchResults as SearchResultsData } from "@/server/queries/search";
import { searchWorkspace } from "@/server/queries/search";
import { GlobalSearchBar } from "@/components/search/GlobalSearchBar";
import { SearchResults } from "@/components/search/SearchResults";

export const metadata: Metadata = {
  title: "Search — Dossier",
};

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    dossierId?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { q, dossierId } = await searchParams;
  // Cap server-rendered queries at the same length as the API route so a
  // pasted query that's too long fails gracefully instead of 500-ing.
  const query = (q?.trim() ?? "").slice(0, LIMITS.searchQuery);

  // Validate the scoped dossier — if the id is unknown to this user, drop the
  // scope rather than silently returning empty results.
  let scopedDossier = null;
  if (dossierId) {
    scopedDossier = await getDossier(dossierId, session.user.id);
  }
  const effectiveDossierId = scopedDossier?.id ?? null;

  const emptyResults: SearchResultsData = {
    query,
    dossierId: effectiveDossierId,
    types: [],
    groups: {
      dossier: [],
      source: [],
      highlight: [],
      claim: [],
      entity: [],
      brief: [],
    },
    total: 0,
  };

  let results: SearchResultsData = emptyResults;
  let searchError: string | null = null;
  if (query) {
    try {
      results = await searchWorkspace(session.user.id, query, {
        dossierId: effectiveDossierId,
      });
    } catch {
      searchError = "Search failed. Please try again.";
    }
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        backgroundColor: "var(--color-bg-canvas)",
        padding: "2rem var(--space-gutter)",
      }}
    >
      <div style={{ maxWidth: "var(--space-content-max)", marginInline: "auto" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <Link
            href={
              scopedDossier
                ? `/dossiers/${scopedDossier.id}/overview`
                : "/dossiers"
            }
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "var(--color-ink-secondary)",
            }}
          >
            ← {scopedDossier ? scopedDossier.title : "Dossiers"}
          </Link>
        </div>

        <header
          style={{
            marginBottom: "1.5rem",
            paddingBottom: "1rem",
            borderBottom: "var(--border-thin) solid var(--color-border)",
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.75rem",
              color: "var(--color-ink-primary)",
              marginBottom: "0.75rem",
            }}
          >
            Search
          </h1>
          <GlobalSearchBar
            dossierId={scopedDossier?.id}
            initialQuery={query}
          />
          {scopedDossier && (
            <p
              style={{
                marginTop: "0.5rem",
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                color: "var(--color-ink-secondary)",
              }}
            >
              Scoped to{" "}
              <span style={{ color: "var(--color-accent-ink)" }}>
                {scopedDossier.title}
              </span>
              {" · "}
              <Link href={`/search?q=${encodeURIComponent(query)}`}>
                search all dossiers
              </Link>
            </p>
          )}
        </header>

        {searchError ? (
          <div
            role="alert"
            style={{
              padding: "0.75rem 1rem",
              backgroundColor: "var(--color-error-bg)",
              border: "var(--border-thin) solid var(--color-error-border)",
              borderRadius: "var(--radius-sm)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.8125rem",
              color: "var(--color-accent-alert)",
            }}
          >
            {searchError}
          </div>
        ) : (
          <SearchResults
            results={results}
            dossierTitle={scopedDossier?.title ?? null}
          />
        )}
      </div>
    </main>
  );
}
