"use client";

import { useState, type FormEvent } from "react";
import { ShieldCheck } from "lucide-react";
import { useAppShell } from "@/components/app-shell/app-shell-context";

export function CollegeVaultView() {
  const { me } = useAppShell();
  const [collegeName, setCollegeName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("classvault_onboarding_college") ?? "";
    }
    return "";
  });
  const [collegeEmail, setCollegeEmail] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("classvault_college_email") ?? "";
    }
    return "";
  });
  const [otpCode, setOtpCode] = useState("");
  const [status, setStatus] = useState<"unverified" | "sent" | "verified">(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("classvault_college_verified") === "true" ? "verified" : "unverified";
    }
    return "unverified";
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleSendCode(e: FormEvent) {
    e.preventDefault();
    const normalizedEmail = collegeEmail.trim().toLowerCase();
    if (
      !normalizedEmail.endsWith(".edu") &&
      !normalizedEmail.endsWith(".edu.in") &&
      !normalizedEmail.endsWith(".ac.in")
    ) {
      setError("Please use a valid official college email (e.g. .edu, .edu.in, .ac.in).");
      return;
    }
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setLoading(false);
      setStatus("sent");
      setOtpCode("");
    }, 700);
  }

  function handleVerifyCode(e: FormEvent) {
    e.preventDefault();
    if (otpCode !== "123456") {
      setError("Incorrect verification code. Use 123456 for the demo.");
      return;
    }
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setLoading(false);
      setStatus("verified");
      if (typeof window !== "undefined") {
        localStorage.setItem("classvault_college_verified", "true");
        localStorage.setItem("classvault_onboarding_college", collegeName);
        localStorage.setItem("classvault_college_email", collegeEmail);
      }
    }, 600);
  }

  function handleReset() {
    setStatus("unverified");
    setCollegeName("");
    setCollegeEmail("");
    setError(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("classvault_college_verified");
      localStorage.removeItem("classvault_college_email");
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <p className="text-sm text-ink-soft">
        Use your official college email address to unlock private college resources, semester groups, verified notes, and classmate focus sessions.
      </p>

      {status === "verified" ? (
        <div className="rounded-xl border border-line bg-surface p-6 text-center space-y-4 shadow-sm">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-ink">Verified Student Access</h3>
            <p className="text-xs text-ink-soft">
              Successfully linked with <span className="font-semibold text-ink">{collegeEmail}</span>
            </p>
            <p className="text-xs text-ink-faint">College: {collegeName}</p>
          </div>
        <div className="mx-auto grid max-w-md gap-3 border-t border-line pt-4 text-left text-xs sm:grid-cols-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Private college notes</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>College PYQ library</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Verified student badge</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Peer silent study rooms</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex h-8 items-center justify-center rounded border border-line bg-paper px-4 text-xs font-semibold text-ink-soft transition hover:bg-surface hover:text-ink"
          >
            Disconnect verification
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
          {status === "unverified" && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-3">
                <label className="block">
                  <span className="text-xs font-bold text-ink-soft">College / University Name</span>
                  <input
                    type="text"
                    required
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    placeholder="e.g. Stanford University"
                    className="mt-1 h-10 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none transition focus:border-line-strong focus:bg-surface"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-ink-soft">Official College Email Address</span>
                  <input
                    type="email"
                    required
                    value={collegeEmail}
                    onChange={(e) => setCollegeEmail(e.target.value)}
                    placeholder="you@college.edu or student@college.ac.in"
                    className="mt-1 h-10 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none transition focus:border-line-strong focus:bg-surface"
                  />
                  <span className="block mt-1 text-[10px] text-ink-faint">
                    Accepted endings: .edu, .edu.in, .ac.in, or official college domains.
                  </span>
                </label>
              </div>
              {error ? <p className="text-xs font-semibold text-red-600">{error}</p> : null}
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-10 w-full items-center justify-center rounded-md bg-ink text-sm font-semibold text-surface transition hover:bg-ink/85 disabled:opacity-60"
              >
                {loading ? "Sending link..." : "Send verification code"}
              </button>
            </form>
          )}

          {status === "sent" && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="space-y-3">
                <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 p-2.5 rounded">
                  Simulation mode: We sent a simulated verification code. Enter <span className="font-bold">123456</span> to complete verification.
                </p>
                <label className="block">
                  <span className="text-xs font-bold text-ink-soft">Verification Code</span>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="mt-1 h-11 w-full rounded-md border border-line bg-paper px-3 text-center font-mono text-base tracking-widest outline-none transition focus:border-line-strong focus:bg-surface"
                  />
                </label>
              </div>
              {error ? <p className="text-xs font-semibold text-red-600">{error}</p> : null}
              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="inline-flex h-10 w-full items-center justify-center rounded-md bg-ink text-sm font-semibold text-surface transition hover:bg-ink/85 disabled:opacity-60"
              >
                {loading ? "Verifying..." : "Verify code"}
              </button>
              <button
                type="button"
                onClick={() => setStatus("unverified")}
                className="inline-flex h-9 w-full items-center justify-center text-xs font-semibold text-ink-soft transition hover:underline"
              >
                Change college details
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
