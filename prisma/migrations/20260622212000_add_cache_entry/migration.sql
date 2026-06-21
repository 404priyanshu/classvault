-- CreateTable
-- DB-backed cross-instance cache (mirrors RateLimit). Rows past expiresAt are
-- treated as misses and overwritten on the next load.
CREATE TABLE "CacheEntry" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CacheEntry_pkey" PRIMARY KEY ("key")
);
