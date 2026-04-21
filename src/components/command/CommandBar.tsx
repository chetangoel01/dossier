"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { DossierCommandContext } from "./CommandBarProvider";
import type {
  SearchObjectType,
  SearchResultBase,
  SearchResults,
} from "@/server/queries/search";

interface CommandBarProps {
  open: boolean;
  onClose: () => void;
  dossier: DossierCommandContext | null;
}

type CommandIcon = "new" | "add" | "search" | "jump" | "toggle";

interface CommandAction {
  id: string;
  label: string;
  hint?: string;
  shortcut?: string;
  group: "Actions" | "Navigate" | "Workspace";
  icon: CommandIcon;
  run: () => void;
}

type CommandItem =
  | { kind: "action"; action: CommandAction }
  | { kind: "result"; result: SearchResultBase };

const TAB_SLUGS = [
  { label: "Overview", slug: "overview" },
  { label: "Sources", slug: "sources" },
  { label: "Claims", slug: "claims" },
  { label: "Entities", slug: "entities" },
  { label: "Timeline", slug: "timeline" },
  { label: "Brief", slug: "brief" },
  { label: "Activity", slug: "activity" },
] as const;

const TYPE_LABEL: Record<SearchObjectType, string> = {
  dossier: "Dossier",
  source: "Source",
  highlight: "Highlight",
  claim: "Claim",
  entity: "Entity",
  brief: "Brief",
};

