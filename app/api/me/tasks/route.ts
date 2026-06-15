import { NextResponse, type NextRequest } from "next/server";
import { requireCurrentUser } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { assertRateLimit, requestKey } from "@/lib/server/rate-limit";
import { createStudyTask, listStudyTasks } from "@/lib/server/study-tasks";
import { createStudyTaskSchema } from "@/lib/server/validation";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    return NextResponse.json({ items: await listStudyTasks(user.id) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    await assertRateLimit({
      key: requestKey(request, "study-task-create", user.id),
      limit: 100,
      windowMs: 60 * 60 * 1000,
    });
    const input = createStudyTaskSchema.parse(await request.json());
    const task = await createStudyTask(user.id, input.title);
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
