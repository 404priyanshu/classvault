"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  Plus,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Users,
} from "lucide-react";
import type { ApiNote, ApiStudyTask, NotesResponse } from "@/lib/api-types";
import { cx } from "@/lib/cx";
import { useAppShell } from "@/components/app-shell/app-shell-context";
import { LoadingRows, NoteRow, SectionLabel } from "@/components/notes/note-ui";

export function DashboardView() {
  const { me, stats, openNoteDetail } = useAppShell();
  const router = useRouter();

  const onGoToRoadmaps = () => router.push("/app/roadmaps");
  const onGoToLibrary = () => router.push("/app/library");
  const onGoToStudyRooms = () => router.push("/app/rooms");
  const onGoToVerify = () => router.push("/app/college-vault");
  const onGoToAddResource = () => router.push("/app/add-resource");
  const onOpenNote = openNoteDetail;

  // Study tasks (server-backed; persisted per user via /api/me/tasks).
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

  const onNewTaskChange = setNewTask;
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
      // Revert the optimistic toggle on failure.
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

  // Trending notes for the dashboard discovery strip.
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
        // trending strip stays empty on failure
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
  const collegeName = me?.collegeName ?? "your college";
  const firstName = me?.name ? me.name.split(" ")[0] : null;
  const greeting = firstName ? `Good to see you, ${firstName}.` : "Welcome back.";
  const tasksDone = tasks.filter((task) => task.done).length;

  const heroPills = [
    { icon: BookOpen, label: "Saved", value: String(stats?.totalNotes ?? 0) },
    { icon: CheckCircle2, label: "Tasks done", value: String(tasksDone) },
    {
      icon: ShieldCheck,
      label: isVerified ? collegeName : "Not verified",
      value: null as string | null,
    },
  ];

  const primaryCta = isVerified
    ? { label: "Generate a roadmap", icon: Sparkles, action: onGoToRoadmaps }
    : { label: "Verify college email", icon: ShieldCheck, action: onGoToVerify };

  const quickActions = [
    { label: "Generate AI Roadmap", desc: "Custom subject study plans", icon: Compass, action: onGoToRoadmaps, primary: true },
    { label: "Add Resource", desc: "Upload notes, slides, PYQs", icon: PlusCircle, action: onGoToAddResource, primary: false },
    { label: "Browse Notes", desc: "Search the course library", icon: BookOpen, action: onGoToLibrary, primary: false },
    { label: "Join Study Room", desc: "Focus alongside peers", icon: Users, action: onGoToStudyRooms, primary: false },
  ];

  return (
    <div className="min-w-0 space-y-8 pb-12">
      {/* Hero band */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="dashboard-hero relative overflow-hidden rounded-3xl px-6 py-7 text-surface shadow-[0_24px_70px_-28px_rgba(99,91,255,0.65)] sm:px-8 sm:py-9"
      >
        <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/70">
              Your study dashboard
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-[2.1rem]">{greeting}</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-white/80">
              Pick up where you left off — your plan, trending notes, and live rooms are all here.
            </p>

            <div className="mt-5 flex flex-wrap gap-2.5">
              {heroPills.map((pill) => (
                <span
                  key={pill.label}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-inset ring-white/20 backdrop-blur-sm"
                >
                  <pill.icon className="h-3.5 w-3.5 text-white/80" />
                  {pill.value ? <span className="font-mono tabular-nums">{pill.value}</span> : null}
                  <span className="max-w-[10rem] truncate text-white/80">{pill.label}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="shrink-0">
            <motion.button
              type="button"
              onClick={primaryCta.action}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="group inline-flex h-11 items-center gap-2 rounded-2xl bg-white px-5 text-sm font-semibold text-accent shadow-lg shadow-black/10"
            >
              <primaryCta.icon className="h-4 w-4" />
              {primaryCta.label}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </motion.button>
          </div>
        </div>
      </motion.section>

      {/* Quick actions */}
      <section>
        <div className="mb-3">
          <SectionLabel>Quick actions</SectionLabel>
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-3 min-[380px]:grid-cols-2 md:grid-cols-4 md:gap-4">
          {quickActions.map((card) => (
            <motion.button
              key={card.label}
              onClick={card.action}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.985 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={cx(
                "dashboard-card group flex min-w-0 flex-col rounded-3xl border p-5 text-left",
                card.primary
                  ? "border-transparent bg-accent text-surface shadow-[0_18px_45px_-22px_rgba(99,91,255,0.8)]"
                  : "border-line bg-surface",
              )}
            >
              <span
                className={cx(
                  "flex h-10 w-10 items-center justify-center rounded-2xl transition",
                  card.primary
                    ? "bg-white/15 text-white ring-1 ring-inset ring-white/25"
                    : "bg-accent-soft text-accent ring-1 ring-inset ring-accent/15 group-hover:ring-accent/30",
                )}
              >
                <card.icon className="h-5 w-5" />
              </span>
              <h4 className={cx("mt-4 text-sm font-semibold tracking-tight", card.primary ? "text-white" : "text-ink")}>
                {card.label}
              </h4>
              <p className={cx("mt-1 text-[12px] leading-snug", card.primary ? "text-white/75" : "text-ink-faint")}>
                {card.desc}
              </p>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Main bento grid */}
      <div className="grid min-w-0 gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Left column: Plan & Trending */}
        <div className="min-w-0 space-y-8">
          <section className="min-w-0 space-y-3">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <SectionLabel>Today&apos;s study plan</SectionLabel>
              <button onClick={onGoToRoadmaps} className="shrink-0 text-xs font-semibold text-accent hover:underline">
                Go to Roadmaps
              </button>
            </div>

            <div className="dashboard-card min-w-0 overflow-hidden rounded-3xl border border-line bg-surface">
              <div className="divide-y divide-line">
                <AnimatePresence>
                  {tasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="gorgeous-task-item group flex min-w-0 items-center gap-3 px-4 py-3"
                    >
                      <button
                        type="button"
                        onClick={() => onToggleTask(task.id)}
                        className={cx(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-xl border text-[11px] font-black transition active:scale-95",
                          task.done
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-line-strong bg-surface hover:border-accent hover:bg-accent-soft",
                        )}
                      >
                        {task.done ? "✓" : null}
                      </button>
                      <span
                        className={cx(
                          "min-w-0 flex-1 truncate text-[13px] font-medium",
                          task.done ? "text-ink-faint line-through" : "text-ink",
                        )}
                      >
                        {task.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveTask(task.id)}
                        className="-mr-1 shrink-0 p-1 text-ink-faint opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {!tasks.length && (
                  <div className="space-y-3 px-4 py-8 text-center">
                    <p className="text-xs text-ink-soft">
                      No tasks yet. Generate a roadmap or add something quick below.
                    </p>
                    <button
                      onClick={onGoToRoadmaps}
                      className="inline-flex h-8 items-center rounded-2xl bg-ink px-4 text-xs font-semibold text-surface transition hover:bg-ink/85"
                    >
                      Generate roadmap
                    </button>
                  </div>
                )}
              </div>
              <form onSubmit={onSubmitTask} className="flex min-w-0 gap-2 border-t border-line bg-paper p-3">
                <input
                  value={newTask}
                  onChange={(event) => onNewTaskChange(event.target.value)}
                  placeholder="Add a quick task…"
                  className="h-9 min-w-0 flex-1 rounded-2xl border border-transparent bg-surface px-3 text-xs font-medium outline-none transition placeholder:text-ink-faint focus:border-line-strong"
                />
                <button
                  type="submit"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-ink text-surface transition hover:bg-ink/85 active:scale-[0.985]"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </form>
            </div>
          </section>

          <section className="min-w-0 space-y-3">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <SectionLabel>Trending this week</SectionLabel>
              <button onClick={onGoToLibrary} className="shrink-0 text-xs font-semibold text-ink-soft hover:text-ink">
                Browse all
              </button>
            </div>
            {trendingLoading ? (
              <LoadingRows count={3} />
            ) : trendingNotes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-xs text-ink-faint">
                No trending resources yet. New downloads will surface useful notes here.
              </div>
            ) : (
              <div className="min-w-0 space-y-2">
                {trendingNotes.map((note) => (
                  <NoteRow key={note.id} note={note} onOpen={() => onOpenNote(note)} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right column: Rooms & metrics */}
        <div className="min-w-0 space-y-8">
          <section className="min-w-0 space-y-3">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <SectionLabel>Active study rooms</SectionLabel>
              <button onClick={onGoToStudyRooms} className="shrink-0 text-xs font-semibold text-accent hover:underline">
                Join room
              </button>
            </div>
            <div className="min-w-0 space-y-3">
              {[
                { name: "DBMS Exam Sprint", count: 18, timer: "25m focus", type: "College-only", avatars: ["D", "M", "B"] },
                { name: "CN Focus Room", count: 9, timer: "50m focus", type: "Public", avatars: ["C", "N"] },
                { name: "Silent Study", count: 32, timer: "Silent Pomodoro", type: "Public", avatars: ["S", "T", "U", "D"] },
              ].map((room, idx) => (
                <motion.div
                  key={room.name}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="dashboard-card flex min-w-0 flex-col gap-3 rounded-3xl border border-line bg-surface p-4 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between"
                >
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <h4 className="min-w-0 text-sm font-semibold leading-none text-ink">{room.name}</h4>
                      <span className="inline-flex items-center rounded-full border border-line bg-paper px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ink-soft">
                        {room.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="room-avatars">
                        {room.avatars.map((initial, i) => (
                          <motion.div
                            key={i}
                            whileHover={{ scale: 1.2 }}
                            className="room-avatar flex h-5 w-5 items-center justify-center rounded-full border border-line bg-accent-soft text-[8px] font-mono font-bold text-accent"
                            style={{ zIndex: room.avatars.length - i }}
                          >
                            {initial}
                          </motion.div>
                        ))}
                      </div>
                      <p className="truncate text-xs text-ink-soft">
                        {room.count} studying • {room.timer}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onGoToStudyRooms}
                    className="inline-flex h-8 w-full items-center justify-center rounded-2xl bg-ink px-4 text-xs font-bold text-surface hover:bg-ink/85 active:scale-[0.985] min-[420px]:w-auto"
                  >
                    Join
                  </button>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="min-w-0 space-y-3">
            <SectionLabel>Study metrics</SectionLabel>
            <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
              {(() => {
                const done = tasksDone;
                const total = Math.max(done, 8); // demo goal
                const pct = total ? Math.round((done / total) * 100) : 0;
                const size = 36,
                  stroke = 4,
                  r = (size - stroke) / 2;
                const circ = 2 * Math.PI * r;
                const offset = circ * (1 - pct / 100);
                return (
                  <div className="dashboard-stat flex items-center gap-3 rounded-3xl border border-accent/25 bg-accent-soft p-4">
                    <div className="relative" style={{ width: size, height: size }}>
                      <svg width={size} height={size} className="rotate-[-90deg]">
                        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
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
                      <div className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-bold text-accent">
                        {pct}
                      </div>
                    </div>
                    <div>
                      <div className="font-mono text-xl font-semibold tabular-nums text-ink">{done}</div>
                      <div className="-mt-0.5 text-[11px] font-semibold text-ink-soft">Tasks done (goal {total})</div>
                    </div>
                  </div>
                );
              })()}

              {[
                { label: "Saved files", value: String(stats?.totalNotes ?? 0), icon: BookOpen },
                { label: "Focus hours", value: "1.2h", icon: Target },
                { label: "AI Roadmaps", value: "3", icon: Compass },
              ].map((stat, i) => (
                <div key={i} className="dashboard-stat flex items-center gap-3 rounded-3xl border border-line bg-surface p-4">
                  <div className="rounded-2xl border border-line bg-paper p-2 text-ink-soft">
                    <stat.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-mono text-xl font-semibold tabular-nums text-ink">{stat.value}</div>
                    <div className="-mt-0.5 text-[11px] font-semibold text-ink-faint">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
