"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookMarked,
  Check,
  GraduationCap,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import type { ApiError, ApiUser } from "@/lib/api-types";

type SignupStep = "account" | "verify" | "basics" | "preferences";

const stepOrder: SignupStep[] = ["account", "verify", "basics", "preferences"];
const subjectOptions = [
  "Data Structures",
  "DBMS",
  "Operating Systems",
  "Computer Networks",
  "Mathematics",
  "Algorithms",
  "AI / ML",
  "Web Engineering",
  "Electronics",
  "Communication Skills",
];
const semesterOptions = ["1", "2", "3", "4", "5", "6", "7", "8"];

async function apiErrorMessage(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as ApiError;
    return body.error?.message ?? fallback;
  } catch {
    return fallback;
  }
}

function TiltPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    event.currentTarget.style.setProperty("--rx", `${-y * 6}deg`);
    event.currentTarget.style.setProperty("--ry", `${x * 8}deg`);
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
      <Link
        href="/sign-in"
        className="inline-flex h-8 items-center rounded-md px-3 text-sm font-medium text-ink-soft transition hover:text-ink"
      >
        Log in
      </Link>
      <span className="inline-flex h-8 items-center rounded-md bg-ink px-3 text-sm font-medium text-surface">
        Sign up
      </span>
    </div>
  );
}

