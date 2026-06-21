"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  CalendarDays,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  Flame,
  GraduationCap,
  Plus,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { ApiNote, ApiStudyTask, NotesResponse } from "@/lib/api-types";
import { cx } from "@/lib/cx";
import { useAppShell } from "@/components/app-shell/app-shell-context";

type LearningCard = {
  number: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tone: "light" | "accent" | "dark";
  action: () => void;
};

type ModuleItem = {
  label: string;
  detail: string;
  icon: LucideIcon;
  action: () => void;
  active?: boolean;
};

function DashboardLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-ink-faint">
      {children}
    </p>
  );
}

export function DashboardView() {
  const { me, stats, openNoteDetail } = useAppShell();
  const router = useRouter();

  const onGoToRoadmaps = () => router.push("/app/roadmaps");
  const onGoToLibrary = () => router.push("/app/library");
  const onGoToStudyRooms = () => router.push("/app/rooms");
  const onGoToVerify = () => router.push("/app/college-vault");
  const onGoToAddResource = () => router.push("/app/add-resource");
  const onOpenNote = openNoteDetail;

  const [tasks, setTasks] = useState<ApiStudyTask[]>([]);
  const [newTask, setNewTask] = useState("");

  useEffect(() => {
    if (!me?.id) return;
    const controller = new AbortController();
    (async () => {
      try {
        const response = await fetch("/api/me/tasks", { signal: controller.signal });
        if (response.ok) {
          setTasks(((await response.json()) as { items: ApiStudyTask[] }).items);
        }
      } catch {
        // Not signed in or offline: leave the list empty.
      }
    })();
    return () => controller.abort();
  }, [me?.id]);

  async function onSubmitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newTask.trim();
    if (!title) return;
    setNewTask("");
    try {
      const response = await fetch("/api/me/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (response.ok) {
        const task = (await response.json()) as ApiStudyTask;
        setTasks((current) => [...current, task]);
      } else {
        setNewTask(title);
      }
    } catch {
      setNewTask(title);
    }
  }

  async function onToggleTask(id: string) {
    const target = tasks.find((task) => task.id === id);
    if (!target) return;
    const done = !target.done;
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, done } : task)));
    try {
      const response = await fetch(`/api/me/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done }),
      });
      if (!response.ok) throw new Error("toggle failed");
    } catch {
      setTasks((current) => current.map((task) => (task.id === id ? { ...task, done: !done } : task)));
    }
  }

  async function onRemoveTask(id: string) {
    const snapshot = tasks;
    setTasks((current) => current.filter((task) => task.id !== id));
    try {
      const response = await fetch(`/api/me/tasks/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("delete failed");
    } catch {
      setTasks(snapshot);
    }
  }

  const [trendingNotes, setTrendingNotes] = useState<ApiNote[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setTrendingLoading(true);
      try {
        const response = await fetch("/api/notes?sort=trending&limit=3", { signal: controller.signal });
        if (response.ok) {
          setTrendingNotes(((await response.json()) as NotesResponse).items);
        }
      } catch {
        // The dashboard remains useful without the discovery strip.
      } finally {
        if (!controller.signal.aborted) setTrendingLoading(false);
      }
    }, 0);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, []);

  const isVerified = Boolean(me?.isCollegeVerified);
  const collegeName = me?.collegeName ?? "College vault";
  const firstName = me?.name ? me.name.split(" ")[0] : "there";
  const tasksDone = tasks.filter((task) => task.done).length;
  const taskTotal = tasks.length;
  const taskProgress = taskTotal ? Math.round((tasksDone / taskTotal) * 100) : 0;
  const activityCount = (stats?.savedCount ?? 0) + (stats?.uploadCount ?? 0);
  const heroTitle = taskTotal
    ? `You've completed ${tasksDone} of ${taskTotal} tasks`
    : activityCount
      ? `You've collected ${activityCount} study items`
      : "Build your study week";

  const primaryCta = isVerified
    ? { label: "View progress", icon: ArrowRight, action: onGoToRoadmaps }
    : { label: "Verify college", icon: ShieldCheck, action: onGoToVerify };

  const learningCards: LearningCard[] = [
    {
      number: "01",
      title: "AI Roadmaps",
      subtitle: "Prerequisite-perfect plans",
      icon: Compass,
      tone: "light",
      action: onGoToRoadmaps,
    },
    {
      number: "02",
      title: "Exam Sprint",
      subtitle: "High-yield PYQ focus",
      icon: Flame,
      tone: "accent",
      action: () => router.push("/app/exam"),
    },
    {
      number: "03",
      title: "Study Rooms",
      subtitle: "Focus with peers",
      icon: Users,
      tone: "dark",
      action: onGoToStudyRooms,
    },
  ];

  const moduleItems: ModuleItem[] = [
    { label: "Generate AI roadmap", detail: "Custom plan from your files", icon: Sparkles, action: onGoToRoadmaps, active: true },
    { label: "Browse course library", detail: `${stats?.totalNotes ?? 0} published notes`, icon: BookOpen, action: onGoToLibrary },
    { label: "Upload resource", detail: `${stats?.uploadCount ?? 0} uploads by you`, icon: PlusCircle, action: onGoToAddResource },
    { label: "Open study rooms", detail: "Live focus sessions", icon: Users, action: onGoToStudyRooms },
  ];

  const scheduledRooms = [
    { name: "DBMS Exam Sprint", starts: "Starts in 3 min", type: "Group", accent: "bg-accent", people: ["D", "M", "B"] },
    { name: "CN Focus Room", starts: "7:00-7:40 PM", type: "College", accent: "bg-[#f7b267]", people: ["C", "N"] },
    { name: "Silent Study", starts: "Pomodoro live", type: "Public", accent: "bg-[#72dd89]", people: ["S", "T", "U"] },
  ];

  const metricCards = [
    { label: "Saved notes", value: String(stats?.savedCount ?? 0), icon: Bookmark },
    { label: "Uploads", value: String(stats?.uploadCount ?? 0), icon: FileText },
    { label: "Library", value: String(stats?.totalNotes ?? 0), icon: BookOpen },
  ];

  const ringSize = 72;
  const ringStroke = 8;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - taskProgress / 100);

  return (
    <div className="dashboard-redesign min-w-0 pb-6 text-ink">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: [0.23, 1, 0.32, 1] }}
        className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]"
      >
        <div className="min-w-0 overflow-hidden rounded-[2rem] border border-line bg-[#241813] shadow-[0_28px_80px_-48px_rgba(255,81,40,0.9)]">
          <div className="grid min-h-[300px] gap-5 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.95fr)]">
            <div className="flex min-w-0 flex-col justify-between">
              <div>
                <p className="text-sm font-semibold text-ink-soft">Salut, {firstName}!</p>
                <h2 className="mt-3 max-w-[11ch] text-[42px] font-black leading-[0.95] tracking-[-0.06em] text-ink sm:text-5xl lg:text-[56px]">
                  {heroTitle}
                </h2>
                <p className="mt-4 max-w-md text-sm leading-6 text-ink-soft">
                  Your roadmap, tasks, resources, and live study rooms now sit in one focused weekly command center.
                </p>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <motion.button
                  type="button"
                  onClick={primaryCta.action}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-black text-[#130f0d] shadow-[0_14px_34px_-18px_rgba(255,81,40,1)] transition hover:bg-accent-hover"
                >
                  {primaryCta.label}
                  <primaryCta.icon className="h-4 w-4" />
                </motion.button>
                <span className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-white/[0.04] px-4 text-xs font-bold text-ink-soft">
                  <GraduationCap className="h-4 w-4 text-accent" />
                  {isVerified ? collegeName : "Preview mode"}
                </span>
              </div>
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-3">
              {learningCards.map((card) => (
                <motion.button
                  key={card.number}
                  type="button"
                  onClick={card.action}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.985 }}
                  className={cx(
                    "group flex min-h-[210px] min-w-0 flex-col justify-between rounded-[1.45rem] border p-4 text-left transition",
                    card.tone === "light" &&
                      "border-[#efe5d8] bg-[#f5f0e7] text-[#17130f] shadow-[0_18px_40px_-28px_rgba(255,245,230,0.7)]",
                    card.tone === "accent" &&
                      "border-accent/40 bg-accent text-[#160f0c] shadow-[0_22px_42px_-28px_rgba(255,81,40,0.9)]",
                    card.tone === "dark" && "border-line bg-[#171a16] text-ink",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={cx(
                        "font-mono text-xs font-black",
                        card.tone === "dark" ? "text-accent" : "text-[#d74222]",
                      )}
                    >
                      {card.number}
                    </span>
                    <span
                      className={cx(
                        "grid h-8 w-8 place-items-center rounded-full",
                        card.tone === "accent" ? "bg-[#17100d]/15" : "bg-black/8",
                      )}
                    >
                      <card.icon className="h-4 w-4" />
                    </span>
                  </div>
                  <div>
                    <h3 className="text-[22px] font-black leading-[0.95] tracking-[-0.05em]">{card.title}</h3>
                    <p className={cx("mt-2 text-xs font-semibold", card.tone === "dark" ? "text-ink-soft" : "text-black/58")}>
                      {card.subtitle}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-black">
                    Open <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        <aside className="rounded-[2rem] border border-line bg-surface p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <DashboardLabel>Weekly progress</DashboardLabel>
              <h3 className="mt-1 text-xl font-black tracking-[-0.04em]">Tasks</h3>
            </div>
            <div className="relative" style={{ width: ringSize, height: ringSize }}>
              <svg width={ringSize} height={ringSize} className="-rotate-90">
                <circle cx={ringSize / 2} cy={ringSize / 2} r={ringRadius} fill="none" stroke="var(--line)" strokeWidth={ringStroke} />
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringRadius}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth={ringStroke}
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                />
              </svg>
              <div className="absolute inset-0 grid place-items-center font-mono text-sm font-black text-accent">
                {taskProgress}%
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {metricCards.map((metric) => (
              <div key={metric.label} className="flex items-center gap-3 rounded-2xl border border-line bg-paper-warm p-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-accent-soft text-accent">
                  <metric.icon className="h-4 w-4" />
                </span>
                <div>
                  <div className="font-mono text-lg font-black leading-none">{metric.value}</div>
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.13em] text-ink-faint">{metric.label}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </motion.section>

      <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
        <section className="min-w-0 rounded-[2rem] border border-line bg-surface p-5 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(230px,0.78fr)_minmax(0,1fr)]">
            <div>
              <DashboardLabel>Current module</DashboardLabel>
              <h3 className="mt-2 text-2xl font-black tracking-[-0.05em]">ClassVault sprint</h3>
              <p className="mt-1 text-sm font-semibold text-ink-soft">Your next study moves, ordered by impact.</p>

              <div className="mt-5 space-y-2">
                {moduleItems.map((item) => (
                  <motion.button
                    key={item.label}
                    type="button"
                    onClick={item.action}
                    whileHover={{ x: 3 }}
                    whileTap={{ scale: 0.99 }}
                    className={cx(
                      "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition",
                      item.active ? "border-accent/35 bg-accent-soft" : "border-line bg-paper-warm hover:border-line-strong",
                    )}
                  >
                    <span
                      className={cx(
                        "grid h-9 w-9 shrink-0 place-items-center rounded-full border",
                        item.active ? "border-accent/35 bg-accent text-[#130f0d]" : "border-line bg-surface text-ink-soft",
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black">{item.label}</span>
                      <span className="block truncate text-xs font-semibold text-ink-faint">{item.detail}</span>
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="min-w-0 rounded-[1.5rem] border border-line bg-paper p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <DashboardLabel>Today&apos;s plan</DashboardLabel>
                  <h3 className="mt-1 text-xl font-black tracking-[-0.04em]">Task queue</h3>
                </div>
                <span className="rounded-full bg-accent-soft px-3 py-1 font-mono text-xs font-black text-accent">
                  {tasksDone}/{taskTotal}
                </span>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface">
                <AnimatePresence initial={false}>
                  {tasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="group flex min-w-0 items-center gap-3 border-b border-line px-4 py-3 last:border-b-0"
                    >
                      <button
                        type="button"
                        onClick={() => onToggleTask(task.id)}
                        className={cx(
                          "grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[11px] font-black transition active:scale-95",
                          task.done
                            ? "border-accent bg-accent text-[#130f0d]"
                            : "border-line-strong bg-paper-warm hover:border-accent hover:bg-accent-soft",
                        )}
                        aria-label={task.done ? "Mark task incomplete" : "Mark task complete"}
                      >
                        {task.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                      </button>
                      <span
                        className={cx(
                          "min-w-0 flex-1 truncate text-sm font-bold",
                          task.done ? "text-ink-faint line-through" : "text-ink",
                        )}
                      >
                        {task.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveTask(task.id)}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-ink-faint opacity-0 transition hover:bg-paper-warm hover:text-accent group-hover:opacity-100"
                        aria-label="Remove task"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {!tasks.length ? (
                  <div className="px-4 py-7 text-center">
                    <p className="text-sm font-semibold text-ink-soft">No tasks yet. Add one quick move or generate a roadmap.</p>
                    <button
                      type="button"
                      onClick={onGoToRoadmaps}
                      className="mt-4 inline-flex h-9 items-center rounded-full bg-accent px-4 text-xs font-black text-[#130f0d] transition hover:bg-accent-hover"
                    >
                      Generate roadmap
                    </button>
                  </div>
                ) : null}
              </div>

              <form onSubmit={onSubmitTask} className="mt-3 flex min-w-0 gap-2">
                <input
                  value={newTask}
                  onChange={(event) => setNewTask(event.target.value)}
                  placeholder="Add a quick task..."
                  className="h-10 min-w-0 flex-1 rounded-full border border-line bg-surface px-4 text-sm font-semibold outline-none transition placeholder:text-ink-faint hover:border-line-strong focus:border-accent"
                />
                <button
                  type="submit"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-[#130f0d] transition hover:bg-accent-hover active:scale-[0.985]"
                  aria-label="Add task"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </section>

        <section className="min-w-0 rounded-[2rem] border border-line bg-surface p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <DashboardLabel>Scheduled</DashboardLabel>
              <h3 className="mt-2 text-2xl font-black tracking-[-0.05em]">Rooms today</h3>
            </div>
            <button
              type="button"
              onClick={onGoToStudyRooms}
              className="text-xs font-black text-accent hover:text-accent-hover"
            >
              See all
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {scheduledRooms.map((room) => (
              <motion.button
                key={room.name}
                type="button"
                onClick={onGoToStudyRooms}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.99 }}
                className="w-full rounded-[1.25rem] border border-line bg-paper-warm p-4 text-left transition hover:border-line-strong"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="truncate text-base font-black tracking-[-0.03em]">{room.name}</h4>
                    <p className="mt-1 text-xs font-semibold text-ink-faint">{room.starts}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-[10px] font-black text-ink-soft">
                    <span className={cx("h-1.5 w-1.5 rounded-full", room.accent)} />
                    {room.type}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-1.5">
                  {room.people.map((person, index) => (
                    <span
                      key={`${room.name}-${person}-${index}`}
                      className="grid h-7 w-7 place-items-center rounded-full border border-line bg-surface font-mono text-[10px] font-black text-ink"
                    >
                      {person}
                    </span>
                  ))}
                </div>
              </motion.button>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-5 rounded-[2rem] border border-line bg-surface p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <DashboardLabel>Recommended resources</DashboardLabel>
            <h3 className="mt-2 text-2xl font-black tracking-[-0.05em]">Trending this week</h3>
          </div>
          <button
            type="button"
            onClick={onGoToLibrary}
            className="inline-flex h-9 items-center justify-center rounded-full border border-line px-4 text-xs font-black text-ink-soft transition hover:border-line-strong hover:text-ink"
          >
            Browse all
          </button>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {trendingLoading
            ? Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="h-32 animate-pulse rounded-[1.4rem] border border-line bg-paper-warm" />
              ))
            : null}

          {!trendingLoading && !trendingNotes.length ? (
            <div className="rounded-[1.4rem] border border-dashed border-line px-5 py-8 text-center text-sm font-semibold text-ink-faint lg:col-span-3">
              No trending resources yet. New downloads will surface useful notes here.
            </div>
          ) : null}

          {!trendingLoading
            ? trendingNotes.map((note) => (
                <motion.button
                  key={note.id}
                  type="button"
                  onClick={() => onOpenNote(note)}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.99 }}
                  className="group min-w-0 rounded-[1.4rem] border border-line bg-paper-warm p-4 text-left transition hover:border-line-strong"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                      <FileText className="h-4 w-4" />
                    </span>
                    <span className="rounded-full border border-line bg-surface px-2.5 py-1 font-mono text-[10px] font-black text-ink-faint">
                      {note.fileType}
                    </span>
                  </div>
                  <h4 className="mt-4 line-clamp-2 text-base font-black leading-tight tracking-[-0.03em] text-ink">
                    {note.title}
                  </h4>
                  <div className="mt-3 flex min-w-0 items-center justify-between gap-3 text-xs font-bold text-ink-faint">
                    <span className="truncate">{note.subject}</span>
                    <span className="shrink-0">{note.downloadCount} downloads</span>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-black text-accent">
                    Open resource <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </span>
                </motion.button>
              ))
            : null}
        </div>
      </section>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[1.5rem] border border-line bg-surface p-4">
          <Clock className="h-4 w-4 text-accent" />
          <p className="mt-3 text-sm font-black">Focus rhythm</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-ink-faint">Plan work in short rooms, then bank resources for later.</p>
        </div>
        <div className="rounded-[1.5rem] border border-line bg-surface p-4">
          <CalendarDays className="h-4 w-4 text-accent" />
          <p className="mt-3 text-sm font-black">Weekly cadence</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-ink-faint">Tasks, rooms, and library activity stay visible in one view.</p>
        </div>
        <div className="rounded-[1.5rem] border border-line bg-surface p-4">
          <Zap className="h-4 w-4 text-accent" />
          <p className="mt-3 text-sm font-black">AI ready</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-ink-faint">Jump straight into personalized roadmaps when you need a path.</p>
        </div>
      </div>
    </div>
  );
}
