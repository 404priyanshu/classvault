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
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  currentUser,
  emptyUploadDraft,
  initialNotes,
  initialsOf,
  type FileType,
  type Note,
  type UploadDraft,
} from "@/lib/classvault-data";
import { SearchCommandPalette } from "@/components/search-command-palette";

type ActiveView = "dashboard" | "library" | "saved" | "uploads" | "profile";
type LayoutMode = "list" | "grid";

type StudyTask = {
  id: string;
  title: string;
  done: boolean;
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

function formatCount(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}

export function ClassVaultApp() {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");
  const [query, setQuery] = useState("");
  const [semester, setSemester] = useState("All");
  const [subject, setSubject] = useState("All");
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("list");
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadDraft, setUploadDraft] = useState<UploadDraft>(emptyUploadDraft);
  const [tasks, setTasks] = useState<StudyTask[]>(initialStudyTasks);
  const [newTask, setNewTask] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const savedCount = notes.filter((note) => note.saved).length;
  const myUploads = notes.filter((note) => note.ownerId === "current-user");
  const totalDownloads = notes.reduce((sum, note) => sum + note.downloads, 0);
  const averageRating = notes.length
    ? notes.reduce((sum, note) => sum + note.rating, 0) / notes.length
    : 0;

  const semesters = useMemo(
    () => ["All", ...Array.from(new Set(notes.map((note) => note.semester))).sort((a, b) => Number(a) - Number(b))],
    [notes],
  );
  const subjects = useMemo(
    () => ["All", ...Array.from(new Set(notes.map((note) => note.subject))).sort()],
    [notes],
  );

  const filteredNotes = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return notes.filter((note) => {
      const viewMatch =
        activeView === "saved"
          ? note.saved
          : activeView === "uploads"
            ? note.ownerId === "current-user"
            : true;

      const queryMatch = normalized
        ? [note.title, note.subject, note.courseCode, note.unit, note.topic, ...note.tags]
            .join(" ")
            .toLowerCase()
            .includes(normalized)
        : true;

      return (
        viewMatch &&
        queryMatch &&
        (semester === "All" || note.semester === semester) &&
        (subject === "All" || note.subject === subject)
      );
    });
  }, [activeView, notes, query, semester, subject]);

  const openNote = openNoteId ? notes.find((note) => note.id === openNoteId) ?? null : null;

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function toggleSaved(noteId: string) {
    setNotes((current) =>
      current.map((note) => (note.id === noteId ? { ...note, saved: !note.saved } : note)),
    );
  }

  function resetFilters() {
    setQuery("");
    setSemester("All");
    setSubject("All");
  }

  function submitUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = uploadDraft.title.trim();
    if (!title) return;

    const tags = uploadDraft.tags
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const note: Note = {
      id: `note-${Date.now()}`,
      title,
      subject: uploadDraft.subject.trim() || "General",
      semester: uploadDraft.semester,
      courseCode: uploadDraft.courseCode.trim().toUpperCase() || "—",
      unit: uploadDraft.unit.trim() || "Uploaded resource",
      topic: tags[0] || uploadDraft.unit.trim() || "Student contribution",
      uploader: currentUser.name,
      uploaderRole: currentUser.role,
      fileType: uploadDraft.fileType,
      fileSize: "Pending",
      uploadDate: "Just now",
      rating: 0,
      ratingsCount: 0,
      downloads: 0,
      tags,
      summary: uploadDraft.summary.trim() || "New upload awaiting review.",
      ownerId: "current-user",
      saved: false,
    };

    setNotes((current) => [note, ...current]);
    setUploadDraft(emptyUploadDraft);
    setUploadOpen(false);
    setToast("Resource submitted for review");
  }

  function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newTask.trim();
    if (!title) return;
    setTasks((current) => [...current, { id: `task-${Date.now()}`, title, done: false }]);
    setNewTask("");
  }

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
              {item.id === "saved" && savedCount > 0 ? (
                <span className="ml-auto font-mono text-xs text-ink-faint">{savedCount}</span>
              ) : null}
            </button>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setActiveView("profile")}
          className="flex items-center gap-3 border-t border-line p-3.5 text-left transition hover:bg-paper"
        >
          <Avatar name={currentUser.name} size="sm" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{currentUser.name}</span>
            <span className="block truncate text-xs text-ink-faint">{currentUser.email}</span>
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
              <SearchCommandPalette notes={notes} onSelectNote={setOpenNoteId} />
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
              savedCount={savedCount}
              uploadCount={myUploads.length}
              totalDownloads={totalDownloads}
              averageRating={averageRating}
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
              onOpenNote={setOpenNoteId}
              onGoToLibrary={() => setActiveView("library")}
            />
          ) : activeView === "profile" ? (
            <ProfileView
              uploads={myUploads}
              savedCount={savedCount}
              totalDownloads={totalDownloads}
              averageRating={averageRating}
              onOpenNote={setOpenNoteId}
              onUpload={() => setUploadOpen(true)}
            />
          ) : (
            <>
              <FilterBar
                query={query}
                onQueryChange={setQuery}
                semester={semester}
                semesters={semesters}
                onSemesterChange={setSemester}
                subject={subject}
                subjects={subjects}
                onSubjectChange={setSubject}
                layoutMode={layoutMode}
                onLayoutModeChange={setLayoutMode}
                onReset={resetFilters}
                count={filteredNotes.length}
              />
              <NoteCollection
                notes={filteredNotes}
                layoutMode={layoutMode}
                onOpenNote={setOpenNoteId}
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
          onClose={() => setOpenNoteId(null)}
          onToggleSaved={() => toggleSaved(openNote.id)}
        />
      ) : null}

      {uploadOpen ? (
        <UploadDialog
          draft={uploadDraft}
          onDraftChange={setUploadDraft}
          onSubmit={submitUpload}
          onClose={() => setUploadOpen(false)}
        />
      ) : null}

      {toast ? (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-md border border-line bg-ink px-4 py-2.5 text-sm font-medium text-surface shadow-lg lg:bottom-6">
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

function DashboardView({
  notes,
  savedCount,
  uploadCount,
  totalDownloads,
  averageRating,
  tasks,
  newTask,
  onNewTaskChange,
  onSubmitTask,
  onToggleTask,
  onRemoveTask,
  onOpenNote,
  onGoToLibrary,
}: {
  notes: Note[];
  savedCount: number;
  uploadCount: number;
  totalDownloads: number;
  averageRating: number;
  tasks: StudyTask[];
  newTask: string;
  onNewTaskChange: (value: string) => void;
  onSubmitTask: (event: FormEvent<HTMLFormElement>) => void;
  onToggleTask: (id: string) => void;
  onRemoveTask: (id: string) => void;
  onOpenNote: (id: string) => void;
  onGoToLibrary: () => void;
}) {
  const metrics: Array<[string, string]> = [
    ["Resources", String(notes.length)],
    ["Saved", String(savedCount)],
    ["Your uploads", String(uploadCount)],
    ["Downloads", formatCount(totalDownloads)],
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
          <div className="space-y-2">
            {notes.slice(0, 5).map((note) => (
              <NoteRow key={note.id} note={note} onOpen={() => onOpenNote(note.id)} />
            ))}
          </div>
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
            <p className="mt-3 font-mono text-2xl font-semibold">{averageRating.toFixed(1)}</p>
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
  layoutMode,
  onOpenNote,
  emptyHint,
}: {
  notes: Note[];
  layoutMode: LayoutMode;
  onOpenNote: (id: string) => void;
  emptyHint: string;
}) {
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
          <NoteCard key={note.id} note={note} onOpen={() => onOpenNote(note.id)} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notes.map((note) => (
        <NoteRow key={note.id} note={note} onOpen={() => onOpenNote(note.id)} />
      ))}
    </div>
  );
}

