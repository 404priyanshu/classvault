"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowUpRight,
  Bookmark,
  Check,
  ChevronDown,
  Clock,
  CornerDownRight,
  Download,
  EyeOff,
  FileText,
  Flag,
  FolderPlus,
  Grid2X2,
  List,
  Maximize2,
  MessageSquare,
  Search,
  Send,
  Star,
  Trash2,
  TrendingUp,
  X,
  type LucideIcon,
} from "lucide-react";
import type {
  ApiCollectionSummary,
  ApiComment,
  ApiNote,
  CollectionsResponse,
  CommentsResponse,
} from "@/lib/api-types";
import { formatBytes, formatCount, formatDate, initialsOf } from "@/lib/format";
import { cx } from "@/lib/cx";

export type LayoutMode = "list" | "grid";
export type NoteSort = "recent" | "trending";

function statusLabel(status: ApiNote["status"]) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "lg" }) {
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

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="min-w-0 truncate font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint">
      {children}
    </p>
  );
}

export function LoadingRows({ count = 4 }: { count?: number }) {
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

export function FilterBar({
  query,
  onQueryChange,
  semester,
  semesters,
  onSemesterChange,
  subject,
  subjects,
  onSubjectChange,
  sort = "recent",
  onSortChange,
  showSort = false,
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
  sort?: NoteSort;
  onSortChange?: (value: NoteSort) => void;
  showSort?: boolean;
  layoutMode: LayoutMode;
  onLayoutModeChange: (value: LayoutMode) => void;
  onReset: () => void;
  count: number;
}) {
  const filtersActive = query !== "" || semester !== "All" || subject !== "All" || (showSort && sort !== "recent");

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
      {showSort && onSortChange ? (
        <div className="inline-flex h-9 rounded-md border border-line bg-surface p-0.5">
          {(
            [
              ["recent", "Recent", Clock],
              ["trending", "Trending", TrendingUp],
            ] as Array<[NoteSort, string, LucideIcon]>
          ).map(([mode, label, Icon]) => (
            <button
              key={mode}
              type="button"
              onClick={() => onSortChange(mode)}
              aria-pressed={sort === mode}
              className={cx(
                "inline-flex items-center gap-1.5 rounded px-2.5 text-xs font-semibold text-ink-faint transition",
                sort === mode && "bg-paper text-ink shadow-[inset_0_0_0_1px_var(--line)]",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      ) : null}
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

export function NoteCollection({
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
      <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {notes.map((note) => (
          <NoteCard key={note.id} note={note} onOpen={() => onOpenNote(note)} />
        ))}
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-2">
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

export function NoteRow({ note, onOpen }: { note: ApiNote; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex min-w-0 w-full items-center gap-2.5 rounded-lg border border-line bg-surface p-3 text-left transition hover:border-line-strong sm:gap-3"
    >
      <FileBadge type={note.fileType} />
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="min-w-0 truncate text-sm font-medium">{note.title}</span>
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
      <span className="flex shrink-0 items-center gap-1 font-mono text-[11px] text-ink-faint sm:text-xs">
        <Star className="h-3 w-3" />
        {note.ratingCount ? note.ratingAverage.toFixed(1) : "—"}
      </span>
      <ArrowUpRight className="hidden h-4 w-4 shrink-0 text-ink-faint opacity-0 transition group-hover:opacity-100 sm:block" />
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

export function DetailDrawer({
  note,
  onClose,
  onToggleSaved,
  onRate,
  onDownload,
  onReport,
  currentUser,
  onAuthRequired,
}: {
  note: ApiNote;
  onClose: () => void;
  onToggleSaved: () => void;
  onRate: (value: number) => void;
  onDownload: () => void;
  onReport: () => void;
  currentUser: { id: string; role: string } | null;
  onAuthRequired: () => void;
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

          {isPublished ? (
            <AddToCollection
              noteId={note.id}
              currentUser={currentUser}
              onAuthRequired={onAuthRequired}
            />
          ) : null}

          {isPublished ? (
            <NoteComments
              key={note.id}
              noteId={note.id}
              currentUser={currentUser}
              onAuthRequired={onAuthRequired}
            />
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

async function readCommentError(res: Response) {
  try {
    const body = (await res.json()) as { error?: { message?: string } };
    return body.error?.message ?? "Something went wrong.";
  } catch {
    return "Something went wrong.";
  }
}

function CommentItem({
  comment,
  currentUser,
  onReply,
  onDelete,
  onHide,
  isReply = false,
}: {
  comment: ApiComment;
  currentUser: { id: string; role: string } | null;
  onReply: (comment: ApiComment) => void;
  onDelete: (comment: ApiComment) => void;
  onHide: (comment: ApiComment) => void;
  isReply?: boolean;
}) {
  return (
    <div className={cx("flex gap-2.5", isReply && "ml-6")}>
      <Avatar name={comment.deleted ? "—" : comment.author.name} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-xs font-semibold text-ink">
            {comment.deleted ? "Removed" : comment.author.name}
          </span>
          {!comment.deleted ? (
            <span className="text-[10px] text-ink-faint">{comment.author.roleLabel}</span>
          ) : null}
          <span className="text-[10px] text-ink-faint">· {formatDate(comment.createdAt)}</span>
        </div>
        <p
          className={cx(
            "mt-1 whitespace-pre-wrap break-words text-sm leading-6",
            comment.deleted ? "italic text-ink-faint" : "text-ink-soft",
          )}
        >
          {comment.body}
        </p>
        {!comment.deleted ? (
          <div className="mt-1 flex items-center gap-3">
            {!isReply ? (
              <button
                type="button"
                onClick={() => onReply(comment)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-faint transition hover:text-ink"
              >
                <CornerDownRight className="h-3 w-3" /> Reply
              </button>
            ) : null}
            {comment.ownedByMe ? (
              <button
                type="button"
                onClick={() => onDelete(comment)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-faint transition hover:text-red-600"
              >
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            ) : null}
            {comment.canModerate && !comment.ownedByMe ? (
              <button
                type="button"
                onClick={() => onHide(comment)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-faint transition hover:text-amber-600"
              >
                <EyeOff className="h-3 w-3" /> Hide
              </button>
            ) : null}
          </div>
        ) : null}
        {comment.replies.length ? (
          <div className="mt-3 space-y-3">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                currentUser={currentUser}
                onReply={onReply}
                onDelete={onDelete}
                onHide={onHide}
                isReply
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AddToCollection({
  noteId,
  currentUser,
  onAuthRequired,
}: {
  noteId: string;
  currentUser: { id: string; role: string } | null;
  onAuthRequired: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ApiCollectionSummary[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [newTitle, setNewTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  async function load() {
    try {
      const response = await fetch("/api/collections");
      if (response.ok) {
        setItems(((await response.json()) as CollectionsResponse).items);
        setLoaded(true);
      }
    } catch {
      // leave empty on failure
    }
  }

  function toggleOpen() {
    if (!currentUser) {
      onAuthRequired();
      return;
    }
    const next = !open;
    setOpen(next);
    if (next && !loaded) void load();
  }

  useEffect(() => {
    if (!open) return;
    function onClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function addTo(collectionId: string) {
    setBusy(true);
    try {
      const response = await fetch(`/api/collections/${collectionId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId }),
      });
      if (response.ok) setAdded((current) => new Set(current).add(collectionId));
    } catch {
      // ignore
    } finally {
      setBusy(false);
    }
  }

  async function createAndAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newTitle.trim();
    if (title.length < 2) return;
    setBusy(true);
    try {
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, isPublic: false }),
      });
      if (response.ok) {
        const created = (await response.json()) as ApiCollectionSummary;
        setNewTitle("");
        setItems((current) => [created, ...current]);
        await addTo(created.id);
      }
    } catch {
      // ignore
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6" ref={ref}>
      <div className="relative inline-block">
        <button
          type="button"
          onClick={toggleOpen}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line px-3 text-sm font-medium text-ink-soft transition hover:border-line-strong hover:text-ink"
        >
          <FolderPlus className="h-4 w-4" /> Add to collection
        </button>
        {open ? (
          <div className="absolute left-0 z-50 mt-2 w-72 max-w-[80vw] overflow-hidden rounded-lg border border-line bg-surface shadow-lg">
            <div className="max-h-64 overflow-y-auto">
              {!loaded ? (
                <p className="px-3 py-3 text-xs text-ink-faint">Loading…</p>
              ) : items.length === 0 ? (
                <p className="px-3 py-3 text-xs text-ink-faint">No collections yet. Create one below.</p>
              ) : (
                items.map((collection) => (
                  <button
                    key={collection.id}
                    type="button"
                    disabled={busy || added.has(collection.id)}
                    onClick={() => addTo(collection.id)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition hover:bg-paper disabled:opacity-60"
                  >
                    <span className="truncate font-medium text-ink">{collection.title}</span>
                    {added.has(collection.id) ? (
                      <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    ) : null}
                  </button>
                ))
              )}
            </div>
            <form onSubmit={createAndAdd} className="flex gap-1.5 border-t border-line p-2">
              <input
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                maxLength={80}
                placeholder="New collection…"
                className="h-8 min-w-0 flex-1 rounded-md border border-line bg-paper px-2.5 text-xs outline-none focus:border-line-strong"
              />
              <button
                type="submit"
                disabled={busy || newTitle.trim().length < 2}
                className="inline-flex h-8 shrink-0 items-center rounded-md bg-ink px-2.5 text-xs font-semibold text-surface transition hover:bg-ink/85 disabled:opacity-60"
              >
                Add
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function NoteComments({
  noteId,
  currentUser,
  onAuthRequired,
}: {
  noteId: string;
  currentUser: { id: string; role: string } | null;
  onAuthRequired: () => void;
}) {
  const [items, setItems] = useState<ApiComment[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<ApiComment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/notes/${noteId}/comments`, { signal: controller.signal });
        if (res.ok && mountedRef.current) {
          const data = (await res.json()) as CommentsResponse;
          setItems(data.items);
          setCount(data.count);
        }
      } catch {
        // leave the discussion empty on failure
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [noteId]);

  async function reload() {
    try {
      const res = await fetch(`/api/notes/${noteId}/comments`);
      if (res.ok && mountedRef.current) {
        const data = (await res.json()) as CommentsResponse;
        setItems(data.items);
        setCount(data.count);
      }
    } catch {
      // keep the current list on failure
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = body.trim();
    if (!text) return;
    if (!currentUser) {
      onAuthRequired();
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/notes/${noteId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text, parentId: replyTo?.id }),
      });
      if (res.status === 401) {
        onAuthRequired();
        return;
      }
      if (!res.ok) {
        setError(await readCommentError(res));
        return;
      }
      setBody("");
      setReplyTo(null);
      await reload();
    } catch {
      setError("Could not post your comment.");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(comment: ApiComment) {
    try {
      const res = await fetch(`/api/comments/${comment.id}`, { method: "DELETE" });
      if (res.ok) await reload();
    } catch {
      // ignore; the list re-syncs on the next open
    }
  }

  async function hide(comment: ApiComment) {
    try {
      const res = await fetch(`/api/comments/${comment.id}/hide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (res.ok) await reload();
    } catch {
      // ignore
    }
  }

  return (
    <div className="mt-6">
      <SectionLabel>
        <span className="inline-flex items-center gap-1.5">
          <MessageSquare className="h-3.5 w-3.5" /> Discussion{count ? ` · ${count}` : ""}
        </span>
      </SectionLabel>

      <form onSubmit={submit} className="mt-3">
        {replyTo ? (
          <div className="mb-2 flex items-center justify-between rounded-md border border-line bg-paper px-2.5 py-1.5 text-[11px] text-ink-soft">
            <span className="truncate">Replying to {replyTo.author.name}</span>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="ml-2 shrink-0 text-ink-faint hover:text-ink"
              aria-label="Cancel reply"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={2}
          maxLength={2000}
          aria-label={replyTo ? `Reply to ${replyTo.author.name}` : "Add a comment"}
          placeholder={currentUser ? "Ask a question or share context…" : "Sign in to join the discussion"}
          className="w-full resize-y rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none transition placeholder:text-ink-faint focus:border-line-strong"
        />
        {error ? <p className="mt-1 text-[11px] text-red-600">{error}</p> : null}
        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            disabled={submitting || !body.trim()}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-ink px-3 text-xs font-semibold text-surface transition hover:bg-ink/85 disabled:opacity-60"
          >
            <Send className="h-3.5 w-3.5" />
            {replyTo ? "Reply" : "Comment"}
          </button>
        </div>
      </form>

      <div className="mt-4 space-y-4">
        {loading ? (
          <p className="text-xs text-ink-faint">Loading discussion…</p>
        ) : items.length === 0 ? (
          <p className="text-xs text-ink-faint">No comments yet. Start the discussion.</p>
        ) : (
          items.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUser={currentUser}
              onReply={setReplyTo}
              onDelete={remove}
              onHide={hide}
            />
          ))
        )}
      </div>
    </div>
  );
}

function NotePreview({ note }: { note: ApiNote }) {
  const previewUrl = `/api/notes/${note.id}/file?disposition=inline`;
  const [expanded, setExpanded] = useState(false);
  const [inlineLoadedNoteId, setInlineLoadedNoteId] = useState<string | null>(null);
  const [expandedLoadedNoteId, setExpandedLoadedNoteId] = useState<string | null>(null);
  const inlineLoaded = inlineLoadedNoteId === note.id;
  const expandedLoaded = expandedLoadedNoteId === note.id;

  useEffect(() => {
    const timer = window.setTimeout(() => setInlineLoadedNoteId(note.id), 1600);
    return () => window.clearTimeout(timer);
  }, [note.id]);

  useEffect(() => {
    if (!expanded) return;
    const timer = window.setTimeout(() => setExpandedLoadedNoteId(note.id), 1600);
    return () => window.clearTimeout(timer);
  }, [expanded, note.id]);

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
    <>
      <section className="mt-6 overflow-hidden rounded-lg border border-line bg-paper">
        <div className="flex min-w-0 items-center justify-between gap-3 border-b border-line px-3.5 py-2.5">
          <div className="min-w-0">
            <SectionLabel>Preview</SectionLabel>
            <p className="mt-1 truncate text-xs text-ink-faint">PDF · inline viewer</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setExpandedLoadedNoteId(null);
                setExpanded(true);
              }}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 text-xs font-medium text-ink-soft transition hover:border-line-strong hover:text-ink"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Expand
            </button>
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 text-xs font-medium text-ink-soft transition hover:border-line-strong hover:text-ink"
            >
              Open
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
        <div className="relative h-96 bg-surface sm:h-[28rem]">
          {!inlineLoaded ? (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-ink-faint">
              Loading preview…
            </div>
          ) : null}
          <iframe
            title={`${note.title} preview`}
            src={previewUrl}
            onLoad={() => setInlineLoadedNoteId(note.id)}
            className="h-full w-full bg-surface"
          />
        </div>
      </section>

      {expanded ? (
        <div
          className="fixed inset-0 z-[80] flex flex-col bg-surface"
          role="dialog"
          aria-modal="true"
          aria-label={`${note.title} PDF preview`}
        >
          <div className="flex min-w-0 items-center justify-between gap-3 border-b border-line px-3.5 py-3 sm:px-5">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{note.title}</p>
              <p className="truncate text-xs text-ink-faint">
                {note.courseCode} · {formatBytes(note.fileSizeBytes)}
                {note.pageCount ? ` · ${note.pageCount} pages` : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line bg-surface px-3 text-xs font-medium text-ink-soft transition hover:border-line-strong hover:text-ink"
              >
                Open
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line text-ink-faint transition hover:border-line-strong hover:text-ink"
                aria-label="Close preview"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="relative min-h-0 flex-1 bg-paper">
            {!expandedLoaded ? (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-ink-faint">
                Loading preview…
              </div>
            ) : null}
            <iframe
              title={`${note.title} full preview`}
              src={previewUrl}
              onLoad={() => setExpandedLoadedNoteId(note.id)}
              className="h-full w-full bg-surface"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
