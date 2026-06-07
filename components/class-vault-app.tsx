"use client";

import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  Bookmark,
  BookOpenCheck,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  LayoutDashboard,
  LayoutGrid,
  Star,
  Upload,
  X,
  Settings,
  Calendar as CalendarIcon,
  Inbox,
  User,
  Activity,
  Plus,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";

import {
  currentUser,
  emptyUploadDraft,
  initialNotes,
  type FileType,
  type Note,
  type UploadDraft,
} from "@/lib/classvault-data";

import {
  Cursor,
  CursorFollow,
  CursorProvider,
} from "@/components/animate-ui/components/animate/cursor";
import { SearchCommandPalette } from "@/components/search-command-palette";
import StarBorder from "@/components/StarBorder";

type View = "library" | "saved" | "uploads" | "explore";
type ThemeMode = "light" | "dark";
const THEME_STORAGE_KEY = "classvault-theme";

type Toast = {
  title: string;
  detail: string;
};

// Top navigation tabs
const topNavTabs = ["Dashboard", "Workflows", "Integrations"];

// Tasks state for the assignments checklist widget
type StudyTask = {
  id: string;
  title: string;
  tag: string;
  priority: "High" | "Medium" | "Low";
};

const initialStudyTasks: StudyTask[] = [
  {
    id: "task-1",
    title: "Solve DBMS normal form numericals",
    tag: "Normalization",
    priority: "High",
  },
  {
    id: "task-2",
    title: "Revise CPU scheduling Gantt charts",
    tag: "OS scheduling",
    priority: "Medium",
  },
  { id: "task-3", title: "Read sliding window protocol details", tag: "Networks", priority: "Low" },
];

