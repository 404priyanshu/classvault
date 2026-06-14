import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-paper px-5 text-center text-ink">
      <p className="font-mono text-sm font-medium text-ink-faint">404</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-soft">
        The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved.
      </p>
      <div className="mt-6 flex gap-2">
        <Link
          href="/"
          className="inline-flex h-9 items-center rounded-md border border-line bg-surface px-3.5 text-sm font-medium text-ink-soft transition hover:border-line-strong hover:text-ink"
        >
          Home
        </Link>
        <Link
          href="/app"
          className="inline-flex h-9 items-center rounded-md bg-ink px-3.5 text-sm font-medium text-surface transition hover:bg-ink/85"
        >
          Open app
        </Link>
      </div>
    </main>
  );
}
