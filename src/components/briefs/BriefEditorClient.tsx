"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { saveBrief } from "@/server/actions/briefs";
import type {
  BriefEvidenceHighlight,
  BriefEvidenceSource,
} from "@/server/queries/briefs";
import {
  buildCitationHref,
  buildCitationToken,
  formatHighlightAnchor,
  formatSourceShortCode,
  segmentCitations,
  type CitationRef,
} from "@/lib/citations";
import { CitationToken } from "./CitationToken";

interface BriefSnapshot {
  title: string;
  body_markdown: string | null;
  updated_at: Date | string;
}

interface BriefEditorClientProps {
  dossierId: string;
  brief: BriefSnapshot;
  evidence: BriefEvidenceSource[];
}

interface OutlineHeading {
  id: string;
  depth: number;
  text: string;
  lineStart: number;
  lineEnd: number;
}

type SaveStatus = "saved" | "dirty" | "saving" | "error";
type ViewMode = "edit" | "preview";
type DrawerTab = "highlights" | "sources";

const AUTOSAVE_DELAY_MS = 800;

const HIGHLIGHT_LABEL_NAMES: Record<BriefEvidenceHighlight["label"], string> = {
  evidence: "Evidence",
  question: "Question",
  counterpoint: "Counterpoint",
  stat: "Stat",
  quote: "Quote",
};

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

function truncate(text: string, max: number): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

