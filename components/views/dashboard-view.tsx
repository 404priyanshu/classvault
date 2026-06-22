"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Compass,
  FileText,
  PlusCircle,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import type { ApiNote, ApiStudyTask, NotesResponse } from "@/lib/api-types";
import { cx } from "@/lib/cx";
import { useAppShell } from "@/components/app-shell/app-shell-context";
import { Badge, Button, Card, EmptyState, Input, SectionHeading, Skeleton } from "@/components/ui";

type QuickAction = { label: string; detail: string; icon: LucideIcon; action: () => void };

export function DashboardView() {
  const { me, stats, openNoteDetail } = useAppShell();
  const router = useRouter();

  const onGoToRoadmaps = () => router.push("/app/roadmaps");
  const onGoToLibrary = () => router.push("/app/library");
  const onGoToStudyRooms = () => router.push("/app/rooms");
  const onGoToAddResource = () => router.push("/app/add-resource");

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
    (async () => {
      try {
        const response = await fetch("/api/notes?sort=trending&limit=4", { signal: controller.signal });
        if (response.ok) {
          setTrendingNotes(((await response.json()) as NotesResponse).items);
        }
      } catch {
        // The dashboard remains useful without the discovery strip.
      } finally {
        if (!controller.signal.aborted) setTrendingLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  const firstName = me?.name ? me.name.split(" ")[0] : "there";
  const tasksDone = tasks.filter((task) => task.done).length;
  const taskTotal = tasks.length;

  const metrics = [
    { label: "Saved", value: stats?.savedCount ?? 0 },
    { label: "Uploads", value: stats?.uploadCount ?? 0 },
    { label: "Library", value: stats?.totalNotes ?? 0 },
    { label: "Tasks done", value: taskTotal ? `${tasksDone}/${taskTotal}` : 0 },
  ];

  const quickActions: QuickAction[] = [
    { label: "Generate AI roadmap", detail: "Custom plan from your files", icon: Compass, action: onGoToRoadmaps },
    { label: "Browse library", detail: `${stats?.totalNotes ?? 0} published notes`, icon: BookOpen, action: onGoToLibrary },
    { label: "Add resource", detail: "Upload notes, slides, PYQs", icon: PlusCircle, action: onGoToAddResource },
    { label: "Study rooms", detail: "Focus alongside peers", icon: Users, action: onGoToStudyRooms },
  ];

  return (
    <div className="min-w-0 space-y-6">
      <p className="text-sm text-ink-soft">Welcome back, {firstName}.</p>

      {/* Stat row */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-surface px-4 py-3.5">
            <div className="font-mono text-2xl font-semibold tabular-nums">{metric.value}</div>
            <div className="mt-1 text-xs text-ink-faint">{metric.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Tasks */}
        <section className="min-w-0">
          <SectionHeading
            title="Today's tasks"
            action={
              <button onClick={onGoToRoadmaps} className="text-xs text-ink-soft hover:text-ink">
                Roadmaps
              </button>
            }
          />
          <Card>
            <div className="divide-y divide-line">
              {tasks.map((task) => (
                <div key={task.id} className="group flex items-center gap-3 px-4 py-2.5">
                  <button
                    type="button"
                    onClick={() => onToggleTask(task.id)}
                    className={cx(
                      "grid h-4 w-4 shrink-0 place-items-center rounded border text-[10px]",
                      task.done
                        ? "border-ink bg-ink text-surface"
                        : "border-line-strong bg-surface hover:border-ink",
                    )}
                    aria-label={task.done ? "Mark task incomplete" : "Mark task complete"}
                  >
                    {task.done ? "✓" : null}
                  </button>
                  <span
                    className={cx(
                      "min-w-0 flex-1 truncate text-sm",
                      task.done ? "text-ink-faint line-through" : "text-ink",
                    )}
                  >
                    {task.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveTask(task.id)}
                    className="shrink-0 p-1 text-ink-faint opacity-0 hover:text-ink group-hover:opacity-100"
                    aria-label="Remove task"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {!tasks.length ? (
                <div className="px-4 py-8 text-center text-sm text-ink-faint">
                  No tasks yet. Add one below or generate a roadmap.
                </div>
              ) : null}
            </div>
            <form onSubmit={onSubmitTask} className="flex gap-2 border-t border-line p-2.5">
              <Input
                value={newTask}
                onChange={(event) => setNewTask(event.target.value)}
                placeholder="Add a task…"
              />
              <Button type="submit">Add</Button>
            </form>
          </Card>
        </section>

        {/* Quick actions */}
        <section className="min-w-0">
          <SectionHeading title="Quick actions" />
          <Card>
            <div className="divide-y divide-line">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.action}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-paper"
                >
                  <action.icon className="h-4 w-4 shrink-0 text-ink-soft" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{action.label}</span>
                    <span className="block truncate text-xs text-ink-faint">{action.detail}</span>
                  </span>
                </button>
              ))}
            </div>
          </Card>
        </section>
      </div>

      {/* Trending */}
      <section className="min-w-0">
        <SectionHeading
          title="Trending this week"
          action={
            <button onClick={onGoToLibrary} className="text-xs text-ink-soft hover:text-ink">
              Browse all
            </button>
          }
        />
        {trendingLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-28" />
            ))}
          </div>
        ) : !trendingNotes.length ? (
          <EmptyState message="No trending resources yet. New downloads will surface notes here." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {trendingNotes.map((note) => (
              <button
                key={note.id}
                type="button"
                onClick={() => openNoteDetail(note)}
                className="flex min-w-0 flex-col rounded-lg border border-line bg-surface p-4 text-left hover:border-line-strong"
              >
                <div className="flex items-center justify-between">
                  <FileText className="h-4 w-4 text-ink-soft" />
                  <Badge mono>{note.fileType}</Badge>
                </div>
                <h3 className="mt-3 line-clamp-2 text-sm font-medium leading-snug">{note.title}</h3>
                <div className="mt-2 flex items-center justify-between gap-2 text-xs text-ink-faint">
                  <span className="truncate">{note.subject}</span>
                  <span className="shrink-0">{note.downloadCount} ↓</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
