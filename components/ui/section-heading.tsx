import type { ReactNode } from "react";

// Standard section header: title on the left, optional action on the right.
export function SectionHeading({
  title,
  action,
}: {
  title: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-2.5 flex items-center justify-between gap-3">
      <h2 className="text-sm font-medium text-ink">{title}</h2>
      {action}
    </div>
  );
}

// Small uppercase meta label (matches the shell's sidebar labels).
export function MetaLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-[10px] font-medium uppercase tracking-wider text-ink-faint">{children}</span>
  );
}
