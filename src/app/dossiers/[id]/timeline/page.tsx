import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getEvents, type EventListItem } from "@/server/queries/events";
import { EntityChip } from "@/components/entities/EntityChip";
import { formatEventDate } from "@/lib/events";

export const metadata: Metadata = {
  title: "Timeline — Dossier",
};

interface TimelinePageProps {
  params: Promise<{ id: string }>;
}

function partitionEvents(events: EventListItem[]) {
  const dated: EventListItem[] = [];
  const undated: EventListItem[] = [];
  for (const event of events) {
    if (event.precision === "unknown" || !event.event_date) {
      undated.push(event);
    } else {
      dated.push(event);
    }
  }
  return { dated, undated };
}

export default async function TimelinePage({ params }: TimelinePageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const events = await getEvents(id, session.user.id);
  const { dated, undated } = partitionEvents(events);

  return (
    <div
      className="w-full max-w-[760px] mx-auto py-8"
      style={{ paddingInline: "var(--space-gutter)" }}
    >
      <div className="flex items-baseline justify-between mb-6">
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.125rem",
            color: "var(--color-ink-primary)",
          }}
        >
          Timeline
        </h2>
        <p
          className="max-w-none"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--color-ink-secondary)",
          }}
        >
          {events.length} event{events.length === 1 ? "" : "s"}
          {undated.length > 0 && dated.length > 0
            ? ` · ${undated.length} undated`
            : ""}
        </p>
      </div>

      {events.length === 0 ? (
        <div className="panel py-12 px-8 text-center">
          <p
            className="mb-2 max-w-none"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.8125rem",
              color: "var(--color-ink-secondary)",
            }}
          >
            No events on record.
          </p>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "0.875rem",
              color: "var(--color-ink-secondary)",
              fontStyle: "italic",
            }}
          >
            Dated events drawn from sources and claims will be arranged
            chronologically here.
          </p>
        </div>
      ) : (
        <>
          {dated.length > 0 && (
            <TimelineList dossierId={id} events={dated} />
          )}

          {undated.length > 0 && (
            <section
              className="mt-10"
              aria-labelledby="undated-heading"
            >
              <div className="flex items-center gap-2 mb-3">
                <h3
                  id="undated-heading"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6875rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--color-ink-secondary)",
                  }}
                >
                  Undated
                </h3>
                <span
                  className="flex-1"
                  style={{
                    height: "var(--border-hairline)",
                    backgroundColor: "var(--color-border)",
                  }}
                  aria-hidden
                />
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6875rem",
                    color: "var(--color-ink-secondary)",
                  }}
                >
                  {undated.length}
                </span>
              </div>
              <TimelineList dossierId={id} events={undated} />
            </section>
          )}
        </>
      )}
    </div>
  );
}

function TimelineList({
  dossierId,
  events,
}: {
  dossierId: string;
  events: EventListItem[];
}) {
  return (
    <ol
      className="relative pl-6"
      style={{
        listStyle: "none",
        borderLeft: "var(--border-rule) solid var(--color-accent-ink)",
        marginLeft: "0.4375rem",
      }}
    >
      {events.map((event) => (
        <TimelineRow key={event.id} dossierId={dossierId} event={event} />
      ))}
    </ol>
  );
}

function TimelineRow({
  dossierId,
  event,
}: {
  dossierId: string;
  event: EventListItem;
}) {
  const entities = event.entities.map((e) => e.entity);
  const highlights = event.highlights.map((h) => h.highlight);
  const primarySource = highlights[0]?.source ?? null;
  const titleHref = event.claim_id
    ? `/dossiers/${dossierId}/claims`
    : primarySource
      ? `/dossiers/${dossierId}/sources/${primarySource.id}`
      : null;

  return (
    <li className="relative" style={{ paddingBottom: "1.25rem" }}>
      {/* Marker dot on the timeline rule */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: "0.4375rem",
          left: "calc(-1 * var(--border-rule) - 5px)",
          width: "10px",
          height: "10px",
          borderRadius: "9999px",
          backgroundColor: "var(--color-accent-ink)",
          boxShadow: "0 0 0 3px var(--color-bg-canvas)",
        }}
      />

      <time
        dateTime={
          event.event_date instanceof Date
            ? event.event_date.toISOString()
            : event.event_date ?? undefined
        }
        className="block"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.6875rem",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--color-ink-secondary)",
          marginBottom: "0.25rem",
        }}
      >
        {formatEventDate(event.event_date, event.precision)}
      </time>

      {titleHref ? (
        <Link
          href={titleHref}
          className="no-underline"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1rem",
            fontWeight: 600,
            color: "var(--color-ink-primary)",
            lineHeight: 1.35,
            display: "inline-block",
          }}
        >
          {event.title}
        </Link>
      ) : (
        <h4
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1rem",
            fontWeight: 600,
            color: "var(--color-ink-primary)",
            lineHeight: 1.35,
          }}
        >
          {event.title}
        </h4>
      )}

      {event.description && (
        <p
          className="mt-1 max-w-none"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "0.875rem",
            color: "var(--color-ink-secondary)",
            lineHeight: 1.5,
          }}
        >
          {event.description}
        </p>
      )}

      {(entities.length > 0 || highlights.length > 0) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {entities.map((entity) => (
            <EntityChip key={entity.id} entity={entity} compact />
          ))}
          {highlights.map((highlight) => (
            <Link
              key={highlight.id}
              href={`/dossiers/${dossierId}/sources/${highlight.source.id}`}
              className="chip chip-citation no-underline"
              style={{ cursor: "pointer" }}
              title={highlight.quote_text}
            >
              <span aria-hidden style={{ opacity: 0.7 }}>§</span>
              <span
                className="overflow-hidden text-ellipsis whitespace-nowrap"
                style={{ maxWidth: "14rem" }}
              >
                {highlight.source.title}
              </span>
              {highlight.page_number != null && (
                <span style={{ opacity: 0.7 }}>
                  p.{highlight.page_number}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </li>
  );
}
