"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import type { ApiNotification, NotificationsResponse } from "@/lib/api-types";
import { cx } from "@/lib/cx";
import { useAppShell } from "@/components/app-shell/app-shell-context";

const POLL_MS = 60_000;

function describe(n: ApiNotification): { title: string; detail: string } {
  const noteTitle = typeof n.payload.noteTitle === "string" ? n.payload.noteTitle : "your note";
  switch (n.type) {
    case "NOTE_APPROVED":
      return { title: "Note approved", detail: `"${noteTitle}" is now published.` };
    case "NOTE_REJECTED": {
      const reason = typeof n.payload.reason === "string" ? n.payload.reason : null;
      return {
        title: "Note rejected",
        detail: reason ? `"${noteTitle}": ${reason}` : `"${noteTitle}" was rejected.`,
      };
    }
    case "COMMENT_NEW": {
      const by = typeof n.payload.byName === "string" ? n.payload.byName : "Someone";
      return { title: "New comment", detail: `${by} commented on "${noteTitle}".` };
    }
    case "COMMENT_REPLY": {
      const by = typeof n.payload.byName === "string" ? n.payload.byName : "Someone";
      const snippet = typeof n.payload.snippet === "string" ? n.payload.snippet : null;
      return { title: "New reply", detail: snippet ? `${by}: ${snippet}` : `${by} replied to you.` };
    }
    default:
      return { title: "Notification", detail: noteTitle };
  }
}

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationsBell() {
  const { me } = useAppShell();
  const [data, setData] = useState<NotificationsResponse>({ items: [], unreadCount: 0 });
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/notifications", { signal });
      if (res.ok) setData((await res.json()) as NotificationsResponse);
    } catch {
      // transient; next poll retries
    }
  }, []);

  useEffect(() => {
    if (!me?.id) return;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/notifications", { signal: controller.signal });
        if (res.ok) setData((await res.json()) as NotificationsResponse);
      } catch {
        // transient; the interval below retries
      }
    })();
    const timer = window.setInterval(() => void load(), POLL_MS);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [me?.id, load]);

  useEffect(() => {
    if (!open) return;
    function onClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const onToggle = useCallback(async () => {
    const next = !open;
    setOpen(next);
    if (next && data.unreadCount > 0) {
      setData((current) => ({
        ...current,
        unreadCount: 0,
        items: current.items.map((item) => ({ ...item, read: true })),
      }));
      try {
        await fetch("/api/notifications/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });
      } catch {
        // optimistic; next poll re-syncs the badge
      }
    }
  }, [open, data.unreadCount]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={onToggle}
        aria-label="Notifications"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-surface text-ink-soft transition hover:text-ink"
      >
        <Bell className="h-4 w-4" />
        {data.unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-surface">
            {data.unreadCount > 9 ? "9+" : data.unreadCount}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-lg border border-line bg-surface shadow-lg">
          <div className="border-b border-line px-3 py-2 text-xs font-bold text-ink">Notifications</div>
          <div className="max-h-96 overflow-y-auto">
            {data.items.length === 0 ? (
              <div className="px-3 py-8 text-center text-xs text-ink-faint">No notifications yet.</div>
            ) : (
              data.items.map((n) => {
                const { title, detail } = describe(n);
                return (
                  <div
                    key={n.id}
                    className={cx(
                      "flex gap-2 border-b border-line px-3 py-2.5 last:border-0",
                      n.read ? "" : "bg-paper",
                    )}
                  >
                    <span
                      className={cx(
                        "mt-1 h-1.5 w-1.5 shrink-0 rounded-full",
                        n.read ? "bg-transparent" : "bg-accent",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-ink">{title}</p>
                      <p className="truncate text-[11px] text-ink-soft">{detail}</p>
                      <p className="mt-0.5 text-[10px] text-ink-faint">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