export function CommandBar({ open, onClose, dossier }: CommandBarProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);

  // Reset state each time we open
  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setResults(null);
      // Defer focus until dialog is rendered
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const runAndClose = useCallback(
    (fn: () => void) => {
      fn();
      onClose();
    },
    [onClose],
  );

  const actions = useMemo<CommandAction[]>(() => {
    const out: CommandAction[] = [];

    out.push({
      id: "new-dossier",
      label: "New dossier",
      hint: "Create a research workspace",
      group: "Actions",
      icon: "new",
      run: () => runAndClose(() => router.push("/dossiers?new=1")),
    });

    if (dossier) {
      out.push({
        id: "add-source",
        label: "Add source",
        hint: `Capture a URL, file, or note in ${dossier.title}`,
        group: "Actions",
        icon: "add",
        run: () =>
          runAndClose(() =>
            router.push(`/dossiers/${dossier.id}/sources?capture=1`),
          ),
      });

      for (const tab of TAB_SLUGS) {
        out.push({
          id: `tab-${tab.slug}`,
          label: `Go to ${tab.label}`,
          hint: dossier.title,
          group: "Navigate",
          icon: "jump",
          run: () =>
            runAndClose(() =>
              router.push(`/dossiers/${dossier.id}/${tab.slug}`),
            ),
        });
      }

      out.push({
        id: "toggle-inspector",
        label: "Toggle inspector",
        hint: "Show or hide the evidence inspector",
        shortcut: "\\",
        group: "Workspace",
        icon: "toggle",
        run: () =>
          runAndClose(() => {
            window.dispatchEvent(new CustomEvent("dossier:toggle-inspector"));
          }),
      });
    }

    out.push({
      id: "jump-dossiers",
      label: "Go to Dossiers",
      hint: "All dossiers",
      group: "Navigate",
      icon: "jump",
      run: () => runAndClose(() => router.push("/dossiers")),
    });

    return out;
  }, [dossier, router, runAndClose]);

  // Fetch search results when the query looks substantive
  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults(null);
      setResultsLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    setResultsLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: trimmed });
        if (dossier) params.set("dossierId", dossier.id);
        const res = await fetch(`/api/search?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          if (!cancelled) setResults(null);
          return;
        }
        const data = (await res.json()) as SearchResults;
        if (!cancelled) setResults(data);
      } catch (err) {
        if ((err as Error).name !== "AbortError" && !cancelled) {
          setResults(null);
        }
      } finally {
        if (!cancelled) setResultsLoading(false);
      }
    }, 140);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, open, dossier]);

  const filteredActions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter((a) => {
      const hay = `${a.label} ${a.hint ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [actions, query]);

  const flatResults = useMemo<SearchResultBase[]>(() => {
    if (!results) return [];
    return (Object.values(results.groups).flat() as SearchResultBase[])
      .slice()
      .sort((a, b) => b.rank - a.rank)
      .slice(0, 8);
  }, [results]);

  const items = useMemo<CommandItem[]>(() => {
    const list: CommandItem[] = filteredActions.map((action) => ({
      kind: "action" as const,
      action,
    }));

    // Always offer "Search all dossiers" as a jump when the user types something
    const trimmed = query.trim();
    if (trimmed.length > 0) {
      list.push({
        kind: "action",
        action: {
          id: "run-search",
          label: `Search for “${trimmed}”`,
          hint: dossier
            ? `Across ${dossier.title}`
            : "Across all dossiers",
          group: "Actions",
          icon: "search",
          run: () => {
            const params = new URLSearchParams({ q: trimmed });
            if (dossier) params.set("dossierId", dossier.id);
            runAndClose(() => router.push(`/search?${params.toString()}`));
          },
        },
      });
    }

    for (const r of flatResults) {
      list.push({ kind: "result", result: r });
    }

    return list;
  }, [filteredActions, flatResults, query, dossier, router, runAndClose]);

  // Clamp the active index when the list changes
  useEffect(() => {
    setActive((prev) => {
      if (items.length === 0) return 0;
      if (prev >= items.length) return items.length - 1;
      return prev;
    });
  }, [items.length]);

  // Keep the active item scrolled into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const node = list.querySelector<HTMLElement>(
      `[data-command-index="${active}"]`,
    );
    node?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((prev) =>
        items.length === 0 ? 0 : (prev + 1) % items.length,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((prev) =>
        items.length === 0 ? 0 : (prev - 1 + items.length) % items.length,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      runItem(items[active]);
    }
  }

  const runItem = useCallback(
    (item: CommandItem | undefined) => {
      if (!item) return;
      if (item.kind === "action") {
        item.action.run();
      } else {
        runAndClose(() => router.push(item.result.href));
      }
    },
    [router, runAndClose],
  );

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command bar"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        backgroundColor: "rgba(31, 41, 51, 0.28)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "14vh",
        paddingInline: "1rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(640px, 100%)",
          backgroundColor: "var(--color-bg-command)",
          backdropFilter: "blur(18px) saturate(1.1)",
          WebkitBackdropFilter: "blur(18px) saturate(1.1)",
          border: "var(--border-thin) solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-float)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            padding: "0.875rem 1rem",
            borderBottom: "var(--border-thin) solid var(--color-border)",
          }}
        >
          <span
            aria-hidden
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.8125rem",
              color: "var(--color-ink-secondary)",
            }}
          >
            ⌕
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={
              dossier
                ? `Search or run a command in ${dossier.title}…`
                : "Search or run a command…"
            }
            aria-label="Command bar input"
            autoComplete="off"
            spellCheck={false}
            style={{
              flex: 1,
              padding: "0.25rem 0",
              fontFamily: "var(--font-sans)",
              fontSize: "0.9375rem",
              color: "var(--color-ink-primary)",
              background: "transparent",
              border: "none",
              outline: "none",
            }}
          />
          <kbd
            aria-hidden
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              color: "var(--color-ink-secondary)",
              border: "var(--border-hairline) solid var(--color-border)",
              borderRadius: "var(--radius-xs)",
              padding: "0.0625rem 0.375rem",
              backgroundColor: "var(--color-bg-selected)",
            }}
          >
            esc
          </kbd>
        </div>

        <div
          ref={listRef}
          role="listbox"
          style={{ maxHeight: "50vh", overflowY: "auto", padding: "0.375rem 0" }}
        >
          {items.length === 0 ? (
            <EmptyState query={query} />
          ) : (
            <CommandList
              items={items}
              active={active}
              onHover={setActive}
              onRun={runItem}
            />
          )}

          {resultsLoading && (
            <div
              style={{
                padding: "0.5rem 1rem 0.75rem",
                fontFamily: "var(--font-mono)",
                fontSize: "0.6875rem",
                color: "var(--color-ink-secondary)",
              }}
            >
              Searching…
            </div>
          )}
        </div>

        <Footer />
      </div>
    </div>
  );
}

function CommandList({
  items,
  active,
  onHover,
  onRun,
}: {
  items: CommandItem[];
  active: number;
  onHover: (i: number) => void;
  onRun: (item: CommandItem) => void;
}) {
  let lastGroup: string | null = null;
  return (
    <>
      {items.map((item, i) => {
        const group =
          item.kind === "action" ? item.action.group : "Results";
        const showHeader = group !== lastGroup;
        lastGroup = group;
        return (
          <div key={itemKey(item, i)}>
            {showHeader && <GroupHeader label={group} />}
            <CommandRow
              item={item}
              index={i}
              isActive={i === active}
              onHover={onHover}
              onRun={onRun}
            />
          </div>
        );
      })}
    </>
  );
}

