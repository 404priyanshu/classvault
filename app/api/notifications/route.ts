import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { listNotifications } from "@/lib/server/notifications";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    return NextResponse.json(await listNotifications(user.id));
  } catch (error) {
    return handleRouteError(error);
  }
}
