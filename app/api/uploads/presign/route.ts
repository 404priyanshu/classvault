import { NextResponse, type NextRequest } from "next/server";
import { requireCurrentUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { handleRouteError, jsonError } from "@/lib/server/http";
import { assertRateLimit, requestKey } from "@/lib/server/rate-limit";
import { createUploadTarget, validateUploadMetadata } from "@/lib/server/storage";
import { presignUploadSchema } from "@/lib/server/validation";

export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    await assertRateLimit({
      key: requestKey(request, "upload", user.id),
      limit: 20,
      windowMs: 60 * 60 * 1000,
    });
    const input = presignUploadSchema.parse(await request.json());
    const validation = validateUploadMetadata(input.mimeType, input.sizeBytes);
    if (!validation.ok) {
      return jsonError("INVALID_INPUT", validation.message, 400);
    }

    const target = await createUploadTarget({
      userId: user.id,
      fileName: input.fileName,
      mimeType: input.mimeType,
    });

    if (target.provider === "R2") {
      await db.uploadedFile.create({
        data: {
          storageKey: target.storageKey,
          userId: user.id,
          provider: target.provider,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
          originalName: input.fileName,
          publicUrl: target.publicUrl,
          uploadedAt: new Date(),
        },
      });
    }

    return NextResponse.json(
      {
        storageKey: target.storageKey,
        uploadUrl: target.uploadUrl,
        method: target.method,
        provider: target.provider,
        expiresIn: target.expiresIn,
        fileType: validation.fileType,
        fileSizeBytes: input.sizeBytes,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
