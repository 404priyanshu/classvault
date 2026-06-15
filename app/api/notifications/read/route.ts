import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { markNotificationsRead } from "@/lib/server/notifications";

// Empty/omitted ids marks all unread as read.
const readSchema = z.object({ ids: z.array(z.string().min(1)).max(100).optional() });

export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const body = await request.json().catch(() => ({}));
    const { ids } = readSchema.parse(body ?? {});
    await markNotificationsRead(user.id, ids);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
