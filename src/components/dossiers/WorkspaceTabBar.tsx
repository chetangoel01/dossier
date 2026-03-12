"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Overview", slug: "overview" },
  { label: "Sources", slug: "sources" },
  { label: "Claims", slug: "claims" },
  { label: "Entities", slug: "entities" },
  { label: "Timeline", slug: "timeline" },
  { label: "Brief", slug: "brief" },
  { label: "Activity", slug: "activity" },
] as const;

interface WorkspaceTabBarProps {
  dossierId: string;
}

export function WorkspaceTabBar({ dossierId }: WorkspaceTabBarProps) {
  const pathname = usePathname();

  return (
    <nav
      role="tablist"
      aria-label="Dossier workspace tabs"
      style={{
        display: "flex",
        gap: 0,
        borderBottom: "var(--border-thin) solid var(--color-border)",
        backgroundColor: "var(--color-bg-panel)",
        paddingInline: "var(--space-gutter)",
        overflowX: "auto",
        scrollbarWidth: "none",
      }}
    >
      {TABS.map(({ label, slug }) => {
        const href = `/dossiers/${dossierId}/${slug}`;
        const isActive = pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={slug}
            href={href}
            role="tab"
            aria-selected={isActive}
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "0.625rem 1rem",
              fontFamily: "var(--font-sans)",
              fontSize: "0.875rem",
              fontWeight: isActive ? 500 : 400,
              color: isActive
                ? "var(--color-ink-primary)"
                : "var(--color-ink-secondary)",
              textDecoration: "none",
              borderBottom: isActive
                ? "var(--border-rule) solid var(--color-accent-ink)"
                : "var(--border-rule) solid transparent",
              marginBottom: "-1px",
              whiteSpace: "nowrap",
              transition: "color var(--duration-fast) ease, border-color var(--duration-fast) ease",
            }}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