function itemKey(item: CommandItem, i: number) {
  if (item.kind === "action") return `a:${item.action.id}`;
  return `r:${item.result.type}:${item.result.id}:${i}`;
}

function GroupHeader({ label }: { label: string }) {
  return (
    <div
      style={{
        padding: "0.5rem 1rem 0.25rem",
        fontFamily: "var(--font-mono)",
        fontSize: "0.6875rem",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: "var(--color-ink-secondary)",
      }}
    >
      {label}
    </div>
  );
}

function CommandRow({
  item,
  index,
  isActive,
  onHover,
  onRun,
}: {
  item: CommandItem;
  index: number;
  isActive: boolean;
  onHover: (i: number) => void;
  onRun: (item: CommandItem) => void;
}) {
  const label = item.kind === "action" ? item.action.label : item.result.title;
  const hint =
    item.kind === "action"
      ? item.action.hint
      : item.result.snippet ?? item.result.dossierTitle;
  const shortcut = item.kind === "action" ? item.action.shortcut : undefined;
  const tag =
    item.kind === "action"
      ? iconGlyph(item.action.icon)
      : TYPE_LABEL[item.result.type];

  return (
    <button
      type="button"
      role="option"
      aria-selected={isActive}
      data-command-index={index}
      onMouseEnter={() => onHover(index)}
      onClick={() => onRun(item)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        width: "100%",
        padding: "0.5rem 1rem",
        background: isActive ? "var(--color-bg-selected)" : "transparent",
        border: "none",
        borderLeft: isActive
          ? "var(--border-rule) solid var(--color-accent-ink)"
          : "var(--border-rule) solid transparent",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "var(--font-sans)",
        color: "var(--color-ink-primary)",
      }}
    >
      <span
        aria-hidden
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.625rem",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--color-ink-secondary)",
          minWidth: "4.5rem",
        }}
      >
        {tag}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: "block",
            fontSize: "0.875rem",
            color: "var(--color-ink-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
        {hint && (
          <span
            style={{
              display: "block",
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              color: "var(--color-ink-secondary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              marginTop: "0.125rem",
            }}
          >
            {hint}
          </span>
        )}
      </span>
      {shortcut && (
        <kbd
          aria-hidden
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6875rem",
            color: "var(--color-ink-secondary)",
            border: "var(--border-hairline) solid var(--color-border)",
            borderRadius: "var(--radius-xs)",
            padding: "0.0625rem 0.375rem",
            backgroundColor: "var(--color-bg-panel)",
          }}
        >
          {shortcut}
        </kbd>
      )}
    </button>
  );
}

function iconGlyph(icon: CommandIcon): string {
  switch (icon) {
    case "new":
      return "New";
    case "add":
      return "Add";
    case "search":
      return "Search";
    case "jump":
      return "Go";
    case "toggle":
      return "View";
  }
}

function EmptyState({ query }: { query: string }) {
  const trimmed = query.trim();
  return (
    <div
      style={{
        padding: "1.25rem 1rem",
        fontFamily: "var(--font-mono)",
        fontSize: "0.75rem",
        color: "var(--color-ink-secondary)",
      }}
    >
      {trimmed.length === 0
        ? "Start typing to search or run a command."
        : `No commands or results for “${trimmed}”.`}
    </div>
  );
}

function Footer() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        padding: "0.5rem 1rem",
        borderTop: "var(--border-thin) solid var(--color-border)",
        fontFamily: "var(--font-mono)",
        fontSize: "0.6875rem",
        color: "var(--color-ink-secondary)",
        backgroundColor: "rgba(232, 225, 212, 0.5)",
      }}
    >
      <span>
        <FooterKey label="↵" /> select <FooterKey label="↑↓" /> navigate{" "}
        <FooterKey label="esc" /> close
      </span>
      <span>
        <FooterKey label="⌘K" /> toggle
      </span>
    </div>
  );
}

function FooterKey({ label }: { label: string }) {
  return (
    <kbd
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.6875rem",
        color: "var(--color-ink-secondary)",
        border: "var(--border-hairline) solid var(--color-border)",
        borderRadius: "var(--radius-xs)",
        padding: "0 0.3125rem",
        marginInline: "0.125rem",
        backgroundColor: "var(--color-bg-panel)",
      }}
    >
      {label}
    </kbd>
  );
}
