import { describe, expect, it } from "vitest";
import { cacheExpiryMs, isCacheFresh } from "@/lib/server/cache-logic";

describe("isCacheFresh", () => {
  it("is fresh strictly before expiry", () => {
    expect(isCacheFresh(1_000, 999)).toBe(true);
  });

  it("is stale at or after expiry", () => {
    expect(isCacheFresh(1_000, 1_000)).toBe(false);
    expect(isCacheFresh(1_000, 1_001)).toBe(false);
  });
});

describe("cacheExpiryMs", () => {
  it("adds the ttl to now", () => {
    expect(cacheExpiryMs(1_000, 5_000)).toBe(6_000);
  });

  it("round-trips with isCacheFresh within the ttl window", () => {
    const now = 10_000;
    const expiry = cacheExpiryMs(now, 5 * 60 * 1000);
    expect(isCacheFresh(expiry, now)).toBe(true);
    expect(isCacheFresh(expiry, expiry)).toBe(false);
  });
});
