"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { BookOpenCheck, CheckCircle2, Clock, Sparkles, Wand2, X, Zap } from "lucide-react";
import { useAppShell } from "@/components/app-shell/app-shell-context";
import type {
  AiRoadmapResponse,
  ApiError,
  ApiRoadmapDay,
  ApiSavedRoadmap,
  ApiSavedRoadmapSummary,
  SavedRoadmapsResponse,
} from "@/lib/api-types";
import { cx } from "@/lib/cx";

type RoadmapDay = ApiRoadmapDay;

const PREVIEW_ROADMAP: RoadmapDay[] = [
  {
    day: 1,
    title: "Foundations & Layering Paradigms",
    topic:
      "Introduction to layered protocols, TCP/IP stack vs OSI model, packet switching basics, and performance metrics (delay, loss).",
    resources: [
      "Introduction to Layers & Protocols.pdf",
      "Computer Networks: System Approach (Slides)",
      "Network Architecture 101 (YouTube)",
    ],
    tasks: [
      "Read Layering paradigms slide deck",
      "Explain propagation vs transmission delay differences",
      "Summarize peer-to-peer vs client-server models",
    ],
    pyqs: [
      "State differences between OSI and TCP/IP protocol architectures (2024, 2022 repeats)",
      "Calculate throughput for a multi-hop link (2023 exam)",
    ],
    done: [true, false, false, false, false],
  },
  {
    day: 2,
    title: "Link Layer & Media Access Control",
    topic:
      "Error detection (parity, CRC), sliding window protocols, multiple access protocols (CSMA/CD, CSMA/CA), Ethernet, and switching.",
    resources: [
      "Sliding Window Protocols Visual Guide.pdf",
      "CRC Error Detection Solver",
      "CSMA/CD Collision Resolution Note",
    ],
    tasks: [
      "Attempt 5 practice questions on CRC generation and validation",
      "Verify sliding window sequence numbers",
      "Understand MAC vs IP address resolutions",
    ],
    pyqs: [
      "Describe sliding window flow control protocols (2023, 2021 repeat)",
      "Show how switch learns MAC addresses dynamically (2022 exam)",
    ],
    done: [true, true, false, false, false],
  },
  {
    day: 3,
    title: "Routing Algorithms & Subnetting",
    topic:
      "IP addressing, CIDR subnetting, Distance Vector vs Link State routing, packet forwarding mechanics, and NAT mappings.",
    resources: [
      "IP Subnetting Cheat Sheet.pdf",
      "Dijkstra Routing Visualizer",
      "NAT Port Mapping Handout",
    ],
    tasks: [
      "Solve subnetting allocation problems for 4 networks",
      "Trace Dijkstra shortest path computation",
      "Compare IPv4 and IPv6 headers side-by-side",
    ],
    pyqs: [
      "Given an IP block, partition it into 4 subnets (2024, 2023 repeat)",
      "Explain link-state routing vs distance-vector routing (2023 exam)",
    ],
    done: [false, false, false, false, false],
  },
  {
    day: 4,
    title: "Transport Protocols & Congestion Control",
    topic:
      "TCP 3-way handshake, connection release, flow control, congestion window phases (Slow Start, Congestion Avoidance, Fast Recovery).",
    resources: [
      "TCP Congestion Control note.pdf",
      "Connection Handshake Trace",
      "UDP vs TCP Header Comparison",
    ],
    tasks: [
      "Graph TCP window sizing during packet drops",
      "Understand TCP Retransmission Timeout calculation",
      "Review UDP sockets architecture",
    ],
    pyqs: [
      "Discuss TCP congestion window phase shifts on duplicate ACKs (2023, 2021 repeat)",
      "Explain why UDP is preferred for real-time video (2022 exam)",
    ],
    done: [false, false, false, false, false],
  },
  {
    day: 5,
    title: "Application Layer & Security Principles",
    topic:
      "DNS resolution stages, HTTP/1.1 vs HTTP/2 multiplexing, SMTP email delivery, symmetric/asymmetric cryptography (RSA), SSL/TLS handshakes.",
    resources: [
      "DNS Resolution Walkthrough.pdf",
      "Web Server protocols cheat sheet",
      "Intro to RSA & Cryptography",
    ],
    tasks: [
      "Trace a recursive DNS resolution path",
      "Review TLS cipher suite negotiations",
      "Revise public key encryption mathematical steps",
    ],
    pyqs: [
      "Explain the TLS handshake procedure (2024 repeat)",
      "Differentiate symmetric key vs asymmetric key cryptography (2023 exam)",
    ],
    done: [false, false, false, false, false],
  },
];

