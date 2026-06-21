import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { handleRouteError } from "@/lib/server/http";
import { getGlobalMeta } from "@/lib/server/meta";
import { assertRateLimit, requestKey } from "@/lib/server/rate-limit";

export async function GET(request: NextRequest) {
  try {
    await assertRateLimit({
      key: requestKey(request, "meta"),
      limit: 120,
      windowMs: 60 * 1000,
    });
    const user = await getCurrentUser();

    // Global aggregates come from the cross-instance cache; the per-user counts
    // are cheap indexed lookups and stay live (never cached).
    const [global, savedCount, uploadCount] = await Promise.all([
      getGlobalMeta(),
      user ? db.savedNote.count({ where: { userId: user.id } }) : 0,
      user ? db.note.count({ where: { ownerId: user.id, status: "PUBLISHED" } }) : 0,
    ]);

    return NextResponse.json({
      subjects: global.subjects,
      semesters: global.semesters,
      stats: {
        totalNotes: global.totalNotes,
        savedCount,
        uploadCount,
        totalDownloads: global.totalDownloads,
        ratingAverage: global.ratingAverage,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
