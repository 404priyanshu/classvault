import { NextResponse, type NextRequest } from "next/server";
import { requireCurrentUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { handleRouteError, jsonError } from "@/lib/server/http";
import { buildStorageKey, saveFile } from "@/lib/server/storage";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/server/validation";

// Local stand-in for the presign + direct-to-storage flow: the browser sends
// the file as multipart form data, the server stores it and returns the
// storageKey to attach via POST /api/notes.
export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return jsonError("INVALID_INPUT", "Missing file.", 400);
    }

    const fileType = ALLOWED_MIME_TYPES[file.type];
    if (!fileType) {
      return jsonError("INVALID_INPUT", "Unsupported file type. Allowed: PDF, DOCX, PPTX, ZIP.", 400);
    }
    if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
      return jsonError("INVALID_INPUT", "File must be between 1 byte and 25 MB.", 400);
    }

    const storageKey = buildStorageKey(user.id, file.name);
    await saveFile(storageKey, Buffer.from(await file.arrayBuffer()));

    await db.uploadedFile.create({
      data: {
        storageKey,
        userId: user.id,
        mimeType: file.type,
        sizeBytes: file.size,
        originalName: file.name,
      },
    });

    return NextResponse.json({ storageKey, fileType, fileSizeBytes: file.size }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
