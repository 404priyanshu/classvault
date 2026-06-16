import type { ApiComment } from "@/lib/api-types";

export function commentSnippet(body: string): string {
  return body.length > 120 ? `${body.slice(0, 117)}…` : body;
}

// Groups a flat list of serialized comments (VISIBLE + DELETED rows, each with
// an empty `replies` array) into a one-level thread. A DELETED top-level
// comment with no replies is dropped; a reply whose parent is absent is dropped.
// `count` reflects only the non-deleted comments actually rendered, so the
// "Discussion · N" header can never disagree with the visible thread.
export function assembleCommentThread(flat: ApiComment[]): {
  items: ApiComment[];
  count: number;
} {
  const repliesByParent = new Map<string, ApiComment[]>();
  const tops: ApiComment[] = [];

  for (const comment of flat) {
    if (comment.parentId === null) {
      tops.push(comment);
    } else {
      const list = repliesByParent.get(comment.parentId) ?? [];
      list.push(comment);
      repliesByParent.set(comment.parentId, list);
    }
  }

  const items: ApiComment[] = [];
  for (const top of tops) {
    top.replies = repliesByParent.get(top.id) ?? [];
    if (top.deleted && top.replies.length === 0) continue;
    items.push(top);
  }

  const count = items.reduce(
    (sum, top) => sum + (top.deleted ? 0 : 1) + top.replies.filter((reply) => !reply.deleted).length,
    0,
  );
  return { items, count };
}

export type CommentNotificationType = "COMMENT_REPLY" | "COMMENT_NEW";

export type CommentFanoutTarget = { userId: string; type: CommentNotificationType };

// Recipients of a new-comment notification: the parent comment's author gets a
// reply notice and the note owner gets a new-activity notice — de-duplicated and
// never the commenter themselves.
export function commentFanoutTargets(input: {
  authorId: string;
  noteOwnerId: string;
  parentAuthorId: string | null;
}): CommentFanoutTarget[] {
  const targets: CommentFanoutTarget[] = [];
  const seen = new Set<string>([input.authorId]);

  if (input.parentAuthorId && !seen.has(input.parentAuthorId)) {
    targets.push({ userId: input.parentAuthorId, type: "COMMENT_REPLY" });
    seen.add(input.parentAuthorId);
  }
  if (!seen.has(input.noteOwnerId)) {
    targets.push({ userId: input.noteOwnerId, type: "COMMENT_NEW" });
    seen.add(input.noteOwnerId);
  }
  return targets;
}
