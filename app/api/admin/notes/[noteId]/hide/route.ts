import { NextResponse, type NextRequest } from "next/server";
import { requireRole } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { moderateNote } from "@/lib/server/moderation";
import { moderationSchema } from "@/lib/server/validation";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> },
) {
  try {
    const user = await requireRole("ADMIN", "MODERATOR");
    const { noteId } = await params;
    const input = moderationSchema.parse(await request.json().catch(() => ({})));
    return NextResponse.json(
      await moderateNote({ noteId, moderatorId: user.id, action: "HIDE", reason: input.reason }),
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
