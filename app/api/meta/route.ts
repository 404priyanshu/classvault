import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { handleRouteError } from "@/lib/server/http";
import { assertRateLimit, requestKey } from "@/lib/server/rate-limit";

export async function GET(request: NextRequest) {
  try {
    await assertRateLimit({
      key: requestKey(request, "meta"),
      limit: 120,
      windowMs: 60 * 1000,
    });
    const user = await getCurrentUser();

    const [subjectRows, semesterRows, totalNotes, savedCount, uploadCount, downloadSum, ratingAvg] =
      await Promise.all([
        db.note.findMany({
          where: { status: "PUBLISHED" },
          select: { subject: true },
          distinct: ["subject"],
          orderBy: { subject: "asc" },
        }),
        db.note.findMany({
          where: { status: "PUBLISHED" },
          select: { semester: true },
          distinct: ["semester"],
        }),
        db.note.count({ where: { status: "PUBLISHED" } }),
        user ? db.savedNote.count({ where: { userId: user.id } }) : 0,
        user ? db.note.count({ where: { ownerId: user.id, status: "PUBLISHED" } }) : 0,
        db.note.aggregate({ where: { status: "PUBLISHED" }, _sum: { downloadCount: true } }),
        db.note.aggregate({
          where: { status: "PUBLISHED", ratingCount: { gt: 0 } },
          _avg: { ratingAverage: true },
        }),
      ]);

    return NextResponse.json({
      subjects: subjectRows.map((row) => row.subject),
      semesters: semesterRows
        .map((row) => row.semester)
        .sort((a, b) => Number(a) - Number(b)),
      stats: {
        totalNotes,
        savedCount,
        uploadCount,
        totalDownloads: downloadSum._sum.downloadCount ?? 0,
        ratingAverage: Math.round((ratingAvg._avg.ratingAverage ?? 0) * 10) / 10,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
