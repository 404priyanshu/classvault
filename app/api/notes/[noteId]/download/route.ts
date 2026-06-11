import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { handleRouteError, jsonError } from "@/lib/server/http";
import { recordDownload } from "@/lib/server/notes";
import { assertRateLimit, requestKey } from "@/lib/server/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> },
) {
  try {
    const { noteId } = await params;
    const user = await getCurrentUser();
    await assertRateLimit({
      key: requestKey(request, "download", user?.id ?? null),
      limit: 200,
      windowMs: 60 * 60 * 1000,
    });
    const result = await recordDownload(noteId, user?.id ?? null);
    if (!result) {
      return jsonError("NOT_FOUND", "Note not found.", 404);
    }
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
