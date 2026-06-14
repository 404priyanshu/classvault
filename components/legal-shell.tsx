import Link from "next/link";
import type { ReactNode } from "react";

// Shared chrome for static content pages (privacy, terms). Matches the
// landing page's paper/ink design tokens.
export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2" aria-label="ClassVault home">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-ink font-mono text-[10px] font-semibold text-surface">
              CV
            </span>
            <span className="text-sm font-semibold tracking-tight">ClassVault</span>
          </Link>
          <Link
            href="/app"
            className="inline-flex h-8 items-center rounded-md bg-ink px-3 text-sm font-medium text-surface transition hover:bg-ink/85"
          >
            Open app
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-5 py-14">
        <h1 className="text-3xl font-semibold tracking-[-0.03em]">{title}</h1>
        <p className="mt-2 font-mono text-xs text-ink-faint">Last updated {updated}</p>
        <div className="legal-prose mt-8 space-y-6 text-sm leading-7 text-ink-soft">{children}</div>
      </article>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-5 py-8 text-sm text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <span className="font-medium text-ink-soft">ClassVault</span>
          <div className="flex gap-5">
            <Link href="/privacy" className="transition hover:text-ink">
              Privacy
            </Link>
            <Link href="/terms" className="transition hover:text-ink">
              Terms
            </Link>
            <Link href="/app" className="transition hover:text-ink">
              Open app
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

export function LegalHeading({ children }: { children: ReactNode }) {
  return <h2 className="pt-2 text-base font-semibold text-ink">{children}</h2>;
}
