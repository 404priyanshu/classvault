"use client";

import { useCallback, useEffect, useState } from "react";
import { Flag, RefreshCw, ShieldCheck } from "lucide-react";
import type { AdminReport, ApiNote } from "@/lib/api-types";
import { formatDate } from "@/lib/format";
import { cx } from "@/lib/cx";
import { useAppShell } from "@/components/app-shell/app-shell-context";
import { LoadingRows, NoteRow, SectionLabel } from "@/components/notes/note-ui";
import { Button, Card, EmptyState } from "@/components/ui";
import type { AdminStats } from "@/lib/server/admin-analytics";

type ModerationAction = "approve" | "reject" | "hide" | "restore";

export function ReviewView() {
  const { openNoteDetail, setToast, refreshMeta } = useAppShell();
  const onOpenNote = openNoteDetail;

  const [notes, setNotes] = useState<ApiNote[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAdminQueue = useCallback(async () => {
    setLoading(true);
    try {
      const [notesResponse, reportsResponse, statsResponse] = await Promise.all([
        fetch("/api/admin/notes?status=PENDING"),
        fetch("/api/admin/reports"),
        fetch("/api/admin/analytics"),
      ]);
      if (!notesResponse.ok || !reportsResponse.ok) {
        throw new Error("Could not load review queue.");
      }
      const notesBody = (await notesResponse.json()) as { items: ApiNote[] };
      const reportsBody = (await reportsResponse.json()) as { items: AdminReport[] };
      setNotes(notesBody.items);
      setReports(reportsBody.items);

      if (statsResponse.ok) {
        setStats((await statsResponse.json()) as AdminStats);
      }
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

  const onResolveReport = useCallback(
    async (reportId: string, status: "RESOLVED" | "DISMISSED") => {
      try {
        const response = await fetch("/api/admin/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reportId, status }),
        });
        if (!response.ok) throw new Error(`Request failed (${response.status})`);
        setToast(status === "RESOLVED" ? "Report resolved" : "Report dismissed");
        void refreshAdminQueue();
      } catch (error) {
        setToast(error instanceof Error ? error.message : "Report action failed.");
      }
    },
    [refreshAdminQueue, setToast],
  );

  return (
    <div className="space-y-8">
      <Card padded className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
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
        <Button
          variant="secondary"
          onClick={onRefresh}
          disabled={loading}
          icon={<RefreshCw className={cx("h-4 w-4", loading && "animate-spin")} />}
        >
          Refresh
        </Button>
      </Card>

      {stats && (
        <Card padded className="p-4 text-sm">
          <div className="mb-2 flex items-center gap-2">
            <SectionLabel>Analytics (B2B preview)</SectionLabel>
            <span className="text-[10px] text-ink-faint">— key for institutional plans (add ?college= filter to /api/admin/analytics for scoping)</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6 text-xs">
            <div>Pending: <span className="font-mono font-bold">{stats.pendingUploads}</span></div>
            <div>Open reports: <span className="font-mono font-bold">{stats.openReports}</span></div>
            <div>Resolved reports: <span className="font-mono font-bold">{stats.resolvedReports}</span></div>
            <div>Mod actions: <span className="font-mono font-bold">{stats.totalModerationActions}</span></div>
            <div>Approval rate: <span className="font-mono font-bold">{Math.round(stats.approvalRate * 100)}%</span></div>
            <div>7d downloads: <span className="font-mono font-bold">{stats.recentDownloads}</span></div>
            <div>Active users (30d): <span className="font-mono font-bold">{stats.activeUsers}</span></div>
          </div>
        </Card>
      )}

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
                  <Button onClick={() => onModerate(note, "approve")}>Approve</Button>
                  <Button variant="secondary" onClick={() => onModerate(note, "reject")}>
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            message={
              <>
                <span className="block text-sm font-medium text-ink">No pending uploads</span>
                <span className="mt-1 block">New student submissions will appear here before publication.</span>
              </>
            }
          />
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
                   <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
                     <Button variant="secondary" onClick={() => onModerate(report.note, "hide")}>
                       Hide note
                     </Button>
                     <Button variant="secondary" onClick={() => onResolveReport(report.id, "RESOLVED")}>
                       Resolve
                     </Button>
                     <Button variant="secondary" onClick={() => onResolveReport(report.id, "DISMISSED")}>
                       Dismiss
                     </Button>
                   </div>
                 </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            message={
              <>
                <span className="block text-sm font-medium text-ink">No open reports</span>
                <span className="mt-1 block">Reports from students will collect here for review.</span>
              </>
            }
          />
        )}
      </section>
    </div>
  );
}
