import { ArrowUpRight, Bookmark, Download, FileText, Star } from "lucide-react";
import type { ApiNote } from "@/lib/api-types";
import { formatCount } from "@/lib/format";
import {
  ErrorState,
  FileBadge,
  LoadingRows,
  StatusBadge,
  type LayoutMode,
} from "@/components/notes/note-primitives";

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
