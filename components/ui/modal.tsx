"use client";

import { useEffect, type ReactNode } from "react";
import { cx } from "@/lib/cx";

type Align = "center" | "top";

// Overlay dialog: Escape to close, click-outside to close, body scroll locked
// while open. No enter/exit animation (minimal system).
export function Modal({
  open,
  onClose,
  label,
  children,
  align = "center",
  className,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  align?: Align;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={cx(
        "fixed inset-0 z-[90] flex justify-center bg-black/25 px-3 py-4 sm:px-4",
        align === "top" ? "items-start sm:py-24" : "items-center",
      )}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={cx(
          "max-h-[calc(100dvh-2rem)] w-full overflow-hidden rounded-lg border border-line bg-surface shadow-lg",
          className ?? "max-w-lg",
        )}
      >
        {children}
      </div>
    </div>
  );
}
