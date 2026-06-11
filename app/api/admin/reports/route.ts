import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { listReports } from "@/lib/server/moderation";

export async function GET() {
  try {
    await requireRole("ADMIN", "MODERATOR");
    return NextResponse.json({ items: await listReports() });
  } catch (error) {
    return handleRouteError(error);
  }
}
