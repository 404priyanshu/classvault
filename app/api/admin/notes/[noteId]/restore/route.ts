import { NextResponse, type NextRequest } from "next/server";
import { requireRole } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { moderateNote } from "@/lib/server/moderation";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> },
) {
  try {
    const user = await requireRole("ADMIN", "MODERATOR");
    const { noteId } = await params;
    return NextResponse.json(await moderateNote({ noteId, moderatorId: user.id, action: "RESTORE" }));
  } catch (error) {
    return handleRouteError(error);
  }
}
