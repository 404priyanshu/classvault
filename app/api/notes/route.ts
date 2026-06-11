import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser, requireCurrentUser } from "@/lib/server/auth";
import { handleRouteError, jsonError } from "@/lib/server/http";
import { createNote, listNotes } from "@/lib/server/notes";
import { assertRateLimit, requestKey } from "@/lib/server/rate-limit";
import { db } from "@/lib/server/db";
import { ALLOWED_MIME_TYPES, createNoteSchema, notesQuerySchema } from "@/lib/server/validation";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const query = notesQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries()),
    );
    const result = await listNotes(query, user?.id ?? null);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    await assertRateLimit({
      key: requestKey(request, "note-create", user.id),
      limit: 30,
      windowMs: 60 * 60 * 1000,
    });
    const input = createNoteSchema.parse(await request.json());

    const upload = await db.uploadedFile.findUnique({ where: { storageKey: input.storageKey } });
    if (!upload || upload.userId !== user.id) {
      return jsonError("INVALID_INPUT", "Unknown storage key. Upload the file first.", 400);
    }
    const fileType = ALLOWED_MIME_TYPES[upload.mimeType];
    if (!fileType) {
      return jsonError("INVALID_INPUT", "Unsupported file type.", 400);
    }

    const note = await createNote(
      { ...input, fileType, fileSizeBytes: upload.sizeBytes },
      user.id,
    );
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
