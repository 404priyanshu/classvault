import { NextResponse, type NextRequest } from "next/server";
import { requireRole } from "@/lib/server/auth";
import { hideComment } from "@/lib/server/comments";
import { handleRouteError, jsonError } from "@/lib/server/http";
import { hideCommentSchema } from "@/lib/server/validation";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> },
) {
  try {
    const user = await requireRole("ADMIN", "MODERATOR");
    const { commentId } = await params;
    const body = await request.json().catch(() => ({}));
    const { reason } = hideCommentSchema.parse(body ?? {});
    const result = await hideComment(user.id, commentId, reason);
    if (!result.ok) {
      return jsonError("NOT_FOUND", "Comment not found.", 404);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