export function SignUpForm({ initialUser }: { initialUser: ApiUser | null }) {
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(initialUser);
  const [step, setStep] = useState<SignupStep>(initialUser ? "basics" : "account");
  const [requestName, setRequestName] = useState(initialUser?.name ?? "");
  const [requestEmail, setRequestEmail] = useState(initialUser?.email ?? "");
  const [otpCode, setOtpCode] = useState("");
  const [name, setName] = useState(initialUser?.name ?? "");
  const [age, setAge] = useState(initialUser?.age ? String(initialUser.age) : "");
  const [department, setDepartment] = useState(initialUser?.department ?? "");
  const [semester, setSemester] = useState(initialUser?.semester ?? "");
  const [subjectPreferences, setSubjectPreferences] = useState<string[]>(
    initialUser?.subjectPreferences ?? [],
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const activeIndex = stepOrder.indexOf(step);
  const progress = ((activeIndex + 1) / stepOrder.length) * 100;
  const profileReady = name.trim().length >= 2 && semester && Number(age) >= 13 && Number(age) <= 80 && Number.isInteger(Number(age));
  const selectedCount = subjectPreferences.length;

  const stepLabels = useMemo(
    () => [
      ["Account", currentUser ? "Done" : "Email"],
      ["Verify", currentUser ? "Done" : "Code"],
      ["Basics", "Profile"],
      ["Subjects", `${selectedCount}/8`],
    ],
    [currentUser, selectedCount],
  );

  function hydrateUser(user: ApiUser) {
    setCurrentUser(user);
    setName(user.name);
    setRequestName(user.name);
    setRequestEmail(user.email);
    setDepartment(user.department ?? "");
    setSemester(user.semester ?? "");
    setAge(user.age ? String(user.age) : "");
    setSubjectPreferences(user.subjectPreferences);
  }

  async function handleOtpRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/auth/email/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: requestName, email: requestEmail }),
      });
      if (!response.ok) {
        setError(await apiErrorMessage(response, `Could not send code (${response.status})`));
        return;
      }
      setOtpCode("");
      setStep("verify");
      setMessage("We sent a six-digit code to your campus email.");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOtpVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: requestEmail, code: otpCode }),
      });
      if (!response.ok) {
        setError(await apiErrorMessage(response, `Could not verify code (${response.status})`));
        return;
      }
      const user = (await response.json()) as ApiUser;
      if (user.hasCompletedOnboarding) {
        window.location.href = "/app";
        return;
      }
      hydrateUser(user);
      setMessage("Email verified. Finish your study profile.");
      setStep("basics");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentUser) {
      setError("Verify your email before setting up your profile.");
      setStep("account");
      return;
    }
    if (!subjectPreferences.length) {
      setError("Choose at least one subject preference.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          department: department.trim() || null,
          semester,
          age: Number(age),
          subjectPreferences,
          completeOnboarding: true,
        }),
      });
      if (!response.ok) {
        setError(await apiErrorMessage(response, `Could not save profile (${response.status})`));
        return;
      }
      window.location.href = "/app";
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function toggleSubject(subject: string) {
    setSubjectPreferences((current) => {
      if (current.includes(subject)) return current.filter((item) => item !== subject);
      if (current.length >= 8) return current;
      return [...current, subject];
    });
  }

  return (
    <main className="auth-stage flex min-h-screen items-center px-4 py-10 text-ink">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <section className="reveal-up max-w-lg">
          <Link href="/" className="mb-8 inline-flex items-center gap-2" aria-label="ClassVault home">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-ink font-mono text-[11px] font-semibold text-surface">
              CV
            </span>
            <span className="text-base font-semibold tracking-tight">ClassVault</span>
          </Link>

          <AuthModeNav />

          <h1 className="mt-8 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
            Build a vault that knows your semester.
          </h1>
          <p className="mt-5 text-base leading-7 text-ink-soft">
            New students answer a few basics once. ClassVault uses them to tune filters, uploads,
            and study recommendations around the subjects they actually care about.
          </p>

          <div className="mt-8 space-y-3">
            {stepLabels.map(([title, caption], index) => (
              <div key={title} className="flex items-center gap-3">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-md border text-xs font-semibold transition ${
                    index <= activeIndex
                      ? "border-ink bg-ink text-surface"
                      : "border-line bg-surface text-ink-faint"
                  }`}
                >
                  {index < activeIndex || (currentUser && index < 2) ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span>
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="block text-xs text-ink-faint">{caption}</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        <TiltPanel className="reveal-up rounded-lg border border-line bg-surface p-5 shadow-[0_30px_80px_rgba(28,25,23,0.14)] sm:p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase text-ink-faint">
                Guided signup
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                {step === "account"
                  ? "Create your account"
                  : step === "verify"
                    ? "Verify your email"
                    : step === "basics"
                      ? "Tell us the basics"
                      : "Choose subject preferences"}
              </h2>
            </div>
            <span className="rounded-md border border-line bg-paper p-2 text-ink-soft">
              {step === "preferences" ? (
                <BookMarked className="h-5 w-5" />
              ) : (
                <GraduationCap className="h-5 w-5" />
              )}
            </span>
          </div>

          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-ink-faint">
              <span>Step {activeIndex + 1} of {stepOrder.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="onboarding-progress" aria-hidden="true">
              <span
                className="onboarding-progress-fill"
                style={{ transform: `scaleX(${progress / 100})` }}
              />
            </div>
          </div>

          {step === "account" ? (
            <form onSubmit={handleOtpRequest} className="space-y-4">
              <label className="block">
                <span className="text-xs font-semibold text-ink-soft">Full name</span>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={requestName}
                  onChange={(event) => setRequestName(event.target.value)}
                  className="mt-1 h-10 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none transition focus:border-line-strong focus:bg-surface"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-ink-soft">Campus email</span>
                <div className="mt-1 flex h-10 items-center gap-2 rounded-md border border-line bg-paper px-3 transition focus-within:border-line-strong focus-within:bg-surface">
                  <Mail className="h-4 w-4 text-ink-faint" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={requestEmail}
                    onChange={(event) => setRequestEmail(event.target.value)}
                    placeholder="you@classvault.edu"
                    className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-faint"
                  />
                </div>
              </label>
              {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-ink text-sm font-semibold text-surface transition hover:-translate-y-0.5 hover:bg-ink/85 disabled:translate-y-0 disabled:opacity-60"
              >
                {submitting ? "Sending code..." : "Send verification code"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : null}

          {step === "verify" ? (
            <form onSubmit={handleOtpVerify} className="space-y-4">
              <label className="block">
                <span className="text-xs font-semibold text-ink-soft">Verification code</span>
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="mt-1 h-12 w-full rounded-md border border-line bg-paper px-3 text-center font-mono text-lg outline-none transition focus:border-line-strong focus:bg-surface"
                />
              </label>
              {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}
              {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
              <button
                type="submit"
                disabled={submitting || otpCode.length !== 6}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-ink text-sm font-semibold text-surface transition hover:-translate-y-0.5 hover:bg-ink/85 disabled:translate-y-0 disabled:opacity-60"
              >
                <ShieldCheck className="h-4 w-4" />
                {submitting ? "Verifying..." : "Verify email"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("account");
                  setError(null);
                  setMessage(null);
                }}
                className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md text-sm font-semibold text-ink-soft transition hover:bg-paper hover:text-ink"
              >
                <ArrowLeft className="h-4 w-4" />
                Use a different email
              </button>
            </form>
          ) : null}

          {step === "basics" ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (profileReady) {
                  setError(null);
                  setStep("preferences");
                }
              }}
              className="space-y-4"
            >
              {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="text-xs font-semibold text-ink-soft">Name</span>
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="mt-1 h-10 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none transition focus:border-line-strong focus:bg-surface"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-ink-soft">Age</span>
                  <input
                    type="number"
                    required
                    min={13}
                    max={80}
                    step="1"
                    value={age}
                    onChange={(event) => setAge(event.target.value)}
                    className="mt-1 h-10 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none transition focus:border-line-strong focus:bg-surface"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-ink-soft">Semester</span>
                  <select
                    required
                    value={semester}
                    onChange={(event) => setSemester(event.target.value)}
                    className="mt-1 h-10 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none transition focus:border-line-strong focus:bg-surface"
                  >
                    <option value="">Choose</option>
                    {semesterOptions.map((option) => (
                      <option key={option} value={option}>
                        Semester {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-semibold text-ink-soft">Department or branch</span>
                  <input
                    type="text"
                    value={department}
                    onChange={(event) => setDepartment(event.target.value)}
                    maxLength={40}
                    placeholder="CSE, ECE, Mechanical..."
                    className="mt-1 h-10 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none transition focus:border-line-strong focus:bg-surface"
                  />
                </label>
              </div>
              {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
              <button
                type="submit"
                disabled={!profileReady}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-ink text-sm font-semibold text-surface transition hover:-translate-y-0.5 hover:bg-ink/85 disabled:translate-y-0 disabled:opacity-60"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : null}

          {step === "preferences" ? (
            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <div className="flex flex-wrap gap-2">
                {subjectOptions.map((subject) => {
                  const active = subjectPreferences.includes(subject);
                  return (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => toggleSubject(subject)}
                      className={`subject-chip ${active ? "subject-chip-active" : ""}`}
                      aria-pressed={active}
                    >
                      {active ? <Check className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                      {subject}
                    </button>
                  );
                })}
              </div>
              {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStep("basics");
                  }}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md border border-line bg-paper text-sm font-semibold text-ink-soft transition hover:border-line-strong hover:text-ink"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting || !subjectPreferences.length}
                  className="inline-flex h-10 flex-[1.4] items-center justify-center gap-2 rounded-md bg-ink text-sm font-semibold text-surface transition hover:-translate-y-0.5 hover:bg-ink/85 disabled:translate-y-0 disabled:opacity-60"
                >
                  {submitting ? "Saving..." : "Finish signup"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          ) : null}

          <p className="mt-5 text-sm text-ink-faint">
            Prefer Google? Use the{" "}
            <Link href="/sign-in" className="font-semibold text-ink transition hover:text-ink-soft">
              sign-in page
            </Link>{" "}
            and new accounts land here automatically.
          </p>
        </TiltPanel>
      </div>
    </main>
  );
}
