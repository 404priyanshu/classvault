import { Prisma } from "@/lib/generated/prisma/client";
import { db } from "@/lib/server/db";
import { cacheExpiryMs, isCacheFresh } from "@/lib/server/cache-logic";

// DB-backed cross-instance cache for hot global read paths. Mirrors the
// RateLimit upsert pattern so cached values survive across serverless instances
// (unlike a per-instance in-memory map). Only cache GLOBAL, non-user-scoped data
// here — never per-user payloads.

// Read-through cache: return the fresh cached value, else run `loader`, store it
// with the given TTL, and return it. On any cache-read failure the loader still
// runs, so caching never takes down the underlying path.
export async function getCached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const now = Date.now();
  try {
    const rows = await db.$queryRaw<Array<{ value: unknown; expiresAt: Date }>>(Prisma.sql`
      SELECT "value", "expiresAt" FROM "CacheEntry" WHERE "key" = ${key}
    `);
    const hit = rows[0];
    if (hit && isCacheFresh(hit.expiresAt.getTime(), now)) {
      return hit.value as T;
    }
  } catch {
    // cache miss on read error — fall through to the loader
  }

  const value = await loader();
  const expiresAt = new Date(cacheExpiryMs(now, ttlMs));
  try {
    await db.$executeRaw(Prisma.sql`
      INSERT INTO "CacheEntry" ("key", "value", "expiresAt", "updatedAt")
      VALUES (${key}, ${JSON.stringify(value)}::jsonb, ${expiresAt}, now())
      ON CONFLICT ("key") DO UPDATE SET
        "value" = EXCLUDED."value",
        "expiresAt" = EXCLUDED."expiresAt",
        "updatedAt" = now()
    `);
  } catch {
    // writing the cache is best-effort; the value is already computed
  }
  return value;
}

// Drop an exact key and any namespaced children (key + ":...") so callers can
// invalidate a family (e.g. "trending") in one call.
export async function invalidateCache(keyOrPrefix: string): Promise<void> {
  try {
    await db.$executeRaw(Prisma.sql`
      DELETE FROM "CacheEntry" WHERE "key" = ${keyOrPrefix} OR "key" LIKE ${keyOrPrefix + ":%"}
    `);
  } catch {
    // best-effort; a stale entry simply expires on its TTL
  }
}
