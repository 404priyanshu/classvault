import { NextResponse, type NextRequest } from "next/server";
import { requireCurrentUser } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { assertRateLimit, requestKey } from "@/lib/server/rate-limit";
import { createRoom, listRooms } from "@/lib/server/rooms";
import { createRoomSchema } from "@/lib/server/validation";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    return NextResponse.json({ items: await listRooms({ id: user.id, collegeName: user.collegeName ?? null }) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    await assertRateLimit({
      key: requestKey(request, "room-create", user.id),
      limit: 20,
      windowMs: 60 * 60 * 1000,
    });
    const input = createRoomSchema.parse(await request.json());
    const room = await createRoom(user.id, input);
    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
