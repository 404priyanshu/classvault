import { NextResponse, type NextRequest } from "next/server";
import { requireCurrentUser } from "@/lib/server/auth";
import { deleteComment } from "@/lib/server/comments";
import { handleRouteError, jsonError } from "@/lib/server/http";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> },
) {
  try {
    const user = await requireCurrentUser();
    const { commentId } = await params;
    const isStaff = user.role === "ADMIN" || user.role === "MODERATOR";
    const result = await deleteComment(user.id, commentId, isStaff);
    if (!result.ok) {
      if (result.code === "FORBIDDEN") {
        return jsonError("FORBIDDEN", "You cannot delete this comment.", 403);
      }
      return jsonError("NOT_FOUND", "Comment not found.", 404);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
