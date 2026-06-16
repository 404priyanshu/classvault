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
    const result = await joinRoom(roomId, user.id);
    if (!result.ok) return jsonError("NOT_FOUND", "Room not found.", 404);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
