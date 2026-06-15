import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { handleRouteError, jsonError } from "@/lib/server/http";
import { createDownloadUrl, readStoredFile } from "@/lib/server/storage";

const CONTENT_TYPES: Record<string, string> = {
  PDF: "application/pdf",
  DOCX: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  PPTX: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ZIP: "application/zip",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> },
) {
  try {
    const { noteId } = await params;
    const user = await getCurrentUser();
    const note = await db.note.findUnique({ where: { id: noteId } });
    if (!note || !note.storageKey) {
      return jsonError("NOT_FOUND", "File not found.", 404);
    }

    const canAccess =
      note.status === "PUBLISHED" ||
      (user !== null &&
        (note.ownerId === user.id || user.role === "ADMIN" || user.role === "MODERATOR"));
    if (!canAccess) {
      return jsonError("NOT_FOUND", "File not found.", 404);
    }

    const disposition =
      request.nextUrl.searchParams.get("disposition") === "inline" ? "inline" : "attachment";
    const contentType = CONTENT_TYPES[note.fileType] ?? "application/octet-stream";
    const fileName = `${note.title.replace(/[^a-zA-Z0-9 ._-]/g, "")}.${note.fileType.toLowerCase()}`;

    const remoteUrl = await createDownloadUrl(note.storageKey, {
      fileName,
      contentType,
      disposition,
    });
    if (remoteUrl) {
      return NextResponse.redirect(remoteUrl);
    }

    const data = await readStoredFile(note.storageKey);

    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `${disposition}; filename="${fileName}"`,
        "Content-Length": String(data.byteLength),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
