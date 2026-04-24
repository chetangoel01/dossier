import { Skeleton } from "@/components/ui/Skeleton";

export default function TimelineLoading() {
  return (
    <div
      className="w-full max-w-[760px] mx-auto py-8"
      style={{ paddingInline: "var(--space-gutter)" }}
    >
      <div className="flex items-baseline justify-between mb-6">
        <Skeleton width="6rem" height="1.25rem" />
        <Skeleton width="5rem" height="0.75rem" />
      </div>

      <ol
        className="relative pl-6"
        style={{
          listStyle: "none",
          borderLeft: "var(--border-rule) solid var(--color-border)",
          marginLeft: "0.4375rem",
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <li
            key={i}
            className="relative"
            style={{
              paddingBottom: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.375rem",
            }}
          >
            <span
              aria-hidden
              className="skeleton"
              style={{
                position: "absolute",
                top: "0.4375rem",
                left: "calc(-1 * var(--border-rule) - 5px)",
                width: "10px",
                height: "10px",
                borderRadius: "9999px",
                boxShadow: "0 0 0 3px var(--color-bg-canvas)",
              }}
            />
            <Skeleton width="5rem" height="0.625rem" />
            <Skeleton width="80%" height="1rem" />
            <Skeleton width="60%" height="0.75rem" />
          </li>
        ))}
      </ol>
    </div>
  );
}
