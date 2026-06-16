import type { ApiNotification } from "@/lib/api-types";

export type NotificationDescription = { title: string; detail: string };

// Maps a notification (type + JSON payload) to its display title and detail.
// Pure and client-safe — shared by the notification bell and covered by tests.
export function describeNotification(
  notification: Pick<ApiNotification, "type" | "payload">,
): NotificationDescription {
  const payload = notification.payload;
  const noteTitle = typeof payload.noteTitle === "string" ? payload.noteTitle : "your note";

  switch (notification.type) {
    case "NOTE_APPROVED":
      return { title: "Note approved", detail: `"${noteTitle}" is now published.` };
    case "NOTE_REJECTED": {
      const reason = typeof payload.reason === "string" ? payload.reason : null;
      return {
        title: "Note rejected",
        detail: reason ? `"${noteTitle}": ${reason}` : `"${noteTitle}" was rejected.`,
      };
    }
    case "COMMENT_NEW": {
      const by = typeof payload.byName === "string" ? payload.byName : "Someone";
      return { title: "New comment", detail: `${by} commented on "${noteTitle}".` };
    }
    case "COMMENT_REPLY": {
      const by = typeof payload.byName === "string" ? payload.byName : "Someone";
      const snippet = typeof payload.snippet === "string" ? payload.snippet : null;
      return { title: "New reply", detail: snippet ? `${by}: ${snippet}` : `${by} replied to you.` };
    }
    default:
      return { title: "Notification", detail: noteTitle };
  }
}
