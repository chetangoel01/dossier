import type { CSSProperties } from "react";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  /** Override border radius — defaults to token --radius-sm */
  radius?: string;
  /** Optional extra classes */
  className?: string;
  style?: CSSProperties;
}

/**
 * Skeleton — subtle breathing placeholder block.
 *
 * Uses a gentle opacity pulse (no shimmer sweep). Respects reduced motion.
 */
export function Skeleton({
  width = "100%",
  height = "1rem",
  radius,
  className = "",
  style,
}: SkeletonProps) {
  return (
    <span
      aria-hidden
      className={`skeleton ${className}`.trim()}
      style={{
        display: "block",
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
    />
  );
}

interface SkeletonPanelProps {
  /** Number of line rows to render inside the panel */
  lines?: number;
  /** Add a taller head row (e.g. title) */
  heading?: boolean;
  compact?: boolean;
}

export function SkeletonPanel({
  lines = 3,
  heading = true,
  compact = false,
}: SkeletonPanelProps) {
  return (
    <div
      className="panel"
      style={{
        padding: compact ? "1rem 1.125rem" : "1.25rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.625rem",
      }}
    >
      {heading && <Skeleton width="40%" height="0.875rem" />}
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? "60%" : "100%"}
          height="0.75rem"
        />
      ))}
    </div>
  );
}
