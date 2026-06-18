import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { getAdminStats } from "@/lib/server/admin-analytics";

export async function GET(request: Request) {
  try {
    const user = await requireRole("ADMIN", "MODERATOR");
    const { searchParams } = new URL(request.url);
    const institutionId = (user as { institution?: { id: string } | null }).institution?.id ?? undefined;

    // MODERATORs are scoped to their own college only; ADMINs may query any college.
    // The raw query param is length-capped to prevent oversized DB payloads.
    let college: string | undefined;
    if (user.role === "ADMIN") {
      const raw = searchParams.get("college");
      college = raw ? raw.trim().slice(0, 120) : undefined;
    } else {
      // Force MODERATORs to their own college — ignore any supplied param.
      college = (user as { collegeName?: string | null }).collegeName ?? undefined;
    }

    return NextResponse.json(await getAdminStats(college, institutionId));
  } catch (error) {
    return handleRouteError(error);
  }
}
