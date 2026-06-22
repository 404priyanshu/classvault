import type { ReactNode } from "react";
import type { ApiNote } from "@/lib/api-types";
import { initialsOf } from "@/lib/format";
import { cx } from "@/lib/cx";

export type LayoutMode = "list" | "grid";
export type NoteSort = "recent" | "trending";

export function statusLabel(status: ApiNote["status"]) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "lg" }) {
  return (
    <span
      className={cx(
        "flex shrink-0 items-center justify-center rounded-full border border-line bg-paper font-medium text-ink-soft",
        size === "sm" ? "h-8 w-8 text-xs" : "h-16 w-16 text-xl",
      )}
    >
      {initialsOf(name)}
    </span>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="min-w-0 truncate font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint">
      {children}
    </p>
  );
}

export function LoadingRows({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="h-16 animate-pulse rounded-lg border border-line bg-surface" />
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-line-strong px-5 py-16 text-center">
      <p className="text-sm font-medium">Could not load resources</p>
      <p className="mt-1 text-sm text-ink-faint">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex h-9 items-center rounded-md border border-line bg-surface px-3.5 text-sm font-medium text-ink-soft transition hover:border-line-strong hover:text-ink"
      >
        Retry
      </button>
    </div>
  );
}

export function FileBadge({ type }: { type: ApiNote["fileType"] }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line bg-paper font-mono text-[10px] font-semibold text-ink-soft">
      {type}
    </span>
  );
}

export function StatusBadge({ status }: { status: ApiNote["status"] }) {
  if (status === "PUBLISHED") return null;
  return (
    <span
      className={cx(
        "shrink-0 rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase",
        status === "PENDING" && "border-line-strong bg-paper text-ink-soft",
        status === "REJECTED" && "border-red-200 bg-red-50 text-red-700",
        status === "HIDDEN" && "border-neutral-200 bg-neutral-50 text-neutral-700",
        status === "DELETED" && "border-line bg-paper text-ink-faint",
      )}
    >
      {statusLabel(status)}
    </span>
  );
}
