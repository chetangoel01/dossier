import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDossier } from "@/server/queries/dossiers";
import {
  getOpenClaims,
  getRecentHighlights,
  getTimelinePreview,
  getTopEntitiesByMentions,
  type OverviewClaim,
  type OverviewEntity,
  type OverviewEvent,
  type OverviewHighlight,
} from "@/server/queries/overview";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = {
  title: "Overview — Dossier",
};

interface OverviewPageProps {
  params: Promise<{ id: string }>;
}

const CLAIM_STATUS_LABELS: Record<string, string> = {
  open: "Open",
  supported: "Supported",
  contested: "Contested",
  deprecated: "Deprecated",
};

const CLAIM_STATUS_CHIP: Record<string, string> = {
  open: "chip",
  supported: "chip chip-success",
  contested: "chip chip-alert",
  deprecated: "chip chip-warning",
};

export default async function OverviewPage({ params }: OverviewPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const dossier = await getDossier(id, session.user.id);
  if (!dossier) {
    notFound();
  }

  const [highlights, entities, events, claims] = await Promise.all([
    getRecentHighlights(id, session.user.id, 5),
    getTopEntitiesByMentions(id, session.user.id, 5),
    getTimelinePreview(id, session.user.id, 4),
    getOpenClaims(id, session.user.id, 5),
  ]);

  const summary = dossier.summary?.trim();
  const researchGoal = dossier.research_goal?.trim();

  return (
    <div
      className="w-full max-w-[960px] mx-auto py-8"
      style={{ paddingInline: "var(--space-gutter)" }}
    >
      <div className="grid grid-cols-2 gap-4 mb-4 anim-stagger">
        {/* Summary panel */}
        <div className="panel col-span-full p-6">
          <PanelEyebrow>Research Summary</PanelEyebrow>
          {summary || researchGoal ? (
            <div>
              {summary && (
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "0.9375rem",
                    color: "var(--color-ink-primary)",
                    lineHeight: 1.55,
                    maxWidth: "none",
                  }}
                >
                  {summary}
                </p>
              )}
              {researchGoal && (
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "0.8125rem",
                    color: "var(--color-ink-secondary)",
                    fontStyle: "italic",
                    marginTop: summary ? "0.625rem" : 0,
                    maxWidth: "none",
                  }}
                >
                  {researchGoal}
                </p>
              )}
            </div>
          ) : (
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.9375rem",
                color: "var(--color-ink-secondary)",
                fontStyle: "italic",
              }}
            >
              No summary yet. Add sources and claims to build your research picture.
            </p>
          )}
        </div>

        <OverviewPanel label="Recent Evidence">
          {highlights.length === 0 ? (
            <EmptyState
              compact
              eyebrow="No evidence captured."
              message="Highlights from sources will surface here as you review."
            />
          ) : (
            <HighlightList dossierId={id} highlights={highlights} />
          )}
        </OverviewPanel>

        <OverviewPanel label="Key Entities">
          {entities.length === 0 ? (
            <EmptyState
              compact
              eyebrow="No entities yet."
              message="People, organizations, and topics will appear as they are identified."
            />
          ) : (
            <EntityList dossierId={id} entities={entities} />
          )}
        </OverviewPanel>

        <OverviewPanel label="Timeline">
          {events.length === 0 ? (
            <EmptyState
              compact
              eyebrow="No events on the timeline."
              message="Dated events will populate a timeline preview here."
            />
          ) : (
            <EventList dossierId={id} events={events} />
          )}
        </OverviewPanel>

        <OverviewPanel label="Open Claims">
          {claims.length === 0 ? (
            <EmptyState
              compact
              eyebrow="No open claims."
              message="Claims awaiting evidence will be surfaced here for follow-up."
            />
          ) : (
            <ClaimList dossierId={id} claims={claims} />
          )}
        </OverviewPanel>
      </div>
    </div>
  );
}

function OverviewPanel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel py-5 px-6">
      <PanelEyebrow>{label}</PanelEyebrow>
      {children}
    </div>
  );
}

function PanelEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-3"
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.6875rem",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: "var(--color-ink-secondary)",
      }}
    >
      {children}
    </p>
  );
}

function HighlightList({
  dossierId,
  highlights,
}: {
  dossierId: string;
  highlights: OverviewHighlight[];
}) {
  return (
    <ul
      style={{ listStyle: "none", display: "grid", gap: "0.625rem" }}
      className="anim-stagger"
    >
      {highlights.map((hl) => (
        <li key={hl.id}>
          <Link
            href={`/dossiers/${dossierId}/sources/${hl.source.id}#highlight-${hl.id}`}
            className="dossier-row-link"
            style={{
              display: "block",
              padding: "0.5rem 0.625rem",
              borderRadius: "var(--radius-sm)",
              textDecoration: "none",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.8125rem",
                color: "var(--color-ink-primary)",
                lineHeight: 1.5,
                maxWidth: "none",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              “{hl.quote_text}”
            </p>
            <p
              style={{
                marginTop: "0.25rem",
                fontFamily: "var(--font-mono)",
                fontSize: "0.6875rem",
                color: "var(--color-ink-secondary)",
                letterSpacing: "0.03em",
                maxWidth: "none",
              }}
            >
              {hl.source.title}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function EntityList({
  dossierId,
  entities,
}: {
  dossierId: string;
  entities: OverviewEntity[];
}) {
  return (
    <ul style={{ listStyle: "none", display: "grid", gap: "0.5rem" }}>
      {entities.map((entity) => (
        <li key={entity.id}>
          <Link
            href={`/dossiers/${dossierId}/entities#entity-${entity.id}`}
            className="dossier-row-link"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.75rem",
              padding: "0.375rem 0.625rem",
              borderRadius: "var(--radius-sm)",
              textDecoration: "none",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.875rem",
                color: "var(--color-ink-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {entity.name}
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                flexShrink: 0,
              }}
            >
              <span className="chip">{entity.type}</span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.6875rem",
                  color: "var(--color-ink-secondary)",
                }}
              >
                {entity._count.mentions} mention
                {entity._count.mentions === 1 ? "" : "s"}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function EventList({
  dossierId,
  events,
}: {
  dossierId: string;
  events: OverviewEvent[];
}) {
  return (
    <ul style={{ listStyle: "none", display: "grid", gap: "0.5rem" }}>
      {events.map((event) => (
        <li key={event.id}>
          <Link
            href={`/dossiers/${dossierId}/timeline#event-${event.id}`}
            className="dossier-row-link"
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: "0.75rem",
              padding: "0.375rem 0.625rem",
              borderRadius: "var(--radius-sm)",
              textDecoration: "none",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.875rem",
                color: "var(--color-ink-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {event.title}
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.6875rem",
                color: "var(--color-ink-secondary)",
                flexShrink: 0,
              }}
            >
              {formatEventDate(event.event_date, event.precision)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ClaimList({
  dossierId,
  claims,
}: {
  dossierId: string;
  claims: OverviewClaim[];
}) {
  return (
    <ul style={{ listStyle: "none", display: "grid", gap: "0.5rem" }}>
      {claims.map((claim) => (
        <li key={claim.id}>
          <Link
            href={`/dossiers/${dossierId}/claims#claim-${claim.id}`}
            className="dossier-row-link"
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "0.75rem",
              padding: "0.5rem 0.625rem",
              borderRadius: "var(--radius-sm)",
              textDecoration: "none",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.8125rem",
                color: "var(--color-ink-primary)",
                lineHeight: 1.45,
                maxWidth: "none",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {claim.statement}
            </span>
            <span
              className={CLAIM_STATUS_CHIP[claim.status] ?? "chip"}
              style={{ flexShrink: 0, marginTop: "0.0625rem" }}
            >
              {CLAIM_STATUS_LABELS[claim.status] ?? claim.status}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function formatEventDate(
  date: Date | null,
  precision: OverviewEvent["precision"],
): string {
  if (!date) return "—";
  const d = new Date(date);
  if (precision === "year") {
    return d.getUTCFullYear().toString();
  }
  if (precision === "month") {
    return d.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  }
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
