import Link from "next/link";

interface CitationTokenProps {
  label: string;
  anchor?: string | null;
  href?: string | null;
  title?: string;
  onNavigate?: () => void;
}

/**
 * Small mono chip with muted citation fill. Renders as a link back to the
 * evidence when an href is provided, or an inert span otherwise (for export
 * contexts or cases where the underlying record has been removed).
 */
export function CitationToken({
  label,
  anchor,
  href,
  title,
  onNavigate,
}: CitationTokenProps) {
  const content = (
    <>
      <span>{label}</span>
      {anchor ? (
        <>
          <span aria-hidden="true" style={{ opacity: 0.5 }}>
            ·
          </span>
          <span>{anchor}</span>
        </>
      ) : null}
    </>
  );

  const ariaLabel = anchor
    ? `Citation ${label}, ${anchor}`
    : `Citation ${label}`;

  if (href) {
    return (
      <Link
        href={href}
        onClick={onNavigate}
        className="chip chip-citation"
        aria-label={ariaLabel}
        title={title ?? ariaLabel}
        style={{
          cursor: "pointer",
          textDecoration: "none",
          verticalAlign: "baseline",
        }}
      >
        {content}
      </Link>
    );
  }

  return (
    <span
      className="chip chip-citation"
      aria-label={ariaLabel}
      title={title ?? ariaLabel}
      style={{ verticalAlign: "baseline" }}
    >
      {content}
    </span>
  );
}
