import { Skeleton } from "@/components/ui/Skeleton";

export default function BriefLoading() {
  return (
    <div
      className="flex-1 flex min-h-0"
      style={{ backgroundColor: "var(--color-bg-canvas)" }}
    >
      <aside
        className="shrink-0"
        style={{
          width: "14rem",
          borderRight: "var(--border-thin) solid var(--color-border)",
          padding: "0.875rem 1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        <Skeleton width="5rem" height="0.75rem" />
        <Skeleton width="80%" height="0.75rem" />
        <Skeleton width="60%" height="0.75rem" />
        <Skeleton width="70%" height="0.75rem" />
      </aside>

      <section className="flex-1 min-w-0 flex flex-col">
        <header
          style={{
            padding: "0.75rem var(--space-gutter)",
            borderBottom: "var(--border-hairline) solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Skeleton width="6rem" height="0.75rem" />
          <Skeleton width="5rem" height="0.75rem" />
        </header>

        <div
          className="w-full mx-auto flex flex-col"
          style={{
            maxWidth: "40rem",
            padding: "3rem 1.5rem 4rem",
            gap: "1rem",
          }}
        >
          <Skeleton width="50%" height="2.25rem" />
          <Skeleton width="100%" height="1rem" />
          <Skeleton width="95%" height="1rem" />
          <Skeleton width="90%" height="1rem" />
          <Skeleton width="70%" height="1rem" />
        </div>
      </section>

      <aside
        className="shrink-0"
        style={{
          width: "17rem",
          borderLeft: "var(--border-thin) solid var(--color-border)",
          padding: "0.875rem 1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        <Skeleton width="5rem" height="0.75rem" />
        <Skeleton width="100%" height="2.5rem" radius="var(--radius-sm)" />
        <Skeleton width="100%" height="2.5rem" radius="var(--radius-sm)" />
      </aside>
    </div>
  );
}
