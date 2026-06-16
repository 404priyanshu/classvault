import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { listReports, resolveReport } from "@/lib/server/moderation";
import { reportResolutionSchema } from "@/lib/server/validation";

export async function GET() {
  try {
    await requireRole("ADMIN", "MODERATOR");
    return NextResponse.json({ items: await listReports() });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole("ADMIN", "MODERATOR");
    const input = reportResolutionSchema.parse(await request.json());
    const result = await resolveReport({ reportId: input.reportId, resolverId: user.id, status: input.status });
    if (!result.ok) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Report not found or not open." } }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
