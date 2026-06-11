import { NextResponse, type NextRequest } from "next/server";
import { requireCurrentUser } from "@/lib/server/auth";
import { handleRouteError, jsonError } from "@/lib/server/http";
import { rateNote } from "@/lib/server/notes";
import { assertRateLimit, requestKey } from "@/lib/server/rate-limit";
import { ratingSchema } from "@/lib/server/validation";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> },
) {
  try {
    const { noteId } = await params;
    const user = await requireCurrentUser();
    await assertRateLimit({
      key: requestKey(request, "rating", user.id),
      limit: 120,
      windowMs: 60 * 60 * 1000,
    });
    const { value } = ratingSchema.parse(await request.json());

    const result = await rateNote(noteId, user.id, value);
    if (!result) {
      return jsonError("NOT_FOUND", "Note not found.", 404);
    }
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
