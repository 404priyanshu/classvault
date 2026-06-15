import { NextResponse, type NextRequest } from "next/server";
import { requireCurrentUser } from "@/lib/server/auth";
import { handleRouteError, jsonError } from "@/lib/server/http";
import { deleteStudyTask, updateStudyTask } from "@/lib/server/study-tasks";
import { updateStudyTaskSchema } from "@/lib/server/validation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const user = await requireCurrentUser();
    const { taskId } = await params;
    const input = updateStudyTaskSchema.parse(await request.json());
    const task = await updateStudyTask(user.id, taskId, input);
    if (!task) {
      return jsonError("NOT_FOUND", "Task not found.", 404);
    }
    return NextResponse.json(task);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const user = await requireCurrentUser();
    const { taskId } = await params;
    const ok = await deleteStudyTask(user.id, taskId);
    if (!ok) {
      return jsonError("NOT_FOUND", "Task not found.", 404);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
