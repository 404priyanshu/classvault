import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser, requireCurrentUser } from "@/lib/server/auth";
import { createComment, listComments } from "@/lib/server/comments";
import { handleRouteError, jsonError } from "@/lib/server/http";
import { assertRateLimit, requestKey } from "@/lib/server/rate-limit";
import { createCommentSchema } from "@/lib/server/validation";

function isStaffRole(role: string | undefined) {
  return role === "ADMIN" || role === "MODERATOR";
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> },
) {
  try {
    const { noteId } = await params;
    const user = await getCurrentUser();
    const result = await listComments(noteId, {
      userId: user?.id ?? null,
      isStaff: isStaffRole(user?.role),
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> },
) {
  try {
    const { noteId } = await params;
    const user = await requireCurrentUser();
    await assertRateLimit({
      key: requestKey(request, "comment-create", user.id),
      limit: 30,
      windowMs: 60 * 60 * 1000,
    });
    const input = createCommentSchema.parse(await request.json());
    const result = await createComment(
      noteId,
      { id: user.id, name: user.name },
      input.body,
      input.parentId,
    );
    if (!result.ok) {
      if (result.code === "NOTE_NOT_FOUND") {
        return jsonError("NOT_FOUND", "Note not found.", 404);
      }
      if (result.code === "PARENT_NOT_FOUND") {
        return jsonError("NOT_FOUND", "The comment you replied to is gone.", 404);
      }
      return jsonError("INVALID_INPUT", "Replies can only be one level deep.", 400);
    }
    return NextResponse.json(result.comment, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
