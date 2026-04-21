"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { saveBrief } from "@/server/actions/briefs";

interface BriefSnapshot {
  title: string;
  body_markdown: string | null;
  updated_at: Date | string;
}

interface BriefEditorClientProps {
  dossierId: string;
  brief: BriefSnapshot;
}

interface OutlineHeading {
  id: string;
  depth: number;
  text: string;
  lineStart: number;
  lineEnd: number;
}

type SaveStatus = "saved" | "dirty" | "saving" | "error";

const AUTOSAVE_DELAY_MS = 800;

function parseOutline(body: string): OutlineHeading[] {
  if (!body) return [];
  const lines = body.split("\n");
  const headings: OutlineHeading[] = [];

  let cursor = 0;
  lines.forEach((line, index) => {
    const lineStart = cursor;
    const lineEnd = cursor + line.length;
    cursor = lineEnd + 1; // +1 for the newline separator

    const match = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (!match) return;

    const depth = match[1].length;
    const text = match[2].trim();
    if (!text) return;

    headings.push({
      id: `heading-${index}`,
      depth,
      text,
      lineStart,
      lineEnd,
    });
  });

  return headings;
}

function formatSavedLabel(updatedAt: Date | string | null): string {
  if (!updatedAt) return "";
  const date = updatedAt instanceof Date ? updatedAt : new Date(updatedAt);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function BriefEditorClient({
  dossierId,
  brief,
}: BriefEditorClientProps) {
  const [title, setTitle] = useState(brief.title);
  const [body, setBody] = useState(brief.body_markdown ?? "");
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [savedAt, setSavedAt] = useState<Date | string | null>(brief.updated_at);
  const [error, setError] = useState<string | null>(null);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Track whether the current state has been persisted.
  const lastPersistedRef = useRef<{ title: string; body: string }>({
    title: brief.title,
    body: brief.body_markdown ?? "",
  });

  const outline = useMemo(() => parseOutline(body), [body]);

  const persist = useCallback(
    async (nextTitle: string, nextBody: string) => {
      setStatus("saving");
      setError(null);
      const result = await saveBrief({
        dossierId,
        title: nextTitle,
        bodyMarkdown: nextBody,
      });

      if ("error" in result) {
        setStatus("error");
        setError(result.error);
        return;
      }

      lastPersistedRef.current = { title: nextTitle, body: nextBody };
      setSavedAt(result.updatedAt);
      setStatus((current) => (current === "saving" ? "saved" : current));
    },
    [dossierId],
  );

  // Debounced autosave: schedule a save whenever title/body drifts from the
  // last persisted snapshot. Any new edit cancels the pending write.
  useEffect(() => {
    const trimmedTitle = title.trim();
    const snapshot = lastPersistedRef.current;
    if (title === snapshot.title && body === snapshot.body) {
      return;
    }
    if (!trimmedTitle) {
      setStatus("error");
      setError("Brief title is required.");
      return;
    }

    setStatus("dirty");
    setError(null);
    const handle = window.setTimeout(() => {
      persist(trimmedTitle, body);
    }, AUTOSAVE_DELAY_MS);

    return () => window.clearTimeout(handle);
  }, [title, body, persist]);

  // Flush pending edits on unload so we don't lose the last few keystrokes.
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const snapshot = lastPersistedRef.current;
      if (title === snapshot.title && body === snapshot.body) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [title, body]);

  function scrollToHeading(heading: OutlineHeading) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.focus();
    textarea.setSelectionRange(heading.lineStart, heading.lineEnd);

    // Approximate scroll by line ratio.
    const totalLines = Math.max(body.split("\n").length, 1);
    const lineIndex = body.slice(0, heading.lineStart).split("\n").length - 1;
    const ratio = lineIndex / totalLines;
    textarea.scrollTop = ratio * textarea.scrollHeight;
  }

  const statusLabel = (() => {
    switch (status) {
      case "saving":
        return "Saving…";
      case "dirty":
        return "Unsaved changes";
      case "error":
        return error ?? "Save failed";
      case "saved":
      default: {
        const label = formatSavedLabel(savedAt);
        return label ? `Saved · ${label}` : "Saved";
      }
    }
  })();

  return (
    <div className="flex flex-1 min-h-0" style={{ overflow: "hidden" }}>
      {/* ── Outline rail ── */}
      <aside
        aria-label="Brief outline"
        className="hidden md:flex flex-col shrink-0"
        style={{
          width: "var(--space-rail-width)",
          borderRight: "var(--border-thin) solid var(--color-border)",
          backgroundColor: "var(--color-bg-rail)",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            padding: "0.875rem var(--space-gutter) 0.5rem",
            borderBottom: "var(--border-hairline) solid var(--color-border)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--color-ink-secondary)",
            }}
          >
            Outline
          </span>
        </div>
        {outline.length === 0 ? (
          <p
            className="max-w-none"
            style={{
              padding: "0.75rem var(--space-gutter)",
              fontFamily: "var(--font-sans)",
              fontSize: "0.8125rem",
              color: "var(--color-ink-secondary)",
              fontStyle: "italic",
              lineHeight: 1.5,
            }}
          >
            Add headings (e.g. “## Summary”) to build a section outline.
          </p>
        ) : (
          <ul
            className="list-none"
            style={{ padding: "0.5rem 0" }}
          >
            {outline.map((heading) => (
              <li key={heading.id}>
                <button
                  type="button"
                  onClick={() => scrollToHeading(heading)}
                  className="w-full text-left"
                  style={{
                    padding: "0.25rem var(--space-gutter)",
                    paddingLeft: `calc(var(--space-gutter) + ${(heading.depth - 1) * 0.75}rem)`,
                    fontFamily: "var(--font-sans)",
                    fontSize:
                      heading.depth === 1
                        ? "0.875rem"
                        : heading.depth === 2
                          ? "0.8125rem"
                          : "0.75rem",
                    fontWeight: heading.depth === 1 ? 500 : 400,
                    color:
                      heading.depth <= 2
                        ? "var(--color-ink-primary)"
                        : "var(--color-ink-secondary)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    lineHeight: 1.45,
                  }}
                >
                  {heading.text}
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* ── Writing column ── */}
      <section
        className="flex-1 min-w-0 flex flex-col"
        style={{ overflowY: "auto" }}
      >
        <header
          className="flex items-center justify-between"
          style={{
            padding: "0.75rem var(--space-gutter)",
            borderBottom: "var(--border-hairline) solid var(--color-border)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--color-ink-secondary)",
            }}
          >
            Brief · Draft
          </span>
          <span
            role="status"
            aria-live="polite"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              color:
                status === "error"
                  ? "var(--color-accent-alert)"
                  : "var(--color-ink-secondary)",
            }}
          >
            {statusLabel}
          </span>
        </header>

        <div
          className="w-full mx-auto flex-1 flex flex-col"
          style={{
            maxWidth: "40rem",
            padding: "3rem 1.5rem 4rem",
            gap: "1.25rem",
          }}
        >
          <label className="block">
            <span className="sr-only">Brief title</span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Untitled brief"
              aria-label="Brief title"
              style={{
                width: "100%",
                fontFamily: "var(--font-display)",
                fontSize: "2rem",
                fontWeight: 600,
                letterSpacing: "-0.015em",
                lineHeight: 1.2,
                color: "var(--color-ink-primary)",
                background: "transparent",
                border: "none",
                outline: "none",
                padding: 0,
              }}
            />
          </label>

          <label className="flex-1 flex flex-col">
            <span className="sr-only">Brief body</span>
            <textarea
              ref={textareaRef}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={
                "Start drafting. Use Markdown — headings (##), lists, and inline citations live here.\n\nLater you’ll pull supporting evidence from the drawer on the right."
              }
              aria-label="Brief body"
              spellCheck
              style={{
                flex: 1,
                minHeight: "28rem",
                width: "100%",
                resize: "none",
                fontFamily: "var(--font-sans)",
                fontSize: "1rem",
                lineHeight: 1.75,
                color: "var(--color-ink-primary)",
                background: "transparent",
                border: "none",
                outline: "none",
                padding: 0,
              }}
            />
          </label>
        </div>
      </section>

      {/* ── Evidence drawer shell (populated by DOS-022) ── */}
      <aside
        aria-label="Evidence drawer"
        className="hidden lg:flex flex-col shrink-0"
        style={{
          width: isEvidenceOpen ? "20rem" : "2.25rem",
          borderLeft: "var(--border-thin) solid var(--color-border)",
          backgroundColor: "var(--color-bg-panel)",
          transition: "width var(--duration-base) ease",
          overflow: "hidden",
        }}
      >
        <div
          className="flex items-center shrink-0"
          style={{
            padding: "0.75rem",
            borderBottom: "var(--border-hairline) solid var(--color-border)",
            justifyContent: isEvidenceOpen ? "space-between" : "center",
            gap: "0.5rem",
          }}
        >
          {isEvidenceOpen && (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.6875rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--color-ink-secondary)",
              }}
            >
              Evidence
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsEvidenceOpen((open) => !open)}
            aria-expanded={isEvidenceOpen}
            aria-label={
              isEvidenceOpen ? "Collapse evidence drawer" : "Expand evidence drawer"
            }
            className="btn btn-ghost"
            style={{
              padding: "0.125rem 0.375rem",
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
            }}
          >
            {isEvidenceOpen ? "›" : "‹"}
          </button>
        </div>

        {isEvidenceOpen && (
          <div
            style={{
              padding: "1rem",
              color: "var(--color-ink-secondary)",
              fontFamily: "var(--font-sans)",
              fontSize: "0.8125rem",
              lineHeight: 1.55,
            }}
          >
            <p className="max-w-none" style={{ marginBottom: "0.75rem" }}>
              Highlights and claims from this dossier will appear here so you
              can pull them into the brief as citations.
            </p>
            <p
              className="max-w-none"
              style={{
                fontStyle: "italic",
                color: "var(--color-ink-secondary)",
                opacity: 0.8,
              }}
            >
              Evidence insertion ships in the next update.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
