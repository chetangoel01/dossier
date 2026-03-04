import type { ReactNode } from "react";

interface SectionFrameProps {
  children: ReactNode;
  /** Optional section heading displayed above the content area */
  heading?: string;
  /** Reduce horizontal padding for denser layouts */
  compact?: boolean;
  className?: string;
}

/**
 * SectionFrame — consistent page content framing primitive.
 *
 * Wraps content in a padded, max-width-constrained container that respects
 * the editorial grid. Use for all major page sections and route content areas.
 */
export function SectionFrame({
  children,
  heading,
  compact = false,
  className = "",
}: SectionFrameProps) {
  return (
    <section
      className={className}
      style={{
        width: "100%",
        maxWidth: "var(--space-content-max)",
        marginInline: "auto",
        paddingInline: compact ? "1rem" : "var(--space-gutter)",
        paddingBlock: compact ? "1rem" : "2rem",
      }}
    >
      {heading && (
        <header
          style={{
            marginBottom: "1.5rem",
            paddingBottom: "0.75rem",
            borderBottom: "var(--border-thin) solid var(--color-border)",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.25rem",
              fontWeight: 600,
              color: "var(--color-ink-primary)",
            }}
          >
            {heading}
          </h2>
        </header>
      )}
      {children}
    </section>
  );
}
