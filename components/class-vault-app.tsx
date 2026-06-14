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
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  TrendingUp,
  Upload,
  User,
  X,
  Compass,
  Flame,
  Users,
  PlusCircle,
  GraduationCap,
  Sparkles,
  Link2,
  Clock,
  Play,
  CheckCircle2,
  Settings,
  BookOpenCheck,
  Flag,
  Check,
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
import type {
  AdminReport,
  ApiError,
  ApiNote,
  ApiUser,
  MetaResponse,
  NotesResponse,
} from "@/lib/api-types";
import { formatBytes, formatCount, formatDate, initialsOf } from "@/lib/format";
import { SearchCommandPalette } from "@/components/search-command-palette";

type ActiveView =
  | "dashboard"
  | "library"
  | "saved"
  | "uploads"
  | "profile"
  | "review"
  | "roadmaps"
  | "exam-mode"
  | "study-rooms"
  | "college-vault"
  | "add-resource";
type LayoutMode = "list" | "grid";
type ModerationAction = "approve" | "reject" | "hide" | "restore";
const AUTH_BANNER_SESSION_KEY = "classvault_auth_banner_dismissed";

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

type UploadTargetResponse = {
  storageKey: string;
  uploadUrl: string;
  method: "PUT" | "POST";
  provider: "S3" | "LOCAL";
  expiresIn: number | null;
  fileType: ApiNote["fileType"];
  fileSizeBytes: number;
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

const viewTitles: Record<ActiveView, string> = {
  dashboard: "Dashboard",
  library: "Library",
  saved: "Saved",
  uploads: "Your uploads",
  profile: "Settings",
  review: "Review queue",
  roadmaps: "AI Study Roadmaps",
  "exam-mode": "Exam Mode",
  "study-rooms": "Silent Study Rooms",
  "college-vault": "College Vault Verification",
  "add-resource": "Add Resource",
};

const initialStudyTasks: StudyTask[] = [
  { id: "task-1", title: "Solve DBMS normal form numericals", done: false },
  { id: "task-2", title: "Revise CPU scheduling Gantt charts", done: false },
  { id: "task-3", title: "Read sliding window protocol details", done: true },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function statusLabel(status: ApiNote["status"]) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

class AuthRequiredError extends Error {}

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
  const [trendingNotes, setTrendingNotes] = useState<ApiNote[]>([]);
  const [adminNotes, setAdminNotes] = useState<ApiNote[]>([]);
  const [adminReports, setAdminReports] = useState<AdminReport[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [authBannerDismissed, setAuthBannerDismissed] = useState(false);

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
  const canModerate = me?.role === "ADMIN" || me?.role === "MODERATOR";
  const navSections: Array<{
    label: string;
    items: Array<{ id: ActiveView; label: string; icon: LucideIcon }>;
  }> = [
    {
      label: "Study",
      items: [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "roadmaps", label: "AI Roadmaps", icon: Compass },
        { id: "exam-mode", label: "Exam Mode", icon: Flame },
        { id: "study-rooms", label: "Study Rooms", icon: Users },
      ],
    },
    {
      label: "Resources",
      items: [
        { id: "library", label: "Library", icon: BookOpen },
        { id: "saved", label: "Saved", icon: Bookmark },
        { id: "add-resource", label: "Add Resource", icon: PlusCircle },
      ],
    },
    {
      label: "Community",
      items: [
        { id: "college-vault", label: "College Vault", icon: GraduationCap },
      ],
    },
  ];

  if (canModerate) {
    navSections.push({
      label: "Admin",
      items: [
        { id: "review", label: "Review queue", icon: FileText },
      ],
    });
  }

  const mobileNavItems: Array<{ id: ActiveView; label: string; icon: LucideIcon }> = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "roadmaps", label: "Roadmaps", icon: Compass },
    { id: "library", label: "Library", icon: BookOpen },
    { id: "study-rooms", label: "Rooms", icon: Users },
    { id: "profile", label: "Settings", icon: Settings },
  ];

  const currentView = activeView === "review" && !canModerate ? "dashboard" : activeView;
  const showAuthBanner = authChecked && !me && !authBannerDismissed;
  const profileDisplayName = me?.name ?? (authChecked ? "Preview mode" : "Loading...");
  const profileDisplayEmail = me?.email ?? (authChecked ? "Sign in to save and upload" : "");
  const profileAvatarName = me?.name ?? (authChecked ? "Guest" : "?");

  const openAuthPrompt = useCallback(() => {
    setAuthPromptOpen(true);
  }, []);

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
      } finally {
        setAuthChecked(true);
      }
      try {
        const response = await fetch("/api/notes?sort=trending&limit=4");
        if (response.ok) {
          setTrendingNotes(((await response.json()) as NotesResponse).items);
        }
      } catch {
        // trending strip simply stays hidden
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshMeta]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setAuthBannerDismissed(sessionStorage.getItem(AUTH_BANNER_SESSION_KEY) === "true");
      } catch {
        // Ignore
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Load tasks from localStorage on mount. Deferred so the initial render uses
  // the default list (avoids hydration mismatch) and setState is not called
  // synchronously inside the effect.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const savedTasks = localStorage.getItem("cv_study_tasks");
        if (savedTasks) setTasks(JSON.parse(savedTasks) as StudyTask[]);
      } catch {
        // Ignore
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Save tasks to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem("cv_study_tasks", JSON.stringify(tasks));
    } catch {
      // Ignore
    }
  }, [tasks]);

  // Server-side filtering: every filter/view change becomes /api/notes params.
  useEffect(() => {
    if (currentView === "review") return;

    const controller = new AbortController();
    const params = new URLSearchParams();
    if (currentView !== "dashboard") {
      if (query.trim()) params.set("q", query.trim());
      if (semester !== "All") params.set("semester", semester);
      if (subject !== "All") params.set("subject", subject);
    }
    if (currentView === "saved") params.set("saved", "true");
    if (currentView === "uploads" || currentView === "profile") params.set("owner", "me");

    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/notes?${params}`, { signal: controller.signal });
        if (response.status === 401) {
          openAuthPrompt();
          setNotes([]);
          setLoadError(null);
          return;
        }
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
  }, [currentView, openAuthPrompt, query, semester, subject, refetchTick]);

  const refetchNotes = useCallback(() => {
    refetchCounter.current += 1;
    setRefetchTick(refetchCounter.current);
  }, []);

  const requireAuth = useCallback(<T,>(fn: () => T) => {
    if (!me) {
      openAuthPrompt();
      return undefined;
    }
    return fn();
  }, [me, openAuthPrompt]);

  const assertResponseOk = useCallback(async (response: Response) => {
    if (response.ok) return;
    if (response.status === 401) {
      openAuthPrompt();
      throw new AuthRequiredError();
    }
    throw new Error(await readError(response));
  }, [openAuthPrompt]);

  const dismissAuthBanner = useCallback(() => {
    setAuthBannerDismissed(true);
    try {
      sessionStorage.setItem(AUTH_BANNER_SESSION_KEY, "true");
    } catch {
      // Ignore
    }
  }, []);

  const refreshAdminQueue = useCallback(async () => {
    if (!canModerate) return;
    setAdminLoading(true);
    try {
      const [notesResponse, reportsResponse] = await Promise.all([
        fetch("/api/admin/notes?status=PENDING"),
        fetch("/api/admin/reports"),
      ]);
      await assertResponseOk(notesResponse);
      await assertResponseOk(reportsResponse);
      const notesBody = (await notesResponse.json()) as { items: ApiNote[] };
      const reportsBody = (await reportsResponse.json()) as { items: AdminReport[] };
      setAdminNotes(notesBody.items);
      setAdminReports(reportsBody.items);
    } catch (error) {
      if (error instanceof AuthRequiredError) return;
      setToast(error instanceof Error ? error.message : "Could not load review queue.");
    } finally {
      setAdminLoading(false);
    }
  }, [assertResponseOk, canModerate]);

  useEffect(() => {
    if (currentView !== "review") return;
    const timer = window.setTimeout(() => void refreshAdminQueue(), 0);
    return () => window.clearTimeout(timer);
  }, [currentView, refreshAdminQueue]);

  async function signOut() {
    try {
      const response = await fetch("/api/auth/sign-out", { method: "POST" });
      await assertResponseOk(response);
      // Full navigation so the cleared cookie applies everywhere.
      window.location.href = "/sign-in";
    } catch (error) {
      if (error instanceof AuthRequiredError) return;
      setToast(error instanceof Error ? error.message : "Sign out failed.");
    }
  }

  async function saveProfile(input: { name: string; department: string | null; semester: string | null }) {
    if (!me) {
      openAuthPrompt();
      return;
    }
    try {
      const response = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      await assertResponseOk(response);
      setMe((await response.json()) as ApiUser);
      setToast("Profile updated");
    } catch (error) {
      if (error instanceof AuthRequiredError) return;
      setToast(error instanceof Error ? error.message : "Could not update profile.");
    }
  }

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function patchNote(noteId: string, patch: Partial<ApiNote>) {
    setNotes((current) =>
      current.map((note) => (note.id === noteId ? { ...note, ...patch } : note)),
    );
    setTrendingNotes((current) =>
      current.map((note) => (note.id === noteId ? { ...note, ...patch } : note)),
    );
    setAdminNotes((current) =>
      current.map((note) => (note.id === noteId ? { ...note, ...patch } : note)),
    );
    setOpenNote((current) => (current?.id === noteId ? { ...current, ...patch } : current));
  }

  async function toggleSaved(note: ApiNote) {
    return requireAuth(async () => {
      const nextSaved = !note.savedByMe;
      patchNote(note.id, { savedByMe: nextSaved });
      try {
        const response = await fetch(`/api/notes/${note.id}/save`, {
          method: nextSaved ? "POST" : "DELETE",
        });
        await assertResponseOk(response);
        void refreshMeta();
        if (currentView === "saved") refetchNotes();
      } catch (error) {
        patchNote(note.id, { savedByMe: note.savedByMe });
        if (error instanceof AuthRequiredError) return;
        setToast(error instanceof Error ? error.message : "Could not update saved state.");
      }
    });
  }

  async function rateNote(note: ApiNote, value: number) {
    return requireAuth(async () => {
      try {
        const response = await fetch(`/api/notes/${note.id}/rating`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value }),
        });
        await assertResponseOk(response);
        const result = (await response.json()) as {
          ratingAverage: number;
          ratingCount: number;
          myRating: number;
        };
        patchNote(note.id, result);
        void refreshMeta();
      } catch (error) {
        if (error instanceof AuthRequiredError) return;
        setToast(error instanceof Error ? error.message : "Could not save rating.");
      }
    });
  }

  async function downloadNote(note: ApiNote) {
    return requireAuth(async () => {
      try {
        const response = await fetch(`/api/notes/${note.id}/download`, { method: "POST" });
        await assertResponseOk(response);
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
        if (error instanceof AuthRequiredError) return;
        setToast(error instanceof Error ? error.message : "Could not download.");
      }
    });
  }

  async function reportNote(note: ApiNote) {
    return requireAuth(async () => {
      const reason = window.prompt("What should moderators review?")?.trim();
      if (!reason) return;
      try {
        const response = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ noteId: note.id, reason }),
        });
        await assertResponseOk(response);
        setToast("Report sent to moderators");
      } catch (error) {
        if (error instanceof AuthRequiredError) return;
        setToast(error instanceof Error ? error.message : "Could not send report.");
      }
    });
  }

  async function submitUpload(draft: UploadDraft) {
    if (!me) {
      openAuthPrompt();
      return false;
    }
    if (!draft.file) {
      setToast("Choose a file to upload.");
      return false;
    }
    if (draft.file.size > 25 * 1024 * 1024) {
      setToast("File is too large. Maximum size is 25 MB.");
      return false;
    }
    const allowedExtensions = ["pdf", "docx", "pptx", "zip"];
    const extension = draft.file.name.split(".").pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      setToast("Invalid file type. Only PDF, DOCX, PPTX, and ZIP files are allowed.");
      return false;
    }
    try {
      let storageKey: string;
      const presignResponse = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: draft.file.name,
          mimeType: draft.file.type,
          sizeBytes: draft.file.size,
        }),
      });
      await assertResponseOk(presignResponse);
      const target = (await presignResponse.json()) as UploadTargetResponse;

      if (target.provider === "S3" && target.method === "PUT") {
        const directUpload = await fetch(target.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": draft.file.type },
          body: draft.file,
        });
        if (!directUpload.ok) {
          throw new Error("Could not upload file to storage. Check the S3 bucket CORS settings.");
        }
        storageKey = target.storageKey;
      } else {
        const formData = new FormData();
        formData.set("file", draft.file);
        const uploadResponse = await fetch("/api/uploads", { method: "POST", body: formData });
        await assertResponseOk(uploadResponse);
        storageKey = ((await uploadResponse.json()) as { storageKey: string }).storageKey;
      }

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
      await assertResponseOk(noteResponse);

      setUploadOpen(false);
      setToast("Resource submitted for review");
      refetchNotes();
      void refreshMeta();
      return true;
    } catch (error) {
      if (error instanceof AuthRequiredError) return false;
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

  async function moderateNote(note: ApiNote, action: ModerationAction) {
    let reason = "";
    if (action === "reject" || action === "hide") {
      const promptResult = window.prompt(
        action === "reject" ? "Reason for rejection" : "Reason for hiding",
      );
      if (promptResult === null) return;
      reason = promptResult.trim();
    }
    try {
      const response = await fetch(`/api/admin/notes/${note.id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      await assertResponseOk(response);
      setToast(action === "approve" || action === "restore" ? "Resource published" : "Resource updated");
      void refreshAdminQueue();
      refetchNotes();
      void refreshMeta();
    } catch (error) {
      if (error instanceof AuthRequiredError) return;
      setToast(error instanceof Error ? error.message : "Moderation failed.");
    }
  }

  const stats = meta?.stats;
  const savedBadge = stats?.savedCount ?? 0;

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Mobile header */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-[calc(3.5rem+env(safe-area-inset-top))] items-center justify-between border-b border-line bg-surface px-4 pt-[env(safe-area-inset-top)] lg:hidden">
        <Wordmark />
        <button
          type="button"
          onClick={() => requireAuth(() => setUploadOpen(true))}
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

        <div className="flex-1 overflow-y-auto p-2.5 space-y-4">
          {navSections.map((section) => (
            <div key={section.label} className="space-y-1">
              <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-ink-faint">
                {section.label}
              </p>
              <nav className="space-y-0.5">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (item.id === "add-resource") {
                        setActiveView("add-resource");
                      } else {
                        setActiveView(item.id);
                      }
                    }}
                    className={cx(
                      "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition",
                      currentView === item.id
                        ? "bg-paper text-ink shadow-[inset_0_0_0_1px_var(--line)]"
                        : "text-ink-soft hover:bg-paper hover:text-ink",
                    )}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                    {item.id === "saved" && savedBadge > 0 ? (
                      <span className="ml-auto font-mono text-[10px] text-ink-faint bg-paper border border-line px-1 rounded">{savedBadge}</span>
                    ) : null}
                  </button>
                ))}
              </nav>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setActiveView("profile")}
          className={cx(
            "flex items-center gap-3 border-t border-line p-3 text-left transition hover:bg-paper",
            currentView === "profile" ? "bg-paper" : ""
          )}
        >
          <Avatar name={profileAvatarName} size="sm" />
          <span className="min-w-0">
            <span className="block truncate text-xs font-bold text-ink">{profileDisplayName}</span>
            <span className="block truncate text-[10px] text-ink-faint">{profileDisplayEmail}</span>
          </span>
        </button>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex overflow-x-auto border-t border-line bg-surface px-2 pb-[calc(0.375rem+env(safe-area-inset-bottom))] pt-1.5 lg:hidden">
        {mobileNavItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveView(item.id)}
            className={cx(
              "flex min-w-14 flex-1 flex-col items-center gap-1 rounded-md px-1 py-1 text-[10px] font-semibold",
              currentView === item.id ? "text-ink" : "text-ink-faint",
            )}
          >
            <item.icon className="h-4 w-4" />
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </nav>

      <main className="px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-[calc(5rem+env(safe-area-inset-top))] sm:px-6 lg:ml-56 lg:px-10 lg:pb-12 lg:pt-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-3 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xl font-semibold tracking-tight">{viewTitles[currentView]}</h1>
            <div className="flex items-center gap-2">
              <SearchCommandPalette
                subjects={meta?.subjects ?? []}
                onSelectNote={setOpenNote}
              />
              <button
                type="button"
                onClick={() => requireAuth(() => setUploadOpen(true))}
                className="hidden h-9 shrink-0 items-center gap-1.5 rounded-md bg-ink px-3.5 text-sm font-medium text-surface transition hover:bg-ink/85 sm:inline-flex"
              >
                <Plus className="h-4 w-4" />
                Upload
              </button>
            </div>
          </div>
          {showAuthBanner ? <AuthPreviewBanner onDismiss={dismissAuthBanner} /> : null}

          {currentView === "dashboard" ? (
            <DashboardView
              me={me}
              notes={notes}
              trendingNotes={trendingNotes}
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
              onGoToRoadmaps={() => setActiveView("roadmaps")}
              onGoToStudyRooms={() => setActiveView("study-rooms")}
              onGoToVerify={() => setActiveView("college-vault")}
              onGoToAddResource={() => setActiveView("add-resource")}
            />
          ) : currentView === "roadmaps" ? (
            <AIRoadmapsView />
          ) : currentView === "exam-mode" ? (
            <ExamModeView />
          ) : currentView === "study-rooms" ? (
            <StudyRoomsView />
          ) : currentView === "college-vault" ? (
            <CollegeVaultView me={me} />
          ) : currentView === "add-resource" ? (
            <AddResourceView onUpload={() => requireAuth(() => setUploadOpen(true))} />
          ) : currentView === "profile" ? (
            <ProfileView
              key={me?.id ?? "guest"}
              me={me}
              authChecked={authChecked}
              uploads={notes}
              loading={loading}
              stats={stats}
              onOpenNote={setOpenNote}
              onUpload={() => requireAuth(() => setUploadOpen(true))}
              onSignOut={signOut}
              onSaveProfile={saveProfile}
            />
          ) : currentView === "review" ? (
            <ReviewView
              notes={adminNotes}
              reports={adminReports}
              loading={adminLoading}
              onRefresh={refreshAdminQueue}
              onOpenNote={setOpenNote}
              onModerate={moderateNote}
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
                  currentView === "saved"
                    ? "Resources you bookmark will collect here."
                    : currentView === "uploads"
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
          onReport={() => reportNote(openNote)}
        />
      ) : null}

      {uploadOpen ? (
        <UploadDialog
          onSubmit={submitUpload}
          onClose={() => setUploadOpen(false)}
          defaultSemester={me?.semester || "1"}
        />
      ) : null}

      {authPromptOpen ? (
        <AuthPromptDialog onClose={() => setAuthPromptOpen(false)} />
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

function AuthPreviewBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-lg border border-line bg-surface p-3 transition hover:border-line-strong sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm leading-6 text-ink-soft">
        Preview mode is on. Sign in to save, rate, download, upload, and personalize resources.
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/sign-in"
          className="inline-flex h-8 items-center rounded-md bg-ink px-3 text-sm font-medium text-surface transition hover:-translate-y-0.5 hover:bg-ink/85"
        >
          Sign in
        </Link>
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-faint transition hover:bg-paper hover:text-ink"
          aria-label="Dismiss sign-in prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function AuthPromptDialog({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/25 p-3 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close sign-in prompt"
      />
      <section className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-lg border border-line bg-surface shadow-2xl transition duration-200">
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase text-ink-faint">
              Account required
            </p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight">Sign in to continue</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-faint transition hover:bg-paper hover:text-ink"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-5">
          <p className="text-sm leading-6 text-ink-soft">
            You can keep browsing resources in preview mode. Sign in when you want to save,
            rate, download, upload, or manage your profile.
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <Link
              href="/sign-in"
              className="inline-flex h-10 items-center justify-center rounded-md bg-ink px-3.5 text-sm font-medium text-surface transition hover:-translate-y-0.5 hover:bg-ink/85"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex h-10 items-center justify-center rounded-md border border-line px-3.5 text-sm font-medium text-ink-soft transition hover:-translate-y-0.5 hover:border-line-strong hover:text-ink"
            >
              Create account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function DashboardView({
  me,
  notes,
  trendingNotes,
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
  onGoToRoadmaps,
  onGoToStudyRooms,
  onGoToVerify,
  onGoToAddResource,
}: {
  me: ApiUser | null;
  notes: ApiNote[];
  trendingNotes: ApiNote[];
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
  onGoToRoadmaps: () => void;
  onGoToStudyRooms: () => void;
  onGoToVerify: () => void;
  onGoToAddResource: () => void;
}) {
  const [isVerified, setIsVerified] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("classvault_college_verified") === "true";
    }
    return false;
  });
  const [collegeName, setCollegeName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("classvault_onboarding_college") ?? "your college";
    }
    return "your college";
  });

  const greeting = me?.name ? `Good evening, ${me.name.split(" ")[0]}.` : "Welcome back.";

  return (
    <div className="space-y-8 pb-12">
      {/* Greeting Header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight text-ink">{greeting}</h2>
        <p className="text-sm text-ink-soft">Ready to continue your study roadmap?</p>
      </div>

      {/* College Vault Status */}
      <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-start gap-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <GraduationCap className="h-5 w-5" />
          </span>
          <div className="space-y-1">
            <div className="flex flex-col gap-2 min-[420px]:flex-row min-[420px]:items-center">
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
      <section className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 md:grid-cols-4 md:gap-4">
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
            <h4 className="mt-3.5 text-xs font-bold text-ink">{card.label}</h4>
            <p className="mt-1 text-[11px] text-ink-faint leading-normal">{card.desc}</p>
          </button>
        ))}
      </section>

      {/* Main Grid: Today's Plan & Study Rooms */}
      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        
        {/* Left column: Plan & Saved */}
        <div className="space-y-8">
          {/* Today's Study Plan */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <SectionLabel>Today&apos;s Study Plan</SectionLabel>
              <button
                onClick={onGoToRoadmaps}
                className="text-xs font-semibold text-accent hover:underline"
              >
                Go to Roadmaps
              </button>
            </div>
            
            <div className="min-w-0 rounded-lg border border-line bg-surface">
              <div className="divide-y divide-line">
                {tasks.map((task) => (
                  <div key={task.id} className="group flex items-center gap-3 px-3.5 py-2.5">
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
                      className="text-ink-faint opacity-0 transition hover:text-ink group-hover:opacity-100"
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
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <SectionLabel>Saved Resources</SectionLabel>
              <button
                onClick={onGoToLibrary}
                className="text-xs font-semibold text-ink-soft hover:text-ink"
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
              <div className="space-y-2">
                {notes.slice(0, 3).map((note) => (
                  <NoteRow key={note.id} note={note} onOpen={() => onOpenNote(note)} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right column: Active Study Rooms & Quick Stats */}
        <div className="space-y-8">
          {/* Study Rooms Feed */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <SectionLabel>Active Study Rooms</SectionLabel>
              <button
                onClick={onGoToStudyRooms}
                className="text-xs font-semibold text-accent hover:underline"
              >
                Join room
              </button>
            </div>
            <div className="space-y-3">
              {[
                { name: "DBMS Exam Sprint", count: 18, timer: "25m focus", type: "College-only" },
                { name: "CN Focus Room", count: 9, timer: "50m focus", type: "Public" },
                { name: "Silent Study", count: 32, timer: "Silent Pomodoro", type: "Public" },
              ].map((room) => (
                <div key={room.name} className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-3.5 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold text-ink leading-none">{room.name}</h4>
                      <span className="inline-flex items-center rounded border border-line bg-paper px-1 py-0.5 text-[9px] font-bold text-ink-soft uppercase leading-none">
                        {room.type}
                      </span>
                    </div>
                    <p className="text-[10px] text-ink-soft leading-none">
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
          <section className="space-y-3">
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

// -----------------------------------------------------------------
// COLLEGE VAULT VERIFICATION VIEW
// -----------------------------------------------------------------
function CollegeVaultView({ me }: { me: ApiUser | null }) {
  const [collegeName, setCollegeName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("classvault_onboarding_college") ?? "";
    }
    return "";
  });
  const [collegeEmail, setCollegeEmail] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("classvault_college_email") ?? "";
    }
    return "";
  });
  const [otpCode, setOtpCode] = useState("");
  const [status, setStatus] = useState<"unverified" | "sent" | "verified">(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("classvault_college_verified") === "true" ? "verified" : "unverified";
    }
    return "unverified";
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleSendCode(e: FormEvent) {
    e.preventDefault();
    if (!collegeEmail.endsWith(".edu") && !collegeEmail.endsWith(".edu.in") && !collegeEmail.endsWith(".ac.in")) {
      setError("Please use a valid official college email (e.g. .edu, .edu.in, .ac.in).");
      return;
    }
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setLoading(false);
      setStatus("sent");
      setOtpCode("");
    }, 700);
  }

  function handleVerifyCode(e: FormEvent) {
    e.preventDefault();
    if (otpCode !== "123456") {
      setError("Incorrect verification code. Use 123456 for the demo.");
      return;
    }
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setLoading(false);
      setStatus("verified");
      if (typeof window !== "undefined") {
        localStorage.setItem("classvault_college_verified", "true");
        localStorage.setItem("classvault_onboarding_college", collegeName);
        localStorage.setItem("classvault_college_email", collegeEmail);
      }
    }, 600);
  }

  function handleReset() {
    setStatus("unverified");
    setCollegeName("");
    setCollegeEmail("");
    setError(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("classvault_college_verified");
      localStorage.removeItem("classvault_college_email");
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-ink">Join your college vault.</h2>
        <p className="text-sm text-ink-soft">
          Use your official college email address to unlock private college resources, semester groups, verified notes, and classmate focus sessions.
        </p>
      </div>

      {status === "verified" ? (
        <div className="rounded-xl border border-line bg-surface p-6 text-center space-y-4 shadow-sm">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-ink">Verified Student Access</h3>
            <p className="text-xs text-ink-soft">
              Successfully linked with <span className="font-semibold text-ink">{collegeEmail}</span>
            </p>
            <p className="text-xs text-ink-faint">College: {collegeName}</p>
          </div>
        <div className="mx-auto grid max-w-md gap-3 border-t border-line pt-4 text-left text-xs sm:grid-cols-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Private college notes</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>College PYQ library</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Verified student badge</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Peer silent study rooms</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex h-8 items-center justify-center rounded border border-line bg-paper px-4 text-xs font-semibold text-ink-soft transition hover:bg-surface hover:text-ink"
          >
            Disconnect verification
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
          {status === "unverified" && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-3">
                <label className="block">
                  <span className="text-xs font-bold text-ink-soft">College / University Name</span>
                  <input
                    type="text"
                    required
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    placeholder="e.g. Stanford University"
                    className="mt-1 h-10 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none transition focus:border-line-strong focus:bg-surface"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-ink-soft">Official College Email Address</span>
                  <input
                    type="email"
                    required
                    value={collegeEmail}
                    onChange={(e) => setCollegeEmail(e.target.value)}
                    placeholder="you@college.edu or student@college.ac.in"
                    className="mt-1 h-10 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none transition focus:border-line-strong focus:bg-surface"
                  />
                  <span className="block mt-1 text-[10px] text-ink-faint">
                    Accepted endings: .edu, .edu.in, .ac.in, or official college domains.
                  </span>
                </label>
              </div>
              {error ? <p className="text-xs font-semibold text-red-600">{error}</p> : null}
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-10 w-full items-center justify-center rounded-md bg-ink text-sm font-semibold text-surface transition hover:bg-ink/85 disabled:opacity-60"
              >
                {loading ? "Sending link..." : "Send verification code"}
              </button>
            </form>
          )}

          {status === "sent" && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="space-y-3">
                <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 p-2.5 rounded">
                  Simulation mode: We sent a simulated verification code. Enter <span className="font-bold">123456</span> to complete verification.
                </p>
                <label className="block">
                  <span className="text-xs font-bold text-ink-soft">Verification Code</span>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="mt-1 h-11 w-full rounded-md border border-line bg-paper px-3 text-center font-mono text-base tracking-widest outline-none transition focus:border-line-strong focus:bg-surface"
                  />
                </label>
              </div>
              {error ? <p className="text-xs font-semibold text-red-600">{error}</p> : null}
              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="inline-flex h-10 w-full items-center justify-center rounded-md bg-ink text-sm font-semibold text-surface transition hover:bg-ink/85 disabled:opacity-60"
              >
                {loading ? "Verifying..." : "Verify code"}
              </button>
              <button
                type="button"
                onClick={() => setStatus("unverified")}
                className="inline-flex h-9 w-full items-center justify-center text-xs font-semibold text-ink-soft transition hover:underline"
              >
                Change college details
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------
// AI ROADMAPS VIEW
// -----------------------------------------------------------------
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

function AIRoadmapsView() {
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

  function getTooltipStyle(i: number, n: number) {
    const pos = getPillStyle(i, n);
    const topVal = parseInt(pos.top) + (i === 0 ? 55 : -125);
    const style: React.CSSProperties = {
      top: `${topVal}px`,
      width: "240px",
    };
    if (i >= n - 2) {
      const leftInt = parseFloat(pos.left);
      const widthInt = parseFloat(pos.width);
      const rightPercent = 100 - (leftInt + widthInt);
      style.right = `${rightPercent}%`;
      style.left = "auto";
    } else {
      style.left = pos.left;
    }
    return style;
  }

  function renderBezierPath(n: number) {
    const centers: { x: number; y: number }[] = [];
    if (n === 5) {
      centers.push({ x: 100, y: 37 });
      centers.push({ x: 300, y: 82 });
      centers.push({ x: 500, y: 127 });
      centers.push({ x: 800, y: 172 });
      centers.push({ x: 900, y: 222 });
    } else if (n === 3) {
      centers.push({ x: 166.5, y: 37 });
      centers.push({ x: 499.5, y: 87 });
      centers.push({ x: 832.5, y: 137 });
    } else {
      for (let i = 0; i < n; i++) {
        let left = 0;
        let width = 0;
        let top = 0;
        const colWidth = 100 / n;
        if (i === n - 2) {
          left = (i * colWidth) + 2;
          width = (colWidth * 2) - 4;
          top = (i * 45) + 15;
        } else if (i === n - 1) {
          left = (i * colWidth) + 2;
          width = colWidth - 4;
          top = (i * 45) + 20;
        } else {
          left = (i * colWidth) + 2;
          width = colWidth - 4;
          top = (i * 45) + 15;
        }
        const midX = (left + width / 2) * 10;
        const midY = top + 22;
        centers.push({ x: midX, y: midY });
      }
    }

    let dString = "";
    if (centers.length > 0) {
      dString = `M ${centers[0].x} ${centers[0].y}`;
      for (let i = 1; i < centers.length; i++) {
        const p0 = centers[i - 1];
        const p1 = centers[i];
        const cp1x = p0.x + (p1.x - p0.x) / 2;
        const cp1y = p0.y;
        const cp2x = p0.x + (p1.x - p0.x) / 2;
        const cp2y = p1.y;
        dString += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
      }
    }

    return (
      <path
        d={dString}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2.2"
        className="animate-roadmap-path opacity-40"
      />
    );
  }

  function getPillStyle(i: number, n: number) {
    const colWidth = 100 / n;
    const left = `${(i * colWidth) + 2}%`;
    const width = `${colWidth - 4}%`;
    const top = `${(i * 45) + 15}px`;
    return { left, width, top };
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
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-ink">AI Study Roadmaps</h2>
        <p className="text-sm text-ink-soft">
          Generate a customized subject study schedule using your files, community notes, and syllabus specifications.
        </p>
      </div>

      {!roadmap && (
        <div className="grid min-w-0 items-start gap-6 lg:grid-cols-12">
          {/* Left Column: Form Configuration */}
          <div className="min-w-0 rounded-xl border border-line bg-surface p-4 shadow-sm sm:p-5 lg:col-span-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-faint mb-3">
              Configure Study Plan
            </h3>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="grid gap-4">
                <label className="block min-w-0">
                  <span className="text-xs font-bold text-ink-soft">Study Subject</span>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Computer Networks, DBMS, Operating Systems"
                    className="mt-1 h-10 w-full min-w-0 rounded-md border border-line bg-paper px-3 text-sm outline-none transition focus:border-line-strong focus:bg-surface"
                  />
                </label>

                <label className="block min-w-0">
                  <span className="text-xs font-bold text-ink-soft">Target Duration</span>
                  <select
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="mt-1 h-10 w-full min-w-0 rounded-md border border-line bg-paper px-3 text-sm outline-none transition focus:border-line-strong focus:bg-surface"
                  >
                    <option value={3}>3 Days (Exam Sprint)</option>
                    <option value={5}>5 Days (Recommended)</option>
                    <option value={7}>7 Days (Deep Learning)</option>
                  </select>
                </label>

                <label className="block min-w-0">
                  <span className="text-xs font-bold text-ink-soft">Current Level</span>
                  <div className="mt-1 flex min-w-0 gap-1 rounded-lg border border-line bg-paper p-1">
                    {["Beginner", "Okay", "Strong"].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setLevel(lvl)}
                        className={cx(
                          "min-w-0 flex-1 rounded py-1 text-xs font-bold transition",
                          level === lvl ? "bg-ink text-surface" : "text-ink-soft hover:text-ink",
                        )}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </label>

                <label className="block min-w-0">
                  <span className="text-xs font-bold text-ink-soft">Study Goal</span>
                  <div className="mt-1 flex flex-wrap gap-2">
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
                          "rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                          goal === gl ? "border-accent bg-accent-soft text-accent" : "border-line text-ink-soft hover:border-line-strong hover:text-ink",
                        )}
                      >
                        {gl}
                      </button>
                    ))}
                  </div>
                </label>

                <div className="space-y-2.5 pt-2">
                  <span className="text-xs font-bold text-ink-soft block">Ingestion Source Materials</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { label: "Use personal resources", val: usePersonal, set: setUsePersonal },
                      { label: "Use community resources", val: useCommunity, set: setUseCommunity },
                      { label: "Include PYQ sets", val: usePYQ, set: setUsePYQ },
                      { label: "Video lectures & websites", val: useVideo, set: setUseVideo },
                    ].map((toggle) => (
                      <label key={toggle.label} className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-ink-soft hover:text-ink">
                        <input
                          type="checkbox"
                          checked={toggle.val}
                          onChange={(e) => toggle.set(e.target.checked)}
                          className="rounded border-line text-accent focus:ring-accent"
                        />
                        <span>{toggle.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={generating || !subject.trim()}
                className="inline-flex h-10 w-full items-center justify-center rounded-md bg-ink text-sm font-semibold text-surface transition hover:bg-ink/85 disabled:opacity-60 pt-1"
              >
                {generating ? "Parsing materials & compiling roadmap..." : "Generate AI Roadmap"}
              </button>
            </form>
          </div>

          {/* Right Column: Live Interactive Sandbox Preview */}
          <div className="min-w-0 space-y-4 lg:col-span-7">
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
              <div className="mb-6 flex items-start justify-between gap-3 border-b border-line pb-4">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-ink-faint font-semibold">Journey highlights</span>
                  <h3 className="text-xl font-bold tracking-tight text-ink mt-0.5">Timeline</h3>
                </div>
                <div className="flex shrink-0 flex-col items-end">
                  <span className="font-mono text-2xl font-light text-ink/80 leading-none">
                    0{previewRoadmap.length}/
                  </span>
                  <div className="flex items-center gap-2 mt-2.5">
                    <span className="text-[9px] uppercase font-bold text-ink-faint">Tools</span>
                    <div className="flex gap-1.5">
                      <div className="flex h-5 w-5 items-center justify-center rounded border border-line bg-paper text-ink" title="Notion">
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M4.46 3h15.08c1.07 0 1.96.86 2.01 1.93l.42 13.9c.03.95-.59 1.79-1.51 1.97l-15.08.3c-1.07.02-1.99-.81-2.02-1.89l-.45-13.91c-.03-.96.67-1.93 1.55-2.3zm1.94 2.8v11.85h3.04l3.87-5.8v5.8h2.76V5.8h-3.04l-3.87 5.8V5.8H6.4zm8.68 2.1c.33 0 .6-.27.6-.6s-.27-.6-.6-.6-.6.27-.6.6.27.6.6.6z"/>
                        </svg>
                      </div>
                      <div className="flex h-5 w-5 items-center justify-center rounded border border-line bg-paper text-ink" title="Figma">
                        <svg className="h-3 w-3" viewBox="0 0 384 512" fill="currentColor">
                          <path d="M120 412c-44.2 0-80-35.8-80-80s35.8-80 80-80h80v80c0 44.2-35.8 80-80 80zM120 0c44.2 0 80 35.8 80 80v80H120c-44.2 0-80-35.8-80-80s35.8-80 80-80zm0 160h80v160H120c-44.2 0-80-35.8-80-80s35.8-80 80-80zm160-80c0 44.2-35.8 80-80 80h-80V80c0-44.2 35.8-80 80-80s80 35.8 80 80zm0 160c0 44.2-35.8 80-80 80h-80v-160h80c44.2 0 80 35.8 80 80z" />
                        </svg>
                      </div>
                      <div className="flex h-5 w-5 items-center justify-center rounded border border-line bg-paper text-ink" title="AI Assistant">
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l-1.813-5.096L2.091 14.09 7.187 12.28 9 7.187l1.813 5.093 5.096 1.81-5.096 1.813z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scrollable Timeline Graphic & Day Indices */}
              <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-5 sm:px-5">
                <div className="min-w-[580px] lg:min-w-0 relative">
                  {/* Gantt Timeline graphic with bezier curves */}
                  <div className="relative border-b border-line pb-6 mb-6 h-[260px]">
                    {/* SVG connection path */}
                    <svg className="absolute inset-0 w-full h-[260px] pointer-events-none" viewBox="0 0 1000 260" preserveAspectRatio="none">
                      {renderBezierPath(5)}
                    </svg>

                    {/* Dashed vertical lines dividing columns */}
                    <div className="absolute inset-0 grid pointer-events-none" style={{ gridTemplateColumns: `repeat(5, minmax(0, 1fr))` }}>
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <div 
                          key={idx} 
                          className={cx(
                            "h-full border-dashed border-line",
                            idx < 4 ? "border-r" : ""
                          )} 
                        />
                      ))}
                    </div>

                    {/* Day Pills rendering cascade */}
                    {previewRoadmap.map((day, dIdx) => {
                      const pos = getPillStyle(dIdx, 5);
                      const isHovered = hoveredPreviewDay === dIdx;
                      const isActive = activePreviewDay === dIdx;
                      return (
                        <div
                          key={day.day}
                          onMouseEnter={() => setHoveredPreviewDay(dIdx)}
                          onMouseLeave={() => setHoveredPreviewDay(null)}
                          onClick={() => setActivePreviewDay(dIdx)}
                          style={{
                            left: pos.left,
                            width: pos.width,
                            top: pos.top,
                            animationDelay: `${dIdx * 80}ms`,
                          }}
                          className={cx(
                            "absolute h-[44px] rounded-[18px] flex items-center justify-between px-5 text-xs font-semibold shadow-md transition-all duration-300 cursor-pointer select-none animate-pill-cascade",
                            isActive
                              ? "bg-accent text-surface ring-4 ring-accent-soft scale-[1.03] z-30"
                              : isHovered 
                                ? "bg-ink-soft text-surface scale-[1.01] z-25" 
                                : "bg-ink text-surface z-20"
                          )}
                        >
                          <span className="truncate pr-2">Day {day.day}</span>
                          <span className="text-[10px] opacity-75 font-mono shrink-0">
                            {day.done.filter(Boolean).length}/{day.done.length}
                          </span>
                        </div>
                      );
                    })}

                    {/* Tooltip Card for hovered preview day */}
                    {hoveredPreviewDay !== null && (
                      <div
                        style={getTooltipStyle(hoveredPreviewDay, 5)}
                        className="absolute z-40 bg-surface border border-line-strong p-3.5 rounded-xl shadow-xl animate-tooltip pointer-events-none"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                            Day {previewRoadmap[hoveredPreviewDay].day} Focus
                          </span>
                          <span className="text-[10px] font-mono font-bold text-success">
                            {Math.round((previewRoadmap[hoveredPreviewDay].done.filter(Boolean).length / previewRoadmap[hoveredPreviewDay].done.length) * 100)}% Done
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-ink leading-snug">
                          {previewRoadmap[hoveredPreviewDay].title}
                        </h4>
                        <p className="text-[10px] text-ink-soft mt-1 leading-normal line-clamp-2">
                          {previewRoadmap[hoveredPreviewDay].topic}
                        </p>
                        <div className="mt-2 pt-2 border-t border-line flex items-center justify-between text-[9px] text-ink-faint">
                          <span>📚 {previewRoadmap[hoveredPreviewDay].resources.length} Resources</span>
                          <span>✓ {previewRoadmap[hoveredPreviewDay].done.filter(Boolean).length}/{previewRoadmap[hoveredPreviewDay].done.length} Tasks</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Day indices at base of dashed lines */}
                  <div className="grid text-center mb-6" style={{ gridTemplateColumns: `repeat(5, minmax(0, 1fr))` }}>
                    {previewRoadmap.map((day, dIdx) => (
                      <button 
                        key={day.day} 
                        onClick={() => setActivePreviewDay(dIdx)}
                        className={cx(
                          "px-1.5 flex flex-col items-center border-t pt-2.5 transition-colors duration-300 outline-none",
                          activePreviewDay === dIdx ? "border-accent text-accent font-bold" : "border-line text-ink hover:text-accent"
                        )}
                      >
                        <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-ink-faint">
                          Day {day.day}
                        </span>
                        <span className="text-[11px] font-bold mt-1 leading-tight line-clamp-2 text-center max-w-[120px]">
                          {day.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

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
            {/* Header section identical to the image mockup */}
            <div className="mb-6 flex items-start justify-between gap-3 border-b border-line pb-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-ink-faint font-semibold">Journey highlights</span>
                <h3 className="text-xl font-bold tracking-tight text-ink mt-0.5">Timeline</h3>
              </div>
              <div className="flex shrink-0 flex-col items-end">
                <span className="font-mono text-2xl font-light text-ink/80 leading-none">0{roadmap.length}/</span>
                <div className="flex items-center gap-2 mt-2.5">
                  <span className="text-[9px] uppercase font-bold text-ink-faint">Tools</span>
                  <div className="flex gap-1.5">
                    {/* Notion SVG icon */}
                    <div className="flex h-5 w-5 items-center justify-center rounded border border-line bg-paper text-ink" title="Notion">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4.46 3h15.08c1.07 0 1.96.86 2.01 1.93l.42 13.9c.03.95-.59 1.79-1.51 1.97l-15.08.3c-1.07.02-1.99-.81-2.02-1.89l-.45-13.91c-.03-.96.67-1.93 1.55-2.3zm1.94 2.8v11.85h3.04l3.87-5.8v5.8h2.76V5.8h-3.04l-3.87 5.8V5.8H6.4zm8.68 2.1c.33 0 .6-.27.6-.6s-.27-.6-.6-.6-.6.27-.6.6.27.6.6.6z"/>
                      </svg>
                    </div>
                    {/* Figma SVG icon */}
                    <div className="flex h-5 w-5 items-center justify-center rounded border border-line bg-paper text-ink" title="Figma">
                      <svg className="h-3 w-3" viewBox="0 0 384 512" fill="currentColor">
                        <path d="M120 412c-44.2 0-80-35.8-80-80s35.8-80 80-80h80v80c0 44.2-35.8 80-80 80zM120 0c44.2 0 80 35.8 80 80v80H120c-44.2 0-80-35.8-80-80s35.8-80 80-80zm0 160h80v160H120c-44.2 0-80-35.8-80-80s35.8-80 80-80zm160-80c0 44.2-35.8 80-80 80h-80V80c0-44.2 35.8-80 80-80s80 35.8 80 80zm0 160c0 44.2-35.8 80-80 80h-80v-160h80c44.2 0 80 35.8 80 80z" />
                      </svg>
                    </div>
                    {/* ChatGPT Sparkle icon */}
                    <div className="flex h-5 w-5 items-center justify-center rounded border border-line bg-paper text-ink" title="AI Assistant">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l-1.813-5.096L2.091 14.09 7.187 12.28 9 7.187l1.813 5.093 5.096 1.81-5.096 1.813z" />
                      </svg>
                    </div>
                    {/* Page Document icon */}
                    <div className="flex h-5 w-5 items-center justify-center rounded border border-line bg-paper text-ink" title="Classroom Materials">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable Timeline Graphic & Day Indices */}
            <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
              <div className="min-w-[580px] lg:min-w-0 relative">

            {/* Gantt Timeline Graphic */}
            <div className={cx("relative border-b border-line pb-6 mb-6", roadmap.length === 3 ? "h-[160px]" : roadmap.length === 5 ? "h-[260px]" : "h-[360px]")}>
              {/* SVG connection path */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 1000 ${roadmap.length === 3 ? 160 : roadmap.length === 5 ? 260 : 360}`} preserveAspectRatio="none">
                {renderBezierPath(roadmap.length)}
              </svg>

              {/* Dashed vertical lines dividing columns */}
              <div className="absolute inset-0 grid pointer-events-none" style={{ gridTemplateColumns: `repeat(${roadmap.length}, minmax(0, 1fr))` }}>
                {Array.from({ length: roadmap.length }).map((_, idx) => (
                  <div 
                    key={idx} 
                    className={cx(
                      "h-full border-dashed border-line",
                      idx < roadmap.length - 1 ? "border-r" : ""
                    )} 
                  />
                ))}
              </div>

              {/* Day Pills rendering cascade */}
              {roadmap.map((day, dIdx) => {
                const pos = getPillStyle(dIdx, roadmap.length);
                const isHovered = hoveredDay === dIdx;
                const isActive = activeDay === dIdx;
                return (
                  <div
                    key={day.day}
                    onMouseEnter={() => setHoveredDay(dIdx)}
                    onMouseLeave={() => setHoveredDay(null)}
                    onClick={() => setActiveDay(dIdx)}
                    style={{
                      left: pos.left,
                      width: pos.width,
                      top: pos.top,
                      animationDelay: `${dIdx * 80}ms`,
                    }}
                    className={cx(
                      "absolute h-[44px] rounded-[18px] flex items-center justify-between px-5 text-xs font-semibold shadow-md transition-all duration-300 cursor-pointer select-none animate-pill-cascade",
                      isActive
                        ? "bg-accent text-surface ring-4 ring-accent-soft scale-[1.03] z-30"
                        : isHovered 
                          ? "bg-ink-soft text-surface scale-[1.01] z-25" 
                          : "bg-ink text-surface z-20"
                    )}
                  >
                    <span className="truncate pr-2">Day {day.day}</span>
                    <span className="text-[10px] opacity-75 font-mono shrink-0">
                      {day.done.filter(Boolean).length}/{day.done.length}
                    </span>
                  </div>
                );
              })}

              {/* Tooltip Card for hovered day */}
              {hoveredDay !== null && (
                <div
                  style={getTooltipStyle(hoveredDay, roadmap.length)}
                  className="absolute z-40 bg-surface border border-line-strong p-3.5 rounded-xl shadow-xl animate-tooltip pointer-events-none"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                      Day {roadmap[hoveredDay].day} Focus
                    </span>
                    <span className="text-[10px] font-mono font-bold text-success">
                      {Math.round((roadmap[hoveredDay].done.filter(Boolean).length / roadmap[hoveredDay].done.length) * 100)}% Done
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-ink leading-snug">
                    {roadmap[hoveredDay].title}
                  </h4>
                  <p className="text-[10px] text-ink-soft mt-1 leading-normal line-clamp-2">
                    {roadmap[hoveredDay].topic}
                  </p>
                  <div className="mt-2 pt-2 border-t border-line flex items-center justify-between text-[9px] text-ink-faint">
                    <span>📚 {roadmap[hoveredDay].resources.length} Resources</span>
                    <span>✓ {roadmap[hoveredDay].done.filter(Boolean).length}/{roadmap[hoveredDay].done.length} Tasks</span>
                  </div>
                </div>
              )}
            </div>

            {/* Day indices and clear wrapping titles at base of dashed lines */}
            <div className="grid text-center mb-8" style={{ gridTemplateColumns: `repeat(${roadmap.length}, minmax(0, 1fr))` }}>
              {roadmap.map((day, dIdx) => (
                <button 
                  key={day.day} 
                  onClick={() => setActiveDay(dIdx)}
                  className={cx(
                    "px-2 flex flex-col items-center border-t pt-3 transition-colors duration-300 outline-none",
                    activeDay === dIdx ? "border-accent text-accent font-bold" : "border-line text-ink hover:text-accent"
                  )}
                >
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-ink-faint">
                    Day {day.day}
                  </span>
                  <span className="text-xs font-bold mt-1 leading-tight line-clamp-2 max-w-[140px] text-center">
                    {day.title}
                  </span>
                </button>
              ))}
            </div>
              </div>
            </div>

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
function ExamModeView() {
  const [subject, setSubject] = useState("");
  const [examDays, setExamDays] = useState("3");
  const [studyHours, setStudyHours] = useState("4");
  const [weakTopics, setWeakTopics] = useState("");
  const [planGenerated, setPlanGenerated] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!subject.trim()) return;
    setPlanGenerated(true);
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-ink">Exam Mode</h2>
        <p className="text-sm text-ink-soft">
          Exam is in 3 days? Shift to Exam Mode for an urgent, high-yield final prep checklist.
        </p>
      </div>

      {!planGenerated ? (
        <div className="rounded-xl border border-line bg-surface p-5 shadow-sm max-w-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs font-bold text-ink-soft">Exam Subject</span>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Operating Systems"
                  className="mt-1 h-10 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none transition focus:border-line-strong focus:bg-surface"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-bold text-ink-soft">Days Remaining</span>
                  <select
                    value={examDays}
                    onChange={(e) => setExamDays(e.target.value)}
                    className="mt-1 h-10 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none transition focus:border-line-strong focus:bg-surface"
                  >
                    <option value="1">1 Day (Crisis Mode)</option>
                    <option value="2">2 Days</option>
                    <option value="3">3 Days (Recommended)</option>
                    <option value="5">5 Days</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-bold text-ink-soft">Study Hours / Day</span>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    value={studyHours}
                    onChange={(e) => setStudyHours(e.target.value)}
                    className="mt-1 h-10 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none transition focus:border-line-strong focus:bg-surface"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-bold text-ink-soft">Weak Topics (optional)</span>
                <textarea
                  value={weakTopics}
                  onChange={(e) => setWeakTopics(e.target.value)}
                  placeholder="e.g. Semaphores, Page replacement algorithms"
                  className="mt-1 w-full rounded-md border border-line bg-paper p-3 text-sm outline-none transition focus:border-line-strong focus:bg-surface h-20 resize-none"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={!subject.trim()}
              className="inline-flex h-10 w-full items-center justify-center rounded-md bg-amber-600 text-sm font-semibold text-surface transition hover:bg-amber-700 disabled:opacity-60"
            >
              Activate Exam Mode
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                Exam Mode Active
              </span>
              <h3 className="text-lg font-bold text-ink mt-1">
                {subject} Crash Plan — {examDays} Days Left
              </h3>
            </div>
            <button
              onClick={() => setPlanGenerated(false)}
              className="inline-flex h-9 w-full items-center justify-center rounded border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-paper sm:w-auto"
            >
              Reset Plan
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            
            {/* Must Study & Skip Columns */}
            <div className="space-y-6">
              {/* Must Study */}
              <div className="rounded-xl border border-line bg-surface p-5 space-y-3 shadow-sm">
                <div className="flex items-center gap-2 text-amber-700 font-bold">
                  <Flame className="h-4 w-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">Must Study (High-Yield)</h4>
                </div>
                <ul className="space-y-2">
                  {[
                    "1. Processes vs Threads & IPC protocols — 85% Exam Probability",
                    "2. CPU Scheduling algorithms (FCFS, SJF, RR) — 80% Exam Probability",
                    "3. Classical synchronization issues (Bounded Buffer, Semaphores) — 75% Exam Probability",
                    "4. Paging, Virtual Memory & TLB caches — 70% Exam Probability",
                  ].map((topic, i) => (
                    <li key={i} className="text-xs text-ink font-semibold flex items-start gap-2.5">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Can Skip */}
              <div className="rounded-xl border border-line bg-surface p-5 space-y-3 shadow-sm opacity-85">
                <div className="flex items-center gap-2 text-ink-soft font-bold">
                  <Clock className="h-4 w-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">Low Yield (Okay to Skip if low time)</h4>
                </div>
                <ul className="space-y-2 text-xs text-ink-soft">
                  {[
                    "1. OS Implementation histories and monolithic internals",
                    "2. Disk scheduling optimization equations",
                    "3. Secondary storage hardware interface mappings",
                  ].map((skip, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span>•</span>
                      <span>{skip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Practice checklist */}
            <div className="rounded-xl border border-line bg-surface p-5 space-y-4 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-faint">Practice Checkpoints</h4>
              
              <div className="space-y-3">
                {[
                  "Complete 12 repeated branch PYQs",
                  "Revise 25 core OS Flashcards",
                  "Attempt 1 Mock Exam Sprint Quiz",
                  "Final revision of CPU scheduling Gantt charts",
                ].map((practice, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="rounded border-line text-amber-600 focus:ring-amber-500 mt-0.5"
                    />
                    <span className="text-xs font-semibold text-ink-soft leading-normal">
                      {practice}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-line pt-4 space-y-2">
                <p className="text-[10px] text-ink-faint font-semibold">AI INSIGHT</p>
                <p className="text-xs text-ink-soft leading-relaxed italic">
                  &quot;Based on analyzed student logs, spending 45 mins drawing scheduling Gantt charts increases related question scores by 34%. Avoid studying Monolithic vs Microkernel internals in the final 24 hours.&quot;
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------
// STUDY ROOMS VIEW
// -----------------------------------------------------------------
type RoomDetails = {
  name: string;
  subject: string;
  count: number;
  timer: string;
  timerVal: number; // minutes
  type: "College-only" | "Public";
  goals: string[];
};

function StudyRoomsView() {
  const [rooms, setRooms] = useState<RoomDetails[]>([
    {
      name: "DBMS Exam Sprint",
      subject: "DBMS",
      count: 18,
      timer: "25:00 focus",
      timerVal: 25,
      type: "College-only",
      goals: ["Finish Unit 2 Normal forms", "Solve PYQs", "Revise SQL joins"],
    },
    {
      name: "CN Focus Room",
      subject: "Computer Networks",
      count: 9,
      timer: "50:00 focus",
      timerVal: 50,
      type: "Public",
      goals: ["Watch routing lecture", "Revise sliding window", "Draw OSI structure"],
    },
    {
      name: "Silent Study",
      subject: "General Study",
      count: 32,
      timer: "25:00 Pomodoro",
      timerVal: 25,
      type: "Public",
      goals: ["Complete reading tasks", "Clean logs", "Write notes"],
    },
  ]);

  const [activeRoom, setActiveRoom] = useState<RoomDetails | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Creation form states
  const [newRoomName, setNewRoomName] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newType, setNewType] = useState<"College-only" | "Public">("Public");
  const [newTimer, setNewTimer] = useState(25);
  const [newGoals, setNewGoals] = useState("");

  // Countdown timer states
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [completedSession, setCompletedSession] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timerRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            setCompletedSession(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timerRunning, timeLeft]);

  function handleJoinRoom(room: RoomDetails) {
    setActiveRoom(room);
    setTimeLeft(room.timerVal * 60);
    setTimerRunning(false);
    setCompletedSession(false);
  }

  function handleCreateRoom(e: FormEvent) {
    e.preventDefault();
    if (!newRoomName || !newSubject) return;

    const created: RoomDetails = {
      name: newRoomName,
      subject: newSubject,
      count: 1,
      timer: `${newTimer}:00 Pomodoro`,
      timerVal: newTimer,
      type: newType,
      goals: newGoals.split(",").map((g) => g.trim()).filter(Boolean),
    };

    setRooms((prev) => [created, ...prev]);
    setCreateOpen(false);
    
    // Auto join
    handleJoinRoom(created);
    
    // Reset form
    setNewRoomName("");
    setNewSubject("");
    setNewType("Public");
    setNewTimer(25);
    setNewGoals("");
  }

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-ink">Study Rooms</h2>
        <p className="text-sm text-ink-soft">
          Silent focus rooms. Set your goals, start the Pomodoro timer, and stay accountable alongside classmates.
        </p>
      </div>

      {!activeRoom ? (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-faint">Available Rooms</h3>
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex h-9 w-full items-center justify-center rounded-md bg-ink px-4 text-xs font-semibold text-surface transition hover:bg-ink/85 min-[420px]:h-8 min-[420px]:w-auto"
            >
              Create study room
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <div key={room.name} className="flex flex-col justify-between p-5 rounded-xl border border-line bg-surface hover:shadow-md transition">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center rounded border border-line bg-paper px-1.5 py-0.5 text-[9px] font-bold text-ink-soft uppercase">
                      {room.type}
                    </span>
                    <span className="text-[10px] text-ink-soft font-semibold">{room.count} studying</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-ink">{room.name}</h4>
                    <p className="text-xs text-ink-soft font-semibold">{room.subject} • {room.timer}</p>
                  </div>
                  <div className="space-y-1 pt-1.5">
                    <span className="text-[9px] font-bold uppercase text-ink-faint tracking-wider block">Goals</span>
                    <ul className="space-y-1">
                      {room.goals.map((g, i) => (
                        <li key={i} className="text-xs text-ink-soft leading-normal font-medium truncate">• {g}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <button
                  onClick={() => handleJoinRoom(room)}
                  className="mt-5 w-full h-8 bg-ink text-surface rounded text-xs font-bold hover:bg-ink/85 transition"
                >
                  Join Room
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Active session view */
        <div className="mx-auto max-w-2xl space-y-6 rounded-xl border border-line bg-surface p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 border-b border-line pb-4 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent leading-none">
                Silent Session
              </span>
              <h3 className="text-base font-bold text-ink mt-0.5">{activeRoom.name}</h3>
              <p className="text-xs text-ink-soft font-semibold mt-0.5">{activeRoom.subject}</p>
            </div>
            <button
              onClick={() => {
                setActiveRoom(null);
                setTimerRunning(false);
              }}
              className="inline-flex h-9 w-full items-center justify-center rounded border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-paper hover:text-red-700 min-[420px]:w-auto"
            >
              Leave Session
            </button>
          </div>

          <div className="space-y-4 py-6 text-center">
            <div className="font-mono text-4xl font-bold tracking-tight text-ink sm:text-5xl">
              {formatTimer(timeLeft)}
            </div>
            <div className="flex flex-col justify-center gap-3 min-[380px]:flex-row">
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className="inline-flex h-9 w-full items-center justify-center rounded bg-ink px-6 text-xs font-bold text-surface transition hover:bg-ink/85 min-[380px]:w-auto"
              >
                {timerRunning ? "Pause Timer" : "Start Focus"}
              </button>
              <button
                onClick={() => {
                  setTimerRunning(false);
                  setTimeLeft(activeRoom.timerVal * 60);
                }}
                className="inline-flex h-9 w-full items-center justify-center rounded border border-line bg-paper px-4 text-xs font-semibold text-ink-soft transition hover:bg-surface hover:text-ink min-[380px]:w-auto"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 pt-4 border-t border-line">
            {/* Goal checklist */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-faint">My Session Goals</h4>
              <div className="space-y-2.5">
                {activeRoom.goals.map((g, i) => (
                  <label key={i} className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-ink-soft">
                    <input type="checkbox" className="rounded border-line text-accent focus:ring-accent" />
                    <span>{g}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Participants list */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-faint">Classmates Focusing</h4>
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { name: "Priyanshu (you)", initials: "PR" },
                  { name: "Rohit", initials: "RO" },
                  { name: "Shruti", initials: "SH" },
                  { name: "Aarav", initials: "AA" },
                ].map((user, i) => (
                  <div key={i} className="flex items-center gap-2 border border-line bg-paper py-1.5 px-3 rounded-full text-xs font-semibold text-ink-soft">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-soft text-[9px] font-bold text-accent">
                      {user.initials}
                    </span>
                    <span>{user.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete session modal details */}
      {completedSession && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-3 sm:items-center sm:p-4">
          <div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-sm space-y-4 overflow-y-auto rounded-xl border border-line bg-surface p-6 text-center shadow-2xl">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-ink">Focus Session Complete!</h3>
              <p className="text-xs text-ink-soft">
                You studied for <span className="font-bold text-ink">{activeRoom?.timerVal} minutes</span> in {activeRoom?.name}.
              </p>
            </div>
            <div className="border-t border-line pt-3 text-left space-y-2">
              <span className="text-[10px] font-bold text-ink-faint uppercase block">Suggested next action</span>
              <p className="text-xs text-ink-soft">
                Add your completed tasks to your AI Study Roadmap, and take a quick 5-min break.
              </p>
            </div>
            <button
              onClick={() => {
                setCompletedSession(false);
                setActiveRoom(null);
              }}
              className="w-full h-9 bg-ink text-surface rounded text-xs font-bold hover:bg-ink/85 transition"
            >
              Awesome
            </button>
          </div>
        </div>
      )}

      {/* Room Creation dialog modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/25 p-3 sm:items-center sm:p-4">
          <div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-md space-y-4 overflow-y-auto rounded-xl border border-line bg-surface p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <h3 className="text-sm font-bold text-ink">Create study room</h3>
              <button onClick={() => setCreateOpen(false)} className="text-ink-faint hover:text-ink">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div className="space-y-3">
                <label className="block">
                  <span className="text-xs font-bold text-ink-soft">Room Name</span>
                  <input
                    type="text"
                    required
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="e.g. DBMS Exam Sprint"
                    className="mt-1 h-10 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none transition focus:border-line-strong focus:bg-surface"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold text-ink-soft">Subject</span>
                  <input
                    type="text"
                    required
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="e.g. DBMS"
                    className="mt-1 h-10 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none transition focus:border-line-strong focus:bg-surface"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-bold text-ink-soft">Timer Mode</span>
                    <select
                      value={newTimer}
                      onChange={(e) => setNewTimer(Number(e.target.value))}
                      className="mt-1 h-10 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none transition focus:border-line-strong focus:bg-surface"
                    >
                      <option value={25}>25 / 5 (Pomodoro)</option>
                      <option value={50}>50 / 10</option>
                      <option value={15}>15m Sprint</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-xs font-bold text-ink-soft">Visibility</span>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as "College-only" | "Public")}
                      className="mt-1 h-10 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none transition focus:border-line-strong focus:bg-surface"
                    >
                      <option value="Public">Public Room</option>
                      <option value="College-only">College-Only</option>
                    </select>
                  </label>
                </div>

                <label className="block">
                  <span className="text-xs font-bold text-ink-soft">Room Goals (comma separated)</span>
                  <input
                    type="text"
                    value={newGoals}
                    onChange={(e) => setNewGoals(e.target.value)}
                    placeholder="e.g. Solve 5 PYQs, Finish Normalization notes"
                    className="mt-1 h-10 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none transition focus:border-line-strong focus:bg-surface"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={!newRoomName.trim() || !newSubject.trim()}
                className="w-full h-10 bg-ink text-surface rounded text-xs font-bold hover:bg-ink/85 transition mt-2 pt-1"
              >
                Create and Join Room
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------
// ADD RESOURCE (INGESTION) VIEW
// -----------------------------------------------------------------
function AddResourceView({ onUpload }: { onUpload: () => void }) {
  const [activeTab, setActiveTab] = useState<"file" | "link">("file");
  const [pastedLink, setPastedLink] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkSubject, setLinkSubject] = useState("");
  const [insights, setInsights] = useState<{
    subject: string;
    topic: string;
    type: string;
    action: string;
  } | null>(null);

  function handlePasteLinkSubmit(e: FormEvent) {
    e.preventDefault();
    if (!pastedLink.trim() || !linkTitle.trim()) return;
    setInsights({
      subject: linkSubject || "Computer Networks",
      topic: "TCP Congestion Control & Flow Systems",
      type: pastedLink.includes("youtube.com") || pastedLink.includes("youtu.be") ? "YouTube Lecture" : "Web Resource Link",
      action: "Add to Day 3 study roadmap",
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-ink">Add Resource</h2>
        <p className="text-sm text-ink-soft">
          Ingest new study materials. Upload your files or paste educational links to parse insights and feed your AI study roadmap.
        </p>
      </div>

      <div className="rounded-xl border border-line bg-surface p-5 shadow-sm space-y-5">
        <div className="flex gap-1 rounded-lg border border-line bg-paper p-1">
          <button
            onClick={() => {
              setActiveTab("file");
              setInsights(null);
            }}
            className={cx(
              "flex-1 py-1.5 rounded text-xs font-bold transition",
              activeTab === "file" ? "bg-ink text-surface" : "text-ink-soft hover:text-ink",
            )}
          >
            Upload File
          </button>
          <button
            onClick={() => {
              setActiveTab("link");
              setInsights(null);
            }}
            className={cx(
              "flex-1 py-1.5 rounded text-xs font-bold transition",
              activeTab === "link" ? "bg-ink text-surface" : "text-ink-soft hover:text-ink",
            )}
          >
            Paste Link
          </button>
        </div>

        {activeTab === "file" && (
          <div className="text-center py-8 border border-dashed border-line rounded-lg bg-paper flex flex-col items-center justify-center space-y-3">
            <span className="text-3xl">📁</span>
            <p className="text-xs text-ink-soft font-semibold">
              PDF, Slides, Docx, or PYQ papers
            </p>
            <button
              onClick={onUpload}
              className="inline-flex h-8 items-center rounded bg-ink px-4 text-xs font-bold text-surface hover:bg-ink/85 transition"
            >
              Choose document file
            </button>
          </div>
        )}

        {activeTab === "link" && (
          <form onSubmit={handlePasteLinkSubmit} className="space-y-4">
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs font-bold text-ink-soft">Pasted URL Link</span>
                <div className="mt-1 flex h-10 items-center gap-2 rounded-md border border-line bg-paper px-3 transition focus-within:border-line-strong focus-within:bg-surface">
                  <Link2 className="h-4 w-4 text-ink-faint" />
                  <input
                    type="url"
                    required
                    value={pastedLink}
                    onChange={(e) => setPastedLink(e.target.value)}
                    placeholder="https://youtube.com/watch?v=... or Drive URL"
                    className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-faint"
                  />
                </div>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-bold text-ink-soft">Resource Title</span>
                  <input
                    type="text"
                    required
                    value={linkTitle}
                    onChange={(e) => setLinkTitle(e.target.value)}
                    placeholder="e.g. TCP Congestion Control Visualized"
                    className="mt-1 h-10 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none transition focus:border-line-strong focus:bg-surface"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold text-ink-soft">Subject Tag</span>
                  <input
                    type="text"
                    value={linkSubject}
                    onChange={(e) => setLinkSubject(e.target.value)}
                    placeholder="e.g. Computer Networks"
                    className="mt-1 h-10 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none transition focus:border-line-strong focus:bg-surface"
                  />
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={!pastedLink.trim() || !linkTitle.trim()}
              className="w-full h-10 bg-ink text-surface rounded text-xs font-bold hover:bg-ink/85 transition pt-1"
            >
              Analyze and Ingest Link
            </button>
          </form>
        )}
      </div>

      {/* Analysis Insights Card */}
      {insights && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 space-y-3 shadow-sm reveal-up">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider leading-none">
              Resource captured. Insights ready.
            </h4>
            <span className="inline-flex items-center rounded bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800 uppercase">
              Parsed ok
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 pt-2 text-xs font-medium text-ink-soft">
            <div>
              <span className="text-[10px] text-ink-faint block">Detected Subject</span>
              <span className="text-ink font-semibold">{insights.subject}</span>
            </div>
            <div>
              <span className="text-[10px] text-ink-faint block">Topic Area</span>
              <span className="text-ink font-semibold">{insights.topic}</span>
            </div>
            <div>
              <span className="text-[10px] text-ink-faint block">Type</span>
              <span className="text-ink font-semibold">{insights.type}</span>
            </div>
            <div>
              <span className="text-[10px] text-ink-faint block">Suggested Action</span>
              <span className="text-accent font-semibold">{insights.action}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-emerald-100 pt-3 min-[380px]:flex-row">
            <button
              onClick={() => {
                alert("Simulated: Added to day 3 roadmap!");
                setInsights(null);
                setPastedLink("");
                setLinkTitle("");
                setLinkSubject("");
              }}
              className="h-8 rounded bg-ink px-4 text-xs font-bold text-surface transition hover:bg-ink/85"
            >
              Add to roadmap
            </button>
            <button
              onClick={() => {
                alert("Simulated: Generating summary notes...");
                setInsights(null);
                setPastedLink("");
                setLinkTitle("");
                setLinkSubject("");
              }}
              className="h-8 rounded border border-line bg-paper px-3 text-xs font-semibold text-ink-soft transition hover:bg-surface hover:text-ink"
            >
              Generate summary
            </button>
          </div>
        </div>
      )}
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
    <div className="flex min-w-0 flex-col gap-2 pb-4 sm:flex-row sm:flex-wrap sm:items-center">
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
      <div className="flex items-center justify-between gap-3 sm:ml-auto sm:justify-start">
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
    <label className="relative min-w-0">
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

function StatusBadge({ status }: { status: ApiNote["status"] }) {
  if (status === "PUBLISHED") return null;
  return (
    <span
      className={cx(
        "shrink-0 rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase",
        status === "PENDING" && "border-line-strong bg-paper text-ink-soft",
        status === "REJECTED" && "border-red-200 bg-red-50 text-red-700",
        status === "HIDDEN" && "border-amber-200 bg-amber-50 text-amber-700",
        status === "DELETED" && "border-line bg-paper text-ink-faint",
      )}
    >
      {statusLabel(status)}
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
          <StatusBadge status={note.status} />
          {note.savedByMe ? (
            <Bookmark className="h-3 w-3 shrink-0 fill-current text-ink-soft" />
          ) : null}
        </span>
        <span className="mt-0.5 block truncate text-xs text-ink-faint">
          {note.subject} · Sem {note.semester} · {note.rejectionReason ?? note.unit}
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
        <span className="flex min-w-0 flex-col items-end gap-1">
          <span className="font-mono text-xs text-ink-faint">{note.courseCode}</span>
          <StatusBadge status={note.status} />
        </span>
      </div>
      <h3 className="mt-4 line-clamp-2 text-sm font-semibold">{note.title}</h3>
      <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-faint">{note.topic || note.description}</p>
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
  authChecked,
  uploads,
  loading,
  stats,
  onOpenNote,
  onUpload,
  onSignOut,
  onSaveProfile,
}: {
  me: ApiUser | null;
  authChecked: boolean;
  uploads: ApiNote[];
  loading: boolean;
  stats: MetaResponse["stats"] | undefined;
  onOpenNote: (note: ApiNote) => void;
  onUpload: () => void;
  onSignOut: () => void;
  onSaveProfile: (input: { name: string; department: string | null; semester: string | null }) => Promise<void>;
}) {
  const [name, setName] = useState(me?.name ?? "");
  const [department, setDepartment] = useState(me?.department ?? "");
  const [semester, setSemester] = useState(me?.semester ?? "");
  const [saving, setSaving] = useState(false);
  const statItems: Array<[string, string]> = [
    ["Uploads", stats ? String(stats.uploadCount) : "—"],
    ["Saved", stats ? String(stats.savedCount) : "—"],
    ["Downloads", stats ? formatCount(stats.totalDownloads) : "—"],
    ["Avg rating", stats ? stats.ratingAverage.toFixed(1) : "—"],
  ];
  const displayName = me?.name ?? (authChecked ? "Guest preview" : "Loading...");
  const displayEmail = me?.email ?? (authChecked ? "Sign in to manage your profile" : "");
  const avatarName = me?.name ?? (authChecked ? "Guest" : "?");

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!me || saving) return;
    setSaving(true);
    await onSaveProfile({
      name: name.trim(),
      department: department.trim() || null,
      semester: semester || null,
    });
    setSaving(false);
  }

  const profileInputClasses =
    "h-9 rounded-md border border-line bg-surface px-3 text-sm outline-none transition placeholder:text-ink-faint hover:border-line-strong focus:border-ink-faint";

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-5 rounded-lg border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={avatarName} size="lg" />
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight">{displayName}</h2>
            <p className="mt-0.5 truncate text-sm text-ink-faint">{displayEmail}</p>
            <p className="mt-0.5 font-mono text-xs text-ink-faint">{me?.roleLabel ?? ""}</p>
          </div>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
          <button
            type="button"
            onClick={onUpload}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-ink px-3.5 text-sm font-medium text-surface transition hover:bg-ink/85"
          >
            <Upload className="h-4 w-4" />
            Upload
          </button>
          {me ? (
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-line px-3.5 text-sm font-medium text-ink-soft transition hover:border-line-strong hover:text-ink"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          ) : (
            <Link
              href="/sign-in"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-line px-3.5 text-sm font-medium text-ink-soft transition hover:border-line-strong hover:text-ink"
            >
              <User className="h-4 w-4" />
              Sign in
            </Link>
          )}
        </div>
      </section>

      <form onSubmit={submitProfile} className="rounded-lg border border-line bg-surface p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-1.5 text-sm font-medium sm:col-span-3">
            Name
            <input
              required
              minLength={2}
              maxLength={80}
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={!me || saving}
              className={profileInputClasses}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Department
            <input
              value={department}
              onChange={(event) => setDepartment(event.target.value.toUpperCase())}
              disabled={!me || saving}
              maxLength={40}
              placeholder="CSE"
              className={profileInputClasses}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Semester
            <select
              value={semester}
              onChange={(event) => setSemester(event.target.value)}
              disabled={!me || saving}
              className={cx(profileInputClasses, "appearance-none")}
            >
              <option value="">Not set</option>
              {["1", "2", "3", "4", "5", "6", "7", "8"].map((item) => (
                <option key={item} value={item}>
                  Semester {item}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={!me || saving}
              className="inline-flex h-9 w-full items-center justify-center rounded-md bg-ink px-3.5 text-sm font-medium text-surface transition hover:bg-ink/85 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save profile"}
            </button>
          </div>
        </div>
      </form>

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

function ReviewView({
  notes,
  reports,
  loading,
  onRefresh,
  onOpenNote,
  onModerate,
}: {
  notes: ApiNote[];
  reports: AdminReport[];
  loading: boolean;
  onRefresh: () => void;
  onOpenNote: (note: ApiNote) => void;
  onModerate: (note: ApiNote, action: ModerationAction) => void;
}) {
  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-ink-faint" />
            <h2 className="text-base font-semibold tracking-tight">Moderation</h2>
          </div>
          <p className="mt-1 text-sm text-ink-faint">
            {notes.length} pending upload{notes.length === 1 ? "" : "s"} and {reports.length} open report
            {reports.length === 1 ? "" : "s"}.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-line px-3.5 text-sm font-medium text-ink-soft transition hover:border-line-strong hover:text-ink disabled:opacity-60"
        >
          <RefreshCw className={cx("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </button>
      </section>

      <section>
        <div className="pb-3">
          <SectionLabel>Pending uploads</SectionLabel>
        </div>
        {loading ? (
          <LoadingRows count={4} />
        ) : notes.length ? (
          <div className="space-y-2">
            {notes.map((note) => (
              <div key={note.id} className="grid gap-2 rounded-lg border border-line bg-surface p-2 sm:grid-cols-[1fr_auto] sm:items-center">
                <NoteRow note={note} onOpen={() => onOpenNote(note)} />
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <button
                    type="button"
                    onClick={() => onModerate(note, "approve")}
                    className="inline-flex h-9 items-center justify-center rounded-md bg-ink px-3 text-sm font-medium text-surface transition hover:bg-ink/85"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => onModerate(note, "reject")}
                    className="inline-flex h-9 items-center justify-center rounded-md border border-line px-3 text-sm font-medium text-ink-soft transition hover:border-line-strong hover:text-ink"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-line-strong px-5 py-14 text-center">
            <p className="text-sm font-medium">No pending uploads</p>
            <p className="mt-1 text-sm text-ink-faint">New student submissions will appear here before publication.</p>
          </div>
        )}
      </section>

      <section>
        <div className="pb-3">
          <SectionLabel>Reports</SectionLabel>
        </div>
        {loading ? (
          <LoadingRows count={3} />
        ) : reports.length ? (
          <div className="space-y-2">
            {reports.map((report) => (
              <div key={report.id} className="rounded-lg border border-line bg-surface p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <button
                    type="button"
                    onClick={() => onOpenNote(report.note)}
                    className="min-w-0 text-left"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Flag className="h-4 w-4 shrink-0 text-ink-faint" />
                      <span className="truncate">{report.note.title}</span>
                    </span>
                    <span className="mt-1 block text-xs text-ink-faint">
                      {report.reason} · {report.reporter?.email ?? "Unknown reporter"} · {formatDate(report.createdAt)}
                    </span>
                    {report.details ? (
                      <span className="mt-2 block text-sm leading-6 text-ink-soft">{report.details}</span>
                    ) : null}
                  </button>
                  <button
                    type="button"
                    onClick={() => onModerate(report.note, "hide")}
                    className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-line px-3 text-sm font-medium text-ink-soft transition hover:border-line-strong hover:text-ink"
                  >
                    Hide note
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-line-strong px-5 py-14 text-center">
            <p className="text-sm font-medium">No open reports</p>
            <p className="mt-1 text-sm text-ink-faint">Reports from students will collect here for review.</p>
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
  onReport,
}: {
  note: ApiNote;
  onClose: () => void;
  onToggleSaved: () => void;
  onRate: (value: number) => void;
  onDownload: () => void;
  onReport: () => void;
}) {
  const [hoverRating, setHoverRating] = useState(0);
  const isPublished = note.status === "PUBLISHED";

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

        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-5 sm:py-6">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight">{note.title}</h2>
            <StatusBadge status={note.status} />
          </div>
          <p className="mt-3 text-sm leading-6 text-ink-soft">{note.description}</p>
          {note.rejectionReason ? (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {note.rejectionReason}
            </p>
          ) : null}

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

          <NotePreview note={note} />

          <div className="mt-6 flex min-w-0 items-center gap-3 rounded-lg border border-line bg-paper p-3.5">
            <Avatar name={note.uploader.name} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{note.uploader.name}</p>
              <p className="truncate text-xs text-ink-faint">
                {note.uploader.roleLabel} · {formatDate(note.createdAt)}
              </p>
            </div>
          </div>

          {isPublished ? (
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
          ) : null}

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

        {isPublished ? (
          <div className="grid grid-cols-3 gap-1.5 border-t border-line p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:gap-2 sm:p-4">
            <button
              type="button"
              onClick={onToggleSaved}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border border-line text-xs sm:text-sm font-medium text-ink-soft transition hover:border-line-strong hover:text-ink px-1 sm:px-2"
            >
              <Bookmark className={cx("h-4 w-4", note.savedByMe && "fill-current")} />
              <span className="truncate">{note.savedByMe ? "Saved" : "Save"}</span>
            </button>
            <button
              type="button"
              onClick={onReport}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border border-line text-xs sm:text-sm font-medium text-ink-soft transition hover:border-line-strong hover:text-ink px-1 sm:px-2"
            >
              <Flag className="h-4 w-4" />
              <span className="truncate">Report</span>
            </button>
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-ink text-xs sm:text-sm font-medium text-surface transition hover:bg-ink/85 px-1 sm:px-2"
            >
              <Download className="h-4 w-4" />
              <span className="truncate">Download</span>
            </button>
          </div>
        ) : (
          <div className="border-t border-line p-4 text-sm text-ink-faint">
            This resource is {statusLabel(note.status).toLowerCase()} and is not available in the public library.
          </div>
        )}
      </aside>
    </div>
  );
}

function NotePreview({ note }: { note: ApiNote }) {
  const previewUrl = `/api/notes/${note.id}/file?disposition=inline`;

  if (!note.hasFile) {
    return (
      <div className="mt-6 rounded-lg border border-dashed border-line-strong bg-paper px-4 py-8 text-center">
        <FileText className="mx-auto h-5 w-5 text-ink-faint" />
        <p className="mt-3 text-sm font-medium">No file preview</p>
        <p className="mt-1 text-sm text-ink-faint">This resource does not have an uploaded file attached.</p>
      </div>
    );
  }

  if (note.fileType !== "PDF") {
    return (
      <div className="mt-6 rounded-lg border border-line bg-paper p-4">
        <div className="flex items-center gap-3">
          <FileBadge type={note.fileType} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Preview unavailable</p>
            <p className="mt-0.5 text-xs text-ink-faint">
              {note.fileType} files can be opened or downloaded from the file actions.
            </p>
          </div>
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 text-xs font-medium text-ink-soft transition hover:border-line-strong hover:text-ink"
          >
            Open
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <section className="mt-6 overflow-hidden rounded-lg border border-line bg-paper">
      <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
        <SectionLabel>Preview</SectionLabel>
        <a
          href={previewUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-ink-soft transition hover:text-ink"
        >
          Open
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>
      <iframe
        title={`${note.title} preview`}
        src={previewUrl}
        className="h-80 w-full bg-surface"
      />
    </section>
  );
}

function UploadDialog({
  onSubmit,
  onClose,
  defaultSemester = "1",
}: {
  onSubmit: (draft: UploadDraft) => Promise<boolean>;
  onClose: () => void;
  defaultSemester?: string;
}) {
  const [draft, setDraft] = useState<UploadDraft>(() => ({
    ...emptyDraft,
    semester: defaultSemester,
  }));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape" || submitting) return;
      event.preventDefault();
      onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, submitting]);

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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/25 p-3 sm:items-center sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="max-h-[calc(100dvh-1.5rem)] w-full max-w-xl overflow-y-auto rounded-lg border border-line bg-surface shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Upload resource</h2>
            <p className="mt-0.5 text-sm text-ink-faint">PDF, DOCX, PPTX, or ZIP up to 25 MB. Submissions go to review.</p>
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

        <div className="grid gap-2 border-t border-line p-4 sm:flex sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center justify-center rounded-md border border-line px-3.5 text-sm font-medium text-ink-soft transition hover:border-line-strong hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-9 items-center justify-center rounded-md bg-ink px-3.5 text-sm font-medium text-surface transition hover:bg-ink/85 disabled:opacity-60"
          >
            {submitting ? "Uploading..." : "Submit for review"}
          </button>
        </div>
      </form>
    </div>
  );
}
