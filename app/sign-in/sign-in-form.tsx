"use client";

import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  LogIn,
  Mail,
  Search,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  useState,
  type CSSProperties,
  type FormEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import type { ApiError, ApiUser } from "@/lib/api-types";

async function apiErrorMessage(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as ApiError;
    return body.error?.message ?? fallback;
  } catch {
    return fallback;
  }
}

function destinationFor(user: ApiUser) {
  return user.hasCompletedOnboarding ? "/app" : "/sign-up";
}

function TiltPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    event.currentTarget.style.setProperty("--rx", `${-y * 7}deg`);
    event.currentTarget.style.setProperty("--ry", `${x * 9}deg`);
  }

  function resetTilt(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.style.setProperty("--rx", "0deg");
    event.currentTarget.style.setProperty("--ry", "0deg");
  }

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
      style={{ "--rx": "0deg", "--ry": "0deg" } as CSSProperties}
      className={`tilt-panel ${className}`}
    >
      {children}
    </div>
  );
}

function AuthModeNav() {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface p-1">
      <span className="inline-flex h-8 items-center rounded-md bg-ink px-3 text-sm font-medium text-surface">
        Log in
      </span>
      <Link
        href="/sign-up"
        className="inline-flex h-8 items-center rounded-md px-3 text-sm font-medium text-ink-soft transition hover:text-ink"
      >
        Sign up
      </Link>
    </div>
  );
}

export function SignInForm({ initialError }: { initialError: string | null }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [submitting, setSubmitting] = useState(false);

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
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
        setError(await apiErrorMessage(response, `Sign-in failed (${response.status})`));
        return;
      }
      const user = (await response.json()) as ApiUser;
      window.location.href = destinationFor(user);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-stage flex min-h-screen items-center px-4 py-10 text-ink">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <section className="reveal-up max-w-xl">
          <Link href="/" className="mb-8 inline-flex items-center gap-2" aria-label="ClassVault home">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-ink font-mono text-[11px] font-semibold text-surface">
              CV
            </span>
            <span className="text-base font-semibold tracking-tight">ClassVault</span>
          </Link>

          <AuthModeNav />

          <h1 className="mt-8 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
            One calm doorway into your class library.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-ink-soft">
            Returning students sign in here. New students can authenticate first, then ClassVault
            guides them through a short profile setup.
          </p>

          <div className="mt-8 grid max-w-lg gap-3 sm:grid-cols-3">
            {[
              ["01", "Authenticate"],
              ["02", "Personalize"],
              ["03", "Study"],
            ].map(([index, label]) => (
              <div key={index} className="rounded-lg border border-line bg-surface/80 p-3">
                <span className="font-mono text-[11px] text-ink-faint">{index}</span>
                <p className="mt-2 text-sm font-semibold">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <TiltPanel className="reveal-up rounded-lg border border-line bg-surface p-5 shadow-[0_30px_80px_rgba(28,25,23,0.14)] sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase text-ink-faint">
                Secure access
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Sign in</h2>
            </div>
            <span className="rounded-md border border-line bg-paper p-2 text-ink-soft">
              <BookOpenCheck className="h-5 w-5" />
            </span>
          </div>

          <a
            href="/api/auth/google/start"
            className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-line bg-paper text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:border-line-strong hover:bg-surface hover:shadow-[0_12px_32px_rgba(28,25,23,0.09)]"
          >
            <LogIn className="h-4 w-4 transition group-hover:rotate-[-6deg]" />
            Continue with Google
          </a>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="text-xs font-semibold text-ink-faint">or use password</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <label className="block">
              <span className="text-xs font-semibold text-ink-soft">Email</span>
              <div className="mt-1 flex h-10 items-center gap-2 rounded-md border border-line bg-paper px-3 transition focus-within:border-line-strong focus-within:bg-surface">
                <Mail className="h-4 w-4 text-ink-faint" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@classvault.edu"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-faint"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-ink-soft">Password</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none transition focus:border-line-strong focus:bg-surface"
              />
            </label>
            {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-ink text-sm font-semibold text-surface transition hover:-translate-y-0.5 hover:bg-ink/85 disabled:translate-y-0 disabled:opacity-60"
            >
              {submitting ? "Signing in..." : "Sign in"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-5 grid gap-2 rounded-lg border border-line bg-paper p-3 text-sm text-ink-soft">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-700" />
              New Google users continue into guided signup.
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-700" />
              Preferences personalize subjects and semester filters.
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
            <Link href="/sign-up" className="font-semibold text-ink transition hover:text-ink-soft">
              New here? Start signup
            </Link>
            <Link
              href="/app"
              className="inline-flex items-center gap-1 text-ink-soft transition hover:text-ink"
            >
              <Search className="h-3.5 w-3.5" />
              Browse as guest
            </Link>
          </div>
        </TiltPanel>
      </div>
    </main>
  );
}
