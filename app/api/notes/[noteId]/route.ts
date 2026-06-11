import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { handleRouteError, jsonError } from "@/lib/server/http";
import { getNote } from "@/lib/server/notes";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> },
) {
  try {
    const { noteId } = await params;
    const user = await getCurrentUser();
    const note = await getNote(noteId, user?.id ?? null);
    if (!note) {
      return jsonError("NOT_FOUND", "Note not found.", 404);
    }
    return NextResponse.json(note);
  } catch (error) {
    return handleRouteError(error);
  }
}