export function BriefEditorClient({
  dossierId,
  brief,
  evidence,
}: BriefEditorClientProps) {
  const [title, setTitle] = useState(brief.title);
  const [body, setBody] = useState(brief.body_markdown ?? "");
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [savedAt, setSavedAt] = useState<Date | string | null>(brief.updated_at);
  const [error, setError] = useState<string | null>(null);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(true);
  const [mode, setMode] = useState<ViewMode>("edit");
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("highlights");
  const [drawerQuery, setDrawerQuery] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Track the caret so we can insert at the user's last known cursor even
  // when the textarea isn't focused (e.g. after clicking a drawer item).
  const caretRef = useRef<number>((brief.body_markdown ?? "").length);

  // Track whether the current state has been persisted.
  const lastPersistedRef = useRef<{ title: string; body: string }>({
    title: brief.title,
    body: brief.body_markdown ?? "",
  });

  const outline = useMemo(() => parseOutline(body), [body]);

  // Fast id→source lookup for rendering citations in preview mode and for
  // resolving highlight → source navigation.
  const sourceIndex = useMemo(() => {
    const map = new Map<string, BriefEvidenceSource>();
    for (const source of evidence) map.set(source.id, source);
    return map;
  }, [evidence]);

  const highlightIndex = useMemo(() => {
    const map = new Map<
      string,
      { highlight: BriefEvidenceHighlight; source: BriefEvidenceSource }
    >();
    for (const source of evidence) {
      for (const highlight of source.highlights) {
        map.set(highlight.id, { highlight, source });
      }
    }
    return map;
  }, [evidence]);

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

  const insertCitation = useCallback(
    (ref: CitationRef) => {
      const token = buildCitationToken(ref);
      setMode("edit");

      setBody((current) => {
        const caret = Math.min(
          Math.max(caretRef.current, 0),
          current.length,
        );
        // Pad with a space so the chip doesn't fuse into adjacent text.
        const prefix = current.slice(0, caret);
        const suffix = current.slice(caret);
        const needsLeadingSpace =
          prefix.length > 0 && !/\s$/.test(prefix);
        const needsTrailingSpace =
          suffix.length > 0 && !/^\s/.test(suffix);
        const insertion =
          (needsLeadingSpace ? " " : "") +
          token +
          (needsTrailingSpace ? " " : "");
        const nextBody = prefix + insertion + suffix;
        const nextCaret = prefix.length + insertion.length;
        caretRef.current = nextCaret;

        // Restore focus and caret position to the textarea after React commits.
        requestAnimationFrame(() => {
          const textarea = textareaRef.current;
          if (!textarea) return;
          textarea.focus();
          textarea.setSelectionRange(nextCaret, nextCaret);
        });

        return nextBody;
      });
    },
    [],
  );

  const filteredEvidence = useMemo(() => {
    const q = drawerQuery.trim().toLowerCase();
    if (!q) return evidence;
    return evidence
      .map((source) => {
        const titleMatches = source.title.toLowerCase().includes(q);
        const matchedHighlights = source.highlights.filter((highlight) => {
          const haystack = `${highlight.quote_text} ${
            highlight.annotation ?? ""
          }`.toLowerCase();
          return haystack.includes(q);
        });
        if (titleMatches) {
          return source;
        }
        if (matchedHighlights.length > 0) {
          return { ...source, highlights: matchedHighlights };
        }
        return null;
      })
      .filter((source): source is BriefEvidenceSource => source !== null);
  }, [evidence, drawerQuery]);

  const highlightCount = useMemo(
    () => evidence.reduce((sum, source) => sum + source.highlights.length, 0),
    [evidence],
  );

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
          <ul className="list-none" style={{ padding: "0.5rem 0" }}>
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
            gap: "0.75rem",
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
            Brief · {mode === "edit" ? "Draft" : "Preview"}
          </span>
          <div className="flex items-center" style={{ gap: "0.75rem" }}>
            <div
              role="tablist"
              aria-label="Brief view mode"
              className="flex"
              style={{
                border: "var(--border-thin) solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                overflow: "hidden",
              }}
            >
              {(["edit", "preview"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={mode === value}
                  onClick={() => setMode(value)}
                  style={{
                    padding: "0.25rem 0.625rem",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6875rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    border: "none",
                    cursor: "pointer",
                    backgroundColor:
                      mode === value
                        ? "var(--color-bg-selected)"
                        : "transparent",
                    color:
                      mode === value
                        ? "var(--color-ink-primary)"
                        : "var(--color-ink-secondary)",
                  }}
                >
                  {value === "edit" ? "Edit" : "Preview"}
                </button>
              ))}
            </div>
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
          </div>
        </header>

        <div
          className="w-full mx-auto flex-1 flex flex-col"
          style={{
            maxWidth: "40rem",
            padding: "3rem 1.5rem 4rem",
            gap: "1.25rem",
          }}
        >
          {mode === "edit" ? (
            <>
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
                  onChange={(event) => {
                    setBody(event.target.value);
                    caretRef.current = event.target.selectionStart;
                  }}
                  onSelect={(event) => {
                    caretRef.current = event.currentTarget.selectionStart;
                  }}
                  onKeyUp={(event) => {
                    caretRef.current = event.currentTarget.selectionStart;
                  }}
                  onBlur={(event) => {
                    caretRef.current = event.currentTarget.selectionStart;
                  }}
                  placeholder={
                    "Start drafting. Use Markdown — headings (##), lists, and inline citations live here.\n\nPull supporting evidence from the drawer on the right to drop citations at the cursor."
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
            </>
          ) : (
            <BriefPreview
              title={title}
              body={body}
              dossierId={dossierId}
              sourceIndex={sourceIndex}
              highlightIndex={highlightIndex}
            />
          )}
        </div>
      </section>

      {/* ── Evidence drawer ── */}
      <aside
        aria-label="Evidence drawer"
        className="hidden lg:flex flex-col shrink-0"
        style={{
          width: isEvidenceOpen ? "22rem" : "2.25rem",
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
              isEvidenceOpen
                ? "Collapse evidence drawer"
                : "Expand evidence drawer"
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
          <div className="flex flex-col min-h-0" style={{ flex: 1 }}>
            <div
              role="tablist"
              aria-label="Evidence drawer filter"
              className="flex shrink-0"
              style={{
                borderBottom:
                  "var(--border-hairline) solid var(--color-border)",
              }}
            >
              <DrawerTabButton
                label={`Highlights · ${highlightCount}`}
                active={drawerTab === "highlights"}
                onClick={() => setDrawerTab("highlights")}
              />
              <DrawerTabButton
                label={`Sources · ${evidence.length}`}
                active={drawerTab === "sources"}
                onClick={() => setDrawerTab("sources")}
              />
            </div>

            <div
              className="shrink-0"
              style={{
                padding: "0.5rem 0.75rem",
                borderBottom:
                  "var(--border-hairline) solid var(--color-border)",
              }}
            >
              <input
                type="search"
                value={drawerQuery}
                onChange={(event) => setDrawerQuery(event.target.value)}
                placeholder={
                  drawerTab === "highlights"
                    ? "Filter highlights"
                    : "Filter sources"
                }
                aria-label="Filter evidence"
                className="input"
                style={{ fontSize: "0.8125rem" }}
              />
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "0.25rem 0",
              }}
            >
              {evidence.length === 0 ? (
                <DrawerEmptyState
                  message="No sources in this dossier yet. Capture a source to pull evidence into the brief."
                />
              ) : filteredEvidence.length === 0 ? (
                <DrawerEmptyState message="No matches for that filter." />
              ) : drawerTab === "highlights" ? (
                <HighlightList
                  sources={filteredEvidence}
                  onInsert={insertCitation}
                />
              ) : (
                <SourceList
                  sources={filteredEvidence}
                  onInsert={insertCitation}
                />
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

function DrawerTabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        flex: 1,
        padding: "0.5rem 0.75rem",
        fontFamily: "var(--font-mono)",
        fontSize: "0.6875rem",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: active
          ? "var(--color-ink-primary)"
          : "var(--color-ink-secondary)",
        backgroundColor: active
          ? "var(--color-bg-selected)"
          : "transparent",
        border: "none",
        cursor: "pointer",
        borderBottom: active
          ? "2px solid var(--color-accent-ink)"
          : "2px solid transparent",
      }}
    >
      {label}
    </button>
  );
}

