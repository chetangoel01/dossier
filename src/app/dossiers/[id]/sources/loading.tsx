import { Skeleton, SkeletonPanel } from "@/components/ui/Skeleton";

export default function SourcesLoading() {
  return (
    <div
      className="w-full mx-auto"
      style={{
        padding: "2rem var(--space-gutter)",
        maxWidth: "960px",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Skeleton width="8rem" height="1.25rem" />
          <Skeleton width="6rem" height="0.75rem" />
        </div>
        <Skeleton width="7.5rem" height="2rem" radius="var(--radius-sm)" />
      </div>
      <SkeletonPanel lines={6} heading={false} />
    </div>
  );
}
