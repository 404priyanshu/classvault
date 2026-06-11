import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { handleRouteError, jsonError } from "@/lib/server/http";
import { recordDownload } from "@/lib/server/notes";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> },
) {
  try {
    const { noteId } = await params;
    const user = await getCurrentUser();
    const result = await recordDownload(noteId, user?.id ?? null);
    if (!result) {
      return jsonError("NOT_FOUND", "Note not found.", 404);
    }
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
