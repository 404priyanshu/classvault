"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clipboard,
  Command,
  Copy,
  FileText,
  GraduationCap,
  Radio,
  Sparkles,
} from "lucide-react";
import { cx } from "@/lib/cx";

const proofRows = [
  {
    name: "Vault intake",
    detail: "PDFs, links, PYQs, notes",
    status: "ready",
    icon: FileText,
  },
  {
    name: "AI roadmap",
    detail: "5-day prerequisite path",
    status: "queued",
    icon: Sparkles,
  },
  {
    name: "College layer",
    detail: "verified campus resources",
    status: "ready",
    icon: GraduationCap,
  },
  {
    name: "Study rooms",
    detail: "silent Pomodoro sessions",
    status: "live",
    icon: Radio,
  },
];

const walkthrough = {
  vault: {
    label: "vault",
    title: "Capture the material",
    lines: ["upload CN notes.pdf", "save PYQ 2024 set", "pin subnetting playlist"],
  },
  plan: {
    label: "plan",
    title: "Generate the order",
    lines: ["Day 1 · OSI/TCP recap", "Day 2 · data link drills", "Day 3 · routing + subnetting"],
  },
  exam: {
    label: "exam",
    title: "Revise what repeats",
    lines: ["high-yield PYQs first", "weak topics marked", "mock sprint ready"],
  },
};

type WalkthroughKey = keyof typeof walkthrough;

function ClassVaultMark() {
  return (
    <span className="grid h-7 w-7 place-items-center rounded-md bg-[#18181b] text-[11px] font-semibold text-white shadow-[0_0_0_1px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.16),0_2px_5px_rgba(0,0,0,0.12)]">
      CV
    </span>
  );
}

function StableSlot({ children, copied }: { children: string; copied: boolean }) {
  return (
    <span className="relative inline-grid min-w-[52px] justify-items-start overflow-hidden">
      <span
        className={cx(
          "col-start-1 row-start-1 transition duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
          copied ? "scale-75 opacity-0 blur-[3px]" : "scale-100 opacity-100 blur-0",
        )}
      >
        {children}
      </span>
      <span
        className={cx(
          "col-start-1 row-start-1 transition duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
          copied ? "scale-100 opacity-100 blur-0" : "scale-75 opacity-0 blur-[3px]",
        )}
      >
        copied
      </span>
    </span>
  );
}

