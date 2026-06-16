import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { getAdminStats } from "@/lib/server/admin-analytics";

export async function GET(request: Request) {
  try {
    const user = await requireRole("ADMIN", "MODERATOR");
    const { searchParams } = new URL(request.url);
    const college = searchParams.get("college") || undefined; // per-college scoping for B2B pilots (leverages existing User.collegeName)
    const institutionId = (user as { institution?: { id: string } | null }).institution?.id ?? undefined;
    return NextResponse.json(await getAdminStats(college, institutionId));
  } catch (error) {
    return handleRouteError(error);
  }
}
