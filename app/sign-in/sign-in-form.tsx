"use client";

import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  LogIn,
  Mail,
  Search,
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

function ClassVaultLogo() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="currentColor"
      className="h-6 w-6 text-ink"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16 3C9.373 3 4 8.373 4 15v13h6V15c0-3.314 2.686-6 6-6s6 2.686 6 6v13h6V15c0-6.627-5.373-12-12-12z"
      />
      <circle cx="16" cy="18" r="3" />
    </svg>
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
      <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
        {/* Left Side: Auth Form */}
        <section className="reveal-up space-y-6">
          <div className="flex items-center gap-2.5">
            <Link href="/" className="inline-flex items-center gap-2" aria-label="ClassVault home">
              <ClassVaultLogo />
              <span className="font-serif font-semibold tracking-tight text-lg text-ink">ClassVault</span>
            </Link>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl text-ink">
              Welcome back to your study vault.
            </h1>
            <p className="text-base text-ink-soft">
              Continue organizing notes, PYQs, links, and AI roadmaps in one place.
            </p>
          </div>

          <AuthModeNav />

          <TiltPanel className="rounded-lg border border-line bg-surface p-5 shadow-[0_20px_50px_rgba(28,25,23,0.08)] sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] font-semibold uppercase text-ink-faint">
                  Secure access
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight">Sign in</h2>
              </div>
              <span className="rounded-md border border-line bg-paper p-2 text-ink-soft">
                <BookOpenCheck className="h-5 w-5" />
              </span>
            </div>

            <a
              href="/api/auth/google/start"
              className="group inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-line bg-paper text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:border-line-strong hover:bg-surface hover:shadow-[0_12px_32px_rgba(28,25,23,0.09)]"
            >
              <LogIn className="h-4 w-4 transition group-hover:rotate-[-6deg]" />
              Continue with Google
            </a>

            <div className="my-4 flex items-center gap-3">
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

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm border-t border-line pt-4">
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
        </section>

        {/* Right Side: Product Value Panel & Mock Preview Card */}
        <section className="reveal-up hidden lg:flex flex-col justify-between gap-8 h-full py-6">
          <div className="space-y-6">
            <h3 className="font-serif text-2xl font-medium text-ink">
              Your focus workspace, organized.
            </h3>
            
            <ul className="space-y-4">
              {[
                "Access your saved resources",
                "Continue your study roadmap",
                "Join college study rooms",
                "Pick up where you left off",
              ].map((bullet) => (
                <li key={bullet} className="flex items-center gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm text-ink-soft font-medium">{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Today's Plan Preview Card */}
          <div className="relative rounded-xl border border-line bg-surface p-6 shadow-[0_30px_70px_rgba(28,25,23,0.12)] max-w-sm">
            <div className="absolute top-4 right-4 flex h-6 items-center rounded-full bg-accent-soft px-2.5 text-[10px] font-semibold text-accent">
              Active Session
            </div>

            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-faint">
              Today&apos;s Plan
            </span>
            <h4 className="mt-1 text-lg font-semibold text-ink">Computer Networks</h4>

            <div className="mt-4 space-y-3">
              {[
                { label: "Revise OSI vs TCP/IP", checked: true },
                { label: "Attempt 5 PYQs", checked: true },
                { label: "Join 25-min study room", checked: false },
              ].map((task, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span
                    className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border text-[10px] ${
                      task.checked
                        ? "border-accent bg-accent text-surface"
                        : "border-line-strong"
                    }`}
                  >
                    {task.checked && <CheckCircle2 className="h-3 w-3" />}
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      task.checked ? "text-ink-faint line-through" : "text-ink"
                    }`}
                  >
                    {task.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-line pt-4">
              <div className="flex items-center justify-between text-xs text-ink-soft font-semibold">
                <span>Progress</span>
                <span className="text-accent">42% exam-ready</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-paper overflow-hidden">
                <div className="h-full rounded-full bg-accent" style={{ width: "42%" }} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
