"use client";

import { useState, type FormEvent } from "react";
import { Clock, Flame } from "lucide-react";

export function ExamModeView() {
  const [subject, setSubject] = useState("");
  const [examDays, setExamDays] = useState("3");
  const [studyHours, setStudyHours] = useState("4");
  const [weakTopics, setWeakTopics] = useState("");
  const [planGenerated, setPlanGenerated] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!subject.trim()) return;
    setPlanGenerated(true);
  }

  return (
    <div className="space-y-6 pb-12">
      <p className="text-sm text-ink-soft">
        Exam is in 3 days? Shift to Exam Mode for an urgent, high-yield final prep checklist.
      </p>

      {!planGenerated ? (
        <div className="rounded-xl border border-line bg-surface p-5 shadow-sm max-w-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs font-bold text-ink-soft">Exam Subject</span>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Operating Systems"
                  className="mt-1 h-10 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none transition focus:border-line-strong focus:bg-surface"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-bold text-ink-soft">Days Remaining</span>
                  <select
                    value={examDays}
                    onChange={(e) => setExamDays(e.target.value)}
                    className="mt-1 h-10 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none transition focus:border-line-strong focus:bg-surface"
                  >
                    <option value="1">1 Day (Crisis Mode)</option>
                    <option value="2">2 Days</option>
                    <option value="3">3 Days (Recommended)</option>
                    <option value="5">5 Days</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-bold text-ink-soft">Study Hours / Day</span>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    value={studyHours}
                    onChange={(e) => setStudyHours(e.target.value)}
                    className="mt-1 h-10 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none transition focus:border-line-strong focus:bg-surface"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-bold text-ink-soft">Weak Topics (optional)</span>
                <textarea
                  value={weakTopics}
                  onChange={(e) => setWeakTopics(e.target.value)}
                  placeholder="e.g. Semaphores, Page replacement algorithms"
                  className="mt-1 w-full rounded-md border border-line bg-paper p-3 text-sm outline-none transition focus:border-line-strong focus:bg-surface h-20 resize-none"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={!subject.trim()}
              className="inline-flex h-10 w-full items-center justify-center rounded-md bg-amber-600 text-sm font-semibold text-surface transition hover:bg-amber-700 disabled:opacity-60"
            >
              Activate Exam Mode
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                Exam Mode Active
              </span>
              <h3 className="text-lg font-bold text-ink mt-1">
                {subject} Crash Plan — {examDays} Days Left
              </h3>
            </div>
            <button
              onClick={() => setPlanGenerated(false)}
              className="inline-flex h-9 w-full items-center justify-center rounded border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-paper sm:w-auto"
            >
              Reset Plan
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">

            {/* Must Study & Skip Columns */}
            <div className="space-y-6">
              {/* Must Study */}
              <div className="rounded-xl border border-line bg-surface p-5 space-y-3 shadow-sm">
                <div className="flex items-center gap-2 text-amber-700 font-bold">
                  <Flame className="h-4 w-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">Must Study (High-Yield)</h4>
                </div>
                <ul className="space-y-2">
                  {[
                    "1. Processes vs Threads & IPC protocols — 85% Exam Probability",
                    "2. CPU Scheduling algorithms (FCFS, SJF, RR) — 80% Exam Probability",
                    "3. Classical synchronization issues (Bounded Buffer, Semaphores) — 75% Exam Probability",
                    "4. Paging, Virtual Memory & TLB caches — 70% Exam Probability",
                  ].map((topic, i) => (
                    <li key={i} className="text-xs text-ink font-semibold flex items-start gap-2.5">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Can Skip */}
              <div className="rounded-xl border border-line bg-surface p-5 space-y-3 shadow-sm opacity-85">
                <div className="flex items-center gap-2 text-ink-soft font-bold">
                  <Clock className="h-4 w-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">Low Yield (Okay to Skip if low time)</h4>
                </div>
                <ul className="space-y-2 text-xs text-ink-soft">
                  {[
                    "1. OS Implementation histories and monolithic internals",
                    "2. Disk scheduling optimization equations",
                    "3. Secondary storage hardware interface mappings",
                  ].map((skip, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span>•</span>
                      <span>{skip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Practice checklist */}
            <div className="rounded-xl border border-line bg-surface p-5 space-y-4 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-faint">Practice Checkpoints</h4>

              <div className="space-y-3">
                {[
                  "Complete 12 repeated branch PYQs",
                  "Revise 25 core OS Flashcards",
                  "Attempt 1 Mock Exam Sprint Quiz",
                  "Final revision of CPU scheduling Gantt charts",
                ].map((practice, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="rounded border-line text-amber-600 focus:ring-amber-500 mt-0.5"
                    />
                    <span className="text-xs font-semibold text-ink-soft leading-normal">
                      {practice}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-line pt-4 space-y-2">
                <p className="text-[10px] text-ink-faint font-semibold">AI INSIGHT</p>
                <p className="text-xs text-ink-soft leading-relaxed italic">
                  &quot;Based on analyzed student logs, spending 45 mins drawing scheduling Gantt charts increases related question scores by 34%. Avoid studying Monolithic vs Microkernel internals in the final 24 hours.&quot;
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
