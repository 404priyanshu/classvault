import { NextResponse, type NextRequest } from "next/server";
import { requireCurrentUser } from "@/lib/server/auth";
import { addNoteToCollection, removeNoteFromCollection } from "@/lib/server/collections";
import { handleRouteError, jsonError } from "@/lib/server/http";
import { collectionNoteSchema } from "@/lib/server/validation";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> },
) {
  try {
    const user = await requireCurrentUser();
    const { collectionId } = await params;
    const { noteId } = collectionNoteSchema.parse(await request.json());
    const result = await addNoteToCollection(user.id, collectionId, noteId);
    if (!result.ok) {
      if (result.code === "NOTE_NOT_FOUND") {
        return jsonError("NOT_FOUND", "Note not found.", 404);
      }
      return jsonError("NOT_FOUND", "Collection not found.", 404);
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> },
) {
  try {
    const user = await requireCurrentUser();
    const { collectionId } = await params;
    const { noteId } = collectionNoteSchema.parse(await request.json());
    const result = await removeNoteFromCollection(user.id, collectionId, noteId);
    if (!result.ok) return jsonError("NOT_FOUND", "Collection not found.", 404);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
