import { Skeleton, SkeletonPanel } from "@/components/ui/Skeleton";

export default function ClaimsLoading() {
  return (
    <div
      className="mx-auto w-full"
      style={{
        padding: "2rem var(--space-gutter)",
        maxWidth: "960px",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Skeleton width="6rem" height="1.25rem" />
          <Skeleton width="5rem" height="0.75rem" />
        </div>
        <Skeleton width="6rem" height="1.75rem" radius="var(--radius-sm)" />
      </div>
      <div className="flex flex-col gap-2">
        <SkeletonPanel lines={2} />
        <SkeletonPanel lines={2} />
        <SkeletonPanel lines={2} />
      </div>
    </div>
  );
}
