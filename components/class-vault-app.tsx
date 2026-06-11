"use client";

import {
  ArrowUpRight,
  Bookmark,
  BookOpen,
  ChevronDown,
  Download,
  FileText,
  Grid2X2,
  LayoutDashboard,
  List,
  LogOut,
  Plus,
  Search,
  Star,
  Trash2,
  Upload,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import type { ApiError, ApiNote, ApiUser, MetaResponse, NotesResponse } from "@/lib/api-types";
import { formatBytes, formatCount, formatDate, initialsOf } from "@/lib/format";
import { SearchCommandPalette } from "@/components/search-command-palette";

type ActiveView = "dashboard" | "library" | "saved" | "uploads" | "profile";
type LayoutMode = "list" | "grid";

type StudyTask = {
  id: string;
  title: string;
  done: boolean;
};

type UploadDraft = {
  title: string;
  subject: string;
  semester: string;
  courseCode: string;
  unit: string;
  tags: string;
  description: string;
  file: File | null;
};

const emptyDraft: UploadDraft = {
  title: "",
  subject: "",
  semester: "5",
  courseCode: "",
  unit: "",
  tags: "",
  description: "",
  file: null,
};

const navItems: Array<{ id: ActiveView; label: string; icon: LucideIcon }> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "library", label: "Library", icon: BookOpen },
  { id: "saved", label: "Saved", icon: Bookmark },
  { id: "uploads", label: "Uploads", icon: Upload },
  { id: "profile", label: "Profile", icon: User },
];

const viewTitles: Record<ActiveView, string> = {
  dashboard: "Dashboard",
  library: "Library",
  saved: "Saved",
  uploads: "Your uploads",
  profile: "Profile",
};

