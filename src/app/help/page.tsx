import type { Metadata } from "next";
import Link from "next/link";
import { SectionFrame } from "@/components/ui/SectionFrame";

export const metadata: Metadata = {
  title: "Help & methodology — Dossier",
};

const SHORTCUTS_GLOBAL: { keys: string; description: string }[] = [
  { keys: "⌘K / Ctrl+K", description: "Open the command bar — search, navigate, run any action." },
  { keys: "Esc", description: "Close modals, dismiss the command bar or any open menu." },
  { keys: "↑ ↓", description: "Navigate items inside the command bar or any list." },
  { keys: "Enter", description: "Confirm — run the highlighted command bar item, submit a form." },
];

const SHORTCUTS_WORKSPACE: { keys: string; description: string }[] = [
  { keys: "[ / ]", description: "Switch between tabs inside a dossier (Overview, Sources, Claims, Entities, Timeline, Brief, Activity)." },
  { keys: "\\", description: "Toggle the right inspector panel." },
];

export default function HelpPage() {
  return (
    <main style={{ minHeight: "100dvh", backgroundColor: "var(--color-bg-canvas)" }}>
      <SectionFrame>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: "3rem",
            paddingBottom: "1rem",
            borderBottom: "var(--border-thin) solid var(--color-border)",
          }}
        >
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.125rem",
              fontWeight: 600,
              letterSpacing: "0.01em",
              color: "var(--color-ink-primary)",
              textDecoration: "none",
            }}
          >
            Dossier
          </Link>
          <Link
            href="/dossiers"
            className="btn btn-ghost"
            style={{ fontFamily: "var(--font-sans)", fontSize: "0.875rem" }}
          >
            Back to dossiers
          </Link>
        </header>

        <div style={{ maxWidth: "44rem", marginBottom: "4rem" }}>
          <p
            className="text-mono"
            style={{
              fontSize: "0.75rem",
              letterSpacing: "0.08em",
              color: "var(--color-ink-secondary)",
              marginBottom: "1rem",
            }}
          >
            HELP &amp; METHODOLOGY
          </p>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 4vw, 2.75rem)",
              lineHeight: 1.15,
              fontWeight: 500,
              marginBottom: "1.25rem",
            }}
          >
            How Dossier works
          </h1>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "1rem",
              lineHeight: 1.6,
              color: "var(--color-ink-secondary)",
              maxWidth: "36rem",
            }}
          >
            A short guide to the model: how sources, highlights, claims, and
            briefs connect, plus a reference for the keyboard shortcuts and
            review pipeline.
          </p>
        </div>

        <Section stamp="§ 01" heading="The model">
          <Body>
            Dossier organizes research around five linked objects. Understanding
            how they connect is the fastest path to using the product well.
          </Body>
          <Body>
            A <strong>dossier</strong> is a private research workspace — one
            investigation, one project, one question. Everything you collect for
            a particular line of inquiry lives inside it.
          </Body>
          <Body>
            A <strong>source</strong> is anything you cite: a web page, a PDF, a
            transcript, an internal memo, a pasted excerpt. Each source carries
            its provenance — author, publisher, date — so you never lose track
            of where a piece of evidence came from.
          </Body>
          <Body>
            A <strong>highlight</strong> is a passage you mark on a source.
            Highlights are the atomic unit of evidence; they&rsquo;re what
            you&rsquo;ll later cite from a brief or attach to a claim.
          </Body>
          <Body>
            A <strong>claim</strong> is a statement your research supports or
            contests. Each claim is backed by one or more highlights, with a
            confidence score (0&ndash;100) and a status — open, supported, or
            contested.
          </Body>
          <Body>
            A <strong>brief</strong> is the output: a memo composed in markdown,
            with inline citations that resolve back to the highlights and
            sources you marked. Export to PDF and the citations become numbered
            footnotes; the source list at the end is generated from what you
            actually cited.
          </Body>
          <Body>
            The flow is linear in the small &mdash; source &rarr; highlights
            &rarr; claims &rarr; brief &mdash; but you&rsquo;ll move back and
            forth in practice: adding a source mid-brief, contesting a claim
            with new evidence, splitting a highlight as you read more carefully.
          </Body>
        </Section>

        <Section stamp="§ 02" heading="The evidence gutter">
          <Body>
            Open any source in the reader and you&rsquo;ll see a thin column to
            the left of the text. That&rsquo;s the evidence gutter. Each
            highlight you&rsquo;ve marked appears as a colored band in this
            column, color-coded by its label &mdash; stat, evidence, quote, or
            counterpoint.
          </Body>
          <Body>
            Click a band to expand the linked evidence card in the right
            inspector. From there you can edit the highlight&rsquo;s annotation,
            change its label, or jump to the claim it supports.
          </Body>
          <Body>
            The gutter exists so the structure of your evidence is always
            visible without leaving the source. You don&rsquo;t lose your place
            in the text to look something up.
          </Body>
        </Section>

        <Section stamp="§ 03" heading="Source statuses">
          <Body>
            Sources move through a pipeline as you triage them:
          </Body>
          <ul
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "1rem",
              lineHeight: 1.65,
              color: "var(--color-ink-primary)",
              paddingLeft: "1.25rem",
              marginBottom: "1.25rem",
            }}
          >
            <li>
              <strong>Unreviewed</strong> &mdash; captured but not yet read. New
              sources start here.
            </li>
            <li>
              <strong>Reviewing</strong> &mdash; you&rsquo;re working through it,
              marking highlights as you go.
            </li>
            <li>
              <strong>Reviewed</strong> &mdash; you&rsquo;ve extracted what you
              need. The source is settled.
            </li>
            <li>
              <strong>Discarded</strong> &mdash; irrelevant or unreliable.
              Hidden from default views but retained for audit.
            </li>
          </ul>
          <Body>
            Move a source through these states from the source&rsquo;s &ldquo;…&rdquo;
            menu, or via the command bar.
          </Body>
        </Section>

        <Section stamp="§ 04" heading="Citations in briefs">
          <Body>
            When you write a brief, insert citations by typing{" "}
            <Code>[[cite:</Code> and choosing a highlight or source from the
            autocomplete. Citations appear as small chips in the editor &mdash;
            they&rsquo;re not just text references; they&rsquo;re live links to
            the underlying evidence.
          </Body>
          <Body>
            On export to PDF, citations resolve to numbered footnotes. The
            source list at the end of the brief is generated automatically from
            the citations you used &mdash; no manual bibliography to maintain.
          </Body>
        </Section>

        <Section stamp="§ 05" heading="Keyboard shortcuts">
          <SubHeading>Anywhere in the app</SubHeading>
          <ShortcutTable rows={SHORTCUTS_GLOBAL} />

          <SubHeading>Inside a dossier</SubHeading>
          <ShortcutTable rows={SHORTCUTS_WORKSPACE} />

          <Body>
            Most actions also appear in the command bar (⌘K), with their
            shortcut shown to the right of the label.
          </Body>
        </Section>

        <Section stamp="§ 06" heading="Privacy">
          <Body>
            Dossier is private by default. There is no AI inference on your
            sources, no shared workspaces, no telemetry on what you read.
            Sources you upload stay in your account and can be deleted at any
            time.
          </Body>
          <Body>
            <em>Your research is yours.</em>
          </Body>
        </Section>

        <p
          className="text-mono"
          style={{
            fontSize: "0.75rem",
            color: "var(--color-ink-secondary)",
            marginTop: "3rem",
          }}
        >
          Last revised · 2026-04-24
        </p>
      </SectionFrame>
    </main>
  );
}

