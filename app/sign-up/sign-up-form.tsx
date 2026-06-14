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

type SignupStep = "account" | "verify" | "basics" | "preferences" | "college";

const stepOrder: SignupStep[] = ["account", "verify", "basics", "preferences", "college"];
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
  
  // Custom onboarding states (stored locally to match schema requirements without DB changes)
  const [collegeName, setCollegeName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("classvault_onboarding_college") ?? "";
    }
    return "";
  });
  const [examGoal, setExamGoal] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("classvault_onboarding_exam_goal") ?? "";
    }
    return "";
  });
  const [collegeEmail, setCollegeEmail] = useState("");
  const [collegeOtpCode, setCollegeOtpCode] = useState("");
  const [collegeVerifyStep, setCollegeVerifyStep] = useState<"ask" | "verify" | "success">("ask");

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const activeIndex = stepOrder.indexOf(step);
  const progress = ((activeIndex + 1) / stepOrder.length) * 100;
  
  const profileReady =
    name.trim().length >= 2 &&
    semester &&
    Number(age) >= 13 &&
    Number(age) <= 80 &&
    Number.isInteger(Number(age)) &&
    collegeName.trim().length >= 2;

  const selectedCount = subjectPreferences.length;

  const stepLabels = useMemo(
    () => [
      ["Account", currentUser ? "Done" : "Email"],
      ["Verify", currentUser ? "Done" : "Code"],
      ["Basics", "Profile"],
      ["Subjects", `${selectedCount}/8`],
      ["College", "Vault Access"],
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
      setMessage("We sent a six-digit code to your email.");
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

  // Completes the onboarding flow and sends patch request
  async function completeOnboardingAction(verified = false) {
    if (!currentUser) {
      setError("Verify your email before setting up your profile.");
      setStep("account");
      return;
    }
    if (!subjectPreferences.length) {
      setError("Choose at least one subject preference.");
      setStep("preferences");
      return;
    }
    setSubmitting(true);
    setError(null);

    // Save custom local states
    if (typeof window !== "undefined") {
      localStorage.setItem("classvault_onboarding_college", collegeName);
      localStorage.setItem("classvault_onboarding_exam_goal", examGoal);
      if (verified) {
        localStorage.setItem("classvault_college_email", collegeEmail);
        localStorage.setItem("classvault_college_verified", "true");
      }
    }

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

  async function handleCollegeVerifyStart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!collegeEmail.endsWith(".edu") && !collegeEmail.endsWith(".edu.in") && !collegeEmail.endsWith(".ac.in")) {
      setError("Email must end with .edu, .edu.in, or .ac.in to unlock private college vaults.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setTimeout(() => {
      setSubmitting(false);
      setCollegeVerifyStep("verify");
      setMessage("Simulated OTP sent to your college email (Enter 123456 to verify).");
    }, 800);
  }

  async function handleCollegeVerifyComplete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (collegeOtpCode !== "123456") {
      setError("Incorrect verification code. Use 123456 for the simulation.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setTimeout(() => {
      setSubmitting(false);
      setCollegeVerifyStep("success");
      setMessage("College email verified successfully!");
    }, 600);
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
      <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
        
        {/* Left Side: Brand & Benefits */}
        <section className="reveal-up space-y-6 lg:max-w-xl">
          <Link href="/" className="inline-flex items-center gap-2" aria-label="ClassVault home">
            <ClassVaultLogo />
            <span className="font-serif font-semibold tracking-tight text-lg text-ink">ClassVault</span>
          </Link>

          <div className="space-y-3">
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl text-ink">
              Start your study vault.
            </h1>
            <p className="text-base text-ink-soft">
              Save notes, links, PYQs, and generate AI roadmaps from your study material.
            </p>
          </div>

          <AuthModeNav />

          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-semibold tracking-wider uppercase text-ink-faint">
              Why join?
            </h3>
            <ul className="space-y-3 text-sm text-ink-soft">
              {[
                "Save and organize resources",
                "Generate AI study roadmaps",
                "Find college notes and PYQs",
                "Study with peers in focus rooms",
              ].map((benefit) => (
                <li key={benefit} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <span className="font-medium">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-line bg-paper/50 p-4 space-y-2">
            <h4 className="text-xs font-semibold text-ink">College verification</h4>
            <p className="text-xs text-ink-soft leading-relaxed">
              After signup, verify your college email to unlock your private college vault. Supported college emails include `.edu`, `.edu.in`, `.ac.in`, or official college domains.
            </p>
          </div>
        </section>

        {/* Right Side: Onboarding Panel */}
        <TiltPanel className="reveal-up rounded-lg border border-line bg-surface p-5 shadow-[0_20px_50px_rgba(28,25,23,0.08)] sm:p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase text-ink-faint">
                Guided signup
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight">
                {step === "account"
                  ? "Create your account"
                  : step === "verify"
                    ? "Verify your email"
                    : step === "basics"
                      ? "Tell us the basics"
                      : step === "preferences"
                        ? "Choose subject preferences"
                        : "Unlock your college vault"}
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
                <span className="text-xs font-semibold text-ink-soft">Email address</span>
                <div className="mt-1 flex h-10 items-center gap-2 rounded-md border border-line bg-paper px-3 transition focus-within:border-line-strong focus-within:bg-surface">
                  <Mail className="h-4 w-4 text-ink-faint" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={requestEmail}
                    onChange={(event) => setRequestEmail(event.target.value)}
                    placeholder="you@email.com"
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
                  <span className="text-xs font-semibold text-ink-soft">Full name</span>
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
                  <span className="text-xs font-semibold text-ink-soft">Semester / Year</span>
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
                  <span className="text-xs font-semibold text-ink-soft">College / University Name</span>
                  <input
                    type="text"
                    required
                    value={collegeName}
                    onChange={(event) => setCollegeName(event.target.value)}
                    placeholder="e.g. Stanford University"
                    className="mt-1 h-10 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none transition focus:border-line-strong focus:bg-surface"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-semibold text-ink-soft">Course / Branch</span>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(event) => setDepartment(event.target.value)}
                    maxLength={40}
                    placeholder="e.g. Computer Science, Mechanical..."
                    className="mt-1 h-10 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none transition focus:border-line-strong focus:bg-surface"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-semibold text-ink-soft">Exam date or goal (optional)</span>
                  <input
                    type="text"
                    value={examGoal}
                    onChange={(event) => setExamGoal(event.target.value)}
                    placeholder="e.g. Finals in Dec, Pass DBMS, Score 9+ GPA"
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
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (subjectPreferences.length) {
                  setError(null);
                  setStep("college");
                }
              }}
              className="space-y-5"
            >
              <p className="text-xs text-ink-soft font-medium">Select the subjects you are studying this semester:</p>
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
                  disabled={!subjectPreferences.length}
                  className="inline-flex h-10 flex-[1.4] items-center justify-center gap-2 rounded-md bg-ink text-sm font-semibold text-surface transition hover:-translate-y-0.5 hover:bg-ink/85 disabled:translate-y-0 disabled:opacity-60"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          ) : null}

          {step === "college" ? (
            <div className="space-y-5">
              <p className="text-xs text-ink-soft leading-relaxed font-medium">
                Verify your college email now to unlock your college vault, private notes, PYQs, and silent study rooms.
              </p>

              {collegeVerifyStep === "ask" && (
                <form onSubmit={handleCollegeVerifyStart} className="space-y-4">
                  <label className="block">
                    <span className="text-xs font-semibold text-ink-soft">Official College Email</span>
                    <input
                      type="email"
                      required
                      value={collegeEmail}
                      onChange={(event) => setCollegeEmail(event.target.value)}
                      placeholder="name@college.edu or name@college.ac.in"
                      className="mt-1 h-10 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none transition focus:border-line-strong focus:bg-surface"
                    />
                  </label>
                  {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-accent text-sm font-semibold text-surface transition hover:-translate-y-0.5 hover:bg-accent-hover disabled:translate-y-0 disabled:opacity-60"
                  >
                    {submitting ? "Sending..." : "Verify college email"}
                  </button>
                </form>
              )}

              {collegeVerifyStep === "verify" && (
                <form onSubmit={handleCollegeVerifyComplete} className="space-y-4">
                  <label className="block">
                    <span className="text-xs font-semibold text-ink-soft">Enter 6-digit Code</span>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={collegeOtpCode}
                      onChange={(event) => setCollegeOtpCode(event.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      className="mt-1 h-12 w-full rounded-md border border-line bg-paper text-center font-mono text-lg tracking-widest outline-none transition focus:border-line-strong focus:bg-surface"
                    />
                  </label>
                  {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}
                  {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
                  <button
                    type="submit"
                    disabled={submitting || collegeOtpCode.length !== 6}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-accent text-sm font-semibold text-surface transition hover:-translate-y-0.5 hover:bg-accent-hover disabled:translate-y-0 disabled:opacity-60"
                  >
                    Confirm Code
                  </button>
                </form>
              )}

              {collegeVerifyStep === "success" && (
                <div className="space-y-4 py-4 text-center">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <Check className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-emerald-800">{message}</p>
                  <button
                    type="button"
                    onClick={() => completeOnboardingAction(true)}
                    className="inline-flex h-10 w-full items-center justify-center rounded-md bg-ink text-sm font-semibold text-surface transition hover:bg-ink/85"
                  >
                    Go to workspace
                  </button>
                </div>
              )}

              {collegeVerifyStep !== "success" && (
                <div className="flex flex-col gap-2 pt-2 border-t border-line">
                  <button
                    type="button"
                    onClick={() => completeOnboardingAction(false)}
                    className="inline-flex h-10 w-full items-center justify-center rounded-md bg-paper border border-line text-sm font-semibold text-ink transition hover:bg-surface hover:border-line-strong"
                  >
                    Skip for now
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setMessage(null);
                      setStep("preferences");
                    }}
                    className="inline-flex h-9 w-full items-center justify-center text-xs font-semibold text-ink-soft transition hover:text-ink"
                  >
                    Back to Subjects
                  </button>
                </div>
              )}
            </div>
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
