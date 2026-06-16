import { describe, expect, it } from "vitest";
import type { ApiComment } from "@/lib/api-types";
import {
  assembleCommentThread,
  commentFanoutTargets,
  commentSnippet,
} from "@/lib/server/comment-logic";

function comment(over: Partial<ApiComment> & { id: string }): ApiComment {
  return {
    id: over.id,
    body: over.body ?? "body",
    deleted: over.deleted ?? false,
    author: over.author ?? { id: "u1", name: "User", roleLabel: "Student" },
    parentId: over.parentId ?? null,
    ownedByMe: over.ownedByMe ?? false,
    canModerate: over.canModerate ?? false,
    createdAt: over.createdAt ?? "2026-01-01T00:00:00.000Z",
    replies: [],
  };
}

describe("assembleCommentThread", () => {
  it("nests a reply under its top-level parent and counts both", () => {
    const { items, count } = assembleCommentThread([
      comment({ id: "a" }),
      comment({ id: "b", parentId: "a" }),
    ]);
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("a");
    expect(items[0].replies.map((r) => r.id)).toEqual(["b"]);
    expect(count).toBe(2);
  });

  it("keeps a deleted top-level comment that still has replies, but excludes it from the count", () => {
    const { items, count } = assembleCommentThread([
      comment({ id: "a", deleted: true }),
      comment({ id: "b", parentId: "a" }),
    ]);
    expect(items).toHaveLength(1);
    expect(items[0].deleted).toBe(true);
    expect(items[0].replies).toHaveLength(1);
    // Deleted parent not counted; the one live reply is.
    expect(count).toBe(1);
  });

  it("drops a deleted top-level comment that has no replies", () => {
    const { items, count } = assembleCommentThread([comment({ id: "a", deleted: true })]);
    expect(items).toHaveLength(0);
    expect(count).toBe(0);
  });

  it("does not count a deleted reply", () => {
    const { count } = assembleCommentThread([
      comment({ id: "a" }),
      comment({ id: "b", parentId: "a" }),
      comment({ id: "c", parentId: "a", deleted: true }),
    ]);
    // top + one live reply (deleted reply excluded)
    expect(count).toBe(2);
  });

  it("drops an orphan reply whose parent is absent", () => {
    const { items, count } = assembleCommentThread([comment({ id: "b", parentId: "missing" })]);
    expect(items).toHaveLength(0);
    expect(count).toBe(0);
  });

  it("preserves top-level order", () => {
    const { items } = assembleCommentThread([
      comment({ id: "a" }),
      comment({ id: "b" }),
      comment({ id: "c" }),
    ]);
    expect(items.map((c) => c.id)).toEqual(["a", "b", "c"]);
  });
});

describe("commentFanoutTargets", () => {
  it("notifies the note owner of a new top-level comment", () => {
    expect(
      commentFanoutTargets({ authorId: "author", noteOwnerId: "owner", parentAuthorId: null }),
    ).toEqual([{ userId: "owner", type: "COMMENT_NEW" }]);
  });

  it("never notifies the commenter on their own note", () => {
    expect(
      commentFanoutTargets({ authorId: "me", noteOwnerId: "me", parentAuthorId: null }),
    ).toEqual([]);
  });

  it("notifies both the parent author (reply) and the note owner (new) when distinct", () => {
    expect(
      commentFanoutTargets({ authorId: "author", noteOwnerId: "owner", parentAuthorId: "parent" }),
    ).toEqual([
      { userId: "parent", type: "COMMENT_REPLY" },
      { userId: "owner", type: "COMMENT_NEW" },
    ]);
  });

  it("de-duplicates when the parent author is also the note owner (reply wins)", () => {
    expect(
      commentFanoutTargets({ authorId: "author", noteOwnerId: "owner", parentAuthorId: "owner" }),
    ).toEqual([{ userId: "owner", type: "COMMENT_REPLY" }]);
  });

  it("does not notify the author when replying to their own comment", () => {
    expect(
      commentFanoutTargets({ authorId: "me", noteOwnerId: "owner", parentAuthorId: "me" }),
    ).toEqual([{ userId: "owner", type: "COMMENT_NEW" }]);
  });
});

describe("commentSnippet", () => {
  it("returns short bodies unchanged", () => {
    expect(commentSnippet("short")).toBe("short");
  });

  it("truncates long bodies to 117 chars plus an ellipsis", () => {
    const long = "x".repeat(200);
    const snippet = commentSnippet(long);
    expect(snippet.endsWith("…")).toBe(true);
    expect(snippet).toHaveLength(118);
  });
});
