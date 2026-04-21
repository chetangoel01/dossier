"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface GlobalSearchBarProps {
  dossierId?: string;
  initialQuery?: string;
  placeholder?: string;
}

export function GlobalSearchBar({
  dossierId,
  initialQuery = "",
  placeholder,
}: GlobalSearchBarProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);

  useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const query = value.trim();
    if (!query) return;

    const params = new URLSearchParams({ q: query });
    if (dossierId) {
      params.set("dossierId", dossierId);
    }
    router.push(`/search?${params.toString()}`);
  }

  const resolvedPlaceholder =
    placeholder ??
    (dossierId
      ? "Search this dossier…"
      : "Search dossiers, sources, claims…");

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className="flex items-center w-full"
      style={{ maxWidth: "32rem" }}
    >
      <div
        className="flex items-center w-full"
        style={{
          border: "var(--border-thin) solid var(--color-border)",
          borderRadius: "var(--radius-sm)",
          backgroundColor: "var(--color-bg-panel)",
          paddingInline: "0.625rem",
          gap: "0.5rem",
        }}
      >
        <span
          aria-hidden
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--color-ink-secondary)",
            letterSpacing: "0.04em",
          }}
        >
          ⌕
        </span>
        <input
          type="search"
          name="q"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={resolvedPlaceholder}
          aria-label="Search"
          autoComplete="off"
          spellCheck={false}
          style={{
            flex: 1,
            padding: "0.375rem 0",
            fontFamily: "var(--font-sans)",
            fontSize: "0.875rem",
            color: "var(--color-ink-primary)",
            background: "transparent",
            border: "none",
            outline: "none",
          }}
        />
        <span
          aria-hidden
          title="Open command bar"
          className="hidden sm:inline"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6875rem",
            color: "var(--color-ink-secondary)",
            border: "var(--border-hairline) solid var(--color-border)",
            borderRadius: "var(--radius-xs)",
            padding: "0.0625rem 0.3125rem",
            backgroundColor: "var(--color-bg-selected)",
          }}
        >
          ⌘K
        </span>
      </div>
    </form>
  );
}