function roadmapCompletedCount(day: RoadmapDay) {
  return day.done.filter(Boolean).length;
}

function roadmapProgress(day: RoadmapDay) {
  if (!day.done.length) return 0;
  return Math.round((roadmapCompletedCount(day) / day.done.length) * 100);
}

function roadmapChartHeight(count: number) {
  if (count <= 3) return 300;
  if (count <= 5) return 450;
  return 600;
}

function roadmapPillStyle(index: number, count: number) {
  const colWidth = 100 / count;
  return {
    left: `${index * colWidth + 1}%`,
    top: `${index * 76 + 18}px`,
    width: `${colWidth - 2}%`,
    animationDelay: `${index * 80}ms`,
  };
}

function roadmapPathData(count: number) {
  const centers = Array.from({ length: count }, (_, index) => {
    const colWidth = 100 / count;
    const left = index * colWidth + 1;
    const width = colWidth - 2;
    return {
      x: (left + width / 2) * 10,
      y: index * 76 + 67,
    };
  });

  if (!centers.length) return "";
  return centers.slice(1).reduce((path, point, index) => {
    const previous = centers[index];
    const midX = previous.x + (point.x - previous.x) / 2;
    return `${path} C ${midX} ${previous.y}, ${midX} ${point.y}, ${point.x} ${point.y}`;
  }, `M ${centers[0].x} ${centers[0].y}`);
}

