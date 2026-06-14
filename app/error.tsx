"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced to the server console / error tracker in production.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-paper px-5 text-center text-ink">
      <p className="font-mono text-sm font-medium text-ink-faint">Error</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-soft">
        An unexpected error occurred. Try again, and if it keeps happening, contact the ClassVault
        administrators.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex h-9 items-center rounded-md bg-ink px-3.5 text-sm font-medium text-surface transition hover:bg-ink/85"
      >
        Try again
      </button>
    </main>
  );
}
