import type { Prisma } from "@/lib/generated/prisma/client";
import type { ApiComment, CommentsResponse } from "@/lib/api-types";
import {
  assembleCommentThread,
  commentFanoutTargets,
  commentSnippet,
} from "@/lib/server/comment-logic";
import { db } from "@/lib/server/db";
import { roleLabelOf } from "@/lib/server/notes";
import { createNotification } from "@/lib/server/notifications";

type CommentWithAuthor = Prisma.CommentGetPayload<{ include: { author: true } }>;

type SerializeCtx = { userId: string | null; isStaff: boolean };

function serializeComment(comment: CommentWithAuthor, ctx: SerializeCtx): ApiComment {
  const deleted = comment.status === "DELETED";
  return {
    id: comment.id,
    body: deleted ? "[deleted]" : comment.body,
    deleted,
    author: {
      id: comment.author.id,
      name: comment.author.name,
      roleLabel: roleLabelOf(comment.author),
    },
    parentId: comment.parentId,
    ownedByMe: ctx.userId !== null && comment.authorId === ctx.userId,
    canModerate: ctx.isStaff,
    createdAt: comment.createdAt.toISOString(),
    replies: [],
  };
}

// Returns a one-level thread: top-level comments each with their replies.
// VISIBLE and DELETED rows are returned (DELETED as a "[deleted]" placeholder so
// replies keep their context); HIDDEN rows are dropped for everyone. A DELETED
// top-level comment with no replies is omitted to avoid clutter.
export async function listComments(
  noteId: string,
  ctx: SerializeCtx,
): Promise<CommentsResponse> {
  // Only published notes expose a discussion — mirror createComment's gate so
  // threads on pending/rejected/hidden/deleted notes are not readable.
  const note = await db.note.findFirst({
    where: { id: noteId, status: "PUBLISHED" },
    select: { id: true },
  });
  if (!note) return { items: [], count: 0 };

  const rows = await db.comment.findMany({
    where: { noteId, status: { in: ["VISIBLE", "DELETED"] } },
    include: { author: true },
    orderBy: { createdAt: "asc" },
  });

  return assembleCommentThread(rows.map((row) => serializeComment(row, ctx)));
}

type CreateResult =
  | { ok: true; comment: ApiComment }
  | { ok: false; code: "NOTE_NOT_FOUND" | "PARENT_NOT_FOUND" | "PARENT_NOT_TOP_LEVEL" };

export async function createComment(
  noteId: string,
  author: { id: string; name: string },
  body: string,
  parentId?: string,
): Promise<CreateResult> {
  return db.$transaction(async (tx) => {
    const note = await tx.note.findFirst({
      where: { id: noteId, status: "PUBLISHED" },
      select: { id: true, title: true, ownerId: true },
    });
    if (!note) return { ok: false, code: "NOTE_NOT_FOUND" };

    let parentAuthorId: string | null = null;
    if (parentId) {
      const parent = await tx.comment.findFirst({
        where: { id: parentId, noteId, status: "VISIBLE" },
        select: { id: true, authorId: true, parentId: true },
      });
      if (!parent) return { ok: false, code: "PARENT_NOT_FOUND" };
      // Enforce a single level of nesting: replies attach only to top-level.
      if (parent.parentId !== null) return { ok: false, code: "PARENT_NOT_TOP_LEVEL" };
      parentAuthorId = parent.authorId;
    }

    const created = await tx.comment.create({
      data: { noteId, authorId: author.id, parentId: parentId ?? null, body },
      include: { author: true },
    });

    // Fan-out: notify the parent comment's author (reply) and the note owner
    // (new activity), de-duplicated and never to the commenter themselves.
    const payload = {
      noteId: note.id,
      noteTitle: note.title,
      commentId: created.id,
      byName: author.name,
      snippet: commentSnippet(body),
    };
    const targets = commentFanoutTargets({
      authorId: author.id,
      noteOwnerId: note.ownerId,
      parentAuthorId,
    });
    await Promise.all(
      targets.map((target) =>
        createNotification(tx, { userId: target.userId, type: target.type, payload }),
      ),
    );

    return { ok: true, comment: serializeComment(created, { userId: author.id, isStaff: false }) };
  });
}

type MutateResult = { ok: true } | { ok: false; code: "NOT_FOUND" | "FORBIDDEN" };

export async function deleteComment(
  userId: string,
  commentId: string,
  isStaff: boolean,
): Promise<MutateResult> {
  const comment = await db.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true, status: true },
  });
  if (!comment || comment.status === "DELETED") return { ok: false, code: "NOT_FOUND" };
  if (comment.authorId !== userId && !isStaff) return { ok: false, code: "FORBIDDEN" };
  await db.comment.update({ where: { id: commentId }, data: { status: "DELETED" } });
  return { ok: true };
}

export async function hideComment(
  staffId: string,
  commentId: string,
  reason?: string,
): Promise<MutateResult> {
  return db.$transaction(async (tx) => {
    const comment = await tx.comment.findUnique({
      where: { id: commentId },
      select: { noteId: true, status: true },
    });
    if (!comment || comment.status === "HIDDEN") return { ok: false, code: "NOT_FOUND" };
    await tx.comment.update({ where: { id: commentId }, data: { status: "HIDDEN" } });
    // Hiding a top-level comment hides its still-visible replies too, so they
    // are not orphaned (dropped from the thread with no parent to attach to).
    await tx.comment.updateMany({
      where: { parentId: commentId, status: "VISIBLE" },
      data: { status: "HIDDEN" },
    });
    await tx.moderationEvent.create({
      data: { noteId: comment.noteId, moderatorId: staffId, action: "HIDE_COMMENT", reason: reason || null },
    });
    return { ok: true };
  });
}