const initialStudyTasks: StudyTask[] = [
  { id: "task-1", title: "Solve DBMS normal form numericals", done: false },
  { id: "task-2", title: "Revise CPU scheduling Gantt charts", done: false },
  { id: "task-3", title: "Read sliding window protocol details", done: true },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

async function readError(response: Response) {
  try {
    const body = (await response.json()) as ApiError;
    return body.error?.message ?? `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

export function ClassVaultApp() {
  const [me, setMe] = useState<ApiUser | null>(null);
  const [meta, setMeta] = useState<MetaResponse | null>(null);
  const [notes, setNotes] = useState<ApiNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<ActiveView>("dashboard");
  const [query, setQuery] = useState("");
  const [semester, setSemester] = useState("All");
  const [subject, setSubject] = useState("All");
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("list");
  const [openNote, setOpenNote] = useState<ApiNote | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [tasks, setTasks] = useState<StudyTask[]>(initialStudyTasks);
  const [newTask, setNewTask] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const refetchCounter = useRef(0);
  const [refetchTick, setRefetchTick] = useState(0);

  const refreshMeta = useCallback(async () => {
    try {
      const response = await fetch("/api/meta");
      if (response.ok) setMeta((await response.json()) as MetaResponse);
    } catch {
      // non-fatal; stats refresh on next successful call
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      void refreshMeta();
      try {
        const response = await fetch("/api/me");
        if (response.ok) setMe((await response.json()) as ApiUser);
      } catch {
        // profile chrome degrades gracefully without a user
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshMeta]);

  // Server-side filtering: every filter/view change becomes /api/notes params.
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (activeView !== "dashboard") {
      if (query.trim()) params.set("q", query.trim());
      if (semester !== "All") params.set("semester", semester);
      if (subject !== "All") params.set("subject", subject);
    }
    if (activeView === "saved") params.set("saved", "true");
    if (activeView === "uploads" || activeView === "profile") params.set("owner", "me");

    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/notes?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error(await readError(response));
        const data = (await response.json()) as NotesResponse;
        setNotes(data.items);
        setLoadError(null);
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(error instanceof Error ? error.message : "Failed to load resources.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, query ? 300 : 0);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [activeView, query, semester, subject, refetchTick]);

  const refetchNotes = useCallback(() => {
    refetchCounter.current += 1;
    setRefetchTick(refetchCounter.current);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function patchNote(noteId: string, patch: Partial<ApiNote>) {
    setNotes((current) =>
      current.map((note) => (note.id === noteId ? { ...note, ...patch } : note)),
    );
    setOpenNote((current) => (current?.id === noteId ? { ...current, ...patch } : current));
  }

  async function toggleSaved(note: ApiNote) {
    const nextSaved = !note.savedByMe;
    patchNote(note.id, { savedByMe: nextSaved });
    try {
      const response = await fetch(`/api/notes/${note.id}/save`, {
        method: nextSaved ? "POST" : "DELETE",
      });
      if (!response.ok) throw new Error(await readError(response));
      void refreshMeta();
      if (activeView === "saved") refetchNotes();
    } catch (error) {
      patchNote(note.id, { savedByMe: note.savedByMe });
      setToast(error instanceof Error ? error.message : "Could not update saved state.");
    }
  }

  async function rateNote(note: ApiNote, value: number) {
    try {
      const response = await fetch(`/api/notes/${note.id}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      if (!response.ok) throw new Error(await readError(response));
      const result = (await response.json()) as {
        ratingAverage: number;
        ratingCount: number;
        myRating: number;
      };
      patchNote(note.id, result);
      void refreshMeta();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not save rating.");
    }
  }

  async function downloadNote(note: ApiNote) {
    try {
      const response = await fetch(`/api/notes/${note.id}/download`, { method: "POST" });
      if (!response.ok) throw new Error(await readError(response));
      const result = (await response.json()) as {
        downloadUrl: string | null;
        downloadCount: number;
      };
      patchNote(note.id, { downloadCount: result.downloadCount });
      void refreshMeta();
      if (result.downloadUrl) {
        window.open(result.downloadUrl, "_blank");
      } else {
        setToast("Download recorded — seeded resource has no file attached.");
      }
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not download.");
    }
  }

  async function submitUpload(draft: UploadDraft) {
    if (!draft.file) {
      setToast("Choose a file to upload.");
      return false;
    }
    try {
      const formData = new FormData();
      formData.set("file", draft.file);
      const uploadResponse = await fetch("/api/uploads", { method: "POST", body: formData });
      if (!uploadResponse.ok) throw new Error(await readError(uploadResponse));
      const { storageKey } = (await uploadResponse.json()) as { storageKey: string };

      const noteResponse = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title.trim(),
          description: draft.description.trim(),
          subject: draft.subject.trim() || "General",
          semester: draft.semester,
          courseCode: draft.courseCode.trim() || "MISC",
          unit: draft.unit.trim(),
          topic: "",
          storageKey,
          tags: draft.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        }),
      });
      if (!noteResponse.ok) throw new Error(await readError(noteResponse));

      setUploadOpen(false);
      setToast("Resource published");
      refetchNotes();
      void refreshMeta();
      return true;
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Upload failed.");
      return false;
    }
  }

  function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newTask.trim();
    if (!title) return;
    setTasks((current) => [...current, { id: `task-${Date.now()}`, title, done: false }]);
    setNewTask("");
  }

  const stats = meta?.stats;
  const savedBadge = stats?.savedCount ?? 0;

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Mobile header */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-surface px-4 lg:hidden">
        <Wordmark />
        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-ink px-3 text-sm font-medium text-surface"
        >
          <Plus className="h-3.5 w-3.5" />
          Upload
        </button>
      </header>

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 flex-col border-r border-line bg-surface lg:flex">
        <div className="flex h-14 items-center border-b border-line px-4">
          <Wordmark />
        </div>

        <nav className="flex-1 space-y-0.5 p-2.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveView(item.id)}
              className={cx(
                "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition",
                activeView === item.id
                  ? "bg-paper text-ink shadow-[inset_0_0_0_1px_var(--line)]"
                  : "text-ink-soft hover:bg-paper hover:text-ink",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {item.id === "saved" && savedBadge > 0 ? (
                <span className="ml-auto font-mono text-xs text-ink-faint">{savedBadge}</span>
              ) : null}
            </button>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setActiveView("profile")}
          className="flex items-center gap-3 border-t border-line p-3.5 text-left transition hover:bg-paper"
        >
          <Avatar name={me?.name ?? "?"} size="sm" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{me?.name ?? "Loading…"}</span>
            <span className="block truncate text-xs text-ink-faint">{me?.email ?? ""}</span>
          </span>
        </button>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-surface px-2 py-1.5 lg:hidden">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveView(item.id)}
            className={cx(
              "flex flex-col items-center gap-1 rounded-md px-1 py-1.5 text-[10px] font-medium",
              activeView === item.id ? "text-ink" : "text-ink-faint",
            )}
          >
            <item.icon className="h-4 w-4" />
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </nav>

      <main className="px-4 pb-24 pt-20 sm:px-6 lg:ml-56 lg:px-10 lg:pb-12 lg:pt-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-3 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xl font-semibold tracking-tight">{viewTitles[activeView]}</h1>
            <div className="flex items-center gap-2">
              <SearchCommandPalette
                subjects={meta?.subjects ?? []}
                onSelectNote={setOpenNote}
              />
              <button
                type="button"
                onClick={() => setUploadOpen(true)}
                className="hidden h-9 shrink-0 items-center gap-1.5 rounded-md bg-ink px-3.5 text-sm font-medium text-surface transition hover:bg-ink/85 sm:inline-flex"
              >
                <Plus className="h-4 w-4" />
                Upload
              </button>
            </div>
          </div>

          {activeView === "dashboard" ? (
            <DashboardView
              notes={notes}
              loading={loading}
              loadError={loadError}
              stats={stats}
              tasks={tasks}
              newTask={newTask}
              onNewTaskChange={setNewTask}
              onSubmitTask={submitTask}
              onToggleTask={(id) =>
                setTasks((current) =>
                  current.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
                )
              }
              onRemoveTask={(id) => setTasks((current) => current.filter((task) => task.id !== id))}
              onOpenNote={setOpenNote}
              onGoToLibrary={() => setActiveView("library")}
            />
          ) : activeView === "profile" ? (
            <ProfileView
              me={me}
              uploads={notes}
              loading={loading}
              stats={stats}
              onOpenNote={setOpenNote}
              onUpload={() => setUploadOpen(true)}
            />
          ) : (
            <>
              <FilterBar
                query={query}
                onQueryChange={setQuery}
                semester={semester}
                semesters={["All", ...(meta?.semesters ?? [])]}
                onSemesterChange={setSemester}
                subject={subject}
                subjects={["All", ...(meta?.subjects ?? [])]}
                onSubjectChange={setSubject}
                layoutMode={layoutMode}
                onLayoutModeChange={setLayoutMode}
                onReset={() => {
                  setQuery("");
                  setSemester("All");
                  setSubject("All");
                }}
                count={notes.length}
              />
              <NoteCollection
                notes={notes}
                loading={loading}
                loadError={loadError}
                onRetry={refetchNotes}
                layoutMode={layoutMode}
                onOpenNote={setOpenNote}
                emptyHint={
                  activeView === "saved"
                    ? "Resources you bookmark will collect here."
                    : activeView === "uploads"
                      ? "Resources you contribute will appear here."
                      : "Try clearing a filter or searching for another course."
                }
              />
            </>
          )}
        </div>
      </main>

      {openNote ? (
        <DetailDrawer
          note={openNote}
          onClose={() => setOpenNote(null)}
          onToggleSaved={() => toggleSaved(openNote)}
          onRate={(value) => rateNote(openNote, value)}
          onDownload={() => downloadNote(openNote)}
        />
      ) : null}

      {uploadOpen ? (
        <UploadDialog onSubmit={submitUpload} onClose={() => setUploadOpen(false)} />
      ) : null}

      {toast ? (
        <div className="fixed bottom-20 left-1/2 z-[95] w-max max-w-[90vw] -translate-x-1/2 rounded-md border border-line bg-ink px-4 py-2.5 text-sm font-medium text-surface shadow-lg lg:bottom-6">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="ClassVault home">
      <span className="flex h-6 w-6 items-center justify-center rounded bg-ink font-mono text-[10px] font-semibold text-surface">
        CV
      </span>
      <span className="text-sm font-semibold tracking-tight">ClassVault</span>
    </Link>
  );
}

function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "lg" }) {
  return (
    <span
      className={cx(
        "flex shrink-0 items-center justify-center rounded-full border border-line bg-paper font-medium text-ink-soft",
        size === "sm" ? "h-8 w-8 text-xs" : "h-16 w-16 text-xl",
      )}
    >
      {initialsOf(name)}
    </span>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint">
      {children}
    </p>
  );
}