export default function ClassVaultLanding() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<WalkthroughKey>("vault");
  const current = walkthrough[activeTab];

  const commandText = useMemo(() => "ClassVault: build a 5-day roadmap from my notes", []);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1400);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(commandText);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main className="compact-landing min-h-screen bg-[radial-gradient(120%_90%_at_50%_0%,#ffffff_0%,#fafafa_60%,#f4f4f5_100%)] px-6 py-14 text-[#18181b] antialiased sm:px-8 sm:py-16">
      <div className="mx-auto w-full max-w-[440px]">
        <header className="compact-enter flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <Link href="/" className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.01em]">
            <ClassVaultMark />
            <span>ClassVault</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/privacy"
              className="inline-flex min-h-6 items-center rounded-md px-2 text-[11px] font-medium leading-none text-[#71717a] transition hover:text-[#18181b] active:scale-95"
            >
              privacy
            </Link>
            <Link
              href="/app"
              className="inline-flex min-h-7 items-center gap-1 rounded-md bg-white px-2.5 text-[12px] font-semibold leading-none text-[#18181b] shadow-[0_0_0_1px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.9),0_2px_5px_rgba(0,0,0,0.08)] transition hover:text-black active:scale-95"
            >
              Open app
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>

        <section className="compact-enter mt-9">
          <h1 className="text-[17px] font-semibold tracking-[-0.01em] text-[#18181b]">
            Notes, PYQs, rooms, and roadmaps in one small study vault.
          </h1>
          <p className="mt-3 max-w-[36ch] text-[14px] leading-[1.5] tracking-[-0.01em] text-[#52525b]">
            Capture class material once. ClassVault keeps it searchable and turns it into a study order when exams get close.
          </p>
        </section>

        <section className="compact-enter mt-9 overflow-hidden rounded-[10px] bg-white/70 shadow-[0_0_0_1px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.04),0_6px_16px_rgba(0,0,0,0.06)] backdrop-blur-md">
          {proofRows.map((row, index) => (
            <div
              key={row.name}
              className="flex min-h-[52px] items-center gap-3 border-t border-[rgba(0,0,0,0.07)] px-3 first:border-t-0"
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white text-[#52525b] shadow-[0_0_0_1px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)]">
                <row.icon className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-mono text-[12px] leading-none text-[#71717a]">{row.name}</span>
                <span className="mt-1 block truncate text-[12.5px] font-medium text-[#18181b]">{row.detail}</span>
              </span>
              <span className="inline-flex w-[58px] items-center justify-end gap-1.5 font-mono text-[11px] leading-none text-[#52525b]">
                <span
                  className={cx(
                    "h-[7px] w-[7px] rounded-full",
                    row.status === "queued"
                      ? "bg-[#f59e0b] shadow-[0_0_0_3px_rgba(245,158,11,0.18)]"
                      : "bg-[#22c55e] shadow-[0_0_0_3px_rgba(34,197,94,0.18)]",
                  )}
                />
                {index === 1 ? `${row.status}` : row.status}
              </span>
            </div>
          ))}
        </section>

        <section className="compact-enter mt-9">
          <button
            type="button"
            onClick={copyCommand}
            className="flex min-h-[42px] w-full items-center gap-2.5 rounded-[9px] bg-white/72 px-3 text-left font-mono text-[12.5px] font-medium leading-none text-[#18181b] shadow-[0_0_0_1px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.04),0_6px_16px_rgba(0,0,0,0.06)] backdrop-blur-md transition hover:text-black active:scale-[0.98]"
            title="Copy roadmap prompt"
          >
            <span className="shrink-0 text-[#a1a1aa]">$</span>
            <span className="min-w-0 flex-1 truncate">{commandText}</span>
            <Copy className="h-[15px] w-[15px] shrink-0 text-[#71717a]" />
          </button>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link
              href="/app"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#18181b] px-4 text-[13.5px] font-semibold leading-none text-white shadow-[0_0_0_1px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.16),0_3px_8px_rgba(0,0,0,0.16)] transition hover:bg-black active:scale-95"
            >
              Open app
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={copyCommand}
              className="inline-flex min-h-7 items-center gap-[5px] rounded-md bg-white px-2 text-[11px] font-medium leading-none text-[#52525b] shadow-[0_0_0_1px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.9),0_2px_5px_rgba(0,0,0,0.08)] transition hover:text-[#18181b] active:scale-95"
              title="Copy prompt for AI assistants"
            >
              <Clipboard className="h-[11px] w-[11px]" />
              <StableSlot copied={copied}>prompt</StableSlot>
            </button>
          </div>
        </section>

        <section className="compact-enter mt-10">
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 className="text-[13px] font-semibold text-[#52525b]">Compact walkthrough</h2>
            <span className="font-mono text-[12px] leading-none text-[#a1a1aa] tabular-nums">03 steps</span>
          </div>

          <div className="rounded-[10px] bg-white/70 p-2 shadow-[0_0_0_1px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.04),0_6px_16px_rgba(0,0,0,0.06)] backdrop-blur-md">
            <div className="flex gap-0.5 rounded-lg bg-black/[0.05] p-0.5">
              {(Object.keys(walkthrough) as WalkthroughKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={cx(
                    "min-h-7 flex-1 rounded-md px-2.5 text-[11.5px] font-medium leading-none transition active:scale-95",
                    activeTab === key
                      ? "bg-white text-[#18181b] shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.07)]"
                      : "text-[#71717a] hover:text-[#18181b]",
                  )}
                >
                  {walkthrough[key].label}
                </button>
              ))}
            </div>

            <div className="mt-2 min-h-[178px] rounded-[10px] bg-white/55 px-3 py-3 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[12px] leading-none text-[#71717a]">{current.title}</span>
                <Command className="h-3.5 w-3.5 text-[#a1a1aa]" />
              </div>
              <div className="mt-4 space-y-2 font-mono text-[12.5px] leading-[1.7]">
                {current.lines.map((line, index) => (
                  <div key={line} className="flex min-h-7 items-center gap-2 border-t border-[rgba(0,0,0,0.07)] first:border-t-0">
                    <span className="w-5 shrink-0 text-[#a1a1aa] tabular-nums">0{index + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-[#18181b]">{line}</span>
                    {index === 0 ? <Check className="h-3.5 w-3.5 shrink-0 text-[#22c55e]" /> : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="compact-enter mt-10">
          <h2 className="mb-3 text-[13px] font-semibold text-[#52525b]">Usage notes</h2>
          <div className="rounded-[10px] bg-white/72 p-3 font-mono text-[12.5px] leading-[1.7] text-[#3f3f46] shadow-[0_0_0_1px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.04),0_6px_16px_rgba(0,0,0,0.06)] backdrop-blur-md">
            <p>
              <span className="text-[#7c3aed]">capture</span>(<span className="text-[#0f766e]">&quot;notes + links&quot;</span>)
            </p>
            <p>
              <span className="text-[#7c3aed]">verify</span>(<span className="text-[#0f766e]">&quot;college vault&quot;</span>)
            </p>
            <p>
              <span className="text-[#7c3aed]">study</span>(<span className="text-[#0f766e]">&quot;roadmap + rooms&quot;</span>)
            </p>
          </div>
        </section>

        <footer className="compact-enter mt-11 flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(0,0,0,0.07)] pt-4">
          <span className="font-mono text-[12px] leading-none text-[#a1a1aa]">ClassVault · student OS</span>
          <div className="flex gap-3">
            <Link href="/terms" className="font-mono text-[12px] leading-none text-[#71717a] transition hover:text-[#18181b] active:scale-95">
              terms
            </Link>
            <Link href="/app/library" className="font-mono text-[12px] leading-none text-[#71717a] transition hover:text-[#18181b] active:scale-95">
              library
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
