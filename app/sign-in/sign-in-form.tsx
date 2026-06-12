"use client";

import { ArrowLeft, LogIn, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { ApiError } from "@/lib/api-types";

type SignupStep = "request" | "verify";

async function apiErrorMessage(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as ApiError;
    return body.error?.message ?? fallback;
  } catch {
    return fallback;
  }
}

export function SignInForm({ initialError }: { initialError: string | null }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [submitting, setSubmitting] = useState(false);
  const [signupStep, setSignupStep] = useState<SignupStep>("request");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [signupMessage, setSignupMessage] = useState<string | null>(null);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

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
      // Full navigation so every request after this carries the session cookie.
      window.location.href = "/app";
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOtpRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSendingOtp(true);
    setSignupError(null);
    setSignupMessage(null);
    try {
      const response = await fetch("/api/auth/email/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: signupName, email: signupEmail }),
      });
      if (!response.ok) {
        setSignupError(await apiErrorMessage(response, `Could not send code (${response.status})`));
        return;
      }
      setOtpCode("");
      setSignupStep("verify");
      setSignupMessage("We sent a six-digit code to your email.");
    } catch {
      setSignupError("Network error. Try again.");
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleOtpVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setVerifyingOtp(true);
    setSignupError(null);
    try {
      const response = await fetch("/api/auth/email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: signupEmail, code: otpCode }),
      });
      if (!response.ok) {
        setSignupError(await apiErrorMessage(response, `Could not verify code (${response.status})`));
        return;
      }
      window.location.href = "/app";
    } catch {
      setSignupError("Network error. Try again.");
    } finally {
      setVerifyingOtp(false);
    }
  }

  function resetOtpRequest() {
    setSignupStep("request");
    setOtpCode("");
    setSignupMessage(null);
    setSignupError(null);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 block text-center text-lg font-semibold tracking-tight">
          ClassVault
        </Link>
        <div className="space-y-5 rounded-lg border border-line bg-surface p-6">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Sign in</h1>
            <p className="mt-1 text-sm text-ink-faint">
              Use your campus account to access your library.
            </p>
          </div>
          <Link
            href="/api/auth/google/start"
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-line bg-paper text-sm font-medium text-ink transition hover:border-line-strong hover:bg-surface"
          >
            <LogIn className="h-4 w-4" />
            Continue with Google
          </Link>
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="text-xs font-medium text-ink-faint">or</span>
            <span className="h-px flex-1 bg-line" />
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
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
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-ink text-sm font-medium text-surface transition hover:bg-ink/85 disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" />
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="border-t border-line pt-5">
            <div className="mb-4">
              <h2 className="text-sm font-semibold">Create account with email</h2>
              <p className="mt-1 text-xs text-ink-faint">
                We will send a one-time code to verify your email.
              </p>
            </div>

            {signupStep === "request" ? (
              <form onSubmit={handleOtpRequest} className="space-y-4">
                <label className="block">
                  <span className="text-xs font-medium text-ink-soft">Full name</span>
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    value={signupName}
                    onChange={(event) => setSignupName(event.target.value)}
                    className="mt-1 h-9 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none transition focus:border-line-strong"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-ink-soft">Campus email</span>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={signupEmail}
                    onChange={(event) => setSignupEmail(event.target.value)}
                    placeholder="you@classvault.edu"
                    className="mt-1 h-9 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none transition focus:border-line-strong"
                  />
                </label>
                {signupError ? <p className="text-sm text-red-600">{signupError}</p> : null}
                <button
                  type="submit"
                  disabled={sendingOtp}
                  className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-line bg-paper text-sm font-medium text-ink transition hover:border-line-strong hover:bg-surface disabled:opacity-60"
                >
                  <Mail className="h-4 w-4" />
                  {sendingOtp ? "Sending code..." : "Send verification code"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleOtpVerify} className="space-y-4">
                <label className="block">
                  <span className="text-xs font-medium text-ink-soft">Verification code</span>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otpCode}
                    onChange={(event) =>
                      setOtpCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="mt-1 h-10 w-full rounded-md border border-line bg-paper px-3 text-center font-mono text-base outline-none transition focus:border-line-strong"
                  />
                </label>
                {signupMessage ? <p className="text-sm text-green-700">{signupMessage}</p> : null}
                {signupError ? <p className="text-sm text-red-600">{signupError}</p> : null}
                <button
                  type="submit"
                  disabled={verifyingOtp || otpCode.length !== 6}
                  className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-ink text-sm font-medium text-surface transition hover:bg-ink/85 disabled:opacity-60"
                >
                  <ShieldCheck className="h-4 w-4" />
                  {verifyingOtp ? "Verifying..." : "Verify and sign in"}
                </button>
                <button
                  type="button"
                  onClick={resetOtpRequest}
                  className="inline-flex h-8 w-full items-center justify-center gap-2 rounded-md text-sm font-medium text-ink-soft transition hover:bg-paper hover:text-ink"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Use a different email
                </button>
              </form>
            )}
          </div>

          <p className="text-xs text-ink-faint">
            Or{" "}
            <Link href="/app" className="underline transition hover:text-ink">
              browse the library as a guest
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