function LoadingRows({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="h-16 animate-pulse rounded-lg border border-line bg-surface" />
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-line-strong px-5 py-16 text-center">
      <p className="text-sm font-medium">Could not load resources</p>
      <p className="mt-1 text-sm text-ink-faint">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex h-9 items-center rounded-md border border-line bg-surface px-3.5 text-sm font-medium text-ink-soft transition hover:border-line-strong hover:text-ink"
      >
        Retry
      </button>
    </div>
  );
}

function DashboardView({
  notes,
  loading,
  loadError,
  stats,
  tasks,
  newTask,
  onNewTaskChange,
  onSubmitTask,
  onToggleTask,
  onRemoveTask,
  onOpenNote,
  onGoToLibrary,
}: {
  notes: ApiNote[];
  loading: boolean;
  loadError: string | null;
  stats: MetaResponse["stats"] | undefined;
  tasks: StudyTask[];
  newTask: string;
  onNewTaskChange: (value: string) => void;
  onSubmitTask: (event: FormEvent<HTMLFormElement>) => void;
  onToggleTask: (id: string) => void;
  onRemoveTask: (id: string) => void;
  onOpenNote: (note: ApiNote) => void;
  onGoToLibrary: () => void;
}) {
  const metrics: Array<[string, string]> = [
    ["Resources", stats ? String(stats.totalNotes) : "—"],
    ["Saved", stats ? String(stats.savedCount) : "—"],
    ["Your uploads", stats ? String(stats.uploadCount) : "—"],
    ["Downloads", stats ? formatCount(stats.totalDownloads) : "—"],
  ];

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line lg:grid-cols-4">
        {metrics.map(([label, value]) => (
          <div key={label} className="bg-surface p-4 sm:p-5">
            <p className="font-mono text-2xl font-semibold tracking-tight">{value}</p>
            <p className="mt-1 text-xs font-medium text-ink-faint">{label}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-8 xl:grid-cols-[1.5fr_1fr]">
        <section>
          <div className="flex items-center justify-between pb-3">
            <SectionLabel>Recent resources</SectionLabel>
            <button
              type="button"
              onClick={onGoToLibrary}
              className="flex items-center gap-1 text-xs font-medium text-ink-soft transition hover:text-ink"
            >
              View library
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
          {loading ? (
            <LoadingRows count={5} />
          ) : loadError ? (
            <p className="rounded-lg border border-dashed border-line-strong px-4 py-10 text-center text-sm text-ink-faint">
              {loadError}
            </p>
          ) : (
            <div className="space-y-2">
              {notes.slice(0, 5).map((note) => (
                <NoteRow key={note.id} note={note} onOpen={() => onOpenNote(note)} />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between pb-3">
            <SectionLabel>Study tasks</SectionLabel>
            <span className="font-mono text-xs text-ink-faint">
              {tasks.filter((task) => !task.done).length} open
            </span>
          </div>
          <div className="rounded-lg border border-line bg-surface">
            <div className="divide-y divide-line">
              {tasks.map((task) => (
                <div key={task.id} className="group flex items-center gap-3 px-3.5 py-2.5">
                  <button
                    type="button"
                    onClick={() => onToggleTask(task.id)}
                    aria-label={task.done ? `Mark "${task.title}" not done` : `Mark "${task.title}" done`}
                    className={cx(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition",
                      task.done ? "border-ink bg-ink" : "border-line-strong hover:border-ink",
                    )}
                  >
                    {task.done ? <span className="h-1.5 w-1.5 rounded-full bg-surface" /> : null}
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
                    className="text-ink-faint opacity-0 transition hover:text-ink group-hover:opacity-100"
                    aria-label={`Remove ${task.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {!tasks.length ? (
                <p className="px-3.5 py-6 text-center text-sm text-ink-faint">No open tasks.</p>
              ) : null}
            </div>
            <form onSubmit={onSubmitTask} className="flex gap-2 border-t border-line p-2.5">
              <input
                value={newTask}
                onChange={(event) => onNewTaskChange(event.target.value)}
                placeholder="Add a task…"
                className="h-8 min-w-0 flex-1 rounded-md border border-transparent bg-paper px-2.5 text-sm outline-none transition placeholder:text-ink-faint focus:border-line-strong"
              />
              <button
                type="submit"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-ink text-surface transition hover:bg-ink/85"
                aria-label="Add task"
              >
                <Plus className="h-4 w-4" />
              </button>
            </form>
          </div>

          <div className="mt-6 rounded-lg border border-line bg-surface p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Library rating</p>
              <Star className="h-4 w-4 text-ink-faint" />
            </div>
            <p className="mt-3 font-mono text-2xl font-semibold">
              {stats ? stats.ratingAverage.toFixed(1) : "—"}
            </p>
            <p className="mt-1 text-xs text-ink-faint">average across all resources</p>
          </div>
        </section>
      </div>
    </div>
  );
}

function FilterBar({
  query,
  onQueryChange,
  semester,
  semesters,
  onSemesterChange,
  subject,
  subjects,
  onSubjectChange,
  layoutMode,
  onLayoutModeChange,
  onReset,
  count,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  semester: string;
  semesters: string[];
  onSemesterChange: (value: string) => void;
  subject: string;
  subjects: string[];
  onSubjectChange: (value: string) => void;
  layoutMode: LayoutMode;
  onLayoutModeChange: (value: LayoutMode) => void;
  onReset: () => void;
  count: number;
}) {
  const filtersActive = query !== "" || semester !== "All" || subject !== "All";

  return (
    <div className="flex flex-col gap-2 pb-4 sm:flex-row sm:flex-wrap sm:items-center">
      <label className="relative min-w-0 flex-1 sm:max-w-64">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Filter by title, tag, code…"
          className="h-9 w-full rounded-md border border-line bg-surface pl-8 pr-3 text-sm outline-none transition placeholder:text-ink-faint hover:border-line-strong focus:border-ink-faint"
        />
      </label>
      <FilterSelect label="Semester" value={semester} options={semesters} onChange={onSemesterChange} />
      <FilterSelect label="Subject" value={subject} options={subjects} onChange={onSubjectChange} />
      {filtersActive ? (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-9 items-center rounded-md px-2.5 text-sm font-medium text-ink-soft transition hover:text-ink"
        >
          Clear
        </button>
      ) : null}
      <div className="flex items-center gap-3 sm:ml-auto">
        <span className="font-mono text-xs text-ink-faint">{count} results</span>
        <div className="inline-flex rounded-md border border-line bg-surface p-0.5">
          {(
            [
              ["list", List],
              ["grid", Grid2X2],
            ] as Array<[LayoutMode, LucideIcon]>
          ).map(([mode, Icon]) => (
            <button
              key={mode}
              type="button"
              onClick={() => onLayoutModeChange(mode)}
              className={cx(
                "inline-flex h-7 w-7 items-center justify-center rounded text-ink-faint transition",
                layoutMode === mode && "bg-paper text-ink shadow-[inset_0_0_0_1px_var(--line)]",
              )}
              aria-label={`${mode} layout`}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full appearance-none rounded-md border border-line bg-surface pl-3 pr-8 text-sm font-medium text-ink-soft outline-none transition hover:border-line-strong focus:border-ink-faint sm:w-auto"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option === "All" ? label : option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
    </label>
  );
}

function NoteCollection({
  notes,
  loading,
  loadError,
  onRetry,
  layoutMode,
  onOpenNote,
  emptyHint,
}: {
  notes: ApiNote[];
  loading: boolean;
  loadError: string | null;
  onRetry: () => void;
  layoutMode: LayoutMode;
  onOpenNote: (note: ApiNote) => void;
  emptyHint: string;
}) {
  if (loading) return <LoadingRows count={6} />;
  if (loadError) return <ErrorState message={loadError} onRetry={onRetry} />;

  if (!notes.length) {
    return (
      <div className="flex flex-col items-center rounded-lg border border-dashed border-line-strong px-5 py-20 text-center">
        <FileText className="h-5 w-5 text-ink-faint" />
        <p className="mt-4 text-sm font-medium">Nothing here yet</p>
        <p className="mt-1 text-sm text-ink-faint">{emptyHint}</p>
      </div>
    );
  }

  if (layoutMode === "grid") {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {notes.map((note) => (
          <NoteCard key={note.id} note={note} onOpen={() => onOpenNote(note)} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notes.map((note) => (
        <NoteRow key={note.id} note={note} onOpen={() => onOpenNote(note)} />
      ))}
    </div>
  );
}

function FileBadge({ type }: { type: ApiNote["fileType"] }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line bg-paper font-mono text-[10px] font-semibold text-ink-soft">
      {type}
    </span>
  );
}

function NoteRow({ note, onOpen }: { note: ApiNote; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-center gap-3 rounded-lg border border-line bg-surface p-3 text-left transition hover:border-line-strong"
    >
      <FileBadge type={note.fileType} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium">{note.title}</span>
          {note.savedByMe ? (
            <Bookmark className="h-3 w-3 shrink-0 fill-current text-ink-soft" />
          ) : null}
        </span>
        <span className="mt-0.5 block truncate text-xs text-ink-faint">
          {note.subject} · Sem {note.semester} · {note.unit}
        </span>
      </span>
      <span className="hidden shrink-0 font-mono text-xs text-ink-faint sm:block">{note.courseCode}</span>
      <span className="flex shrink-0 items-center gap-1 font-mono text-xs text-ink-faint">
        <Star className="h-3 w-3" />
        {note.ratingCount ? note.ratingAverage.toFixed(1) : "—"}
      </span>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-faint opacity-0 transition group-hover:opacity-100" />
    </button>
  );
}

function NoteCard({ note, onOpen }: { note: ApiNote; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex flex-col rounded-lg border border-line bg-surface p-4 text-left transition hover:border-line-strong"
    >
      <div className="flex w-full items-start justify-between gap-3">
        <FileBadge type={note.fileType} />
        <span className="font-mono text-xs text-ink-faint">{note.courseCode}</span>
      </div>
      <h3 className="mt-4 line-clamp-2 text-sm font-semibold">{note.title}</h3>
      <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-faint">{note.topic}</p>
      <div className="mt-4 flex w-full items-center justify-between border-t border-line pt-3 font-mono text-xs text-ink-faint">
        <span className="flex items-center gap-1">
          <Star className="h-3 w-3" />
          {note.ratingCount ? note.ratingAverage.toFixed(1) : "—"}
        </span>
        <span className="flex items-center gap-1">
          <Download className="h-3 w-3" />
          {formatCount(note.downloadCount)}
        </span>
      </div>
    </button>
  );
}

function ProfileView({
  me,
  uploads,
  loading,
  stats,
  onOpenNote,
  onUpload,
}: {
  me: ApiUser | null;
  uploads: ApiNote[];
  loading: boolean;
  stats: MetaResponse["stats"] | undefined;
  onOpenNote: (note: ApiNote) => void;
  onUpload: () => void;
}) {
  const statItems: Array<[string, string]> = [
    ["Uploads", stats ? String(stats.uploadCount) : "—"],
    ["Saved", stats ? String(stats.savedCount) : "—"],
    ["Downloads", stats ? formatCount(stats.totalDownloads) : "—"],
    ["Avg rating", stats ? stats.ratingAverage.toFixed(1) : "—"],
  ];

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-5 rounded-lg border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-4">
          <Avatar name={me?.name ?? "?"} size="lg" />
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{me?.name ?? "Loading…"}</h2>
            <p className="mt-0.5 text-sm text-ink-faint">{me?.email ?? ""}</p>
            <p className="mt-0.5 font-mono text-xs text-ink-faint">{me?.roleLabel ?? ""}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onUpload}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-ink px-3.5 text-sm font-medium text-surface transition hover:bg-ink/85"
          >
            <Upload className="h-4 w-4" />
            Upload
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line px-3.5 text-sm font-medium text-ink-soft transition hover:border-line-strong hover:text-ink"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line lg:grid-cols-4">
        {statItems.map(([label, value]) => (
          <div key={label} className="bg-surface p-4 sm:p-5">
            <p className="font-mono text-2xl font-semibold tracking-tight">{value}</p>
            <p className="mt-1 text-xs font-medium text-ink-faint">{label}</p>
          </div>
        ))}
      </section>

      <section>
        <div className="pb-3">
          <SectionLabel>Your contributions</SectionLabel>
        </div>
        {loading ? (
          <LoadingRows count={3} />
        ) : uploads.length ? (
          <div className="space-y-2">
            {uploads.map((note) => (
              <NoteRow key={note.id} note={note} onOpen={() => onOpenNote(note)} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-line-strong px-5 py-14 text-center">
            <p className="text-sm font-medium">No uploads yet</p>
            <p className="mt-1 text-sm text-ink-faint">Share your first resource with your class.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function DetailDrawer({
  note,
  onClose,
  onToggleSaved,
  onRate,
  onDownload,
}: {
  note: ApiNote;
  onClose: () => void;
  onToggleSaved: () => void;
  onRate: (value: number) => void;
  onDownload: () => void;
}) {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/25">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close detail" />
      <aside className="relative flex h-full w-full max-w-lg flex-col border-l border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div className="flex items-center gap-3">
            <FileBadge type={note.fileType} />
            <div>
              <p className="font-mono text-sm font-medium">{note.courseCode}</p>
              <p className="text-xs text-ink-faint">{note.subject}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-faint transition hover:bg-paper hover:text-ink"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6">
          <h2 className="text-xl font-semibold tracking-tight">{note.title}</h2>
          <p className="mt-3 text-sm leading-6 text-ink-soft">{note.description}</p>

          <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
            {(
              [
                ["Rating", note.ratingCount ? note.ratingAverage.toFixed(1) : "—"],
                ["Downloads", formatCount(note.downloadCount)],
                ["Size", formatBytes(note.fileSizeBytes)],
                ["Pages", note.pageCount ? String(note.pageCount) : "—"],
              ] as Array<[string, string]>
            ).map(([label, value]) => (
              <div key={label} className="bg-surface p-3.5">
                <p className="font-mono text-base font-semibold">{value}</p>
                <p className="mt-0.5 text-[11px] text-ink-faint">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-3 rounded-lg border border-line bg-paper p-3.5">
            <Avatar name={note.uploader.name} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{note.uploader.name}</p>
              <p className="truncate text-xs text-ink-faint">
                {note.uploader.roleLabel} · {formatDate(note.createdAt)}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-line p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {note.myRating ? "Your rating" : "Rate this resource"}
              </p>
              <span className="font-mono text-xs text-ink-faint">
                {note.ratingCount} rating{note.ratingCount === 1 ? "" : "s"}
              </span>
            </div>
            <div
              className="mt-3 flex gap-1"
              onMouseLeave={() => setHoverRating(0)}
              role="radiogroup"
              aria-label="Rate this resource from 1 to 5 stars"
            >
              {[1, 2, 3, 4, 5].map((value) => {
                const active = value <= (hoverRating || note.myRating || 0);
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={note.myRating === value}
                    aria-label={`${value} star${value === 1 ? "" : "s"}`}
                    onMouseEnter={() => setHoverRating(value)}
                    onClick={() => onRate(value)}
                    className="rounded p-0.5 transition hover:scale-110"
                  >
                    <Star
                      className={cx(
                        "h-5 w-5 transition",
                        active ? "fill-current text-ink" : "text-line-strong",
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {note.tags.length ? (
            <div className="mt-6">
              <SectionLabel>Tags</SectionLabel>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {note.tags.map((item) => (
                  <span
                    key={item}
                    className="rounded-md border border-line bg-surface px-2 py-1 text-xs font-medium text-ink-soft"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-line p-4">
          <button
            type="button"
            onClick={onToggleSaved}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line text-sm font-medium text-ink-soft transition hover:border-line-strong hover:text-ink"
          >
            <Bookmark className={cx("h-4 w-4", note.savedByMe && "fill-current")} />
            {note.savedByMe ? "Saved" : "Save"}
          </button>
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink text-sm font-medium text-surface transition hover:bg-ink/85"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
        </div>
      </aside>
    </div>
  );
}

function UploadDialog({
  onSubmit,
  onClose,
}: {
  onSubmit: (draft: UploadDraft) => Promise<boolean>;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<UploadDraft>(emptyDraft);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof UploadDraft>(key: K, value: UploadDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const ok = await onSubmit(draft);
    if (!ok) setSubmitting(false);
  }

  const inputClasses =
    "h-9 rounded-md border border-line bg-surface px-3 text-sm outline-none transition placeholder:text-ink-faint hover:border-line-strong focus:border-ink-faint";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg border border-line bg-surface shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Upload resource</h2>
            <p className="mt-0.5 text-sm text-ink-faint">PDF, DOCX, PPTX, or ZIP up to 25 MB.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-faint transition hover:bg-paper hover:text-ink"
            aria-label="Close upload dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
            File
            <input
              required
              type="file"
              accept=".pdf,.docx,.pptx,.zip"
              onChange={(event) => update("file", event.target.files?.[0] ?? null)}
              className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink-soft outline-none transition file:mr-3 file:rounded file:border-0 file:bg-ink file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-surface hover:border-line-strong"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
            Title
            <input
              required
              minLength={3}
              maxLength={120}
              value={draft.title}
              onChange={(event) => update("title", event.target.value)}
              placeholder="DBMS – Unit 3 Notes"
              className={inputClasses}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Subject
            <input
              required
              value={draft.subject}
              onChange={(event) => update("subject", event.target.value)}
              className={inputClasses}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Course code
            <input
              required
              value={draft.courseCode}
              onChange={(event) => update("courseCode", event.target.value)}
              placeholder="CS302"
              className={inputClasses}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Semester
            <select
              value={draft.semester}
              onChange={(event) => update("semester", event.target.value)}
              className={cx(inputClasses, "appearance-none")}
            >
              {["1", "2", "3", "4", "5", "6", "7", "8"].map((item) => (
                <option key={item} value={item}>
                  Semester {item}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Unit
            <input
              value={draft.unit}
              onChange={(event) => update("unit", event.target.value)}
              placeholder="Unit 3"
              className={inputClasses}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
            Tags
            <input
              value={draft.tags}
              onChange={(event) => update("tags", event.target.value)}
              placeholder="DBMS, SQL, PYQ"
              className={inputClasses}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
            Description
            <textarea
              value={draft.description}
              onChange={(event) => update("description", event.target.value)}
              rows={3}
              className="resize-none rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none transition placeholder:text-ink-faint hover:border-line-strong focus:border-ink-faint"
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-line p-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-md border border-line px-3.5 text-sm font-medium text-ink-soft transition hover:border-line-strong hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-9 items-center rounded-md bg-ink px-3.5 text-sm font-medium text-surface transition hover:bg-ink/85 disabled:opacity-60"
          >
            {submitting ? "Uploading…" : "Publish resource"}
          </button>
        </div>
      </form>
    </div>
  );
}
