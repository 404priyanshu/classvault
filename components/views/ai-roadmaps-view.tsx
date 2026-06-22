"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { BookOpenCheck, Sparkles, Wand2, X, Zap } from "lucide-react";
import { useAppShell } from "@/components/app-shell/app-shell-context";
import type {
  AiRoadmapResponse,
  ApiError,
  ApiSavedRoadmap,
  ApiSavedRoadmapSummary,
  SavedRoadmapsResponse,
} from "@/lib/api-types";
import { cx } from "@/lib/cx";
import { Button, Modal } from "@/components/ui";
import {
  PREVIEW_ROADMAP,
  roadmapCompletedCount,
  type RoadmapDay,
} from "@/components/views/roadmaps/roadmap-data";
import { RoadmapTimelineChart } from "@/components/views/roadmaps/roadmap-timeline-chart";


export function AIRoadmapsView() {
  const { me, openAuthPrompt, setToast } = useAppShell();
  const [subject, setSubject] = useState("");
  const [days, setDays] = useState(5);
  const [level, setLevel] = useState("Beginner");
  const [goal, setGoal] = useState("Score high");
  const [usePersonal, setUsePersonal] = useState(true);
  const [useCommunity, setUseCommunity] = useState(true);
  const [usePYQ, setUsePYQ] = useState(true);
  const [useVideo, setUseVideo] = useState(true);

  const [generating, setGenerating] = useState(false);
  const [roadmap, setRoadmap] = useState<RoadmapDay[] | null>(null);

  // Loader step driver (reflects generation stages; no fabricated counters).
  const [loaderStep, setLoaderStep] = useState(0);
  const [generationMeta, setGenerationMeta] = useState<{
    provider: AiRoadmapResponse["provider"];
    model: string;
    contextNoteCount: number;
  } | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  // Active Selected Day States
  const [activeDay, setActiveDay] = useState(0);
  const [activePreviewDay, setActivePreviewDay] = useState(0);

  // Interactive Preview State
  const [previewRoadmap, setPreviewRoadmap] = useState<RoadmapDay[]>(PREVIEW_ROADMAP);
  const [hoveredPreviewDay, setHoveredPreviewDay] = useState<number | null>(null);

  // For aborting in-flight generation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Persistence: the saved row backing the current roadmap, the user's saved
  // list (for the resume picker), and a debounce timer for progress syncs.
  const [savedRoadmapId, setSavedRoadmapId] = useState<string | null>(null);
  const [savedList, setSavedList] = useState<ApiSavedRoadmapSummary[]>([]);
  const [resumingId, setResumingId] = useState<string | null>(null);
  const progressSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function refreshSavedList(signal?: AbortSignal) {
    try {
      const response = await fetch("/api/me/roadmaps", { signal });
      if (response.ok) {
        setSavedList(((await response.json()) as SavedRoadmapsResponse).items);
      }
    } catch {
      // not signed in or offline: leave the list as-is
    }
  }

  // Load the saved-roadmaps list for the resume picker.
  useEffect(() => {
    if (!me?.id) return;
    const controller = new AbortController();
    void (async () => {
      await refreshSavedList(controller.signal);
    })();
    return () => controller.abort();
  }, [me?.id]);

  // Debounced progress sync. Content is immutable server-side; only done[] moves.
  function scheduleProgressSave(id: string, plan: RoadmapDay[]) {
    if (progressSaveRef.current) clearTimeout(progressSaveRef.current);
    progressSaveRef.current = setTimeout(() => {
      void fetch(`/api/me/roadmaps/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      }).catch(() => {
        // best-effort; local state already reflects the toggle
      });
    }, 700);
  }

  async function openSavedRoadmap(id: string) {
    setResumingId(id);
    try {
      const response = await fetch(`/api/me/roadmaps/${id}`);
      if (!response.ok) return;
      const saved = (await response.json()) as ApiSavedRoadmap;
      setSubject(saved.subject);
      setDays(saved.days);
      setLevel(saved.level);
      setGoal(saved.goal);
      setGenerationMeta({
        provider: saved.provider,
        model: saved.model,
        contextNoteCount: saved.contextNoteCount,
      });
      setSavedRoadmapId(saved.id);
      setRoadmap(saved.plan);
      setActiveDay(0);
    } catch {
      // ignore; picker stays open
    } finally {
      setResumingId(null);
    }
  }

  async function deleteSavedRoadmap(id: string) {
    const snapshot = savedList;
    setSavedList((current) => current.filter((item) => item.id !== id));
    if (savedRoadmapId === id) setSavedRoadmapId(null);
    try {
      const response = await fetch(`/api/me/roadmaps/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("delete failed");
    } catch {
      setSavedList(snapshot);
    }
  }

  function togglePreviewTaskCheckbox(dayIdx: number, taskIdx: number) {
    setPreviewRoadmap((current) =>
      current.map((day, dIdx) => {
        if (dIdx !== dayIdx) return day;
        const newDone = [...day.done];
        newDone[taskIdx] = !newDone[taskIdx];
        return { ...day, done: newDone };
      }),
    );
  }

  async function readError(response: Response) {
    try {
      const body = (await response.json()) as ApiError;
      return body.error?.message ?? `Request failed (${response.status})`;
    } catch {
      return `Request failed (${response.status})`;
    }
  }

  async function handleGenerate(e: FormEvent) {
    e.preventDefault();
    if (!subject.trim()) return;
    if (!me) {
      openAuthPrompt();
      return;
    }

    // Setup abort controller for cancel support
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setGenerating(true);
    setLoaderStep(0);
    setGenerateError(null);
    setGenerationMeta(null);

    try {
      const response = await fetch("/api/ai/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          days,
          level,
          goal,
          sources: {
            personal: usePersonal,
            community: useCommunity,
            pyq: usePYQ,
            video: useVideo,
          },
        }),
        signal: controller.signal,
      });

      if (response.status === 401) {
        openAuthPrompt();
        return;
      }
      if (!response.ok) throw new Error(await readError(response));

      const result = (await response.json()) as AiRoadmapResponse;
      setRoadmap(result.days);
      setGenerationMeta({
        provider: result.provider,
        model: result.model,
        contextNoteCount: result.contextNoteCount,
      });
      setActiveDay(0);
      setSavedRoadmapId(null);
      setToast("Roadmap generated.");

      // Auto-save so the plan survives refresh and shows in the resume picker.
      void (async () => {
        try {
          const saveResponse = await fetch("/api/me/roadmaps", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subject,
              days,
              level,
              goal,
              provider: result.provider,
              model: result.model,
              contextNoteCount: result.contextNoteCount,
              plan: result.days,
            }),
          });
          if (saveResponse.ok) {
            const saved = (await saveResponse.json()) as ApiSavedRoadmap;
            setSavedRoadmapId(saved.id);
            void refreshSavedList();
          }
        } catch {
          // generation still succeeded; saving is best-effort
        }
      })();
    } catch (error: unknown) {
      const err = error as Error & { name?: string };
      if (err.name === "AbortError") {
        // User cancelled — do not treat as error
        setGenerateError(null);
        return;
      }
      setGenerateError(err instanceof Error ? err.message : "Could not generate roadmap.");
    } finally {
      setGenerating(false);
      abortControllerRef.current = null;
    }
  }

  function stopGeneration() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setGenerating(false);
    setGenerateError(null);
    abortControllerRef.current = null;
  }

  // Advance the loader step labels while generation runs.
  useEffect(() => {
    if (!generating) return;
    const stepTimer = window.setInterval(() => {
      setLoaderStep((s) => Math.min(s + 1, 3));
    }, 1250);
    return () => window.clearInterval(stepTimer);
  }, [generating]);

  function toggleTaskCheckbox(dayIdx: number, taskIdx: number) {
    if (!roadmap) return;
    const next = roadmap.map((day, dIdx) => {
      if (dIdx !== dayIdx) return day;
      const newDone = [...day.done];
      newDone[taskIdx] = !newDone[taskIdx];
      return { ...day, done: newDone };
    });
    setRoadmap(next);
    if (savedRoadmapId) scheduleProgressSave(savedRoadmapId, next);
  }

  function handleTriggerQuiz(dayTitle: string) {
    setShowQuiz(dayTitle);
    setAnswers({});
    setQuizScore(null);
  }

  return (
    <div className="space-y-10 pb-16">
      {/* Luxurious, rewarding AI header */}
      <div className=" pt-2">
        <div className="flex items-center gap-4">
          <div
                        className="ai-badge inline-flex h-11 w-11 items-center justify-center rounded-lg bg-accent-soft ring-1 ring-inset ring-accent/30 shadow-inner"
          >
            <Sparkles className="h-5 w-5 text-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-accent/70">
                CLASSVAULT • AI STUDIO
              </div>
            </div>
            <h1 className="text-xl leading-none font-semibold tracking-tight text-ink">
              Your Perfect Study Roadmap
            </h1>
          </div>
        </div>
        <p
          className="no-native-text-check mt-3 max-w-[58ch] text-[13px] leading-relaxed text-ink-soft"
          spellCheck={false}
          data-gramm="false"
          data-ms-editor="false"
        >
          AI synthesizes a personalized, prerequisite-perfect plan from your files, the community
          vault, and real exams. Play with the live sandbox below. Every generation feels like
          magic.
        </p>
      </div>

      {!roadmap && (
        <div className="min-w-0 space-y-8">
          {/* Resume a previously saved roadmap */}
          {savedList.length > 0 && (
            <div className="roadmap-premium-card min-w-0 rounded-lg border border-line bg-surface p-5 shadow-sm sm:p-6">
              <div className="mb-3 flex items-center gap-2.5">
                <div className="rounded-md bg-accent/10 p-1.5">
                  <BookOpenCheck className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold tracking-tight text-ink">Resume a saved roadmap</span>
                  <div className="-mt-0.5 text-[10px] text-ink-faint">Your plans and progress are saved automatically</div>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {savedList.map((item) => (
                  <div
                    key={item.id}
                    className="group flex items-center gap-3 rounded-md border border-line bg-paper p-3 transition hover:border-line-strong"
                  >
                    <button
                      type="button"
                      onClick={() => openSavedRoadmap(item.id)}
                      disabled={resumingId === item.id}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:opacity-60"
                    >
                      <div className="relative h-9 w-9 shrink-0">
                        <svg width={36} height={36} className="rotate-[-90deg]">
                          <circle cx={18} cy={18} r={15} fill="none" stroke="var(--line)" strokeWidth={3} />
                          <circle
                            cx={18}
                            cy={18}
                            r={15}
                            fill="none"
                            stroke="var(--accent)"
                            strokeWidth={3}
                            strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 15}
                            strokeDashoffset={2 * Math.PI * 15 * (1 - item.progress / 100)}
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center font-mono text-[8px] font-bold text-accent">
                          {item.progress}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-semibold text-ink">{item.subject}</div>
                        <div className="truncate font-mono text-[10px] text-ink-faint">
                          {item.days}d · {item.level} · {item.goal}
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSavedRoadmap(item.id)}
                      aria-label="Delete saved roadmap"
                      className="shrink-0 p-1 text-ink-faint opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Premium Composer — the "create magic" moment */}
          <div className="roadmap-premium-card min-w-0 rounded-lg border border-line bg-surface p-5 shadow-sm sm:p-6 reward-glow">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="rounded-md bg-accent/10 p-1.5">
                  <Wand2 className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold tracking-tight text-ink">
                    Compose Your AI Plan
                  </span>
                  <div className="text-[10px] text-ink-faint -mt-0.5">
                    Tell the AI exactly what you need
                  </div>
                </div>
              </div>
              <div className="rounded-full border border-accent/20 bg-accent-soft px-3 py-0.5 text-[9px] font-bold text-accent">
                Gemini + your vault
              </div>
            </div>

                          {!generating ? (
                <form
                  key="config-form"
                  onSubmit={handleGenerate}
                  className="space-y-4"
                                                    >
                  <div className="grid gap-3">
                    {/* Row 1: Subject and Duration */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <label className="block min-w-0 sm:col-span-2">
                        <span className="text-[11px] font-bold text-ink-soft">Study Subject</span>
                        <input
                          type="text"
                          required
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="e.g. Computer Networks, DBMS, Operating Systems"
                          className="mt-1 h-9 w-full min-w-0 rounded-md border border-line bg-paper px-3 text-xs outline-none transition focus:border-line-strong focus:bg-surface focus:ring-1 focus:ring-accent/30"
                        />
                      </label>

                      <label className="block min-w-0">
                        <span className="text-[11px] font-bold text-ink-soft">Target Duration</span>
                        <select
                          value={days}
                          onChange={(e) => setDays(Number(e.target.value))}
                          className="mt-1 h-9 w-full min-w-0 rounded-md border border-line bg-paper px-3 text-xs outline-none transition focus:border-line-strong focus:bg-surface focus:ring-1 focus:ring-accent/30"
                        >
                          <option value={3}>3 Days (Exam Sprint)</option>
                          <option value={5}>5 Days (Recommended)</option>
                          <option value={7}>7 Days (Deep Learning)</option>
                        </select>
                      </label>
                    </div>

                    {/* Row 2: Level and Goal — beautiful segmented */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="block min-w-0">
                        <span className="text-[11px] font-bold text-ink-soft">Current Level</span>
                        <div className="mt-1 flex min-w-0 gap-1 rounded-lg border border-line bg-paper p-0.5">
                          {["Beginner", "Okay", "Strong"].map((lvl) => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => setLevel(lvl)}
                              className={cx(
                                "min-w-0 flex-1 rounded py-1 text-[11px] font-bold transition active:scale-[0.985]",
                                level === lvl
                                  ? "bg-ink text-surface shadow-sm"
                                  : "text-ink-soft hover:text-ink hover:bg-surface",
                              )}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>
                      </label>

                      <label className="block min-w-0">
                        <span className="text-[11px] font-bold text-ink-soft">Study Goal</span>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {[
                            "Pass quickly",
                            "Score high",
                            "Deep understanding",
                            "Interview prep",
                          ].map((gl) => (
                            <button
                              key={gl}
                              type="button"
                              onClick={() => setGoal(gl)}
                              className={cx(
                                "rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition active:scale-[0.985]",
                                goal === gl
                                  ? "border-accent bg-accent-soft text-accent shadow-sm"
                                  : "border-line text-ink-soft hover:border-line-strong hover:text-ink hover:bg-paper",
                              )}
                            >
                              {gl}
                            </button>
                          ))}
                        </div>
                      </label>
                    </div>

                    {/* Row 3: Ingestion Source Materials */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-ink-soft block">
                        Ingestion Source Materials
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          {
                            label: "Use personal resources",
                            val: usePersonal,
                            set: setUsePersonal,
                          },
                          {
                            label: "Use community resources",
                            val: useCommunity,
                            set: setUseCommunity,
                          },
                          { label: "Include PYQ sets", val: usePYQ, set: setUsePYQ },
                          { label: "Video lectures & websites", val: useVideo, set: setUseVideo },
                        ].map((toggle) => (
                          <label
                            key={toggle.label}
                            className="flex items-center gap-2 cursor-pointer text-[11px] font-semibold text-ink-soft hover:text-ink"
                          >
                            <input
                              type="checkbox"
                              checked={toggle.val}
                              onChange={(e) => toggle.set(e.target.checked)}
                              className="rounded border-line text-accent focus:ring-accent accent-accent"
                            />
                            <span className="truncate" title={toggle.label}>
                              {toggle.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-1">
                    <div className="text-[10px] text-ink-faint mb-1.5 text-center font-medium tracking-wider">
                      AI will craft a perfect plan from your selected sources
                    </div>
                    <Button type="submit" icon={<Zap className="h-4 w-4" />} className="h-11 w-full">
                      Generate AI Roadmap
                    </Button>
                  </div>

                  {generateError ? (
                    <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                      {generateError}
                    </p>
                  ) : null}
                </form>
              ) : (
                /* Minimal generation state */
                <div key="generating" className="rounded-md border border-line bg-surface p-6">
                  <div className="text-sm font-semibold text-ink">Building your study path</div>
                  <div className="mt-0.5 text-xs text-ink-soft">
                    Generating from your selected sources…
                  </div>

                  <div className="mt-4 space-y-1.5">
                    {[
                      "Scanning your vault & community notes",
                      "Mapping prerequisites & difficulty",
                      "Weighting to your level + goal",
                      "Injecting high-yield PYQs & resources",
                    ].map((label, index) => {
                      const isActive = loaderStep === index;
                      const isDone = loaderStep > index;
                      return (
                        <div
                          key={index}
                          className={cx(
                            "flex items-center gap-3 rounded-md border border-line px-3 py-2 text-xs",
                            isActive ? "bg-paper text-ink" : isDone ? "text-ink-soft" : "text-ink-faint",
                          )}
                        >
                          <div
                            className={cx(
                              "grid h-4 w-4 shrink-0 place-items-center rounded text-[10px] font-medium",
                              isDone ? "bg-ink text-surface" : isActive ? "border border-ink text-ink" : "border border-line text-ink-faint",
                            )}
                          >
                            {isDone ? "✓" : index + 1}
                          </div>
                          <div className="flex-1 leading-tight">{label}</div>
                        </div>
                      );
                    })}
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={stopGeneration}
                    icon={<X className="h-3.5 w-3.5" />}
                    className="mt-5"
                  >
                    Stop generation
                  </Button>
                </div>
              )}
                      </div>

          {/* Live Interactive Sandbox — a gorgeous, rewarding playground */}
          <div className="roadmap-premium-card min-w-0 space-y-5 rounded-lg border border-line bg-surface p-5 shadow-sm sm:p-6 reward-glow">
            <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-md border border-accent/30 bg-accent/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                  LIVE SANDBOX
                </span>
                <div>
                  <div className="text-sm font-semibold tracking-tight text-ink">
                    Play with the demo
                  </div>
                  <div className="text-[11px] text-ink-soft -mt-0.5">
                    Toggle tasks and switch days — this is exactly how your real roadmap will feel
                  </div>
                </div>
              </div>
              <div className="rounded-md border border-line bg-paper px-4 py-1 text-center">
                <div className="text-[10px] font-mono font-bold tracking-widest text-ink-faint">
                  DEMO
                </div>
                <div className="text-xs font-semibold text-ink-soft -mt-0.5">
                  Computer Networks • 5 Days
                </div>
              </div>
            </div>

            {/* Live overall demo progress — makes the sandbox feel rewarding even in preview mode */}
            {(() => {
              const demoTotal = previewRoadmap.reduce((sum, d) => sum + d.done.length, 0);
              const demoDone = previewRoadmap.reduce(
                (sum, d) => sum + d.done.filter(Boolean).length,
                0,
              );
              const demoPct = demoTotal ? Math.round((demoDone / demoTotal) * 100) : 0;
              return (
                <div className="flex items-center gap-3 rounded-md bg-paper border border-line px-4 py-2 text-xs">
                  <div className="font-mono font-semibold text-ink">{demoPct}%</div>
                  <div className="flex-1 h-1.5 rounded-full bg-line overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all"
                      style={{ width: `${demoPct}%` }}
                    />
                  </div>
                  <div className="text-ink-faint font-medium">
                    {demoDone}/{demoTotal} demo tasks complete
                  </div>
                </div>
              );
            })()}

            <RoadmapTimelineChart
              days={previewRoadmap}
              activeIndex={activePreviewDay}
              hoveredIndex={hoveredPreviewDay}
              onSelect={setActivePreviewDay}
              onHover={setHoveredPreviewDay}
            />

            {/* Active Day Detail Panel for Preview — now as luxurious and rewarding as the real thing */}
                          <div
                key={activePreviewDay}
                                                                                className="mt-6 space-y-5 border-t border-line pt-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 flex-col gap-1.5 min-[420px]:flex-row min-[420px]:items-center">
                    <span className="inline-block w-fit rounded-md bg-accent-soft px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-accent">
                      Day {previewRoadmap[activePreviewDay].day} Focus
                    </span>
                    <h4 className="min-w-0 text-base font-semibold tracking-tight text-ink leading-tight">
                      {previewRoadmap[activePreviewDay].title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-success/10 px-3 py-1.5 text-center font-mono text-xs font-bold text-success">
                      {Math.round(
                        (previewRoadmap[activePreviewDay].done.filter(Boolean).length /
                          previewRoadmap[activePreviewDay].done.length) *
                          100,
                      )}
                      % done
                    </div>
                  </div>
                </div>

                <div className="rounded-md border border-line bg-paper p-5 text-sm leading-relaxed text-ink-soft">
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                    Core Focus
                  </div>
                  {previewRoadmap[activePreviewDay].topic}
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Tasks — matching the gorgeous generated experience */}
                  <div>
                    <div className="mb-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-ink-faint">
                      <span>Action Checklist</span>
                      <span>
                        {previewRoadmap[activePreviewDay].done.filter(Boolean).length} /{" "}
                        {previewRoadmap[activePreviewDay].done.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {[
                        ...previewRoadmap[activePreviewDay].tasks,
                        ...previewRoadmap[activePreviewDay].pyqs,
                      ].map((task, tIdx) => (
                        <div
                          key={tIdx}
                          className="gorgeous-task group flex items-start gap-3.5 rounded-md border border-line/70 bg-surface p-3.5 transition hover:border-accent/30 hover:bg-paper"
                        >
                          <button
                            onClick={() => togglePreviewTaskCheckbox(activePreviewDay, tIdx)}
                            className={cx(
                              "mt-px flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-lg border text-[10px] font-semibold transition-all active:scale-95",
                              previewRoadmap[activePreviewDay].done[tIdx]
                                ? "border-neutral-500 bg-neutral-500 text-white shadow-inner"
                                : "border-line-strong bg-white group-hover:border-accent group-hover:bg-accent-soft",
                            )}
                          >
                            {previewRoadmap[activePreviewDay].done[tIdx] ? "✓" : null}
                          </button>
                          <span
                            className={cx(
                              "text-[13px] leading-snug font-medium transition-all",
                              previewRoadmap[activePreviewDay].done[tIdx]
                                ? "text-ink-faint line-through"
                                : "text-ink",
                            )}
                          >
                            {task}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Resources — elegant curated list (matches generated) */}
                  <div>
                    <div className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-ink-faint">
                      Curated Resources
                    </div>
                    <div className="space-y-2">
                      {previewRoadmap[activePreviewDay].resources.map((res, rIdx) => (
                        <div
                          key={rIdx}
                          className="flex items-center gap-3 rounded-md border border-line bg-paper px-4 py-3 text-sm text-ink-soft transition hover:border-line-strong"
                        >
                          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-surface text-base">
                            📘
                          </div>
                          <span className="font-medium leading-tight">{res}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-[10px] text-ink-faint">
                      Toggle tasks above — watch the progress update live. This is your future
                      roadmap.
                    </div>
                  </div>
                </div>
              </div>
                      </div>
        </div>
      )}

      {roadmap && (
        <div
          className="space-y-8"
                                      >
          {/* Hero Reward Header — this is the "you did it" moment */}
          <div className="roadmap-premium-card rounded-lg border border-accent/20 bg-surface p-6 sm:p-7 reward-glow">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-neutral-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-neutral-600">
                    AI GENERATION COMPLETE
                  </span>
                </div>
                <h2 className="mt-2 text-2xl font-semibold tracking-tighter text-ink">
                  {subject} — {days}-Day Mastery Path
                </h2>
                <p className="mt-1 text-sm text-ink-soft">
                  Tailored for <span className="font-medium text-ink">{goal}</span> • {level} level
                  • Built from {generationMeta?.contextNoteCount ?? "your"} sources
                </p>
              </div>

              {/* Big rewarding progress ring + stats */}
              <div className="flex items-center gap-5">
                {(() => {
                  const totalTasks = roadmap.reduce((sum, d) => sum + d.done.length, 0);
                  const doneTasks = roadmap.reduce((sum, d) => sum + roadmapCompletedCount(d), 0);
                  const pct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;
                  const size = 68;
                  const stroke = 6;
                  const r = (size - stroke) / 2;
                  const circ = 2 * Math.PI * r;
                  const offset = circ * (1 - pct / 100);

                  return (
                    <div className="flex items-center gap-4">
                      <div className="relative" style={{ width: size, height: size }}>
                        <svg width={size} height={size} className="rotate-[-90deg]">
                          <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={r}
                            fill="none"
                            stroke="var(--line)"
                            strokeWidth={stroke}
                          />
                          <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={r}
                            fill="none"
                            stroke="var(--accent)"
                            strokeWidth={stroke}
                            strokeLinecap="round"
                            strokeDasharray={circ}
                            strokeDashoffset={offset}
                            className="progress-ring"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="font-mono text-xl font-semibold tabular-nums text-ink">
                              {pct}
                            </div>
                            <div className="text-[8px] -mt-1 font-bold tracking-widest text-ink-faint">
                              DONE
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm leading-tight">
                        <div className="font-semibold text-ink">
                          {doneTasks} / {totalTasks} tasks
                        </div>
                        <div className="text-ink-soft text-xs">Your journey is {pct}% complete</div>
                      </div>
                    </div>
                  );
                })()}

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setRoadmap(null);
                    setGenerationMeta(null);
                    setGenerateError(null);
                    setSavedRoadmapId(null);
                  }}
                  className="whitespace-nowrap"
                >
                  Start new plan
                </Button>
              </div>
            </div>
          </div>

          {/* The beautiful timeline (preserved + elevated) */}
          <div className="relative min-w-0 overflow-hidden rounded-lg border border-line bg-surface p-5 shadow-sm sm:p-7 roadmap-premium-card">
            <div className="mb-4 flex items-center justify-between border-b border-line pb-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                  Your Visual Journey
                </span>
                <div className="text-lg font-semibold tracking-tight">Timeline & Progress</div>
              </div>
              <div className="text-xs font-mono text-ink-soft">
                {roadmap.length} sessions •{" "}
                {generationMeta ? (generationMeta.provider === "gemini" ? "Gemini" : "OpenAI") : ""}
              </div>
            </div>

            <RoadmapTimelineChart
              days={roadmap}
              activeIndex={activeDay}
              hoveredIndex={hoveredDay}
              onSelect={setActiveDay}
              onHover={setHoveredDay}
              includeClassroomMaterials
            />

            {/* Luxurious Day Detail Panel */}
                          <div
                key={activeDay}
                                                                                className="mt-7 space-y-5 border-t border-line pt-7"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 flex-col gap-1.5 min-[420px]:flex-row min-[420px]:items-center">
                    <span className="inline-block w-fit rounded-md bg-accent-soft px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-accent">
                      Day {roadmap[activeDay].day} Focus
                    </span>
                    <h4 className="min-w-0 text-base font-semibold tracking-tight text-ink leading-tight">
                      {roadmap[activeDay].title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleTriggerQuiz(roadmap[activeDay].title)}
                      icon={<Zap className="h-3.5 w-3.5" />}
                    >
                      Practice Quiz
                    </Button>
                    <div className="rounded-md bg-neutral-500/10 px-3 py-1.5 text-center font-mono text-xs font-bold text-neutral-600">
                      {Math.round(
                        (roadmap[activeDay].done.filter(Boolean).length /
                          roadmap[activeDay].done.length) *
                          100,
                      )}
                      % done
                    </div>
                  </div>
                </div>

                <div className="rounded-md border border-line bg-paper p-5 text-sm leading-relaxed text-ink-soft">
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                    Core Focus
                  </div>
                  {roadmap[activeDay].topic}
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Tasks — ultra satisfying checklist */}
                  <div>
                    <div className="mb-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-ink-faint">
                      <span>Action Checklist</span>
                      <span>
                        {roadmap[activeDay].done.filter(Boolean).length} /{" "}
                        {roadmap[activeDay].done.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {[...roadmap[activeDay].tasks, ...roadmap[activeDay].pyqs].map(
                        (task, tIdx) => (
                          <div
                            key={tIdx}
                            className="gorgeous-task group flex items-start gap-3.5 rounded-md border border-line/70 bg-surface p-3.5 transition hover:border-accent/30 hover:bg-paper"
                          >
                            <button
                              onClick={() => toggleTaskCheckbox(activeDay, tIdx)}
                              className={cx(
                                "mt-px flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-lg border text-[10px] font-semibold transition-all active:scale-95",
                                roadmap[activeDay].done[tIdx]
                                  ? "border-neutral-500 bg-neutral-500 text-white shadow-inner"
                                  : "border-line-strong bg-white group-hover:border-accent group-hover:bg-accent-soft",
                              )}
                            >
                              {roadmap[activeDay].done[tIdx] ? "✓" : null}
                            </button>
                            <span
                              className={cx(
                                "text-[13px] leading-snug font-medium transition-all",
                                roadmap[activeDay].done[tIdx]
                                  ? "text-ink-faint line-through"
                                  : "text-ink",
                              )}
                            >
                              {task}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  {/* Resources — beautiful curated list */}
                  <div>
                    <div className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-ink-faint">
                      Curated Resources
                    </div>
                    <div className="space-y-2">
                      {roadmap[activeDay].resources.map((res, rIdx) => (
                        <div
                          key={rIdx}
                          className="flex items-center gap-3 rounded-md border border-line bg-paper px-4 py-3 text-sm text-ink-soft transition hover:border-line-strong"
                        >
                          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-surface text-base">
                            📘
                          </div>
                          <span className="font-medium leading-tight">{res}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-[10px] text-ink-faint">
                      Click tasks above to mark progress — your roadmap updates live.
                    </div>
                  </div>
                </div>
              </div>
                      </div>
        </div>
      )}

      {/* Practice quiz dialog */}
      <Modal open={!!showQuiz} onClose={() => setShowQuiz(null)} label="AI Practice Quiz" className="max-w-md">
            <div className="space-y-4 p-5">
              <div className="flex items-center justify-between border-b border-line pb-2.5">
                <h4 className="text-xs font-bold uppercase text-accent tracking-wider leading-none">
                  AI Practice Quiz
                </h4>
                <button onClick={() => setShowQuiz(null)} className="text-ink-faint hover:text-ink">
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-semibold text-ink leading-relaxed">Test: {showQuiz}</p>
                <div className="space-y-2.5">
                  {[
                    {
                      q: "1. Which protocol provides reliable connection-oriented packet deliveries?",
                      o: ["UDP", "TCP", "IP", "DNS"],
                      a: 1,
                    },
                    {
                      q: "2. What is the default size of an IPv4 address?",
                      o: ["32 bits", "64 bits", "128 bits", "48 bits"],
                      a: 0,
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="space-y-1.5 border border-line p-3 rounded-lg bg-paper"
                    >
                      <p className="text-xs font-bold text-ink">{item.q}</p>
                      <div className="grid gap-2 min-[380px]:grid-cols-2">
                        {item.o.map((opt, oIdx) => (
                          <button
                            key={oIdx}
                            type="button"
                            onClick={() => setAnswers((prev) => ({ ...prev, [idx]: oIdx }))}
                            className={cx(
                              "py-1.5 px-2 rounded border text-[11px] font-semibold transition text-left",
                              answers[idx] === oIdx
                                ? "border-accent bg-accent-soft text-accent"
                                : "border-line bg-surface hover:bg-paper",
                            )}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {quizScore !== null ? (
                <div className="p-3 bg-neutral-50 border border-neutral-100 rounded text-center">
                  <p className="text-xs font-bold text-neutral-800">
                    Quiz Completed! Score: {quizScore} / 2
                  </p>
                </div>
              ) : (
                <Button
                  onClick={() => {
                    let correct = 0;
                    if (answers[0] === 1) correct++;
                    if (answers[1] === 0) correct++;
                    setQuizScore(correct);
                  }}
                  disabled={answers[0] === undefined || answers[1] === undefined}
                  className="w-full"
                >
                  Submit Answers
                </Button>
              )}
            </div>
      </Modal>
          </div>
  );
}

// -----------------------------------------------------------------
// EXAM MODE VIEW
// -----------------------------------------------------------------