function DrawerEmptyState({ message }: { message: string }) {
  return (
    <p
      className="max-w-none"
      style={{
        padding: "1rem 0.875rem",
        fontFamily: "var(--font-sans)",
        fontSize: "0.8125rem",
        color: "var(--color-ink-secondary)",
        fontStyle: "italic",
        lineHeight: 1.5,
      }}
    >
      {message}
    </p>
  );
}

function HighlightList({
  sources,
  onInsert,
}: {
  sources: BriefEvidenceSource[];
  onInsert: (ref: CitationRef) => void;
}) {
  const withHighlights = sources.filter(
    (source) => source.highlights.length > 0,
  );
  if (withHighlights.length === 0) {
    return (
      <DrawerEmptyState message="No highlights captured yet. Highlight text in a source to reuse it here." />
    );
  }

  return (
    <ul className="list-none" style={{ margin: 0, padding: 0 }}>
      {withHighlights.map((source) => (
        <li key={source.id}>
          <div
            style={{
              padding: "0.5rem 0.875rem 0.25rem",
              display: "flex",
              alignItems: "baseline",
              gap: "0.5rem",
            }}
          >
            <span className="chip" style={{ flexShrink: 0 }}>
              {formatSourceShortCode(source)}
            </span>
            <span
              title={source.title}
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.8125rem",
                fontWeight: 500,
                color: "var(--color-ink-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {source.title}
            </span>
          </div>
          <ul className="list-none" style={{ margin: 0, padding: 0 }}>
            {source.highlights.map((highlight) => (
              <li key={highlight.id}>
                <HighlightDrawerItem
                  source={source}
                  highlight={highlight}
                  onInsert={onInsert}
                />
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

function HighlightDrawerItem({
  source,
  highlight,
  onInsert,
}: {
  source: BriefEvidenceSource;
  highlight: BriefEvidenceHighlight;
  onInsert: (ref: CitationRef) => void;
}) {
  const anchor = formatHighlightAnchor(highlight);
  const labelName = HIGHLIGHT_LABEL_NAMES[highlight.label] ?? highlight.label;

  return (
    <div
      style={{
        padding: "0.375rem 0.875rem 0.625rem",
        borderBottom: "var(--border-hairline) solid var(--color-border)",
      }}
    >
      <blockquote
        style={{
          margin: 0,
          paddingLeft: "0.625rem",
          borderLeft: "var(--border-rule) solid var(--color-accent-ink)",
          fontFamily: "var(--font-sans)",
          fontSize: "0.8125rem",
          lineHeight: 1.55,
          color: "var(--color-ink-primary)",
        }}
      >
        {truncate(highlight.quote_text, 180)}
      </blockquote>
      {highlight.annotation ? (
        <p
          className="max-w-none"
          style={{
            marginTop: "0.25rem",
            paddingLeft: "0.625rem",
            fontFamily: "var(--font-sans)",
            fontSize: "0.75rem",
            color: "var(--color-ink-secondary)",
            fontStyle: "italic",
            lineHeight: 1.45,
          }}
        >
          {truncate(highlight.annotation, 160)}
        </p>
      ) : null}
      <div
        className="flex items-center"
        style={{
          marginTop: "0.5rem",
          gap: "0.5rem",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6875rem",
            color: "var(--color-ink-secondary)",
            letterSpacing: "0.02em",
          }}
        >
          {labelName} · {anchor}
        </span>
        <button
          type="button"
          onClick={() =>
            onInsert({ kind: "highlight", id: highlight.id })
          }
          className="btn btn-ghost"
          aria-label={`Insert citation for ${source.title}, ${anchor}`}
          style={{
            padding: "0.125rem 0.5rem",
            fontFamily: "var(--font-mono)",
            fontSize: "0.6875rem",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Insert
        </button>
      </div>
    </div>
  );
}

function SourceList({
  sources,
  onInsert,
}: {
  sources: BriefEvidenceSource[];
  onInsert: (ref: CitationRef) => void;
}) {
  return (
    <ul className="list-none" style={{ margin: 0, padding: 0 }}>
      {sources.map((source) => (
        <li
          key={source.id}
          style={{
            padding: "0.625rem 0.875rem",
            borderBottom: "var(--border-hairline) solid var(--color-border)",
          }}
        >
          <div
            className="flex items-baseline"
            style={{ gap: "0.5rem" }}
          >
            <span className="chip" style={{ flexShrink: 0 }}>
              {formatSourceShortCode(source)}
            </span>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "var(--color-ink-primary)",
                lineHeight: 1.4,
              }}
            >
              {source.title}
            </span>
          </div>
          {source.author || source.publisher ? (
            <p
              className="max-w-none"
              style={{
                marginTop: "0.125rem",
                fontFamily: "var(--font-sans)",
                fontSize: "0.75rem",
                color: "var(--color-ink-secondary)",
              }}
            >
              {[source.author, source.publisher].filter(Boolean).join(" · ")}
            </p>
          ) : null}
          <div
            className="flex items-center"
            style={{
              marginTop: "0.375rem",
              gap: "0.5rem",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.6875rem",
                color: "var(--color-ink-secondary)",
              }}
            >
              {source.highlights.length} highlight
              {source.highlights.length === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              onClick={() => onInsert({ kind: "source", id: source.id })}
              className="btn btn-ghost"
              aria-label={`Insert citation for ${source.title}`}
              style={{
                padding: "0.125rem 0.5rem",
                fontFamily: "var(--font-mono)",
                fontSize: "0.6875rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Insert
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function BriefPreview({
  title,
  body,
  dossierId,
  sourceIndex,
  highlightIndex,
}: {
  title: string;
  body: string;
  dossierId: string;
  sourceIndex: Map<string, BriefEvidenceSource>;
  highlightIndex: Map<
    string,
    { highlight: BriefEvidenceHighlight; source: BriefEvidenceSource }
  >;
}) {
  const segments = useMemo(() => segmentCitations(body), [body]);
  const displayTitle = title.trim() || "Untitled brief";

  return (
    <article className="flex-1 flex flex-col" aria-label="Brief preview">
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "2rem",
          fontWeight: 600,
          letterSpacing: "-0.015em",
          lineHeight: 1.2,
          color: "var(--color-ink-primary)",
          marginBottom: "1.25rem",
        }}
      >
        {displayTitle}
      </h1>

      {body.trim() === "" ? (
        <p
          className="max-w-none"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "0.9375rem",
            color: "var(--color-ink-secondary)",
            fontStyle: "italic",
            lineHeight: 1.55,
          }}
        >
          Nothing to preview yet. Switch back to Edit to start drafting.
        </p>
      ) : (
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "1rem",
            lineHeight: 1.75,
            color: "var(--color-ink-primary)",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {segments.map((segment, index) => {
            if (segment.type === "text") {
              return <span key={index}>{segment.text}</span>;
            }
            return (
              <CitationChipForRef
                key={index}
                ref_={segment.ref}
                raw={segment.raw}
                dossierId={dossierId}
                sourceIndex={sourceIndex}
                highlightIndex={highlightIndex}
              />
            );
          })}
        </div>
      )}
    </article>
  );
}

function CitationChipForRef({
  ref_,
  raw,
  dossierId,
  sourceIndex,
  highlightIndex,
}: {
  ref_: CitationRef;
  raw: string;
  dossierId: string;
  sourceIndex: Map<string, BriefEvidenceSource>;
  highlightIndex: Map<
    string,
    { highlight: BriefEvidenceHighlight; source: BriefEvidenceSource }
  >;
}) {
  if (ref_.kind === "highlight") {
    const entry = highlightIndex.get(ref_.id);
    if (!entry) {
      return (
        <CitationToken
          label="missing"
          title={`Citation references a removed highlight (${raw}).`}
        />
      );
    }
    return (
      <CitationToken
        label={formatSourceShortCode(entry.source)}
        anchor={formatHighlightAnchor(entry.highlight)}
        href={buildCitationHref(dossierId, ref_, {
          highlightSourceId: entry.source.id,
        })}
        title={`${entry.source.title} — “${truncate(
          entry.highlight.quote_text,
          120,
        )}”`}
      />
    );
  }

  const source = sourceIndex.get(ref_.id);
  if (!source) {
    return (
      <CitationToken
        label="missing"
        title={`Citation references a removed source (${raw}).`}
      />
    );
  }
  return (
    <CitationToken
      label={formatSourceShortCode(source)}
      href={buildCitationHref(dossierId, ref_)}
      title={source.title}
    />
  );
}
