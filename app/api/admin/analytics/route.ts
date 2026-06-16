import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { getAdminStats } from "@/lib/server/admin-analytics";

export async function GET(request: Request) {
  try {
    await requireRole("ADMIN", "MODERATOR");
    const { searchParams } = new URL(request.url);
    const college = searchParams.get("college") || undefined; // per-college scoping for B2B pilots (leverages existing User.collegeName)
    return NextResponse.json(await getAdminStats(college));
  } catch (error) {
    return handleRouteError(error);
  }
}
