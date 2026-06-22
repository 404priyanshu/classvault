import type { HTMLAttributes } from "react";
import { cx } from "@/lib/cx";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  padded?: boolean;
};

// Canonical surface: bordered, rounded, white. `padded` adds standard inner space.
export function Card({ padded = false, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cx(
        "min-w-0 overflow-hidden rounded-lg border border-line bg-surface",
        padded && "p-4",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
