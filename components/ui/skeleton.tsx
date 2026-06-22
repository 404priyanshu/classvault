import { cx } from "@/lib/cx";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-md border border-line bg-paper", className)} />;
}

export function SkeletonRows({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cx("space-y-2", className)}>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className="h-14" />
      ))}
    </div>
  );
}
