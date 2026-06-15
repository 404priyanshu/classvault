import { Prisma } from "@/lib/generated/prisma/client";
import type { ApiLeaderboardEntry, LeaderboardResponse } from "@/lib/api-types";
import { db } from "@/lib/server/db";
import { roleLabelOf } from "@/lib/server/notes";

// Live-computed reputation. No stored column: score = published uploads * 10
// + downloads received * 1 + a flat bonus for a high average rating.
const PUBLISH_WEIGHT = 10;
const DOWNLOAD_WEIGHT = 1;
const HIGH_RATING_BONUS = 25;
const HIGH_RATING_THRESHOLD = 4.5;
const TOP_N = 20;
const CACHE_TTL_MS = 5 * 60 * 1000;

type ScoredRow = {
  id: string;
  name: string;
  role: string;
  department: string | null;
  semester: string | null;
  published: number;
  downloads: number;
  avgRating: number;
};

function scoreOf(row: ScoredRow) {
  return (
    row.published * PUBLISH_WEIGHT +
    row.downloads * DOWNLOAD_WEIGHT +
    (row.avgRating >= HIGH_RATING_THRESHOLD ? HIGH_RATING_BONUS : 0)
  );
}

function toEntry(row: ScoredRow): ApiLeaderboardEntry {
  return {
    userId: row.id,
    name: row.name,
    roleLabel: roleLabelOf(row),
    score: scoreOf(row),
    publishedCount: row.published,
    downloadsReceived: row.downloads,
    avgRating: Math.round(row.avgRating * 10) / 10,
  };
}

let cache: { at: number; rows: ScoredRow[] } | null = null;

async function loadScoredRows(): Promise<ScoredRow[]> {
  // Self-downloads are excluded so contributors cannot inflate their own score.
  const rows = await db.$queryRaw<ScoredRow[]>(Prisma.sql`
    WITH note_stats AS (
      SELECT n."ownerId" AS user_id,
             COUNT(*) FILTER (WHERE n.status = 'PUBLISHED')::int AS published,
             COALESCE(
               AVG(n."ratingAverage") FILTER (WHERE n.status = 'PUBLISHED' AND n."ratingCount" > 0),
               0
             )::float AS avg_rating
      FROM "Note" n
      GROUP BY n."ownerId"
    ),
    dl AS (
      SELECT n."ownerId" AS user_id, COUNT(*)::int AS downloads
      FROM "DownloadEvent" de
      JOIN "Note" n ON n.id = de."noteId"
      WHERE n.status = 'PUBLISHED' AND (de."userId" IS NULL OR de."userId" <> n."ownerId")
      GROUP BY n."ownerId"
    )
    SELECT u.id, u.name, u.role::text AS role, u.department, u.semester,
           COALESCE(s.published, 0)::int AS published,
           COALESCE(d.downloads, 0)::int AS downloads,
           COALESCE(s.avg_rating, 0)::float AS "avgRating"
    FROM "User" u
    JOIN note_stats s ON s.user_id = u.id
    LEFT JOIN dl d ON d.user_id = u.id
    WHERE COALESCE(s.published, 0) > 0
  `);
  return rows;
}

async function getRanked(now: number): Promise<ScoredRow[]> {
  if (cache && now - cache.at < CACHE_TTL_MS) return cache.rows;
  const rows = await loadScoredRows();
  rows.sort((a, b) => scoreOf(b) - scoreOf(a));
  cache = { at: now, rows };
  return rows;
}

export async function getLeaderboard(currentUserId: string | null): Promise<LeaderboardResponse> {
  const ranked = await getRanked(Date.now());
  const entries = ranked.slice(0, TOP_N).map(toEntry);

  let me: LeaderboardResponse["me"] = null;
  if (currentUserId) {
    const idx = ranked.findIndex((row) => row.id === currentUserId);
    if (idx >= 0) me = { ...toEntry(ranked[idx]), rank: idx + 1 };
  }

  return { entries, me };
}