function Section({
  stamp,
  heading,
  children,
}: {
  stamp: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        maxWidth: "44rem",
        marginBottom: "3.5rem",
        paddingBottom: "2rem",
        borderBottom: "var(--border-thin) solid var(--color-border)",
      }}
    >
      <p
        className="text-mono"
        style={{
          fontSize: "0.75rem",
          letterSpacing: "0.08em",
          color: "var(--color-ink-secondary)",
          marginBottom: "0.5rem",
        }}
      >
        {stamp}
      </p>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.625rem",
          lineHeight: 1.2,
          fontWeight: 500,
          color: "var(--color-ink-primary)",
          marginBottom: "1.25rem",
        }}
      >
        {heading}
      </h2>
      {children}
    </section>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: "var(--font-sans)",
        fontSize: "1rem",
        lineHeight: 1.65,
        color: "var(--color-ink-primary)",
        marginBottom: "1.25rem",
      }}
    >
      {children}
    </p>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-mono"
      style={{
        fontSize: "0.75rem",
        letterSpacing: "0.08em",
        color: "var(--color-ink-secondary)",
        textTransform: "uppercase",
        marginTop: "1.5rem",
        marginBottom: "0.75rem",
      }}
    >
      {children}
    </p>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.875em",
        backgroundColor: "var(--color-citation-chip, var(--color-bg-panel))",
        padding: "0.125rem 0.375rem",
        borderRadius: "var(--radius-sm)",
        border: "var(--border-thin) solid var(--color-border)",
      }}
    >
      {children}
    </code>
  );
}

function ShortcutTable({
  rows,
}: {
  rows: { keys: string; description: string }[];
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(8rem, auto) 1fr",
        columnGap: "1.5rem",
        rowGap: "0.5rem",
        marginBottom: "1.5rem",
      }}
    >
      {rows.map((row) => (
        <div key={row.keys} style={{ display: "contents" }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.8125rem",
              color: "var(--color-ink-primary)",
              whiteSpace: "nowrap",
            }}
          >
            {row.keys}
          </div>
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "0.9375rem",
              lineHeight: 1.55,
              color: "var(--color-ink-secondary)",
            }}
          >
            {row.description}
          </div>
        </div>
      ))}
    </div>
  );
}
