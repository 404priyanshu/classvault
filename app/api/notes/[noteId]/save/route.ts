import { NextResponse, type NextRequest } from "next/server";
import { requireCurrentUser } from "@/lib/server/auth";
import { handleRouteError, jsonError } from "@/lib/server/http";
import { setSaved } from "@/lib/server/notes";

async function toggle(
  params: Promise<{ noteId: string }>,
  saved: boolean,
) {
  const { noteId } = await params;
  const user = await requireCurrentUser();
  const result = await setSaved(noteId, user.id, saved);
  if (!result) {
    return jsonError("NOT_FOUND", "Note not found.", 404);
  }
  return NextResponse.json(result);
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> },
) {
  try {
    return await toggle(params, true);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> },
) {
  try {
    return await toggle(params, false);
  } catch (error) {
    return handleRouteError(error);
  }
}
