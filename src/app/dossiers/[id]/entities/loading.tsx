import { Skeleton, SkeletonPanel } from "@/components/ui/Skeleton";

export default function EntitiesLoading() {
  return (
    <div
      className="w-full max-w-[960px] mx-auto py-8"
      style={{ paddingInline: "var(--space-gutter)" }}
    >
      <div className="flex items-start justify-between mb-6">
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Skeleton width="6rem" height="1.25rem" />
          <Skeleton width="8rem" height="0.75rem" />
        </div>
        <Skeleton width="7rem" height="2rem" radius="var(--radius-sm)" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
        <SkeletonPanel lines={2} />
        <SkeletonPanel lines={2} />
        <SkeletonPanel lines={2} />
      </div>
    </div>
  );
}
