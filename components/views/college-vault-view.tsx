"use client";

import { useState, type FormEvent } from "react";
import { ShieldCheck } from "lucide-react";
import { useAppShell } from "@/components/app-shell/app-shell-context";
import type { ApiError } from "@/lib/api-types";
import { Button, Card, Input } from "@/components/ui";

async function apiErrorMessage(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as ApiError;
    return body.error?.message ?? fallback;
  } catch {
    return fallback;
  }
}

export function CollegeVaultView() {
  const { me, refreshMe, openAuthPrompt, setToast } = useAppShell();
  const [collegeName, setCollegeName] = useState(me?.collegeName ?? "");
  const [collegeEmail, setCollegeEmail] = useState(me?.collegeEmail ?? "");
  const [otpCode, setOtpCode] = useState("");
  const [status, setStatus] = useState<"unverified" | "sent">("unverified");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const verified = Boolean(me?.isCollegeVerified);

  async function handleSendCode(e: FormEvent) {
    e.preventDefault();
    if (!me) {
      openAuthPrompt();
      return;
    }
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
    try {
      const response = await fetch("/api/me/college-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collegeName, collegeEmail }),
      });
      if (!response.ok) {
        setError(await apiErrorMessage(response, `Could not send code (${response.status})`));
        return;
      }
      setStatus("sent");
      setOtpCode("");
      setToast("Verification code sent");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault();
    if (!me) {
      openAuthPrompt();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/me/college-verification", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collegeEmail, code: otpCode }),
      });
      if (!response.ok) {
        setError(await apiErrorMessage(response, `Could not verify code (${response.status})`));
        return;
      }
      await refreshMe();
      setStatus("unverified");
      setToast("College email verified");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    if (!me) {
      openAuthPrompt();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/me/college-verification", { method: "DELETE" });
      if (!response.ok) {
        setError(await apiErrorMessage(response, `Could not disconnect (${response.status})`));
        return;
      }
      await refreshMe();
      setStatus("unverified");
      setCollegeName("");
      setCollegeEmail("");
      setToast("College verification disconnected");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <p className="text-sm text-ink-soft">
        Use your official college email address to unlock private college resources, semester groups, verified notes, and classmate focus sessions.
      </p>

      {verified ? (
        <Card padded className="p-6 text-center space-y-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-ink">Verified Student Access</h3>
            <p className="text-xs text-ink-soft">
              Successfully linked with <span className="font-semibold text-ink">{me?.collegeEmail}</span>
            </p>
            <p className="text-xs text-ink-faint">College: {me?.collegeName}</p>
          </div>
          <div className="mx-auto grid max-w-md gap-3 border-t border-line pt-4 text-left text-xs sm:grid-cols-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-500" />
              <span>Private college notes</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-500" />
              <span>College PYQ library</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-500" />
              <span>Verified student badge</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-500" />
              <span>Peer silent study rooms</span>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={handleReset} disabled={loading}>
            {loading ? "Disconnecting..." : "Disconnect verification"}
          </Button>
          {error ? <p className="text-xs font-semibold text-red-600">{error}</p> : null}
        </Card>
      ) : (
        <Card padded className="p-5">
          {status === "unverified" && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-3">
                <label className="block">
                  <span className="text-xs font-bold text-ink-soft">College / University Name</span>
                  <Input
                    type="text"
                    required
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    placeholder="e.g. Stanford University"
                    className="mt-1 h-10"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-ink-soft">Official College Email Address</span>
                  <Input
                    type="email"
                    required
                    value={collegeEmail}
                    onChange={(e) => setCollegeEmail(e.target.value)}
                    placeholder="you@college.edu or student@college.ac.in"
                    className="mt-1 h-10"
                  />
                  <span className="block mt-1 text-[10px] text-ink-faint">
                    Accepted endings: .edu, .edu.in, or .ac.in.
                  </span>
                </label>
              </div>
              {error ? <p className="text-xs font-semibold text-red-600">{error}</p> : null}
              <Button type="submit" disabled={loading} className="h-10 w-full">
                {loading ? "Sending code..." : "Send verification code"}
              </Button>
            </form>
          )}

          {status === "sent" && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="space-y-3">
                <p className="text-xs text-neutral-800 bg-neutral-50 border border-neutral-100 p-2.5 rounded">
                  We sent a verification code to <span className="font-bold">{collegeEmail}</span>. Enter it to complete verification.
                </p>
                <label className="block">
                  <span className="text-xs font-bold text-ink-soft">Verification Code</span>
                  <Input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    className="mt-1 h-11 text-center font-mono text-base tracking-widest"
                  />
                </label>
              </div>
              {error ? <p className="text-xs font-semibold text-red-600">{error}</p> : null}
              <Button type="submit" disabled={loading || otpCode.length !== 6} className="h-10 w-full">
                {loading ? "Verifying..." : "Verify code"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setStatus("unverified")}
                className="w-full"
              >
                Change college details
              </Button>
            </form>
          )}
        </Card>
      )}
    </div>
  );
}
