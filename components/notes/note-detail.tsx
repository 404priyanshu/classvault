import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Bookmark,
  Download,
  FileText,
  Flag,
  Maximize2,
  Star,
  X,
} from "lucide-react";
import type { ApiNote } from "@/lib/api-types";
import { formatBytes, formatCount, formatDate } from "@/lib/format";
import { cx } from "@/lib/cx";
import {
  Avatar,
  FileBadge,
  SectionLabel,
  StatusBadge,
  statusLabel,
} from "@/components/notes/note-primitives";
import { AddToCollection } from "@/components/notes/add-to-collection";
import { NoteComments } from "@/components/notes/note-comments";

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
      <aside className="relative flex h-full w-full max-w-lg flex-col border-l border-line bg-surface">
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