function FileBadge({ type }: { type: FileType }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line bg-paper font-mono text-[10px] font-semibold text-ink-soft">
      {type}
    </span>
  );
}

function NoteRow({ note, onOpen }: { note: Note; onOpen: () => void }) {
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
          {note.saved ? <Bookmark className="h-3 w-3 shrink-0 fill-current text-ink-soft" /> : null}
        </span>
        <span className="mt-0.5 block truncate text-xs text-ink-faint">
          {note.subject} · Sem {note.semester} · {note.unit}
        </span>
      </span>
      <span className="hidden shrink-0 font-mono text-xs text-ink-faint sm:block">{note.courseCode}</span>
      <span className="flex shrink-0 items-center gap-1 font-mono text-xs text-ink-faint">
        <Star className="h-3 w-3" />
        {note.rating ? note.rating.toFixed(1) : "—"}
      </span>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-faint opacity-0 transition group-hover:opacity-100" />
    </button>
  );
}

function NoteCard({ note, onOpen }: { note: Note; onOpen: () => void }) {
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
          {note.rating ? note.rating.toFixed(1) : "—"}
        </span>
        <span className="flex items-center gap-1">
          <Download className="h-3 w-3" />
          {formatCount(note.downloads)}
        </span>
      </div>
    </button>
  );
}

