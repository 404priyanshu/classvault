"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Compass,
  GraduationCap,
  Plus,
  PlusCircle,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import type { ApiNote } from "@/lib/api-types";
import { cx } from "@/lib/cx";
import { useAppShell } from "@/components/app-shell/app-shell-context";
import { LoadingRows, NoteRow, SectionLabel } from "@/components/notes/note-ui";

type StudyTask = {
  id: string;
  title: string;
  done: boolean;
};

const initialStudyTasks: StudyTask[] = [
  { id: "task-1", title: "Solve DBMS normal form numericals", done: false },
  { id: "task-2", title: "Revise CPU scheduling Gantt charts", done: false },
  { id: "task-3", title: "Read sliding window protocol details", done: true },
];

export function DashboardView() {
  const { me, stats, openNoteDetail } = useAppShell();
  const router = useRouter();

  const onGoToRoadmaps = () => router.push("/app/roadmaps");
  const onGoToLibrary = () => router.push("/app/library");
  const onGoToStudyRooms = () => router.push("/app/rooms");
  const onGoToVerify = () => router.push("/app/college-vault");
  const onGoToAddResource = () => router.push("/app/add-resource");
  const onOpenNote = openNoteDetail;

  // Study tasks (dashboard-local; persisted to localStorage).
  const [tasks, setTasks] = useState<StudyTask[]>(initialStudyTasks);
  const [newTask, setNewTask] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem("cv_study_tasks");
        if (saved) setTasks(JSON.parse(saved) as StudyTask[]);
      } catch {
        // Ignore
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("cv_study_tasks", JSON.stringify(tasks));
    } catch {
      // Ignore
    }
  }, [tasks]);

  const onNewTaskChange = setNewTask;
  function onSubmitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newTask.trim();
    if (!title) return;
    setTasks((current) => [...current, { id: `task-${Date.now()}`, title, done: false }]);
    setNewTask("");
  }
  function onToggleTask(id: string) {
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));
  }
  function onRemoveTask(id: string) {
    setTasks((current) => current.filter((task) => task.id !== id));
  }

  // Recent notes for the "Saved Resources" strip.
  const [notes, setNotes] = useState<ApiNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/notes", { signal: controller.signal });
        if (response.ok) {
          setNotes(((await response.json()) as { items: ApiNote[] }).items);
        }
      } catch {
        // recent strip stays empty on failure
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 0);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, []);

  const isVerified = Boolean(me);
  const collegeName = me?.email.split("@")[1] ?? "your college";

  const greeting = me?.name ? `Good evening, ${me.name.split(" ")[0]}.` : "Welcome back.";

  return (
    <div className="min-w-0 space-y-8 pb-12">
      {/* Greeting Header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight text-ink">{greeting}</h2>
        <p className="text-sm text-ink-soft">Ready to continue your study roadmap?</p>
      </div>

      {/* College Vault Status */}
      <div className="flex min-w-0 flex-col gap-4 rounded-xl border border-line bg-surface p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-start gap-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <GraduationCap className="h-5 w-5" />
          </span>
          <div className="min-w-0 space-y-1">
            <div className="flex min-w-0 flex-col gap-2 min-[420px]:flex-row min-[420px]:items-center">
              <h3 className="text-sm font-semibold text-ink">
                {isVerified ? `Verified: ${collegeName}` : "Unlock your College Vault"}
              </h3>
              {isVerified && (
                <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                  <ShieldCheck className="h-3 w-3" />
                  Verified student
                </span>
              )}
            </div>
            <p className="text-xs text-ink-soft">
              {isVerified
                ? "You have full access to verified campus notes, semester groups, and private study rooms."
                : "Verify your official student email address to access private course groups, notes, and classmate study rooms."}
            </p>
          </div>
        </div>
        {!isVerified && (
          <button
            type="button"
            onClick={onGoToVerify}
            className="inline-flex h-9 w-full items-center justify-center rounded-md bg-accent px-4 text-xs font-semibold text-surface transition hover:bg-accent-hover sm:w-auto"
          >
            Verify college email
          </button>
        )}
      </div>

      {/* Primary Action Grid */}
      <section className="grid min-w-0 grid-cols-1 gap-3 min-[380px]:grid-cols-2 md:grid-cols-4 md:gap-4">
        {[
          { label: "Generate AI Roadmap", desc: "Build custom subject study plans", icon: Compass, action: onGoToRoadmaps },
          { label: "Add Resource", desc: "Ingest notes, link YouTube, websites", icon: PlusCircle, action: onGoToAddResource },
          { label: "Browse Notes", desc: "Search subject course library", icon: BookOpen, action: onGoToLibrary },
          { label: "Join Study Room", desc: "Study silently alongside peers", icon: Users, action: onGoToStudyRooms },
        ].map((card) => (
          <button
            key={card.label}
            onClick={card.action}
            className="group flex min-w-0 flex-col rounded-xl border border-line bg-surface p-4 text-left transition hover:border-line-strong hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-paper border border-line text-ink-soft group-hover:text-accent transition">
              <card.icon className="h-4.5 w-4.5" />
            </span>
            <h4 className="mt-3.5 min-w-0 text-xs font-bold text-ink">{card.label}</h4>
            <p className="mt-1 min-w-0 text-[11px] leading-normal text-ink-faint">{card.desc}</p>
          </button>
        ))}
      </section>

      {/* Main Grid: Today's Plan & Study Rooms */}
      <div className="grid min-w-0 gap-8 lg:grid-cols-[1.6fr_1fr]">

        {/* Left column: Plan & Saved */}
        <div className="min-w-0 space-y-8">
          {/* Today's Study Plan */}
          <section className="min-w-0 space-y-3">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <SectionLabel>Today&apos;s Study Plan</SectionLabel>
              <button
                onClick={onGoToRoadmaps}
                className="shrink-0 text-xs font-semibold text-accent hover:underline"
              >
                Go to Roadmaps
              </button>
            </div>

            <div className="min-w-0 rounded-lg border border-line bg-surface">
              <div className="divide-y divide-line">
                {tasks.map((task) => (
                  <div key={task.id} className="group flex min-w-0 items-center gap-3 px-3.5 py-2.5">
                    <button
                      type="button"
                      onClick={() => onToggleTask(task.id)}
                      className={cx(
                        "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border transition",
                        task.done ? "border-accent bg-accent text-surface" : "border-line-strong hover:border-ink",
                      )}
                    >
                      {task.done ? <span className="text-[10px]">✓</span> : null}
                    </button>
                    <span
                      className={cx(
                        "min-w-0 flex-1 truncate text-xs font-medium",
                        task.done ? "text-ink-faint line-through" : "text-ink",
                      )}
                    >
                      {task.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveTask(task.id)}
                      className="shrink-0 text-ink-faint opacity-0 transition hover:text-ink group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {!tasks.length ? (
                  <div className="px-3.5 py-10 text-center space-y-3">
                    <p className="text-xs text-ink-soft">
                      No roadmap yet. Generate a study plan from your notes, PYQs, and saved resources.
                    </p>
                    <button
                      onClick={onGoToRoadmaps}
                      className="inline-flex h-8 items-center rounded-md bg-ink px-4 text-xs font-semibold text-surface transition hover:bg-ink/85"
                    >
                      Generate roadmap
                    </button>
                  </div>
                ) : null}
              </div>
              {tasks.length > 0 && (
                <form onSubmit={onSubmitTask} className="flex min-w-0 gap-2 border-t border-line p-2">
                  <input
                    value={newTask}
                    onChange={(event) => onNewTaskChange(event.target.value)}
                    placeholder="Add a custom task…"
                    className="h-8 min-w-0 flex-1 rounded-md border border-transparent bg-paper px-2.5 text-xs font-medium outline-none transition placeholder:text-ink-faint focus:border-line-strong"
                  />
                  <button
                    type="submit"
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-ink text-surface transition hover:bg-ink/85"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>
          </section>

          {/* Recently Saved Resources */}
          <section className="min-w-0 space-y-3">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <SectionLabel>Saved Resources</SectionLabel>
              <button
                onClick={onGoToLibrary}
                className="shrink-0 text-xs font-semibold text-ink-soft hover:text-ink"
              >
                Browse all
              </button>
            </div>
            {loading ? (
              <LoadingRows count={3} />
            ) : notes.length === 0 ? (
              <div className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-xs text-ink-faint">
                Your study vault is empty. Save notes, links, and PYQs to start organizing.
              </div>
            ) : (
              <div className="min-w-0 space-y-2">
                {notes.slice(0, 3).map((note) => (
                  <NoteRow key={note.id} note={note} onOpen={() => onOpenNote(note)} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right column: Active Study Rooms & Quick Stats */}
        <div className="min-w-0 space-y-8">
          {/* Study Rooms Feed */}
          <section className="min-w-0 space-y-3">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <SectionLabel>Active Study Rooms</SectionLabel>
              <button
                onClick={onGoToStudyRooms}
                className="shrink-0 text-xs font-semibold text-accent hover:underline"
              >
                Join room
              </button>
            </div>
            <div className="min-w-0 space-y-3">
              {[
                { name: "DBMS Exam Sprint", count: 18, timer: "25m focus", type: "College-only" },
                { name: "CN Focus Room", count: 9, timer: "50m focus", type: "Public" },
                { name: "Silent Study", count: 32, timer: "Silent Pomodoro", type: "Public" },
              ].map((room) => (
                <div key={room.name} className="flex min-w-0 flex-col gap-3 rounded-lg border border-line bg-surface p-3.5 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <h4 className="min-w-0 text-xs font-semibold leading-none text-ink">{room.name}</h4>
                      <span className="inline-flex items-center rounded border border-line bg-paper px-1 py-0.5 text-[9px] font-bold text-ink-soft uppercase leading-none">
                        {room.type}
                      </span>
                    </div>
                    <p className="truncate text-[10px] leading-none text-ink-soft">
                      {room.count} studying • {room.timer}
                    </p>
                  </div>
                  <button
                    onClick={onGoToStudyRooms}
                    className="inline-flex h-8 w-full items-center justify-center rounded bg-ink px-3 text-[10px] font-bold text-surface hover:bg-ink/85 min-[420px]:h-7 min-[420px]:w-auto"
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Study Metrics */}
          <section className="min-w-0 space-y-3">
            <SectionLabel>Study metrics</SectionLabel>
            <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
              <div className="rounded-lg border border-line bg-surface p-4 text-center">
                <span className="block text-xl font-bold text-ink">{stats?.totalNotes ?? "0"}</span>
                <span className="block text-[10px] text-ink-soft font-semibold mt-1">Saved files</span>
              </div>
              <div className="rounded-lg border border-line bg-surface p-4 text-center">
                <span className="block text-xl font-bold text-ink">{tasks.filter(t => t.done).length}</span>
                <span className="block text-[10px] text-ink-soft font-semibold mt-1">Tasks done</span>
              </div>
              <div className="rounded-lg border border-line bg-surface p-4 text-center">
                <span className="block text-xl font-bold text-ink">1.2h</span>
                <span className="block text-[10px] text-ink-soft font-semibold mt-1">Focus hours</span>
              </div>
              <div className="rounded-lg border border-line bg-surface p-4 text-center">
                <span className="block text-xl font-bold text-ink">3</span>
                <span className="block text-[10px] text-ink-soft font-semibold mt-1">AI Roadmaps</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
