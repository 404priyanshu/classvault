"use client";

import { useState, type FormEvent } from "react";
import { BookOpenCheck, CheckCircle2, Clock, Sparkles, X } from "lucide-react";
import { cx } from "@/lib/cx";

type RoadmapDay = {
  day: number;
  title: string;
  topic: string;
  resources: string[];
  tasks: string[];
  pyqs: string[];
  done: boolean[];
};

const PREVIEW_ROADMAP: RoadmapDay[] = [
  {
    day: 1,
    title: "Foundations & Layering Paradigms",
    topic: "Introduction to layered protocols, TCP/IP stack vs OSI model, packet switching basics, and performance metrics (delay, loss).",
    resources: ["Introduction to Layers & Protocols.pdf", "Computer Networks: System Approach (Slides)", "Network Architecture 101 (YouTube)"],
    tasks: ["Read Layering paradigms slide deck", "Explain propagation vs transmission delay differences", "Summarize peer-to-peer vs client-server models"],
    pyqs: ["State differences between OSI and TCP/IP protocol architectures (2024, 2022 repeats)", "Calculate throughput for a multi-hop link (2023 exam)"],
    done: [true, false, false, false, false],
  },
  {
    day: 2,
    title: "Link Layer & Media Access Control",
    topic: "Error detection (parity, CRC), sliding window protocols, multiple access protocols (CSMA/CD, CSMA/CA), Ethernet, and switching.",
    resources: ["Sliding Window Protocols Visual Guide.pdf", "CRC Error Detection Solver", "CSMA/CD Collision Resolution Note"],
    tasks: ["Attempt 5 practice questions on CRC generation and validation", "Verify sliding window sequence numbers", "Understand MAC vs IP address resolutions"],
    pyqs: ["Describe sliding window flow control protocols (2023, 2021 repeat)", "Show how switch learns MAC addresses dynamically (2022 exam)"],
    done: [true, true, false, false, false],
  },
  {
    day: 3,
    title: "Routing Algorithms & Subnetting",
    topic: "IP addressing, CIDR subnetting, Distance Vector vs Link State routing, packet forwarding mechanics, and NAT mappings.",
    resources: ["IP Subnetting Cheat Sheet.pdf", "Dijkstra Routing Visualizer", "NAT Port Mapping Handout"],
    tasks: ["Solve subnetting allocation problems for 4 networks", "Trace Dijkstra shortest path computation", "Compare IPv4 and IPv6 headers side-by-side"],
    pyqs: ["Given an IP block, partition it into 4 subnets (2024, 2023 repeat)", "Explain link-state routing vs distance-vector routing (2023 exam)"],
    done: [false, false, false, false, false],
  },
  {
    day: 4,
    title: "Transport Protocols & Congestion Control",
    topic: "TCP 3-way handshake, connection release, flow control, congestion window phases (Slow Start, Congestion Avoidance, Fast Recovery).",
    resources: ["TCP Congestion Control note.pdf", "Connection Handshake Trace", "UDP vs TCP Header Comparison"],
    tasks: ["Graph TCP window sizing during packet drops", "Understand TCP Retransmission Timeout calculation", "Review UDP sockets architecture"],
    pyqs: ["Discuss TCP congestion window phase shifts on duplicate ACKs (2023, 2021 repeat)", "Explain why UDP is preferred for real-time video (2022 exam)"],
    done: [false, false, false, false, false],
  },
  {
    day: 5,
    title: "Application Layer & Security Principles",
    topic: "DNS resolution stages, HTTP/1.1 vs HTTP/2 multiplexing, SMTP email delivery, symmetric/asymmetric cryptography (RSA), SSL/TLS handshakes.",
    resources: ["DNS Resolution Walkthrough.pdf", "Web Server protocols cheat sheet", "Intro to RSA & Cryptography"],
    tasks: ["Trace a recursive DNS resolution path", "Review TLS cipher suite negotiations", "Revise public key encryption mathematical steps"],
    pyqs: ["Explain the TLS handshake procedure (2024 repeat)", "Differentiate symmetric key vs asymmetric key cryptography (2023 exam)"],
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
            {activeDay ? `Now viewing Day ${activeDay.day}: ${activeDay.title}` : "Select a day to inspect its plan."}
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
                "min-w-0 rounded-xl border p-4 text-left transition-all duration-200",
                isActive
                  ? "border-accent bg-surface shadow-[0_4px_12px_rgba(99,91,255,0.08)] ring-2 ring-accent/30"
                  : progress === 100
                    ? "border-emerald-500/30 bg-emerald-50/45 hover:bg-emerald-50"
                    : "border-line bg-paper hover:border-line-strong",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <span className={cx(
                  "rounded px-2 py-0.5 font-mono text-[9px] font-extrabold uppercase",
                  isActive
                    ? "bg-accent/10 text-accent"
                    : progress === 100
                      ? "bg-emerald-500/10 text-emerald-700"
                      : "bg-surface text-ink-soft"
                )}>
                  Day {day.day}
                </span>
                <span className={cx(
                  "font-mono text-[10px] font-bold",
                  progress === 100 ? "text-emerald-600" : "text-ink-soft"
                )}>
                  {progress === 100 ? "✓ Done" : `${progress}% done`}
                </span>
              </div>
              <h4 className="mt-3 break-words text-sm font-bold leading-snug text-ink">{day.title}</h4>
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
                    progress === 100 ? "bg-emerald-500" : "bg-accent"
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
                  className={cx("h-full border-dashed border-line", index < days.length - 1 && "border-r")}
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
                          : "border-line bg-paper"
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
                    "absolute z-20 flex h-[98px] min-w-0 flex-col justify-between rounded-xl p-3 text-left text-xs font-semibold shadow-sm border transition-all duration-300 animate-pill-cascade",
                    isActive
                      ? "border-accent bg-surface text-ink ring-4 ring-accent-soft/40 shadow-lg scale-[1.03] -translate-y-0.5"
                      : progress === 100
                        ? "border-emerald-500/40 bg-emerald-50/60 hover:bg-emerald-50 text-ink hover:border-emerald-500 hover:shadow-md hover:-translate-y-0.5"
                        : isHovered
                          ? "border-line-strong bg-paper text-ink hover:shadow-md hover:-translate-y-0.5"
                          : "border-line bg-surface text-ink",
                  )}
                >
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span className={cx(
                      "font-mono text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded",
                      isActive
                        ? "bg-accent/10 text-accent"
                        : progress === 100
                          ? "bg-emerald-500/10 text-emerald-700"
                          : "bg-paper text-ink-soft"
                    )}>
                      Day {day.day}
                    </span>
                    <span className={cx(
                      "font-mono text-[9px] font-bold",
                      progress === 100 ? "text-emerald-600" : "text-ink-soft"
                    )}>
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
                          progress === 100 ? "bg-emerald-500" : "bg-accent"
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
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
          {days.map((day, index) => {
            const isActive = activeIndex === index;
            const progress = roadmapProgress(day);
            return (
              <button
                key={day.day}
                type="button"
                onClick={() => onSelect(index)}
                className={cx(
                  "min-w-0 rounded-xl border p-3 text-left transition-all duration-200",
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
                <h4 className="mt-1 break-words text-xs font-bold leading-snug text-ink line-clamp-1">{day.title}</h4>
                <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-ink-soft">{day.topic}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-line bg-paper px-3 py-2">
            <span className="block text-[9px] font-bold uppercase tracking-wider text-ink-faint">Sequencing</span>
            <span className="mt-0.5 block text-xs font-semibold text-ink-soft">Prerequisites flow left to right.</span>
          </div>
          <div className="rounded-lg border border-line bg-paper px-3 py-2">
            <span className="block text-[9px] font-bold uppercase tracking-wider text-ink-faint">Evidence</span>
            <span className="mt-0.5 block text-xs font-semibold text-ink-soft">{totalResources} resources mapped into sessions.</span>
          </div>
          <div className="rounded-lg border border-line bg-paper px-3 py-2">
            <span className="block text-[9px] font-bold uppercase tracking-wider text-ink-faint">Mode</span>
            <span className="mt-0.5 block text-xs font-semibold text-ink-soft">
              {includeClassroomMaterials ? "Classroom materials included." : "Preview sandbox with sample sources."}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

export function AIRoadmapsView() {
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

  function togglePreviewTaskCheckbox(dayIdx: number, taskIdx: number) {
    setPreviewRoadmap((current) =>
      current.map((day, dIdx) => {
        if (dIdx !== dayIdx) return day;
        const newDone = [...day.done];
        newDone[taskIdx] = !newDone[taskIdx];
        return { ...day, done: newDone };
      })
    );
  }

  function handleGenerate(e: FormEvent) {
    e.preventDefault();
    if (!subject.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      // Simulated Roadmap Ingestion & Ingestion Details
      const generatedRoadmap: RoadmapDay[] = [
        {
          day: 1,
          title: "Foundations & Core Architecture",
          topic: `${subject} Unit 1 basic concepts and architecture paradigms`,
          resources: [`${subject} Chapter 1 slides.pdf`, "OSI vs TCP/IP Overview (YouTube)"],
          tasks: ["Read unit 1 slides and summary notes", "Watch 10-minute overview animation"],
          pyqs: ["Discuss layering advantages and drawbacks (2023, 2024 repeat)"],
          done: [false, false, false],
        },
        {
          day: 2,
          title: "Mechanics & Addressing Structures",
          topic: "Core algorithms, routing protocols, and addressing formats",
          resources: ["Subnetting & Addressing Cheat Sheet.pdf", "Interactive Problems Set 1"],
          tasks: ["Solve 10 practice subnetting / addressing equations", "Read routing algorithms guide"],
          pyqs: ["State differences between Distance Vector & Link State (2022 repeat)"],
          done: [false, false, false],
        },
        {
          day: 3,
          title: "Flow Control & Resource Allocation",
          topic: "Congestion control, TCP windows, and scheduling strategies",
          resources: ["Sliding Window Protocols Visual guide", "TCP Congestion Control note"],
          tasks: ["Understand 3-way handshake and congestion window adjustments", "Attempt sample packet traces"],
          pyqs: ["Describe slow start and congestion avoidance mechanisms (2021 repeat)"],
          done: [false, false, false],
        },
        {
          day: 4,
          title: "Application layer & Advanced Integrations",
          topic: "Symmetric key cryptography, DNS resolutions, and HTTP flows",
          resources: ["Cryptography Intro PDF", "Web Server protocols cheat sheet"],
          tasks: ["Revise public/private key algorithms", "Verify DNS resolver pipeline steps"],
          pyqs: ["Explain security protocols in HTTP transport layer (2024 repeat)"],
          done: [false, false, false],
        },
        {
          day: 5,
          title: "Consolidation & Final Practice Run",
          topic: "Mock test review, full syllabus flashcards, and weak areas",
          resources: ["Consolidated mock questionnaire", "Flashcards Deck"],
          tasks: ["Attempt 1 complete mock review quiz", "Go through weakest 3 topics flashcard review"],
          pyqs: ["Solve entire 2024 official branch exam paper"],
          done: [false, false, false],
        },
      ];
      setRoadmap(generatedRoadmap.slice(0, days));
      setActiveDay(0);
    }, 1200);
  }

  function toggleTaskCheckbox(dayIdx: number, taskIdx: number) {
    if (!roadmap) return;
    setRoadmap((current) => {
      if (!current) return null;
      return current.map((day, dIdx) => {
        if (dIdx !== dayIdx) return day;
        const newDone = [...day.done];
        newDone[taskIdx] = !newDone[taskIdx];
        return { ...day, done: newDone };
      });
    });
  }

  function handleTriggerQuiz(dayTitle: string) {
    setShowQuiz(dayTitle);
    setAnswers({});
    setQuizScore(null);
  }

  return (
    <div className="space-y-6 pb-12">
      <p className="text-sm text-ink-soft">
        Generate a customized subject study schedule using your files, community notes, and syllabus specifications.
      </p>

      {!roadmap && (
        <div className="min-w-0 space-y-6">
          {/* Left Column: Form Configuration */}
          <div className="min-w-0 rounded-xl border border-line bg-surface p-3 shadow-sm sm:p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-faint mb-2.5">
              Configure Study Plan
            </h3>
            <form onSubmit={handleGenerate} className="space-y-3">
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
                      className="mt-1 h-9 w-full min-w-0 rounded-md border border-line bg-paper px-3 text-xs outline-none transition focus:border-line-strong focus:bg-surface"
                    />
                  </label>

                  <label className="block min-w-0">
                    <span className="text-[11px] font-bold text-ink-soft">Target Duration</span>
                    <select
                      value={days}
                      onChange={(e) => setDays(Number(e.target.value))}
                      className="mt-1 h-9 w-full min-w-0 rounded-md border border-line bg-paper px-3 text-xs outline-none transition focus:border-line-strong focus:bg-surface"
                    >
                      <option value={3}>3 Days (Exam Sprint)</option>
                      <option value={5}>5 Days (Recommended)</option>
                      <option value={7}>7 Days (Deep Learning)</option>
                    </select>
                  </label>
                </div>

                {/* Row 2: Level and Goal */}
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
                            "min-w-0 flex-1 rounded py-1 text-[11px] font-bold transition",
                            level === lvl ? "bg-ink text-surface" : "text-ink-soft hover:text-ink",
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
                            "rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition",
                            goal === gl ? "border-accent bg-accent-soft text-accent" : "border-line text-ink-soft hover:border-line-strong hover:text-ink",
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
                  <span className="text-[11px] font-bold text-ink-soft block">Ingestion Source Materials</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { label: "Use personal resources", val: usePersonal, set: setUsePersonal },
                      { label: "Use community resources", val: useCommunity, set: setUseCommunity },
                      { label: "Include PYQ sets", val: usePYQ, set: setUsePYQ },
                      { label: "Video lectures & websites", val: useVideo, set: setUseVideo },
                    ].map((toggle) => (
                      <label key={toggle.label} className="flex items-center gap-2 cursor-pointer text-[11px] font-semibold text-ink-soft hover:text-ink">
                        <input
                          type="checkbox"
                          checked={toggle.val}
                          onChange={(e) => toggle.set(e.target.checked)}
                          className="rounded border-line text-accent focus:ring-accent"
                        />
                        <span className="truncate" title={toggle.label}>{toggle.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={generating || !subject.trim()}
                className="inline-flex h-9 w-full items-center justify-center rounded-md bg-ink text-xs font-semibold text-surface transition hover:bg-ink/85 disabled:opacity-60 pt-0.5"
              >
                {generating ? "Parsing materials & compiling roadmap..." : "Generate AI Roadmap"}
              </button>
            </form>
          </div>

          {/* Right Column: Live Interactive Sandbox Preview */}
          <div className="min-w-0 space-y-4">
            <div className="flex flex-col gap-2 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-accent"></span>
                Interactive Preview
              </span>
              <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider">
                Demo: Computer Networks (5 Days)
              </span>
            </div>

            {/* Sandbox Gantt Chart Timeline Card */}
            <div className="relative min-w-0 select-none overflow-hidden rounded-xl border border-line bg-surface p-4 shadow-sm sm:p-5">
              <RoadmapTimelineChart
                days={previewRoadmap}
                activeIndex={activePreviewDay}
                hoveredIndex={hoveredPreviewDay}
                onSelect={setActivePreviewDay}
                onHover={setHoveredPreviewDay}
              />

              {/* Active Day Detail Panel for Preview */}
              <div className="mt-6 space-y-4 border-t border-line pt-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-col gap-2 min-[420px]:flex-row min-[420px]:items-center">
                    <span className="bg-accent-soft text-accent text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase">
                      Day {previewRoadmap[activePreviewDay].day} Focus
                    </span>
                    <h4 className="min-w-0 text-sm font-bold text-ink">
                      {previewRoadmap[activePreviewDay].title}
                    </h4>
                  </div>
                  <span className="w-fit text-xs font-mono font-bold text-success bg-success/10 px-2 py-0.5 rounded">
                    {Math.round((previewRoadmap[activePreviewDay].done.filter(Boolean).length / previewRoadmap[activePreviewDay].done.length) * 100)}% Complete
                  </span>
                </div>

                <p className="text-xs text-ink-soft leading-relaxed bg-paper p-3 rounded-lg border border-line">
                  <span className="font-semibold text-ink block text-[10px] uppercase tracking-wider mb-0.5">Focus Topic</span>
                  {previewRoadmap[activePreviewDay].topic}
                </p>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Left Column: Tasks */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint block">Tasks Checklist</span>
                    <div className="space-y-2.5">
                      {[...previewRoadmap[activePreviewDay].tasks, ...previewRoadmap[activePreviewDay].pyqs].map((task, tIdx) => (
                        <div key={tIdx} className="flex items-start gap-3 group bg-surface hover:bg-paper p-2 rounded-lg border border-line/40 transition-colors">
                          <button
                            onClick={() => togglePreviewTaskCheckbox(activePreviewDay, tIdx)}
                            className={cx(
                              "flex h-4 w-4 mt-0.5 shrink-0 items-center justify-center rounded border transition-colors",
                              previewRoadmap[activePreviewDay].done[tIdx]
                                ? "border-success bg-success text-surface animate-check-pop"
                                : "border-line-strong hover:border-accent hover:bg-accent-soft"
                            )}
                          >
                            {previewRoadmap[activePreviewDay].done[tIdx] ? <span className="text-[9px] font-black">✓</span> : null}
                          </button>
                          <span
                            className={cx(
                              "text-xs font-medium leading-relaxed transition-colors",
                              previewRoadmap[activePreviewDay].done[tIdx]
                                ? "text-ink-faint line-through"
                                : "text-ink-soft group-hover:text-ink"
                            )}
                          >
                            {task}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Ingested Materials */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint block">Ingested Materials</span>
                    <div className="space-y-2">
                      {previewRoadmap[activePreviewDay].resources.map((res, rIdx) => (
                        <div
                          key={rIdx}
                          className="flex items-center gap-2.5 text-xs text-ink-soft bg-paper p-2.5 rounded-lg border border-line truncate"
                          title={res}
                        >
                          <span className="text-base">📄</span>
                          <span className="truncate font-medium">{res}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {roadmap && (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">
                Generated Plan
              </span>
              <h3 className="text-lg font-bold text-ink">
                {subject} — {days} Day Roadmap
              </h3>
              <p className="text-xs text-ink-soft mt-0.5">
                Target: {goal} ({level}) • {roadmap.length} active sessions
              </p>
            </div>
            <button
              onClick={() => setRoadmap(null)}
              className="inline-flex h-9 w-full items-center justify-center rounded border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-paper hover:text-ink sm:w-auto"
            >
              Configure new plan
            </button>
          </div>

          {/* Visual Gantt Chart Timeline Card (Desktop-scrollable, responsive) */}
          <div className="relative min-w-0 overflow-hidden rounded-xl border border-line bg-surface p-4 shadow-sm sm:p-6">
            <RoadmapTimelineChart
              days={roadmap}
              activeIndex={activeDay}
              hoveredIndex={hoveredDay}
              onSelect={setActiveDay}
              onHover={setHoveredDay}
              includeClassroomMaterials
            />

            {/* Detailed Active Day Panel */}
            <div className="mt-6 space-y-4 border-t border-line pt-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-col gap-2 min-[420px]:flex-row min-[420px]:items-center">
                  <span className="bg-accent-soft text-accent text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase">
                    Day {roadmap[activeDay].day} Focus
                  </span>
                  <h4 className="min-w-0 text-sm font-bold text-ink">
                    {roadmap[activeDay].title}
                  </h4>
                </div>
                <div className="grid gap-2 min-[420px]:flex min-[420px]:items-center min-[420px]:gap-3">
                  <button
                    onClick={() => handleTriggerQuiz(roadmap[activeDay].title)}
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-accent/20 bg-accent-soft px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-accent transition hover:bg-accent hover:text-surface"
                  >
                    Take Practice Quiz
                  </button>
                  <span className="inline-flex h-8 items-center justify-center rounded bg-success/10 px-2 py-0.5 font-mono text-xs font-bold text-success">
                    {Math.round((roadmap[activeDay].done.filter(Boolean).length / roadmap[activeDay].done.length) * 100)}% Complete
                  </span>
                </div>
              </div>

              <p className="text-xs text-ink-soft leading-relaxed bg-paper p-3 rounded-lg border border-line">
                <span className="font-semibold text-ink block text-[10px] uppercase tracking-wider mb-0.5">Focus Topic</span>
                {roadmap[activeDay].topic}
              </p>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Left Column: Tasks */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint block">Tasks Checklist</span>
                  <div className="space-y-2.5">
                    {[...roadmap[activeDay].tasks, ...roadmap[activeDay].pyqs].map((task, tIdx) => (
                      <div key={tIdx} className="flex items-start gap-3 group bg-surface hover:bg-paper p-2 rounded-lg border border-line/40 transition-colors">
                        <button
                          onClick={() => toggleTaskCheckbox(activeDay, tIdx)}
                          className={cx(
                            "flex h-4 w-4 mt-0.5 shrink-0 items-center justify-center rounded border transition-colors",
                            roadmap[activeDay].done[tIdx]
                              ? "border-success bg-success text-surface animate-check-pop"
                              : "border-line-strong hover:border-accent hover:bg-accent-soft"
                          )}
                        >
                          {roadmap[activeDay].done[tIdx] ? <span className="text-[9px] font-black">✓</span> : null}
                        </button>
                        <span
                          className={cx(
                            "text-xs font-medium leading-relaxed transition-colors",
                            roadmap[activeDay].done[tIdx]
                              ? "text-ink-faint line-through"
                              : "text-ink-soft group-hover:text-ink"
                          )}
                        >
                          {task}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Column: Ingested Materials */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint block">Ingested Materials</span>
                  <div className="space-y-2">
                    {roadmap[activeDay].resources.map((res, rIdx) => (
                      <div
                        key={rIdx}
                        className="flex items-center gap-2.5 text-xs text-ink-soft bg-paper p-2.5 rounded-lg border border-line truncate"
                        title={res}
                      >
                        <span className="text-base">📄</span>
                        <span className="truncate font-medium">{res}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mock Quiz dialog modal */}
      {showQuiz && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-3 sm:items-center sm:p-4">
          <div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-md space-y-4 overflow-y-auto rounded-xl border border-line bg-surface p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <h4 className="text-xs font-bold uppercase text-accent tracking-wider leading-none">AI Practice Quiz</h4>
              <button onClick={() => setShowQuiz(null)} className="text-ink-faint hover:text-ink">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-ink leading-relaxed">
                Test: {showQuiz}
              </p>
              <div className="space-y-2.5">
                {[
                  { q: "1. Which protocol provides reliable connection-oriented packet deliveries?", o: ["UDP", "TCP", "IP", "DNS"], a: 1 },
                  { q: "2. What is the default size of an IPv4 address?", o: ["32 bits", "64 bits", "128 bits", "48 bits"], a: 0 },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1.5 border border-line p-3 rounded-lg bg-paper">
                    <p className="text-xs font-bold text-ink">{item.q}</p>
                    <div className="grid gap-2 min-[380px]:grid-cols-2">
                      {item.o.map((opt, oIdx) => (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => setAnswers(prev => ({ ...prev, [idx]: oIdx }))}
                          className={cx(
                            "py-1.5 px-2 rounded border text-[11px] font-semibold transition text-left",
                            answers[idx] === oIdx ? "border-accent bg-accent-soft text-accent" : "border-line bg-surface hover:bg-paper"
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
                <p className="text-xs font-bold text-emerald-800">Quiz Completed! Score: {quizScore} / 2</p>
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
