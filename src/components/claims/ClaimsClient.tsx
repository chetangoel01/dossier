"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { deleteClaim, updateClaim } from "@/server/actions/claims";
import type { ClaimListItem } from "@/server/queries/claims";
import type { ClaimStatus } from "@prisma/client";
import { useRouter } from "next/navigation";

interface Props {
  dossierId: string;
  claims: ClaimListItem[];
}

const STATUS_OPTIONS: { value: ClaimStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "supported", label: "Supported" },
  { value: "contested", label: "Contested" },
  { value: "deprecated", label: "Deprecated" },
];

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ClaimsClient({ dossierId, claims }: Props) {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (filterStatus === "all") return claims;
    return claims.filter((c) => c.status === filterStatus);
  }, [claims, filterStatus]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: claims.length };
    for (const c of claims) {
      counts[c.status] = (counts[c.status] ?? 0) + 1;
    }
    return counts;
  }, [claims]);

  const handleStatusChange = (claimId: string, newStatus: ClaimStatus) => {
    startTransition(async () => {
      await updateClaim({ id: claimId, status: newStatus });
      router.refresh();
    });
  };

  const handleDelete = (claimId: string) => {
    if (!window.confirm("Delete this claim? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteClaim(claimId);
      router.refresh();
    });
  };

  return (
    <div
      style={{
        padding: "2rem var(--space-gutter)",
        maxWidth: "960px",
        marginInline: "auto",
        width: "100%",
        opacity: isPending ? 0.7 : 1,
        transition: "opacity var(--duration-fast) ease",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.125rem",
            color: "var(--color-ink-primary)",
          }}
        >
          Claims
        </h2>
      </div>

      {/* Filter bar */}
      {claims.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "0.375rem",
            marginBottom: "1rem",
            flexWrap: "wrap",
          }}
        >
          {[{ value: "all", label: "All" }, ...STATUS_OPTIONS].map((opt) => {
            const count = statusCounts[opt.value] ?? 0;
            const isActive = filterStatus === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFilterStatus(opt.value)}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.6875rem",
                  padding: "0.25rem 0.625rem",
                  borderRadius: "var(--radius-sm)",
                  border: "var(--border-thin) solid var(--color-border)",
                  backgroundColor: isActive
                    ? "var(--color-bg-selected)"
                    : "transparent",
                  color: isActive
                    ? "var(--color-ink-primary)"
                    : "var(--color-ink-secondary)",
                  cursor: "pointer",
                  transition: "background-color var(--duration-fast) ease",
                }}
              >
                {opt.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Claims list */}
      {filtered.length === 0 ? (
        <div
          className="panel"
          style={{
            padding: "3rem 2rem",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.8125rem",
              color: "var(--color-ink-secondary)",
              marginBottom: "0.5rem",
              maxWidth: "none",
            }}
          >
            {claims.length === 0
              ? "No claims recorded."
              : "No claims match the current filter."}
          </p>
          {claims.length === 0 && (
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.875rem",
                color: "var(--color-ink-secondary)",
                fontStyle: "italic",
              }}
            >
              Claims are defensible assertions linked to source evidence. Create
              them from highlights in the source reader.
            </p>
          )}
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {filtered.map((claim) => (
            <div
              key={claim.id}
              className="panel"
              style={{
                padding: "1rem 1.25rem",
                borderLeft: "var(--border-rule) solid var(--color-accent-ink)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "1rem",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "0.9375rem",
                      color: "var(--color-ink-primary)",
                      lineHeight: 1.5,
                      marginBottom: "0.5rem",
                      maxWidth: "none",
                    }}
                  >
                    {claim.statement}
                  </p>

                  {/* Meta row */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <select
                      value={claim.status}
                      onChange={(e) =>
                        handleStatusChange(
                          claim.id,
                          e.target.value as ClaimStatus,
                        )
                      }
                      className="input"
                      style={{
                        fontSize: "0.6875rem",
                        padding: "0.125rem 0.375rem",
                        width: "auto",
                      }}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    {claim.confidence != null && (
                      <span
                        className="chip chip-citation"
                        style={{ fontSize: "0.625rem" }}
                      >
                        {claim.confidence}% confidence
                      </span>
                    )}

                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.6875rem",
                        color: "var(--color-ink-secondary)",
                      }}
                    >
                      {claim._count.highlights} highlight
                      {claim._count.highlights !== 1 ? "s" : ""}
                    </span>

                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.6875rem",
                        color: "var(--color-ink-secondary)",
                      }}
                    >
                      · {formatDate(claim.created_at)}
                    </span>
                  </div>

                  {/* Notes */}
                  {claim.notes && (
                    <p
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "0.8125rem",
                        color: "var(--color-ink-secondary)",
                        lineHeight: 1.45,
                        marginTop: "0.5rem",
                        fontStyle: "italic",
                        maxWidth: "none",
                      }}
                    >
                      {claim.notes}
                    </p>
                  )}

                  {/* Linked highlights */}
                  {claim.highlights.length > 0 && (
                    <div
                      style={{
                        marginTop: "0.625rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.25rem",
                      }}
                    >
                      {claim.highlights.map((ch) => (
                        <Link
                          key={ch.highlight.id}
                          href={`/dossiers/${dossierId}/sources/${ch.highlight.source.id}`}
                          style={{
                            display: "block",
                            padding: "0.375rem 0.5rem",
                            backgroundColor: "var(--color-highlight-wash)",
                            borderRadius: "var(--radius-xs)",
                            textDecoration: "none",
                            transition:
                              "background-color var(--duration-fast) ease",
                          }}
                        >
                          <p
                            style={{
                              fontFamily: "var(--font-sans)",
                              fontSize: "0.75rem",
                              color: "var(--color-ink-primary)",
                              fontStyle: "italic",
                              lineHeight: 1.35,
                              maxWidth: "none",
                            }}
                          >
                            &ldquo;
                            {ch.highlight.quote_text.length > 100
                              ? ch.highlight.quote_text.slice(0, 100) + "…"
                              : ch.highlight.quote_text}
                            &rdquo;
                          </p>
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "0.625rem",
                              color: "var(--color-ink-secondary)",
                              marginTop: "0.125rem",
                              display: "block",
                            }}
                          >
                            {ch.highlight.source.title}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => handleDelete(claim.id)}
                  style={{
                    fontSize: "0.6875rem",
                    padding: "0.25rem 0.375rem",
                    color: "var(--color-ink-secondary)",
                    flexShrink: 0,
                  }}
                  aria-label="Delete claim"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
