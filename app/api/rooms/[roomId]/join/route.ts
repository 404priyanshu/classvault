import { NextResponse, type NextRequest } from "next/server";
import { requireCurrentUser } from "@/lib/server/auth";
import { handleRouteError, jsonError } from "@/lib/server/http";
import { joinRoom } from "@/lib/server/rooms";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const user = await requireCurrentUser();
    const { roomId } = await params;
    const viewer = {
      collegeName: (user as { collegeName?: string | null }).collegeName ?? null,
      institutionId: (user as { institution?: { id: string } | null }).institution?.id ?? null,
    };
    const result = await joinRoom(roomId, user.id, viewer);
    if (!result.ok) {
      if (result.code === "FORBIDDEN") {
        return jsonError("FORBIDDEN", "You do not have access to this room.", 403);
      }
      return jsonError("NOT_FOUND", "Room not found.", 404);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