function RoadmapTimelineChart({
  days,
  activeIndex,
  hoveredIndex,
  onSelect,
  onHover,
  includeClassroomMaterials = false,
}: {
  days: RoadmapDay[];
  activeIndex: number;
  hoveredIndex: number | null;
  onSelect: (index: number) => void;
  onHover: (index: number | null) => void;
  includeClassroomMaterials?: boolean;
}) {
  const totalTasks = days.reduce((sum, day) => sum + day.done.length, 0);
  const completedTasks = days.reduce((sum, day) => sum + roadmapCompletedCount(day), 0);
  const totalResources = days.reduce((sum, day) => sum + day.resources.length, 0);
  const activeDay = days[activeIndex] ?? days[0];
  const chartHeight = roadmapChartHeight(days.length);

  return (
    <>
      <div className="mb-5 flex flex-col gap-4 border-b border-line pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-faint">
            <Sparkles className="h-3 w-3 text-accent" />
            Journey highlights
          </span>
          <h3 className="mt-2 text-xl font-bold tracking-tight text-ink">Timeline</h3>
          <p className="mt-1 text-xs leading-5 text-ink-soft">
            {activeDay
              ? `Now viewing Day ${activeDay.day}: ${activeDay.title}`
              : "Select a day to inspect its plan."}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:w-auto">
          {[
            { label: "Sessions", value: String(days.length), icon: Clock },
            { label: "Tasks", value: `${completedTasks}/${totalTasks}`, icon: CheckCircle2 },
            { label: "Sources", value: String(totalResources), icon: BookOpenCheck },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-line bg-paper px-2.5 py-2">
              <div className="flex items-center gap-1.5 text-ink">
                <item.icon className="h-3.5 w-3.5 text-accent" />
                <span className="font-mono text-sm font-bold">{item.value}</span>
              </div>
              <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-wider text-ink-faint">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:hidden">
        {days.map((day, index) => {
          const isActive = activeIndex === index;
          const progress = roadmapProgress(day);
          return (
            <button
              key={day.day}
              type="button"
              onClick={() => onSelect(index)}
                                                        className={cx(
                "timeline-pill min-w-0 rounded-xl border p-4 text-left",
                isActive
                  ? "border-accent bg-surface ring-2 ring-accent/30"
                  : progress === 100
                    ? "border-emerald-500/30 bg-emerald-50/45 hover:bg-emerald-50"
                    : "border-line bg-paper hover:border-line-strong",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className={cx(
                    "rounded px-2 py-0.5 font-mono text-[9px] font-extrabold uppercase",
                    isActive
                      ? "bg-accent/10 text-accent"
                      : progress === 100
                        ? "bg-emerald-500/10 text-emerald-700"
                        : "bg-surface text-ink-soft",
                  )}
                >
                  Day {day.day}
                </span>
                <span
                  className={cx(
                    "font-mono text-[10px] font-bold",
                    progress === 100 ? "text-emerald-600" : "text-ink-soft",
                  )}
                >
                  {progress === 100 ? "✓ Done" : `${progress}% done`}
                </span>
              </div>
              <h4 className="mt-3 break-words text-sm font-bold leading-snug text-ink">
                {day.title}
              </h4>
              <p className="mt-1 text-xs leading-5 text-ink-soft">{day.topic}</p>

              <div className="mt-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-ink-faint border-t border-line/40 pt-3">
                <span>{day.resources.length} sources</span>
                <span>{day.tasks.length} tasks</span>
                <span>{day.pyqs.length} pyqs</span>
              </div>

              <span className="mt-3 block h-1 overflow-hidden rounded-full bg-line/60">
                <span
                  className={cx(
                    "block h-full rounded-full transition-all",
                    progress === 100 ? "bg-emerald-500" : "bg-accent",
                  )}
                  style={{ width: `${progress}%` }}
                />
              </span>
            </button>
          );
        })}
      </div>

      <div className="hidden md:block">
        <div className="-mx-2 overflow-x-auto px-2 pb-4">
          <div
            className="relative min-w-[820px] overflow-hidden rounded-xl border border-line bg-paper/70 p-4"
            style={{ height: `${chartHeight}px` }}
          >
            {/* Curved Connection Path with Glow Effect */}
            <svg
              className="absolute inset-0 h-full w-full pointer-events-none"
              viewBox={`0 0 1000 ${chartHeight}`}
              preserveAspectRatio="none"
            >
              <path
                d={roadmapPathData(days.length)}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="8"
                className="animate-roadmap-path opacity-15 blur-[2px]"
              />
              <path
                d={roadmapPathData(days.length)}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2.8"
                className="animate-roadmap-path opacity-60"
              />
            </svg>

            {/* Column Dashed Lines */}
            <div
              className="absolute inset-0 grid pointer-events-none"
              style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
            >
              {days.map((day, index) => (
                <div
                  key={day.day}
                  className={cx(
                    "h-full border-dashed border-line",
                    index < days.length - 1 && "border-r",
                  )}
                />
              ))}
            </div>

            {/* Glowing Path Dots */}
            {days.map((day, index) => {
              const colWidth = 100 / days.length;
              const leftCenter = index * colWidth + colWidth / 2;
              const topCenter = index * 76 + 67;
              const isActive = activeIndex === index;
              const progress = roadmapProgress(day);
              const isCompleted = progress === 100;

              return (
                <div
                  key={`dot-${day.day}`}
                  className="absolute z-10 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{
                    left: `${leftCenter}%`,
                    top: `${topCenter}px`,
                  }}
                >
                  {isActive && (
                    <div className="absolute inset-0 -m-1.5 rounded-full bg-accent/20 animate-ping" />
                  )}
                  <div
                    className={cx(
                      "h-3 w-3 rounded-full border-2 transition-all shadow-sm",
                      isActive
                        ? "border-accent bg-surface"
                        : isCompleted
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-line bg-paper",
                    )}
                  />
                </div>
              );
            })}

            {/* Premium Active Focus Badge */}
            <div className="absolute right-4 top-4 rounded-xl border border-line bg-surface/90 backdrop-blur-md px-3.5 py-2 text-right shadow-sm transition-all duration-300">
              <span className="inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wider text-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse"></span>
                Active focus
              </span>
              <span className="mt-1 block max-w-[240px] break-words text-[11px] font-bold leading-snug text-ink">
                {activeDay?.title}
              </span>
            </div>

            {/* Redesigned Roadmap Pills */}
            {days.map((day, index) => {
              const isHovered = hoveredIndex === index;
              const isActive = activeIndex === index;
              const progress = roadmapProgress(day);
              return (
                <button
                  key={day.day}
                  type="button"
                  onMouseEnter={() => onHover(index)}
                  onMouseLeave={() => onHover(null)}
                  onClick={() => onSelect(index)}
                  style={roadmapPillStyle(index, days.length)}
                                                                        className={cx(
                    "timeline-pill absolute z-20 flex h-[98px] min-w-0 flex-col justify-between rounded-xl p-3 text-left text-xs font-semibold shadow-sm border",
                    isActive
                      ? "border-accent bg-surface text-ink ring-4 ring-accent-soft/40"
                      : progress === 100
                        ? "border-emerald-500/40 bg-emerald-50/60 text-ink hover:border-emerald-500"
                        : isHovered
                          ? "border-line-strong bg-paper text-ink"
                          : "border-line bg-surface text-ink",
                  )}
                >
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span
                      className={cx(
                        "font-mono text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded",
                        isActive
                          ? "bg-accent/10 text-accent"
                          : progress === 100
                            ? "bg-emerald-500/10 text-emerald-700"
                            : "bg-paper text-ink-soft",
                      )}
                    >
                      Day {day.day}
                    </span>
                    <span
                      className={cx(
                        "font-mono text-[9px] font-bold",
                        progress === 100 ? "text-emerald-600" : "text-ink-soft",
                      )}
                    >
                      {progress === 100 ? "✓ Done" : `${progress}%`}
                    </span>
                  </div>

                  <span className="line-clamp-2 break-words text-[11px] leading-tight font-bold text-ink/90 my-1">
                    {day.title}
                  </span>

                  <div className="space-y-1.5 w-full mt-auto">
                    <div className="flex items-center justify-between text-[9px] font-bold text-ink-faint">
                      <span>{day.tasks.length + day.pyqs.length} tasks</span>
                      <span>{day.resources.length} sources</span>
                    </div>
                    <span className="block h-1 overflow-hidden rounded-full bg-line/60">
                      <span
                        className={cx(
                          "block h-full rounded-full transition-all",
                          progress === 100 ? "bg-emerald-500" : "bg-accent",
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Staggered Day Cards Grid - Dynamic Column Count */}
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
        >
          {days.map((day, index) => {
            const isActive = activeIndex === index;
            const progress = roadmapProgress(day);
            return (
              <button
                key={day.day}
                type="button"
                onClick={() => onSelect(index)}
                                                                className={cx(
                  "timeline-pill min-w-0 rounded-xl border p-3 text-left",
                  isActive
                    ? "border-accent bg-accent-soft/50 shadow-sm"
                    : progress === 100
                      ? "border-emerald-500/20 bg-emerald-50/30 hover:bg-emerald-50/50"
                      : "border-line bg-paper hover:border-line-strong",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-ink-faint">
                    Day {day.day}
                  </span>
                  {progress === 100 && (
                    <span className="text-[10px] text-emerald-600 font-bold">✓</span>
                  )}
                </div>
                <h4 className="mt-1 break-words text-xs font-bold leading-snug text-ink line-clamp-1">
                  {day.title}
                </h4>
                <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-ink-soft">{day.topic}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-line bg-paper px-3 py-2">
            <span className="block text-[9px] font-bold uppercase tracking-wider text-ink-faint">
              Sequencing
            </span>
            <span className="mt-0.5 block text-xs font-semibold text-ink-soft">
              Prerequisites flow left to right.
            </span>
          </div>
          <div className="rounded-lg border border-line bg-paper px-3 py-2">
            <span className="block text-[9px] font-bold uppercase tracking-wider text-ink-faint">
              Evidence
            </span>
            <span className="mt-0.5 block text-xs font-semibold text-ink-soft">
              {totalResources} resources mapped into sessions.
            </span>
          </div>
          <div className="rounded-lg border border-line bg-paper px-3 py-2">
            <span className="block text-[9px] font-bold uppercase tracking-wider text-ink-faint">
              Mode
            </span>
            <span className="mt-0.5 block text-xs font-semibold text-ink-soft">
              {includeClassroomMaterials
                ? "Classroom materials included."
                : "Preview sandbox with sample sources."}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

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

  // Beautiful loader visuals (decoupled from real API for delightful progress feel)
  const [loaderStep, setLoaderStep] = useState(0);
  const [notesAnalyzed, setNotesAnalyzed] = useState(42);
  const [connectionsMapped, setConnectionsMapped] = useState(17);
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
    setNotesAnalyzed(42);
    setConnectionsMapped(17);
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

  // Drive the gorgeous loader visuals + simulated progress while the real generation runs
  useEffect(() => {
    if (!generating) {
      return;
    }

    const stepTimer = window.setInterval(() => {
      setLoaderStep((s) => Math.min(s + 1, 3));
    }, 1250);

    const metricsTimer = window.setInterval(() => {
      setNotesAnalyzed((n) => Math.min(n + (Math.random() > 0.5 ? 2 : 1), 137));
      setConnectionsMapped((c) => Math.min(c + (Math.random() > 0.6 ? 2 : 1), 71));
    }, 620);

    return () => {
      window.clearInterval(stepTimer);
      window.clearInterval(metricsTimer);
    };
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
              <div className="text-[10px] font-mono font-bold uppercase tracking-[3px] text-accent/70">
                CLASSVAULT • AI STUDIO
              </div>
            </div>
            <h1 className="text-[28px] leading-none font-semibold tracking-[-1.2px] text-ink">
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
                    <button
                      type="submit"
                      className="ai-magic-btn inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-surface active:scale-[0.985]"
                    >
                      <Zap className="h-4 w-4" />
                      Generate AI Roadmap
                    </button>
                  </div>

                  {generateError ? (
                    <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                      {generateError}
                    </p>
                  ) : null}
                </form>
              ) : (
                /* Stunning, rewarding AI generation experience */
                <div
                  key="generating"
                                                                        className="relative overflow-hidden rounded-md border border-line/70 bg-paper/70 p-6 text-center"
                >
                  {/* Subtle living background field */}
                  <div className="absolute inset-0 bg-[radial-gradient(#635bFF_0.6px,transparent_1px)] bg-[length:3.5px_3.5px] opacity-[0.035]" />

                  <div className="relative z-10">
                    {/* Hero AI Orb — beautiful layered animated core */}
                    <div className="relative mx-auto mb-5 flex h-24 w-24 items-center justify-center">
                      {/* Outer slow rotating glow ring */}
                      <div
                        className="absolute h-24 w-24 rounded-full border border-accent/30"
                                                                      />
                      {/* Mid pulsing ring */}
                      <div
                        className="absolute h-[78px] w-[78px] rounded-full border-2 border-accent/50"
                                                                      />
                      {/* Core glowing orb */}
                      <div
                        className="absolute h-12 w-12 rounded-full bg-ink"
                                                                      />
                      {/* Inner bright nucleus */}
                      <div
                        className="absolute h-5 w-5 rounded-full bg-white/90"
                                                                      />
                      {/* Orbiting data nodes — neural feel */}
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="absolute h-1.5 w-1.5 rounded-full bg-accent"
                          style={{
                            top: "50%",
                            left: "50%",
                            marginTop: -3,
                            marginLeft: -3,
                          }}
                                                                            />
                      ))}
                    </div>

                    <div className="text-base font-semibold tracking-tight text-ink">
                      AI is crafting your perfect study path
                    </div>
                    <div className="mt-0.5 text-xs text-ink-soft">
                      This is personalized to you in real time
                    </div>

                    {/* Live AI metrics — feel the work happening */}
                    <div className="mt-4 flex justify-center gap-2">
                      <div className="rounded-xl border border-line bg-surface px-3 py-1 text-left">
                        <div className="font-mono text-lg font-semibold tabular-nums text-ink">
                          {notesAnalyzed}
                        </div>
                        <div className="text-[9px] font-bold uppercase tracking-widest text-ink-faint -mt-0.5">
                          notes analyzed
                        </div>
                      </div>
                      <div className="rounded-xl border border-line bg-surface px-3 py-1 text-left">
                        <div className="font-mono text-lg font-semibold tabular-nums text-ink">
                          {connectionsMapped}
                        </div>
                        <div className="text-[9px] font-bold uppercase tracking-widest text-ink-faint -mt-0.5">
                          connections mapped
                        </div>
                      </div>
                    </div>

                    {/* Elegant progressing steps — current step glows & previous complete */}
                    <div className="mt-5 mx-auto max-w-[300px] space-y-2 text-left">
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
                              "flex items-center gap-3 rounded-xl border px-3 py-2 text-xs font-medium transition-all",
                              isActive
                                ? "border-accent bg-accent-soft/60 text-accent shadow-sm scale-[1.01]"
                                : isDone
                                  ? "border-emerald-500/30 bg-emerald-50/40 text-emerald-700"
                                  : "border-line bg-surface text-ink-soft",
                            )}
                          >
                            <div
                              className={cx(
                                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-black",
                                isActive
                                  ? "bg-accent text-surface"
                                  : isDone
                                    ? "bg-emerald-500 text-white"
                                    : "bg-line text-ink-faint",
                              )}
                            >
                              {isDone ? "✓" : index + 1}
                            </div>
                            <div className="flex-1 leading-tight">{label}</div>
                            {isActive && (
                              <div
                                className="h-1.5 w-1.5 rounded-full bg-accent"
                                                                                              />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Beautiful, obvious stop control */}
                    <button
                      type="button"
                      onClick={stopGeneration}
                      className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface px-5 py-2 text-xs font-semibold text-ink-soft transition hover:border-red-400/60 hover:bg-red-50 hover:text-red-600 active:scale-[0.985]"
                    >
                      <X className="h-3.5 w-3.5" />
                      Stop generation
                    </button>
                    <div className="mt-1 text-[10px] text-ink-faint/70">
                      You can cancel at any time
                    </div>
                  </div>
                </div>
              )}
                      </div>

          {/* Live Interactive Sandbox — a gorgeous, rewarding playground */}
          <div className="roadmap-premium-card min-w-0 space-y-5 rounded-lg border border-line bg-surface p-5 shadow-sm sm:p-6 reward-glow">
            <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-md border border-accent/30 bg-accent/5 px-4 py-1.5 text-xs font-extrabold uppercase tracking-[1.5px] text-accent">
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
                    <span className="inline-block w-fit rounded-md bg-accent-soft px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-accent">
                      Day {previewRoadmap[activePreviewDay].day} Focus
                    </span>
                    <h4 className="min-w-0 text-[17px] font-semibold tracking-tight text-ink leading-tight">
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
                  <div className="mb-1 text-[10px] font-extrabold uppercase tracking-[1px] text-ink-faint">
                    Core Focus
                  </div>
                  {previewRoadmap[activePreviewDay].topic}
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Tasks — matching the gorgeous generated experience */}
                  <div>
                    <div className="mb-3 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-widest text-ink-faint">
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
                              "mt-px flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-lg border text-[10px] font-black transition-all active:scale-95",
                              previewRoadmap[activePreviewDay].done[tIdx]
                                ? "border-emerald-500 bg-emerald-500 text-white shadow-inner"
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
                    <div className="mb-3 text-[10px] font-extrabold uppercase tracking-widest text-ink-faint">
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
                  <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">
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

                <button
                  onClick={() => {
                    setRoadmap(null);
                    setGenerationMeta(null);
                    setGenerateError(null);
                    setSavedRoadmapId(null);
                  }}
                  className="rounded-md border border-line bg-surface px-4 py-2 text-xs font-semibold text-ink-soft transition hover:bg-paper hover:text-ink active:scale-[0.985] whitespace-nowrap"
                >
                  Start new plan
                </button>
              </div>
            </div>
          </div>

          {/* The beautiful timeline (preserved + elevated) */}
          <div className="relative min-w-0 overflow-hidden rounded-lg border border-line bg-surface p-5 shadow-sm sm:p-7 roadmap-premium-card">
            <div className="mb-4 flex items-center justify-between border-b border-line pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[1.5px] text-ink-faint">
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
                    <span className="inline-block w-fit rounded-md bg-accent-soft px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-accent">
                      Day {roadmap[activeDay].day} Focus
                    </span>
                    <h4 className="min-w-0 text-[17px] font-semibold tracking-tight text-ink leading-tight">
                      {roadmap[activeDay].title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTriggerQuiz(roadmap[activeDay].title)}
                      className="inline-flex items-center gap-2 rounded-md border border-accent/30 bg-accent-soft px-4 py-2 text-xs font-bold uppercase tracking-wider text-accent transition hover:bg-accent hover:text-white active:scale-[0.985]"
                    >
                      <Zap className="h-3.5 w-3.5" /> Practice Quiz
                    </button>
                    <div className="rounded-md bg-emerald-500/10 px-3 py-1.5 text-center font-mono text-xs font-bold text-emerald-600">
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
                  <div className="mb-1 text-[10px] font-extrabold uppercase tracking-[1px] text-ink-faint">
                    Core Focus
                  </div>
                  {roadmap[activeDay].topic}
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Tasks — ultra satisfying checklist */}
                  <div>
                    <div className="mb-3 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-widest text-ink-faint">
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
                                "mt-px flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-lg border text-[10px] font-black transition-all active:scale-95",
                                roadmap[activeDay].done[tIdx]
                                  ? "border-emerald-500 bg-emerald-500 text-white shadow-inner"
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
                    <div className="mb-3 text-[10px] font-extrabold uppercase tracking-widest text-ink-faint">
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

      {/* Mock Quiz dialog modal — beautiful spring entrance */}
              {showQuiz && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-3 sm:items-center sm:p-4">
            <div
                                                                      className="max-h-[calc(100dvh-1.5rem)] w-full max-w-md space-y-4 overflow-y-auto rounded-xl border border-line bg-surface p-5"
            >
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
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded text-center">
                  <p className="text-xs font-bold text-emerald-800">
                    Quiz Completed! Score: {quizScore} / 2
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => {
                    let correct = 0;
                    if (answers[0] === 1) correct++;
                    if (answers[1] === 0) correct++;
                    setQuizScore(correct);
                  }}
                  disabled={answers[0] === undefined || answers[1] === undefined}
                  className="w-full h-9 bg-ink text-surface rounded text-xs font-bold hover:bg-ink/85 disabled:opacity-50"
                >
                  Submit Answers
                </button>
              )}
            </div>
          </div>
        )}
          </div>
  );
}

// -----------------------------------------------------------------
// EXAM MODE VIEW
// -----------------------------------------------------------------
