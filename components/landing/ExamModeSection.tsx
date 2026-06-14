"use client";

import { AlertTriangle, ShieldCheck, Flame, BookOpen, RefreshCw, FileText } from "lucide-react";
import Link from "next/link";

export function ExamModeSection() {
  return (
    <section className="bg-paper px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-xl border border-line bg-surface p-6 shadow-xl sm:p-10">
          
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            
            {/* Left Column: Urgency copy */}
            <div className="flex flex-col items-start">
              <div className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600">
                <Flame className="h-3.5 w-3.5" />
                Exam Mode
              </div>
              
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                Exam in 3 days? <br />
                Switch to Exam Mode.
              </h2>
              
              <p className="mt-4 text-sm leading-relaxed text-ink-soft sm:text-base">
                No time to study the whole syllabus? Switch to Exam Mode. StudyVault sifts through your material, community uploads, and past papers to prioritize the highest-probability topics, repeated questions, and key summaries.
              </p>
              
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/app"
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-ink px-5 text-sm font-medium text-surface transition hover:bg-ink/85"
                >
                  Create revision plan
                </Link>
                <Link
                  href="/app"
                  className="inline-flex h-10 items-center gap-1.5 rounded-md border border-line-strong bg-surface px-4 text-sm font-medium text-ink hover:bg-paper-warm hover:border-ink/20 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-ink-faint" />
                  Simulate Exam
                </Link>
              </div>
            </div>

            {/* Right Column: Visual Prioritization Box */}
            <div className="rounded-lg border border-line bg-paper/50 p-5">
              <div className="flex items-center gap-2 border-b border-line pb-3">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-amber-500/10 text-amber-600">
                  <AlertTriangle className="h-3.5 w-3.5" />
                </span>
                <span className="font-mono text-[10px] font-semibold text-ink-soft uppercase tracking-wider">
                  Priority Checklist: Computer Networks
                </span>
              </div>
              
              {/* Prioritized items */}
              <div className="mt-4 space-y-4">
                
                {/* Must Study block */}
                <div>
                  <span className="text-[9px] font-bold tracking-wider text-ink-faint uppercase">Must Study (82% probability)</span>
                  <div className="mt-1.5 space-y-1.5">
                    {[
                      { topic: "OSI vs TCP/IP Protocol Architectures", wt: "Repeated in 4 exams" },
                      { topic: "IPv4 Subnetting & CIDR Calculation", wt: "Compulsory 10-mark question" },
                      { topic: "Routing Algorithms (Dijkstra's Link State)", wt: "Expected in Section B" },
                    ].map((item) => (
                      <div key={item.topic} className="flex items-center gap-2.5 rounded border border-line bg-surface p-2.5">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-600 text-[10px] font-bold">!</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-ink">{item.topic}</p>
                          <p className="text-[9px] text-ink-faint mt-0.5">{item.wt}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Practice Material block */}
                <div className="border-t border-line/60 pt-3">
                  <span className="text-[9px] font-bold tracking-wider text-ink-faint uppercase">Recommended Practice</span>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {[
                      { count: "12", type: "Repeated PYQs", icon: FileText },
                      { count: "20", type: "Flashcards", icon: BookOpen },
                      { count: "1", type: "Mock Quiz", icon: ShieldCheck },
                    ].map((card) => {
                      const Icon = card.icon;
                      return (
                        <div key={card.type} className="rounded border border-line bg-surface p-2 text-center">
                          <div className="mx-auto flex h-6 w-6 items-center justify-center rounded bg-accent-soft text-accent">
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <p className="mt-1.5 text-xs font-bold text-ink">{card.count}</p>
                          <p className="text-[9px] text-ink-faint truncate mt-0.5">{card.type}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