function formatCount(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return String(value);
}

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function ClassVaultApp() {
  const [theme, setTheme] = useState<ThemeMode>("light");

  // Read theme from localStorage on mount
  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "dark") {
      const timer = window.setTimeout(() => setTheme("dark"), 0);
      return () => window.clearTimeout(timer);
    }
  }, []);

  // Toggle theme handler
  const updateTheme = useCallback((nextTheme: ThemeMode) => {
    setTheme(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  }, []);

  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [activeView, setActiveView] = useState<View>("library");
  const [query, setQuery] = useState("");
  const [semester, setSemester] = useState("All");
  const [subject, setSubject] = useState("All");
  const [noteTag, setNoteTag] = useState("All");
  const [layoutMode, setLayoutMode] = useState<"list" | "grid">("list");

  const [savedIds, setSavedIds] = useState<Set<string>>(
    () => new Set(initialNotes.filter((note) => note.saved).map((note) => note.id)),
  );
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [selectedNoteId, setSelectedNoteId] = useState(initialNotes[0]?.id ?? "");
  const [detailOpen, setDetailOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [, setIsSignedIn] = useState(true);
  const [uploadDraft, setUploadDraft] = useState<UploadDraft>(emptyUploadDraft);
  const [toast, setToast] = useState<Toast | null>(null);

  // V4 assignments widget state
  const [studyTasks, setStudyTasks] = useState<StudyTask[]>(initialStudyTasks);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskTag, setNewTaskTag] = useState("");

  const subjects = useMemo(
    () => ["All", ...Array.from(new Set(notes.map((note) => note.subject))).sort()],
    [notes],
  );

  const semesters = useMemo(
    () => [
      "All",
      ...Array.from(new Set(notes.map((note) => note.semester))).sort(
        (a, b) => Number(a) - Number(b),
      ),
    ],
    [notes],
  );

  const tags = useMemo(
    () => ["All", ...Array.from(new Set(notes.flatMap((note) => note.tags))).sort()],
    [notes],
  );

  const filteredNotes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return notes.filter((note) => {
      const viewMatch =
        activeView === "library" ||
        activeView === "explore" ||
        (activeView === "saved" && savedIds.has(note.id)) ||
        (activeView === "uploads" && note.ownerId === currentUser.id);

      const semesterMatch = semester === "All" || note.semester === semester;
      const subjectMatch = subject === "All" || note.subject === subject;
      const tagMatch = noteTag === "All" || note.tags.includes(noteTag);

      const searchableText = [
        note.title,
        note.subject,
        note.semester,
        note.courseCode,
        note.unit,
        note.topic,
        note.uploader,
        note.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      const queryMatch = !normalizedQuery || searchableText.includes(normalizedQuery);

      return viewMatch && semesterMatch && subjectMatch && tagMatch && queryMatch;
    });
  }, [activeView, notes, query, savedIds, semester, subject, noteTag]);

  const selectedNote = useMemo(() => {
    const selectedInFiltered = filteredNotes.find((note) => note.id === selectedNoteId);
    return (
      selectedInFiltered ??
      filteredNotes[0] ??
      notes.find((note) => note.id === selectedNoteId) ??
      notes[0]
    );
  }, [filteredNotes, notes, selectedNoteId]);

  const savedCount = savedIds.size;
  const uploadCount = notes.filter((note) => note.ownerId === currentUser.id).length;
  const totalDownloads = notes.reduce((sum, note) => sum + note.downloads, 0);
  const averageRating =
    notes.reduce((sum, note) => sum + note.rating, 0) / Math.max(notes.length, 1);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function resetFilters() {
    setQuery("");
    setSemester("All");
    setSubject("All");
    setNoteTag("All");
  }

  function toggleSaved(noteId: string) {
    setSavedIds((current) => {
      const next = new Set(current);
      const isSaved = next.has(noteId);

      if (isSaved) {
        next.delete(noteId);
      } else {
        next.add(noteId);
      }

      setToast({
        title: isSaved ? "Removed from saved" : "Saved to vault",
        detail: isSaved
          ? "The note is no longer in your saved list."
          : "You can find this note under Bookmarks.",
      });

      return next;
    });
  }

  function rateNote(noteId: string, value: number) {
    setRatings((current) => ({ ...current, [noteId]: value }));
    setToast({
      title: "Rating captured",
      detail: `You rated this resource ${value} out of 5.`,
    });
  }

  function downloadNote(noteId: string) {
    const note = notes.find((item) => item.id === noteId);

    setNotes((current) =>
      current.map((item) =>
        item.id === noteId ? { ...item, downloads: item.downloads + 1 } : item,
      ),
    );

    setToast({
      title: "Download started",
      detail: note
        ? `${note.title} is ready as a mock ${note.fileType} download.`
        : "Mock file ready.",
    });
  }

  function openNote(noteId: string) {
    setSelectedNoteId(noteId);
    setDetailOpen(true);
  }

  function submitUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = uploadDraft.title.trim();
    const courseCodeVal = uploadDraft.courseCode.trim();

    if (!title || !courseCodeVal) {
      setToast({
        title: "Upload needs a title and code",
        detail: "Add the resource title and course code before publishing.",
      });
      return;
    }

    const newNote: Note = {
      id: `note-upload-${Date.now()}`,
      title,
      subject: uploadDraft.subject.trim() || "General",
      semester: uploadDraft.semester,
      courseCode: courseCodeVal.toUpperCase(),
      unit: uploadDraft.unit.trim() || "All Units",
      topic: uploadDraft.tags.trim() || "Student upload",
      uploader: currentUser.name,
      uploaderRole: "You",
      fileType: uploadDraft.fileType,
      fileSize: uploadDraft.fileName ? "New file" : "Draft file",
      uploadDate: "Just now",
      rating: 0,
      ratingsCount: 0,
      downloads: 0,
      tags: uploadDraft.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 4),
      summary:
        uploadDraft.summary.trim() ||
        "A newly uploaded ClassVault resource available in the local prototype.",
      ownerId: "current-user",
      saved: false,
    };

    setNotes((current) => [newNote, ...current]);
    setActiveView("uploads");
    setSelectedNoteId(newNote.id);
    setDetailOpen(true);
    setUploadOpen(false);
    setUploadDraft(emptyUploadDraft);
    setToast({
      title: "Resource auto-published",
      detail: "Your mock upload now appears under My uploads.",
    });
  }

  // Add study task helper
  function addStudyTask() {
    if (!newTaskTitle.trim()) {
      return;
    }
    const newTask: StudyTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      tag: newTaskTag.trim() || "General",
      priority: Math.random() > 0.5 ? "High" : Math.random() > 0.5 ? "Medium" : "Low",
    };
    setStudyTasks([...studyTasks, newTask]);
    setNewTaskTitle("");
    setNewTaskTag("");
    setToast({
      title: "Task added",
      detail: "Your custom study task is added to the checklist.",
    });
  }

  // Remove study task helper
  function removeStudyTask(id: string) {
    setStudyTasks(studyTasks.filter((t) => t.id !== id));
  }

  return (
    <main
      data-theme={theme}
      className="classvault-shell flex min-h-screen overflow-x-hidden bg-[var(--cv-bg)] text-[var(--cv-text)] transition-colors duration-300"
    >
      {/* MOBILE TOP HEADER */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-[var(--cv-border)] bg-[var(--cv-card)] px-4 shadow-sm md:hidden">
        <div className="flex items-center gap-2.5">
          <img src="/logo_badge.png" alt="Logo" className="h-7 w-7 object-contain" />
          <span className="text-sm font-bold text-[var(--cv-text)]">ClassVault</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => updateTheme(theme === "dark" ? "light" : "dark")}
            className="text-[var(--cv-muted)] hover:text-[var(--cv-text)] transition"
            title="Toggle theme"
          >
            {theme === "dark" ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          <img
            src="/avatar_arjun.png"
            alt="User"
            className="h-7 w-7 rounded-full border border-[var(--cv-border)] object-cover"
          />
        </div>
      </header>

      {/* NARROW SIDEBAR */}
      <aside className="fixed inset-x-0 bottom-0 z-40 flex h-16 w-full items-center justify-between border-t border-[var(--cv-sidebar-border)] bg-[var(--cv-sidebar)] px-3 shadow-2xl md:inset-x-auto md:inset-y-0 md:left-0 md:h-screen md:w-20 md:flex-col md:border-r md:border-t-0 md:px-0 md:py-6">
        <div className="flex min-w-0 flex-1 items-center md:w-full md:flex-none md:flex-col md:gap-10">
          {/* Logo badge */}
          <button
            onClick={() => setActiveView("library")}
            className="hidden cursor-pointer md:block"
          >
            <img
              src="/logo_badge.png"
              alt="Logo"
              className="h-8 w-8 object-contain brightness-0 invert"
            />
          </button>

          {/* Navigation vertical icons */}
          <nav className="flex w-full min-w-0 items-center justify-around gap-1 md:flex-col md:gap-4 md:px-3">
            <SidebarIconButton
              icon={LayoutDashboard}
              active={activeView === "library"}
              onClick={() => setActiveView("library")}
              label="Dashboard"
            />
            <SidebarIconButton
              icon={User}
              active={activeView === "uploads"}
              onClick={() => setActiveView("uploads")}
              label="Profile"
            />
            <SidebarIconButton
              icon={Activity}
              active={activeView === "explore"}
              onClick={() => setActiveView("explore")}
              label="Analytics"
            />
            <SidebarIconButton
              icon={Bell}
              active={false}
              onClick={() => {}}
              label="Notifications"
              mobileHidden
            />
            <SidebarIconButton
              icon={CalendarIcon}
              active={false}
              onClick={() => {}}
              label="Calendar"
              mobileHidden
            />
            <SidebarIconButton
              icon={Inbox}
              active={false}
              onClick={() => {}}
              label="Inbox"
              mobileHidden
            />
            <SidebarIconButton
              icon={Bookmark}
              active={activeView === "saved"}
              onClick={() => setActiveView("saved")}
              label="Bookmarks"
            />
            <SidebarIconButton
              icon={Settings}
              active={false}
              onClick={() => {}}
              label="Settings"
              mobileHidden
            />
          </nav>
        </div>

        {/* Bottom profile avatar */}
        <div className="hidden flex-col items-center gap-4 md:flex">
          <button
            onClick={() => {
              setIsSignedIn(false);
              setToast({
                title: "Signed out",
                detail: "Prototype switched to guest browsing mode.",
              });
            }}
            title="Log out"
            className="text-white/70 hover:text-white transition cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
          <img
            src="/avatar_arjun.png"
            alt="User avatar"
            className="h-8 w-8 rounded-full border-2 border-white/40 object-cover shadow-sm"
          />
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <section className="flex min-w-0 flex-1 flex-col overflow-y-auto px-4 pb-24 pt-[4.5rem] sm:px-6 md:pb-6 md:pl-[6.5rem] md:pt-5 lg:px-8 lg:pl-28">
        {/* TOP ROW HEADER */}
        <header className="flex min-w-0 flex-col gap-4 border-b border-slate-200/80 pb-5 xl:flex-row xl:items-center xl:justify-between">
          {/* Sub-nav tabs */}
          <div className="flex min-w-0 items-center gap-5 overflow-x-auto pb-1 sm:gap-6 xl:pb-0">
            {topNavTabs.map((tab) => (
              <button
                key={tab}
                className={classNames(
                  "text-sm font-bold pb-2 relative transition cursor-pointer",
                  tab === "Dashboard"
                    ? "text-slate-900 border-b-2 border-slate-900"
                    : "text-slate-400 hover:text-slate-600",
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search bar & utilities */}
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center xl:justify-end">
            <SearchCommandPalette query={query} onQueryChange={setQuery} />

            {/* Light / Dark Toggle */}
            <div className="flex w-fit items-center rounded-full border border-[var(--cv-border)] bg-[var(--cv-toggle-bg)] p-0.5 shadow-inner">
              <button
                type="button"
                aria-pressed={theme === "light"}
                onClick={() => updateTheme("light")}
                className={classNames(
                  "cursor-pointer rounded-full px-3 py-1 text-[10px] font-bold transition",
                  theme === "light"
                    ? "bg-[var(--cv-toggle-active)] text-[var(--cv-text)] shadow"
                    : "text-[var(--cv-muted)] hover:text-[var(--cv-text)]",
                )}
              >
                Light
              </button>
              <button
                type="button"
                aria-pressed={theme === "dark"}
                onClick={() => updateTheme("dark")}
                className={classNames(
                  "cursor-pointer rounded-full px-3 py-1 text-[10px] font-bold transition",
                  theme === "dark"
                    ? "bg-[var(--cv-toggle-active)] text-[var(--cv-text)] shadow"
                    : "text-[var(--cv-muted)] hover:text-[var(--cv-text)]",
                )}
              >
                Dark
              </button>
            </div>

            {/* Icons */}
            <button className="hidden p-2 text-slate-400 transition hover:text-slate-600 sm:inline-flex">
              <Bell className="h-4.5 w-4.5" />
            </button>
            <button className="hidden p-2 text-slate-400 transition hover:text-slate-600 sm:inline-flex">
              <Settings className="h-4.5 w-4.5" />
            </button>

            {/* Buttons */}
            <button className="hidden h-9 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 lg:inline-flex lg:items-center">
              Export data
            </button>
            <button
              onClick={() => setUploadOpen(true)}
              className="cv-primary-btn h-9 w-full rounded-xl px-4 text-xs font-bold shadow sm:w-auto"
            >
              Add new board
            </button>
          </div>
        </header>

        {/* GREETING BANNER */}
        <div className="mt-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Hi, Arjun. Your notes workspace is ready.
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
              Browse shared resources, pick up your saved notes, and keep today&apos;s revision
              moving from one focused dashboard.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
              {filteredNotes.length} visible
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700">
              Auto-publish prototype
            </span>
          </div>
        </div>

        {/* TOP QUICK ACCESS CARDS ROW */}
        <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <CursorProvider className="relative block h-full w-full">
            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              className="group relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 p-5 text-left text-white shadow-[0_22px_55px_rgba(15,23,42,0.25)] transition hover:border-slate-300/60 hover:shadow-[0_26px_60px_rgba(15,23,42,0.32)]"
            >
              <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-white/10 blur-2xl" />
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                <Plus className="h-5 w-5" />
              </div>
              <p className="relative mt-8 text-sm font-semibold">Upload a new resource</p>
              <p className="relative mt-1 text-xs leading-5 text-slate-300">
                Add PDFs, slides, question sets, or lab files to the vault.
              </p>
            </button>
            <Cursor className="text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.35)]" />
            <CursorFollow
              side="right"
              align="center"
              sideOffset={12}
              alignOffset={0}
              transition={{ stiffness: 420, damping: 42, bounce: 0 }}
              className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-slate-950 shadow-lg"
            >
              Upload
            </CursorFollow>
          </CursorProvider>

          <MetricCard
            icon={BookOpenCheck}
            label="Library"
            value={formatCount(notes.length)}
            detail={`${filteredNotes.length} resources in this view`}
            tone="bg-indigo-50 text-indigo-600 border-indigo-100"
          />
          <MetricCard
            icon={Bookmark}
            label="Saved"
            value={formatCount(savedCount)}
            detail="Pinned for exam revision"
            tone="bg-amber-50 text-amber-600 border-amber-100"
          />
          <MetricCard
            icon={Download}
            label="Downloads"
            value={formatCount(totalDownloads)}
            detail={`${averageRating.toFixed(1)} average rating`}
            tone="bg-emerald-50 text-emerald-600 border-emerald-100"
          />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Today&apos;s focus
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">DBMS revision sprint</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Finish normalization notes, then review CPU scheduling numericals.
                </p>
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                  3 tasks
                </span>
                <span className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">
                  1 high priority
                </span>
              </div>
            </div>
          </div>

          <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Your uploads
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {uploadCount}
              </span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-[68%] rounded-full bg-slate-950" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-500">
              Storage mock: 6.8 GB of 10 GB used
            </p>
          </div>
        </div>

        {/* NOTES FILTER PANEL */}
        <div className="mt-8 min-w-0 rounded-[1.35rem] border border-white/80 bg-white p-4 shadow-[0_22px_55px_rgba(15,23,42,0.14)] ring-1 ring-slate-200/70 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-extrabold tracking-tight text-slate-800">Notes Library</h2>
            <button
              onClick={() => setUploadOpen(true)}
              className="cv-primary-btn inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold shadow-sm"
            >
              Upload Notes
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
              <StarBorder
                as="div"
                className="w-full min-w-0 md:w-[260px]"
                color="#818cf8"
                speed="5s"
                thickness={2}
              >
                <div className="relative min-w-0">
                  <SearchIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by title or course"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-semibold text-slate-900 shadow-[0_3px_14px_rgba(15,23,42,0.06)] outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  />
                </div>
              </StarBorder>

              <FilterDropdown
                label="All Semesters"
                value={semester}
                onChange={setSemester}
                options={semesters}
              />
              <FilterDropdown
                label="All Subjects"
                value={subject}
                onChange={setSubject}
                options={subjects}
              />
              <FilterDropdown
                label="Filter by tag"
                value={noteTag}
                onChange={setNoteTag}
                options={tags}
              />

              {(query || semester !== "All" || subject !== "All" || noteTag !== "All") && (
                <button
                  onClick={resetFilters}
                  className="inline-flex h-11 items-center gap-2 rounded-xl px-1 text-sm font-bold text-slate-500 transition hover:text-slate-950"
                >
                  <X className="h-5 w-5 rounded-full border border-slate-300 p-1 text-slate-500" />
                  Reset filters
                </button>
              )}
            </div>

            <div className="flex h-11 w-fit max-w-full items-center gap-1 rounded-xl bg-slate-50 p-1 shadow-[0_3px_14px_rgba(15,23,42,0.05)] ring-1 ring-slate-200">
              <button
                onClick={() => setLayoutMode("list")}
                className={classNames(
                  "rounded-lg p-2 transition",
                  layoutMode === "list"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-slate-600",
                )}
                aria-label="List view"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
              <button
                onClick={() => setLayoutMode("grid")}
                className={classNames(
                  "rounded-lg p-2 transition",
                  layoutMode === "grid"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-slate-600",
                )}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Document list view based on layout mode */}
          <div
            className={classNames(
              "mt-4 min-w-0 max-h-[420px] overflow-y-auto pr-1",
              layoutMode === "grid" ? "grid gap-3 md:grid-cols-2 xl:grid-cols-3" : "space-y-2",
            )}
          >
            {filteredNotes.length > 0 ? (
              filteredNotes.map((note) => (
                <DocumentRow
                  key={note.id}
                  note={note}
                  selected={note.id === selectedNoteId}
                  onOpen={() => openNote(note.id)}
                  mode={layoutMode}
                />
              ))
            ) : (
              <div className="text-center py-10 text-xs font-bold text-slate-400">
                No notes match this filter combination.
              </div>
            )}
          </div>
        </div>

        {/* MIDDLE GRID COLUMNS (Notifications, Assignments, Calendar) */}
        <div className="mt-8 grid min-w-0 gap-5 md:grid-cols-3">
          {/* Notifications */}
          <div className="widget-card rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Notifications
                </h3>
                <button className="text-[10px] font-bold text-[#6366f1] hover:underline">
                  Clear
                </button>
              </div>

              <div className="space-y-3">
                {/* Event notification */}
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 relative">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="h-1.5 w-1.5 rounded-full bg-[#6366f1] inline-block mr-1.5" />
                      <span className="text-[10px] font-bold text-slate-800">
                        Upcoming revision session
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400">Time: 120 min</span>
                  </div>
                  <h4 className="text-[11px] font-extrabold text-slate-900 mt-1.5">
                    DBMS Exam normalization notes
                  </h4>
                  <div className="mt-3 flex items-center justify-between text-[9px] text-[#6366f1] font-bold bg-[#6366f1]/5 rounded-lg px-2 py-1">
                    <span>Sat, 10 May</span>
                    <span>11:00 AM - 12:00 PM</span>
                  </div>
                </div>

                {/* Message notification */}
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-[#6366f1]">
                      Message | Study Club
                    </span>
                    <span className="text-[9px] font-semibold text-slate-400">Just now</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                    Hey Arjun, I uploaded the normalization revision sheets, let me know if they
                    help!
                  </p>
                </div>
              </div>
            </div>

            <button className="mt-4 w-full h-8 text-center text-[10px] font-bold text-slate-500 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 transition">
              See all notifications
            </button>
          </div>

          {/* Assignments / Study Tasks widget */}
          <div className="widget-card rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Study Tasks
                </h3>
                <span className="rounded bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 text-[9px] font-bold">
                  {studyTasks.length} left
                </span>
              </div>

              {/* Tasks list */}
              <div className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1">
                {studyTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-100 rounded-xl p-2.5"
                  >
                    <div className="min-w-0">
                      <h4 className="text-[11px] font-extrabold text-slate-800 truncate">
                        {task.title}
                      </h4>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-[9px] font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                          {task.tag}
                        </span>
                        <span
                          className={classNames(
                            "text-[9px] font-bold px-1.5 py-0.5 rounded",
                            task.priority === "High"
                              ? "bg-rose-50 text-rose-600 border border-rose-100"
                              : task.priority === "Medium"
                                ? "bg-amber-50 text-amber-600 border border-amber-100"
                                : "bg-emerald-50 text-emerald-600 border border-emerald-100",
                          )}
                        >
                          {task.priority}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeStudyTask(task.id)}
                      className="text-slate-400 hover:text-rose-500 transition shrink-0 p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick add task input */}
            <div className="mt-4 flex gap-1.5">
              <input
                type="text"
                placeholder="New task..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="flex-1 h-8 rounded-lg border border-slate-200 bg-slate-50 px-2 text-[10px] font-bold text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#6366f1]"
              />
              <button
                onClick={addStudyTask}
                className="h-8 w-8 rounded-lg bg-[#6366f1] text-white flex items-center justify-center hover:bg-[#4f46e5] transition shrink-0"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Calendar Widget */}
          <div className="widget-card rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  June 2026
                </h3>
                <div className="flex items-center gap-1">
                  <button className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Minimal Calendar Matrix */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-500 mb-2 border-b border-slate-100 pb-1">
                <span>M</span>
                <span>T</span>
                <span>W</span>
                <span>T</span>
                <span>F</span>
                <span>S</span>
                <span>S</span>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-700">
                <span className="text-slate-300">1</span>
                <span className="text-slate-300">2</span>
                <span className="text-slate-300">3</span>
                <span className="text-slate-300">4</span>
                <span className="rounded-lg bg-slate-50 py-0.5">5</span>
                <span className="rounded-lg bg-[#6366f1] text-white py-0.5 shadow-sm">6</span>
                <span className="rounded-lg bg-slate-50 py-0.5">7</span>
                <span className="rounded-lg bg-slate-50 py-0.5">8</span>
                <span className="rounded-lg bg-slate-50 py-0.5">9</span>
                <span className="rounded-lg bg-slate-50 py-0.5">10</span>
                <span className="rounded-lg bg-slate-50 py-0.5">11</span>
                <span className="rounded-lg bg-slate-50 py-0.5">12</span>
                <span className="rounded-lg bg-slate-50 py-0.5">13</span>
                <span className="rounded-lg bg-slate-50 py-0.5">14</span>
              </div>

              {/* Events lists */}
              <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between text-[9px] font-bold">
                  <span className="text-slate-400 uppercase">04:30 - 05:00 PM</span>
                  <span className="text-slate-800">Team Study Session</span>
                </div>
                <div className="flex items-center justify-between text-[9px] font-bold">
                  <span className="text-slate-400 uppercase">11:30 - 12:30 PM</span>
                  <span className="text-slate-800">Discrete Math PYQs revision</span>
                </div>
              </div>
            </div>

            <button className="mt-4 w-full h-8 text-center text-[10px] font-bold text-[#6366f1] border border-violet-100 rounded-lg bg-violet-50/50 hover:bg-violet-50 transition">
              Manage schedule
            </button>
          </div>
        </div>

        {/* BOTTOM ROW WIDGETS (Tasks progress, Go premium, Circular progress, Board meeting) */}
        <div className="mt-8 grid min-w-0 gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Today Tasks Progress list */}
          <div className="widget-card rounded-2xl p-5 flex flex-col justify-between md:col-span-1">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4">
              Today Tasks
            </h3>
            <div className="space-y-4">
              <ProgressItem label="DBMS Normalization notes" percentage={90} color="bg-[#6366f1]" />
              <ProgressItem
                label="Computer Networks complete notes"
                percentage={50}
                color="bg-amber-500"
              />
              <ProgressItem label="Digital Logic gates notes" percentage={10} color="bg-rose-500" />
            </div>
            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-[10px] font-extrabold text-slate-400">
              <span>Finished: 1/3</span>
              <span className="text-[#6366f1]">Detail</span>
            </div>
          </div>

          {/* Go Premium Box */}
          <div className="rounded-2xl bg-[#6366f1] p-5 flex flex-col justify-between text-white shadow-xl relative overflow-hidden">
            <div className="absolute right-0 bottom-0 top-0 w-24 bg-white/5 rounded-l-full blur-xl pointer-events-none" />
            <div>
              <h3 className="text-sm font-extrabold">Go premium!</h3>
              <p className="mt-2 text-[10px] leading-relaxed text-white/80 font-semibold">
                Gain access to a range of benefits designed to enhance your user experience.
              </p>
            </div>
            <button className="mt-6 w-full h-9 rounded-xl bg-white text-[#6366f1] text-xs font-bold hover:bg-white/95 transition shadow">
              Find out more
            </button>
          </div>

          {/* Circular Progress Rings */}
          <div className="widget-card rounded-2xl p-5 flex flex-col justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4">
              Completeness
            </h3>
            <div className="flex items-center justify-around gap-2">
              <div className="text-center">
                <CircularGauge percentage={90} color="#6366f1" size={56} />
                <p className="mt-2 text-[9px] font-extrabold text-slate-800 leading-none">
                  Database
                </p>
                <p className="text-[8px] font-bold text-slate-400 mt-0.5">9/10 notes read</p>
              </div>
              <div className="text-center">
                <CircularGauge percentage={65} color="#22c55e" size={56} />
                <p className="mt-2 text-[9px] font-extrabold text-slate-800 leading-none">
                  Networks
                </p>
                <p className="text-[8px] font-bold text-slate-400 mt-0.5">2/3 slides read</p>
              </div>
            </div>
            <div className="text-[9px] font-semibold text-slate-400 text-center mt-2">
              Daily study goal: 80%
            </div>
          </div>

          {/* Study Group Session Card */}
          <div className="widget-card rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 text-[9px] font-bold">
                  Study Group
                </span>
                <span className="text-[9px] font-semibold text-slate-400">March 26 at 4:00 PM</span>
              </div>
              <h4 className="text-xs font-extrabold text-slate-800">Study Group Session</h4>
              <p className="mt-1 text-[10px] text-slate-400 font-semibold leading-relaxed">
                Join Riya, Karan and Aman to discuss Networks protocols sheet.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button className="h-8 rounded-lg border border-slate-200 bg-white text-[10px] font-bold text-slate-700 hover:bg-slate-50 transition">
                Reschedule
              </button>
              <button className="h-8 rounded-lg bg-[#6366f1] text-white text-[10px] font-bold hover:bg-[#4f46e5] transition">
                Accept invite
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SLIDE-OVER DETAIL DRAWER OVERLAY */}
      {detailOpen && selectedNote ? (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm flex justify-end">
          <div className="fixed inset-0 cursor-pointer" onClick={() => setDetailOpen(false)} />
          <div className="cv-drawer-panel relative w-full max-w-md h-full bg-white shadow-2xl border-l border-slate-200 p-6 flex flex-col justify-between z-50 animate-slide-in overflow-y-auto">
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6366f1]">
                    Selected Note
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 mt-1">
                    {selectedNote.title}
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold">{selectedNote.topic}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleSaved(selectedNote.id)}
                    className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#6366f1] transition cursor-pointer"
                  >
                    <Bookmark
                      className={`h-4.5 w-4.5 ${savedIds.has(selectedNote.id) ? "fill-[#6366f1] text-[#6366f1]" : ""}`}
                    />
                  </button>
                  <button
                    onClick={() => setDetailOpen(false)}
                    className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-800 transition cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Uploader profile block */}
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <img
                  src={selectedNote.uploaderAvatar ?? "/avatar_neha.png"}
                  alt={selectedNote.uploader}
                  className="h-9 w-9 rounded-full object-cover border border-[#6366f1]/20"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 leading-none">
                    {selectedNote.uploader}
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">
                    {selectedNote.uploaderRole}
                  </p>
                </div>
                <div className="flex items-center gap-1 rounded-lg bg-[#6366f1]/10 px-2 py-1 text-[11px] font-bold text-[#6366f1]">
                  {selectedNote.rating ? selectedNote.rating.toFixed(1) : "5.0"}
                  <Star className="h-3 w-3 fill-[#6366f1] text-[#6366f1]" />
                </div>
              </div>

              {/* Summary */}
              <p className="text-xs leading-relaxed text-slate-500 font-semibold">
                {selectedNote.summary}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {selectedNote.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Metadata */}
              <div className="border-t border-b border-slate-100 py-3 text-[10px] font-bold text-slate-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5 uppercase">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  {selectedNote.fileType}
                </span>
                <span>•</span>
                <span>{selectedNote.pages ?? 24} Pages</span>
                <span>•</span>
                <span>{selectedNote.fileSize}</span>
                <span>•</span>
                <span>Uploaded {selectedNote.uploadDate}</span>
              </div>

              {/* Preview with thumbnails */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-2">
                  <span className="text-slate-800">Preview</span>
                  <span className="text-slate-400">1 / {selectedNote.pages ?? 24}</span>
                </div>
                <div className="grid grid-cols-[1fr_50px] gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2">
                  <div className="aspect-[4/5] overflow-hidden rounded-lg bg-white border border-slate-100">
                    <img
                      src="/preview_dbms_main.png"
                      alt="Notes preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 h-full overflow-y-auto">
                    <div className="aspect-[4/5] overflow-hidden rounded border border-[#6366f1]/40 bg-white shadow-sm">
                      <img
                        src="/preview_dbms_main.png"
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="aspect-[4/5] overflow-hidden rounded border border-slate-200 bg-white opacity-60 hover:opacity-100 transition">
                      <img
                        src="/preview_dbms_thumb1.png"
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="aspect-[4/5] overflow-hidden rounded border border-slate-200 bg-white opacity-60 hover:opacity-100 transition">
                      <img
                        src="/preview_dbms_thumb2.png"
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Rating block */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-[11px] font-bold text-slate-800">Rate this note</p>
                <div className="mt-2.5 flex gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => rateNote(selectedNote.id, value)}
                      className="text-amber-400 hover:scale-110 transition cursor-pointer p-0.5"
                    >
                      <Star
                        className={classNames(
                          "h-5 w-5",
                          ratings[selectedNote.id] && value <= ratings[selectedNote.id]
                            ? "fill-amber-400"
                            : "fill-transparent",
                        )}
                      />
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[9px] font-bold text-slate-400">
                  {ratings[selectedNote.id]
                    ? `Your rating: ${ratings[selectedNote.id]}/5`
                    : `${selectedNote.ratingsCount} students rated this resource`}
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-8 pt-4 border-t border-slate-100">
              <div className="grid grid-cols-[1.5fr_1fr] gap-2">
                <button
                  onClick={() => downloadNote(selectedNote.id)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#6366f1] py-3 text-xs font-bold text-white hover:bg-[#4f46e5] transition cursor-pointer shadow"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </button>
                <button
                  onClick={() => toggleSaved(selectedNote.id)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-sm"
                >
                  <Bookmark className="h-4 w-4 text-slate-400" />
                  Bookmark
                </button>
              </div>
              <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition">
                View full document
                <ArrowRight className="h-3.5 w-3.5 text-[#6366f1]" />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* DIALOGS */}
      {uploadOpen ? (
        <UploadDialog
          draft={uploadDraft}
          onDraftChange={setUploadDraft}
          onClose={() => setUploadOpen(false)}
          onSubmit={submitUpload}
        />
      ) : null}

      {toast ? <ToastMessage toast={toast} /> : null}
    </main>
  );
}

/* SIDEBAR ICON BUTTON */
function SidebarIconButton({
  icon: Icon,
  active,
  onClick,
  label,
  mobileHidden = false,
}: {
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
  label: string;
  mobileHidden?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={classNames(
        "group relative flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-transparent transition md:h-12 md:w-full",
        mobileHidden && "hidden md:flex",
        active
          ? "border-white/10 bg-white/15 text-white shadow-sm"
          : "text-indigo-100/70 hover:border-white/10 hover:bg-white/10 hover:text-white",
      )}
    >
      {active && (
        <span className="absolute bottom-0 h-1 w-6 rounded-t bg-white md:bottom-auto md:left-0 md:h-6 md:w-1 md:rounded-r md:rounded-t-none" />
      )}
      <Icon className="h-5 w-5" />
      {/* Tooltip */}
      <span className="pointer-events-none absolute left-16 z-30 hidden origin-left scale-95 rounded bg-slate-900 px-2 py-1 text-[10px] font-bold text-white opacity-0 shadow-md transition-all group-hover:scale-100 group-hover:opacity-100 md:block">
        {label}
      </span>
    </button>
  );
}

/* SEARCH ICON ELEMENT */
function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

/* FILTER DROPDOWN COMPONENT */
function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
}) {
  return (
    <div className="relative w-full md:w-auto">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-9 text-sm font-semibold text-slate-800 shadow-[0_3px_14px_rgba(15,23,42,0.06)] outline-none transition hover:border-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 md:w-auto"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option === "All" ? label : option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
    </div>
  );
}

/* DOCUMENT ROW LIST ITEM */
function DocumentRow({
  note,
  selected,
  onOpen,
  mode,
}: {
  note: Note;
  selected: boolean;
  onOpen: () => void;
  mode: "list" | "grid";
}) {
  if (mode === "grid") {
    return (
      <button
        type="button"
        onClick={onOpen}
        className={classNames(
          "flex min-h-48 min-w-0 flex-col justify-between rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg",
          selected
            ? "cv-note-selected border-slate-950 bg-slate-950 text-white shadow-xl"
            : "border-slate-200 bg-white text-slate-950 shadow-sm",
        )}
      >
        <div>
          <div className="flex min-w-0 items-start justify-between gap-3">
            <span
              className={classNames(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-[10px] font-bold uppercase",
                selected
                  ? "border-white/15 bg-white/10 text-white"
                  : "border-rose-200 bg-rose-50 text-rose-600",
              )}
            >
              {note.fileType}
            </span>
            <span
              className={classNames(
                "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                selected ? "bg-white/10 text-white/80" : "bg-slate-100 text-slate-500",
              )}
            >
              {note.courseCode}
            </span>
          </div>
          <h4 className="mt-4 line-clamp-2 min-w-0 text-sm font-semibold leading-5">
            {note.title}
          </h4>
          <p
            className={classNames(
              "mt-2 text-xs font-medium",
              selected ? "text-white/60" : "text-slate-500",
            )}
          >
            Sem {note.semester} · {note.subject}
          </p>
        </div>

        <div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {note.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className={classNames(
                  "rounded-md px-2 py-1 text-[10px] font-semibold",
                  selected ? "bg-white/10 text-white/75" : "bg-slate-100 text-slate-600",
                )}
              >
                {tag}
              </span>
            ))}
          </div>
          <div
            className={classNames(
              "mt-4 flex items-center justify-between border-t pt-3 text-xs font-semibold",
              selected ? "border-white/10 text-white/75" : "border-slate-100 text-slate-500",
            )}
          >
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {note.rating ? note.rating.toFixed(1) : "New"}
            </span>
            <span className="flex items-center gap-1">
              <Download className="h-3.5 w-3.5" />
              {formatCount(note.downloads)}
            </span>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className={classNames(
        "grid w-full min-w-0 grid-cols-1 items-start gap-3 rounded-2xl border px-4 py-3 text-left transition hover:-translate-y-0.5 hover:shadow-md sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center md:grid-cols-[minmax(0,1fr)_90px_90px_auto] lg:grid-cols-[minmax(0,1fr)_110px_110px_90px]",
        selected
          ? "cv-note-selected border-slate-950 bg-slate-950 text-white shadow-lg"
          : "border-slate-200 bg-white text-slate-950 shadow-sm hover:border-slate-300",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={classNames(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-[10px] font-bold uppercase",
            selected
              ? "border-white/15 bg-white/10 text-white"
              : "border-rose-200 bg-rose-50 text-rose-600",
          )}
        >
          {note.fileType}
        </span>
        <div className="min-w-0">
          <h4 className="truncate text-sm font-semibold">{note.title}</h4>
          <p
            className={classNames(
              "mt-1 truncate text-xs font-medium",
              selected ? "text-white/60" : "text-slate-500",
            )}
          >
            Sem {note.semester} · {note.subject} · {note.unit}
          </p>
          <div className="mt-2 hidden flex-wrap gap-1.5 sm:flex">
            {note.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className={classNames(
                  "rounded-md px-2 py-0.5 text-[10px] font-semibold",
                  selected ? "bg-white/10 text-white/70" : "bg-slate-100 text-slate-600",
                )}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div
        className={classNames(
          "hidden items-center gap-1 text-xs font-semibold md:flex",
          selected ? "text-white/75" : "text-slate-600",
        )}
      >
        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
        {note.rating ? note.rating.toFixed(1) : "New"}
      </div>
      <div
        className={classNames(
          "hidden items-center gap-1 text-xs font-semibold md:flex",
          selected ? "text-white/75" : "text-slate-600",
        )}
      >
        <Download className="h-3.5 w-3.5" />
        {formatCount(note.downloads)}
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end lg:gap-3">
        <span
          className={classNames(
            "rounded-lg px-2.5 py-1 text-xs font-semibold",
            selected ? "bg-white/10 text-white/80" : "bg-slate-100 text-slate-600",
          )}
        >
          {note.courseCode}
        </span>
        <span
          className={classNames(
            "hidden text-xs font-semibold xl:inline",
            selected ? "text-white/50" : "text-slate-400",
          )}
        >
          {note.uploadDate}
        </span>
        <span
          className={classNames("p-1 transition", selected ? "text-white/50" : "text-slate-300")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="12" cy="5" r="1"></circle>
            <circle cx="12" cy="19" r="1"></circle>
          </svg>
        </span>
      </div>
    </button>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  tone: string;
}) {
  return (
    <div className="widget-card rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div
          className={classNames(
            "flex h-11 w-11 items-center justify-center rounded-xl border",
            tone,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <ArrowUpRight className="h-4 w-4 text-slate-300" />
      </div>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
        <p className="max-w-32 text-right text-xs font-medium leading-5 text-slate-500">{detail}</p>
      </div>
    </div>
  );
}

/* PROGRESS BAR COMPONENT */
function ProgressItem({
  label,
  percentage,
  color,
}: {
  label: string;
  percentage: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] font-bold mb-1">
        <span className="text-slate-800 truncate max-w-[80%]">{label}</span>
        <span className="text-slate-500">{percentage}%</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={classNames("h-full rounded-full", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/* CIRCULAR PROGRESS RING GAUGES */
function CircularGauge({
  percentage,
  color,
  size,
}: {
  percentage: number;
  color: string;
  size: number;
}) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="var(--cv-muted-surface, #e2e8f0)"
          strokeWidth={strokeWidth}
        />
        {/* Colored progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[10px] font-extrabold text-slate-800">{percentage}%</span>
    </div>
  );
}

/* UPLOAD DIALOG */
function UploadDialog({
  draft,
  onDraftChange,
  onClose,
  onSubmit,
}: {
  draft: UploadDraft;
  onDraftChange: (draft: UploadDraft) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  function updateField<K extends keyof UploadDraft>(key: K, value: UploadDraft[K]) {
    onDraftChange({ ...draft, [key]: value });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <form
        onSubmit={onSubmit}
        className="cv-dialog-panel max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-100 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
          <div>
            <h2 className="text-base font-extrabold text-slate-800">Upload academic note</h2>
            <p className="mt-1 text-xs text-slate-400 font-semibold">
              Auto-publishes into the local prototype workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close upload dialog"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-slate-800 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Title" className="sm:col-span-2">
            <input
              value={draft.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="e.g. Compiler Design Unit 3 Notes"
              className="form-field"
            />
          </Field>
          <Field label="Subject">
            <input
              value={draft.subject}
              onChange={(event) => updateField("subject", event.target.value)}
              placeholder="Computer Science"
              className="form-field"
            />
          </Field>
          <Field label="Course code">
            <input
              value={draft.courseCode}
              onChange={(event) => updateField("courseCode", event.target.value)}
              placeholder="CS352"
              className="form-field uppercase"
            />
          </Field>
          <Field label="Semester">
            <select
              value={draft.semester}
              onChange={(event) => updateField("semester", event.target.value)}
              className="form-field"
            >
              {["1", "2", "3", "4", "5", "6", "7", "8"].map((item) => (
                <option key={item} value={item}>
                  Semester {item}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Unit">
            <input
              value={draft.unit}
              onChange={(event) => updateField("unit", event.target.value)}
              placeholder="Unit 2"
              className="form-field"
            />
          </Field>
          <Field label="File type">
            <select
              value={draft.fileType}
              onChange={(event) => updateField("fileType", event.target.value as FileType)}
              className="form-field"
            >
              {(["PDF", "DOCX", "PPTX", "ZIP"] satisfies FileType[]).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </Field>
          <Field label="File">
            <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-200 px-3 text-xs font-semibold text-slate-500 hover:border-[#6366f1]/40 hover:text-slate-800 transition">
              <Upload className="h-4 w-4" />
              <span className="truncate">{draft.fileName || "Choose file"}</span>
              <input
                type="file"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  updateField("fileName", file?.name ?? "");
                }}
              />
            </label>
          </Field>
          <Field label="Tags" className="sm:col-span-2">
            <input
              value={draft.tags}
              onChange={(event) => updateField("tags", event.target.value)}
              placeholder="comma separated: pyq, unit 3, numericals"
              className="form-field"
            />
          </Field>
          <Field label="Summary" className="sm:col-span-2">
            <textarea
              value={draft.summary}
              onChange={(event) => updateField("summary", event.target.value)}
              placeholder="Short description students will see in the detail panel"
              className="form-field min-h-24 resize-y py-3"
            />
          </Field>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 p-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#6366f1] px-4 text-xs font-bold text-white hover:bg-[#4f46e5] transition"
          >
            <Check className="h-4 w-4" />
            Publish upload
          </button>
        </div>
      </form>
    </div>
  );
}

/* FIELD WRAPPER */
function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={classNames("block", className)}>
      <span className="mb-1.5 block text-xs font-bold text-slate-500">{label}</span>
      {children}
    </label>
  );
}

/* TOAST */
function ToastMessage({ toast }: { toast: Toast }) {
  return (
    <div className="cv-toast-panel fixed bottom-4 right-4 z-50 w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl">
      <div className="flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#6366f1]/10 text-[#6366f1] border border-[#6366f1]/20">
          <Check className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-extrabold text-slate-800">{toast.title}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-400 font-semibold">
            {toast.detail}
          </p>
        </div>
      </div>
    </div>
  );
}
