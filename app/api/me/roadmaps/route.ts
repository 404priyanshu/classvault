import { NextResponse, type NextRequest } from "next/server";
import { requireCurrentUser } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { assertRateLimit, requestKey } from "@/lib/server/rate-limit";
import { createSavedRoadmap, listSavedRoadmaps } from "@/lib/server/saved-roadmaps";
import { createSavedRoadmapSchema } from "@/lib/server/validation";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    return NextResponse.json({ items: await listSavedRoadmaps(user.id) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    await assertRateLimit({
      key: requestKey(request, "saved-roadmap-create", user.id),
      limit: 60,
      windowMs: 60 * 60 * 1000,
    });
    const input = createSavedRoadmapSchema.parse(await request.json());
    const roadmap = await createSavedRoadmap(user.id, input);
    return NextResponse.json(roadmap, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
