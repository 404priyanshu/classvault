import { db } from "@/lib/server/db";
import { getCached } from "@/lib/server/cache";

const META_CACHE_TTL_MS = 5 * 60 * 1000;

export type GlobalMeta = {
  subjects: string[];
  semesters: string[];
  totalNotes: number;
  totalDownloads: number;
  ratingAverage: number;
};

// The global, non-user-scoped portion of /api/meta: distinct subjects/semesters
// plus published totals. Cached cross-instance; invalidated on moderation.
export async function getGlobalMeta(): Promise<GlobalMeta> {
  return getCached("meta:global", META_CACHE_TTL_MS, async () => {
    const [subjectRows, semesterRows, totalNotes, downloadSum, ratingAvg] = await Promise.all([
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
      db.note.aggregate({ where: { status: "PUBLISHED" }, _sum: { downloadCount: true } }),
      db.note.aggregate({
        where: { status: "PUBLISHED", ratingCount: { gt: 0 } },
        _avg: { ratingAverage: true },
      }),
    ]);

    return {
      subjects: subjectRows.map((row) => row.subject),
      semesters: semesterRows
        .map((row) => row.semester)
        .sort((a, b) => Number(a) - Number(b)),
      totalNotes,
      totalDownloads: downloadSum._sum.downloadCount ?? 0,
      ratingAverage: Math.round((ratingAvg._avg.ratingAverage ?? 0) * 10) / 10,
    };
  });
}
