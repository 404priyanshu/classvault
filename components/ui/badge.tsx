import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

type Variant = "neutral" | "solid" | "outline";

const VARIANTS: Record<Variant, string> = {
  neutral: "border-line bg-paper text-ink-soft",
  solid: "border-ink bg-ink text-surface",
  outline: "border-line bg-surface text-ink-soft",
};

export function Badge({
  children,
  variant = "neutral",
  mono = false,
  className,
}: {
  children: ReactNode;
  variant?: Variant;
  mono?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        mono && "font-mono",
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
