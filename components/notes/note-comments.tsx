import { useEffect, useRef, useState, type FormEvent } from "react";
import { CornerDownRight, EyeOff, MessageSquare, Send, Trash2, X } from "lucide-react";
import type { ApiComment, CommentsResponse } from "@/lib/api-types";
import { formatDate } from "@/lib/format";
import { cx } from "@/lib/cx";
import { Avatar, SectionLabel } from "@/components/notes/note-primitives";

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
                className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-faint transition hover:text-neutral-600"
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

export function NoteComments({
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
