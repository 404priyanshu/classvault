import { NextResponse, type NextRequest } from "next/server";
import { requireCurrentUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { handleRouteError, jsonError } from "@/lib/server/http";
import { assertRateLimit, requestKey } from "@/lib/server/rate-limit";
import { reportSchema } from "@/lib/server/validation";

export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    await assertRateLimit({
      key: requestKey(request, "report", user.id),
      limit: 10,
      windowMs: 60 * 60 * 1000,
    });
    const input = reportSchema.parse(await request.json());
    const note = await db.note.findFirst({ where: { id: input.noteId, status: "PUBLISHED" } });
    if (!note) {
      return jsonError("NOT_FOUND", "Note not found.", 404);
    }
    const report = await db.report.create({
      data: {
        noteId: input.noteId,
        reporterId: user.id,
        reason: input.reason,
        details: input.details ?? null,
      },
    });
    return NextResponse.json({ id: report.id, status: report.status }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