function ProfileView({
  uploads,
  savedCount,
  totalDownloads,
  averageRating,
  onOpenNote,
  onUpload,
}: {
  uploads: Note[];
  savedCount: number;
  totalDownloads: number;
  averageRating: number;
  onOpenNote: (id: string) => void;
  onUpload: () => void;
}) {
  const stats: Array<[string, string]> = [
    ["Uploads", String(uploads.length)],
    ["Saved", String(savedCount)],
    ["Downloads", formatCount(totalDownloads)],
    ["Avg rating", averageRating.toFixed(1)],
  ];

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-5 rounded-lg border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-4">
          <Avatar name={currentUser.name} size="lg" />
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{currentUser.name}</h2>
            <p className="mt-0.5 text-sm text-ink-faint">{currentUser.email}</p>
            <p className="mt-0.5 font-mono text-xs text-ink-faint">{currentUser.role}</p>
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
        {stats.map(([label, value]) => (
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
        {uploads.length ? (
          <div className="space-y-2">
            {uploads.map((note) => (
              <NoteRow key={note.id} note={note} onOpen={() => onOpenNote(note.id)} />
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
}: {
  note: Note;
  onClose: () => void;
  onToggleSaved: () => void;
}) {
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
          <p className="mt-3 text-sm leading-6 text-ink-soft">{note.summary}</p>

          <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
            {(
              [
                ["Rating", note.rating ? note.rating.toFixed(1) : "—"],
                ["Downloads", formatCount(note.downloads)],
                ["Size", note.fileSize],
                ["Pages", note.pages ? String(note.pages) : "—"],
              ] as Array<[string, string]>
            ).map(([label, value]) => (
              <div key={label} className="bg-surface p-3.5">
                <p className="font-mono text-base font-semibold">{value}</p>
                <p className="mt-0.5 text-[11px] text-ink-faint">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-3 rounded-lg border border-line bg-paper p-3.5">
            <Avatar name={note.uploader} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{note.uploader}</p>
              <p className="truncate text-xs text-ink-faint">
                {note.uploaderRole} · {note.uploadDate}
              </p>
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
            <Bookmark className={cx("h-4 w-4", note.saved && "fill-current")} />
            {note.saved ? "Saved" : "Save"}
          </button>
          <button
            type="button"
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
  draft,
  onDraftChange,
  onSubmit,
  onClose,
}: {
  draft: UploadDraft;
  onDraftChange: (draft: UploadDraft) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}) {
  function update<K extends keyof UploadDraft>(key: K, value: UploadDraft[K]) {
    onDraftChange({ ...draft, [key]: value });
  }

  const inputClasses =
    "h-9 rounded-md border border-line bg-surface px-3 text-sm outline-none transition placeholder:text-ink-faint hover:border-line-strong focus:border-ink-faint";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-xl overflow-hidden rounded-lg border border-line bg-surface shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Upload resource</h2>
            <p className="mt-0.5 text-sm text-ink-faint">Add metadata before the file enters review.</p>
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
            Title
            <input
              required
              value={draft.title}
              onChange={(event) => update("title", event.target.value)}
              placeholder="DBMS – Unit 3 Notes"
              className={inputClasses}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Subject
            <input
              value={draft.subject}
              onChange={(event) => update("subject", event.target.value)}
              className={inputClasses}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Course code
            <input
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
            File type
            <select
              value={draft.fileType}
              onChange={(event) => update("fileType", event.target.value as FileType)}
              className={cx(inputClasses, "appearance-none")}
            >
              {["PDF", "DOCX", "PPTX", "ZIP"].map((item) => (
                <option key={item} value={item}>
                  {item}
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
          <label className="grid gap-1.5 text-sm font-medium">
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
              value={draft.summary}
              onChange={(event) => update("summary", event.target.value)}
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
            className="inline-flex h-9 items-center rounded-md bg-ink px-3.5 text-sm font-medium text-surface transition hover:bg-ink/85"
          >
            Submit upload
          </button>
        </div>
      </form>
    </div>
  );
}
