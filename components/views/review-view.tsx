"use client";

import { useCallback, useEffect, useState } from "react";
import { Flag, RefreshCw, ShieldCheck } from "lucide-react";
import type { AdminReport, ApiNote } from "@/lib/api-types";
import { formatDate } from "@/lib/format";
import { cx } from "@/lib/cx";
import { useAppShell } from "@/components/app-shell/app-shell-context";
import { LoadingRows, NoteRow, SectionLabel } from "@/components/notes/note-ui";

type ModerationAction = "approve" | "reject" | "hide" | "restore";

export function ReviewView() {
  const { openNoteDetail, setToast, refreshMeta } = useAppShell();
  const onOpenNote = openNoteDetail;

  const [notes, setNotes] = useState<ApiNote[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshAdminQueue = useCallback(async () => {
    setLoading(true);
    try {
      const [notesResponse, reportsResponse] = await Promise.all([
        fetch("/api/admin/notes?status=PENDING"),
        fetch("/api/admin/reports"),
      ]);
      if (!notesResponse.ok || !reportsResponse.ok) {
        throw new Error("Could not load review queue.");
      }
      const notesBody = (await notesResponse.json()) as { items: ApiNote[] };
      const reportsBody = (await reportsResponse.json()) as { items: AdminReport[] };
      setNotes(notesBody.items);
      setReports(reportsBody.items);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not load review queue.");
    } finally {
      setLoading(false);
    }
  }, [setToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshAdminQueue();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshAdminQueue]);

  const onRefresh = refreshAdminQueue;

  const onModerate = useCallback(
    async (note: ApiNote, action: ModerationAction) => {
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
        if (!response.ok) throw new Error(`Request failed (${response.status})`);
        setToast(action === "approve" || action === "restore" ? "Resource published" : "Resource updated");
        void refreshAdminQueue();
        void refreshMeta();
      } catch (error) {
        setToast(error instanceof Error ? error.message : "Moderation failed.");
      }
    },
    [refreshAdminQueue, refreshMeta, setToast],
  );

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
