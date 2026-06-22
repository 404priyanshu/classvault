"use client";

import { useState, type FormEvent } from "react";
import { Clock, Flame } from "lucide-react";
import type { AiExamPlanResponse, ApiError } from "@/lib/api-types";
import { cx } from "@/lib/cx";
import { useAppShell } from "@/components/app-shell/app-shell-context";
import { Button, Card, Input, Select, TextArea } from "@/components/ui";

async function readError(response: Response) {
  try {
    const body = (await response.json()) as ApiError;
    return body.error?.message ?? `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

export function ExamModeView() {
  const { me, openAuthPrompt } = useAppShell();
  const [subject, setSubject] = useState("");
  const [examDays, setExamDays] = useState("3");
  const [studyHours, setStudyHours] = useState("4");
  const [weakTopics, setWeakTopics] = useState("");

  const [plan, setPlan] = useState<AiExamPlanResponse | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<number>>(new Set());

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!subject.trim()) return;
    if (!me) {
      openAuthPrompt();
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          examDays: Number(examDays),
          studyHoursPerDay: Number(studyHours),
          weakTopics,
        }),
      });
      if (response.status === 401) {
        openAuthPrompt();
        return;
      }
      if (!response.ok) throw new Error(await readError(response));
      const result = (await response.json()) as AiExamPlanResponse;
      setPlan(result);
      setChecked(new Set());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not generate exam plan.");
    } finally {
      setGenerating(false);
    }
  }

  function toggleCheckpoint(index: number) {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <div className="space-y-6 pb-12">
      <p className="text-sm text-ink-soft">
        Exam coming up fast? Shift to Exam Mode for an urgent, high-yield final-prep plan.
      </p>

      {!plan ? (
        <Card padded className="max-w-xl p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs font-bold text-ink-soft">Exam Subject</span>
                <Input
                  type="text"
                  required
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="e.g. Operating Systems"
                  className="mt-1 h-10"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-bold text-ink-soft">Days Remaining</span>
                  <Select
                    value={examDays}
                    onChange={(event) => setExamDays(event.target.value)}
                    className="mt-1 h-10"
                  >
                    <option value="1">1 Day (Crisis Mode)</option>
                    <option value="2">2 Days</option>
                    <option value="3">3 Days (Recommended)</option>
                    <option value="5">5 Days</option>
                  </Select>
                </label>

                <label className="block">
                  <span className="text-xs font-bold text-ink-soft">Study Hours / Day</span>
                  <Input
                    type="number"
                    min="1"
                    max="16"
                    value={studyHours}
                    onChange={(event) => setStudyHours(event.target.value)}
                    className="mt-1 h-10"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-bold text-ink-soft">Weak Topics (optional)</span>
                <TextArea
                  value={weakTopics}
                  onChange={(event) => setWeakTopics(event.target.value)}
                  placeholder="e.g. Semaphores, Page replacement algorithms"
                  className="mt-1 h-20 resize-none"
                />
              </label>
            </div>

            {error ? <p className="text-xs text-red-600">{error}</p> : null}

            <Button type="submit" disabled={!subject.trim() || generating} className="h-10 w-full">
              {generating ? "Building plan…" : "Activate Exam Mode"}
            </Button>
          </form>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-800">
                Exam Mode Active
              </span>
              <h3 className="mt-1 text-lg font-bold text-ink">
                {subject} Crash Plan — {examDays} Day{examDays === "1" ? "" : "s"} Left
              </h3>
              <p className="text-[11px] text-ink-faint">
                {plan.contextNoteCount} ClassVault {plan.contextNoteCount === 1 ? "source" : "sources"} · {plan.model}
              </p>
            </div>
            <Button variant="secondary" onClick={() => setPlan(null)} className="w-full sm:w-auto">
              Reset Plan
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-6">
              <div className="space-y-3 rounded-lg border border-line bg-surface p-5">
                <div className="flex items-center gap-2 font-bold text-neutral-700">
                  <Flame className="h-4 w-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">Must Study (High-Yield)</h4>
                </div>
                <ul className="space-y-2.5">
                  {plan.mustStudy.map((item, index) => (
                    <li key={index} className="flex items-start gap-2.5 text-xs">
                      <span className="font-bold text-neutral-500">•</span>
                      <span className="min-w-0">
                        <span className="font-semibold text-ink">{item.topic}</span>
                        <span className="ml-1.5 font-mono text-[10px] font-bold text-neutral-700">
                          {item.examProbability}%
                        </span>
                        {item.why ? (
                          <span className="block text-[11px] text-ink-faint">{item.why}</span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {plan.canSkip.length ? (
                <div className="space-y-3 rounded-lg border border-line bg-surface p-5 opacity-85">
                  <div className="flex items-center gap-2 font-bold text-ink-soft">
                    <Clock className="h-4 w-4" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Low Yield (Okay to Skip)</h4>
                  </div>
                  <ul className="space-y-2 text-xs text-ink-soft">
                    {plan.canSkip.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span>•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <div className="space-y-4 rounded-lg border border-line bg-surface p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-faint">Practice Checkpoints</h4>
              <div className="space-y-3">
                {plan.checkpoints.map((item, index) => (
                  <label key={index} className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={checked.has(index)}
                      onChange={() => toggleCheckpoint(index)}
                      className="mt-0.5 rounded border-line text-neutral-600 focus:ring-neutral-500"
                    />
                    <span
                      className={cx(
                        "text-xs font-semibold leading-normal",
                        checked.has(index) ? "text-ink-faint line-through" : "text-ink-soft",
                      )}
                    >
                      {item}
                    </span>
                  </label>
                ))}
              </div>

              <div className="space-y-2 border-t border-line pt-4">
                <p className="text-[10px] font-semibold text-ink-faint">AI INSIGHT</p>
                <p className="text-xs italic leading-relaxed text-ink-soft">{plan.insight}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
