import { SkeletonPanel } from "@/components/ui/Skeleton";

export default function OverviewLoading() {
  return (
    <div
      className="w-full max-w-[960px] mx-auto py-8"
      style={{ paddingInline: "var(--space-gutter)" }}
    >
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="col-span-full">
          <SkeletonPanel lines={3} />
        </div>
        <SkeletonPanel lines={2} />
        <SkeletonPanel lines={2} />
        <SkeletonPanel lines={2} />
        <SkeletonPanel lines={2} />
      </div>
    </div>
  );
}
