// Pure cache helpers, DB-free so they're unit-testable. cache.ts wires these
// into the CacheEntry table.

// A cached row is fresh while now is strictly before its expiry.
export function isCacheFresh(expiresAtMs: number, nowMs: number): boolean {
  return expiresAtMs > nowMs;
}

// Expiry timestamp for a value written at `nowMs` with the given TTL.
export function cacheExpiryMs(nowMs: number, ttlMs: number): number {
  return nowMs + ttlMs;
}
