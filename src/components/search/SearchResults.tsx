import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import type {
  SearchObjectType,
  SearchResultBase,
  SearchResults as SearchResultsData,
} from "@/server/queries/search";

interface SearchResultsProps {
  results: SearchResultsData;
  dossierTitle: string | null;
}

const TYPE_LABELS: Record<SearchObjectType, string> = {
  dossier: "Dossiers",
  source: "Sources",
  highlight: "Highlights",
  claim: "Claims",
  entity: "Entities",
  brief: "Briefs",
};

const TYPE_ORDER: SearchObjectType[] = [
  "dossier",
  "source",
  "highlight",
  "claim",
  "entity",
  "brief",
];

export function SearchResults({ results, dossierTitle }: SearchResultsProps) {
  if (!results.query) {
    return (
      <EmptyState
        eyebrow="Search the workspace."
        message="Enter a term to search across dossiers, sources, highlights, claims, entities, and briefs."
      />
    );
  }

  if (results.total === 0) {
    return (
      <EmptyState
        eyebrow="No matches."
        message={
          dossierTitle
            ? `Nothing matched “${results.query}” in ${dossierTitle}.`
            : `Nothing matched “${results.query}”.`
        }
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      {TYPE_ORDER.map((type) => {
        const items = results.groups[type];
        if (!items || items.length === 0) return null;
        return <ResultGroup key={type} type={type} items={items} />;
      })}
    </div>
  );
}

function ResultGroup({
  type,
  items,
}: {
  type: SearchObjectType;
  items: SearchResultBase[];
}) {
  return (
    <section>
      <header
        className="flex items-baseline justify-between"
        style={{ marginBottom: "0.625rem" }}
      >
        <h2
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6875rem",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--color-ink-secondary)",
            fontWeight: 500,
          }}
        >
          {TYPE_LABELS[type]}
        </h2>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6875rem",
            color: "var(--color-ink-secondary)",
          }}
        >
          {items.length} result{items.length === 1 ? "" : "s"}
        </span>
      </header>

      <div className="panel" style={{ overflow: "hidden" }}>
        {items.map((item, i) => (
          <Link
            key={`${item.type}-${item.id}`}
            href={item.href}
            className="dossier-row-link"
            style={{
              display: "block",
              padding: "0.75rem 1rem",
              textDecoration: "none",
              borderBottom:
                i < items.length - 1
                  ? "var(--border-hairline) solid var(--color-border)"
                  : undefined,
            }}
          >
            <div
              className="flex items-baseline justify-between"
              style={{ gap: "1rem", marginBottom: "0.25rem" }}
            >
              <p
                className="overflow-hidden text-ellipsis whitespace-nowrap"
                style={{
                  fontFamily:
                    item.type === "highlight"
                      ? "var(--font-display)"
                      : "var(--font-sans)",
                  fontStyle: item.type === "highlight" ? "italic" : "normal",
                  fontSize: "0.9375rem",
                  fontWeight: 500,
                  color: "var(--color-ink-primary)",
                  minWidth: 0,
                  flex: 1,
                }}
              >
                {item.type === "highlight"
                  ? `“${item.title}”`
                  : item.title}
              </p>
              <span
                className="shrink-0"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.6875rem",
                  color: "var(--color-ink-secondary)",
                }}
              >
                {item.dossierTitle}
              </span>
            </div>
            {item.snippet && (
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.8125rem",
                  color: "var(--color-ink-secondary)",
                  margin: 0,
                  maxWidth: "none",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {renderSnippet(item.snippet)}
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

// ts_headline wraps matches in `<<…>>` — split the string so we can render
// matched fragments with an inline highlight without dangerouslySetInnerHTML.
function renderSnippet(snippet: string): React.ReactNode {
  const parts = snippet.split(/(<<[^>]*>>)/g);
  return parts.map((part, i) => {
    const match = part.match(/^<<(.*)>>$/);
    if (match) {
      return (
        <mark
          key={i}
          style={{
            backgroundColor: "var(--color-highlight-wash)",
            color: "var(--color-ink-primary)",
            padding: "0 0.125rem",
            borderRadius: "var(--radius-xs)",
          }}
        >
          {match[1]}
        </mark>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
