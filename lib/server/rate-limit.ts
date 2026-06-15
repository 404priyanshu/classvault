import { Prisma } from "@/lib/generated/prisma/client";
import { db } from "@/lib/server/db";

export class RateLimitError extends Error {
  constructor(readonly retryAfterSeconds: number) {
    super("Too many requests.");
  }
}

// Trusted client IP. On Vercel, `x-real-ip` is set by the edge to the actual
// client and cannot be spoofed by the caller. `x-forwarded-for` CAN be
// prepended by the client, so we never trust its leftmost entry — the real
// client is the LAST hop appended by the trusted proxy.
function clientIp(request: Request) {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const hops = request.headers
    .get("x-forwarded-for")
    ?.split(",")
    .map((hop) => hop.trim())
    .filter(Boolean);
  return hops?.length ? hops[hops.length - 1] : "unknown";
}

export function requestKey(request: Request, scope: string, userId?: string | null) {
  if (userId) return `${scope}:user:${userId}`;
  return `${scope}:ip:${clientIp(request)}`;
}

export async function assertRateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  const now = new Date();
  const cutoff = new Date(now.getTime() - windowMs);

  // Single atomic statement: starts a fresh window if the stored one has
  // expired, otherwise increments. Avoids the check-then-write race where two
  // concurrent requests could both pass the limit.
  const rows = await db.$queryRaw<Array<{ count: number; windowStart: Date }>>(Prisma.sql`
    INSERT INTO "RateLimit" ("key", "count", "windowStart", "updatedAt")
    VALUES (${key}, 1, ${now}, ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."windowStart" < ${cutoff} THEN 1 ELSE "RateLimit"."count" + 1 END,
      "windowStart" = CASE WHEN "RateLimit"."windowStart" < ${cutoff} THEN ${now} ELSE "RateLimit"."windowStart" END,
      "updatedAt" = ${now}
    RETURNING "count", "windowStart"
  `);

  const row = rows[0];
  if (row && row.count > limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((windowMs - (now.getTime() - row.windowStart.getTime())) / 1000),
    );
    throw new RateLimitError(retryAfterSeconds);
  }
}
