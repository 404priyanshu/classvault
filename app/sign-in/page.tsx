"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { ApiError } from "@/lib/api-types";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        let message = `Sign-in failed (${response.status})`;
        try {
          const body = (await response.json()) as ApiError;
          message = body.error?.message ?? message;
        } catch {
          // keep fallback message
        }
        setError(message);
        return;
      }
      // Full navigation so every request after this carries the session cookie.
      window.location.href = "/app";
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center text-lg font-semibold tracking-tight">
          ClassVault
        </Link>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-line bg-surface p-6"
        >
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Sign in</h1>
            <p className="mt-1 text-sm text-ink-faint">
              Use your campus email to access your library.
            </p>
          </div>
          <label className="block">
            <span className="text-xs font-medium text-ink-soft">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@classvault.edu"
              className="mt-1 h-9 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none transition focus:border-line-strong"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-ink-soft">Password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none transition focus:border-line-strong"
            />
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-9 w-full items-center justify-center rounded-md bg-ink text-sm font-medium text-surface transition hover:bg-ink/85 disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
          <p className="text-xs text-ink-faint">
            Or{" "}
            <Link href="/app" className="underline transition hover:text-ink">
              browse the library as a guest
            </Link>
            .
          </p>
        </form>
      </div>
    </main>
  );
}
