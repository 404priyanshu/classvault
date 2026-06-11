import { NextResponse, type NextRequest } from "next/server";
import { requireCurrentUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { handleRouteError, jsonError } from "@/lib/server/http";
import { assertRateLimit, requestKey } from "@/lib/server/rate-limit";
import { buildStorageKey, saveFile, validateUploadMetadata } from "@/lib/server/storage";

// Local stand-in for the presign + direct-to-storage flow: the browser sends
// the file as multipart form data, the server stores it and returns the
// storageKey to attach via POST /api/notes.
export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    await assertRateLimit({
      key: requestKey(request, "upload", user.id),
      limit: 20,
      windowMs: 60 * 60 * 1000,
    });

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return jsonError("INVALID_INPUT", "Missing file.", 400);
    }

    const validation = validateUploadMetadata(file.type, file.size);
    if (!validation.ok) {
      return jsonError("INVALID_INPUT", validation.message, 400);
    }

    const storageKey = buildStorageKey(user.id, file.name);
    await saveFile(storageKey, Buffer.from(await file.arrayBuffer()));

    await db.uploadedFile.create({
      data: {
        storageKey,
        userId: user.id,
        provider: "LOCAL",
        mimeType: file.type,
        sizeBytes: file.size,
        originalName: file.name,
        uploadedAt: new Date(),
      },
    });

    return NextResponse.json(
      { storageKey, fileType: validation.fileType, fileSizeBytes: file.size },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
