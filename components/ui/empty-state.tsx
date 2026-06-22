import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

// Dashed-border placeholder for empty lists, with an optional action.
export function EmptyState({
  message,
  action,
  dashed = true,
  className,
}: {
  message: ReactNode;
  action?: ReactNode;
  dashed?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "space-y-3 rounded-lg border px-5 py-8 text-center text-sm text-ink-faint",
        dashed ? "border-dashed border-line" : "border-line",
        className,
      )}
    >
      <p>{message}</p>
      {action}
    </div>
  );
}
