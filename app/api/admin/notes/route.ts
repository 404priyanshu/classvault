import { NextResponse, type NextRequest } from "next/server";
import { requireRole } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { listAdminNotes } from "@/lib/server/moderation";
import { adminNotesQuerySchema } from "@/lib/server/validation";

export async function GET(request: NextRequest) {
  try {
    await requireRole("ADMIN", "MODERATOR");
    const query = adminNotesQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries()),
    );
    return NextResponse.json({ items: await listAdminNotes(query.status, query.limit) });
  } catch (error) {
    return handleRouteError(error);
  }
}
