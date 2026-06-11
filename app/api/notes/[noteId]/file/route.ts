import { NextResponse, type NextRequest } from "next/server";
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
  _request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> },
) {
  try {
    const { noteId } = await params;
    const note = await db.note.findFirst({
      where: { id: noteId, status: "PUBLISHED" },
    });
    if (!note || !note.storageKey) {
      return jsonError("NOT_FOUND", "File not found.", 404);
    }

    const remoteUrl = await createDownloadUrl(note.storageKey);
    if (remoteUrl) {
      return NextResponse.redirect(remoteUrl);
    }

    const data = await readStoredFile(note.storageKey);
    const fileName = `${note.title.replace(/[^a-zA-Z0-9 ._-]/g, "")}.${note.fileType.toLowerCase()}`;

    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": CONTENT_TYPES[note.fileType] ?? "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(data.byteLength),
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
