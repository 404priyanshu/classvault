import { describe, expect, it } from "vitest";
import {
  computeRatingAggregate,
  isFullTextQuery,
  orderByIds,
  roundToTenth,
} from "@/lib/server/note-logic";

describe("computeRatingAggregate", () => {
  it("folds a new rating into a seeded aggregate without per-user rows", () => {
    // Seed: avg 5.0 over 312 ratings, no live Rating rows yet. One new 4.
    const result = computeRatingAggregate({
      cachedAverage: 5,
      cachedCount: 312,
      liveCountBefore: 0,
      liveSumBefore: 0,
      liveCountAfter: 1,
      liveSumAfter: 4,
    });
    expect(result.ratingCount).toBe(313);
    // (5*312 seed + 4 live) / 313
    expect(roundToTenth(result.ratingAverage)).toBe(5);
    expect(result.ratingAverage).toBeCloseTo((1560 + 4) / 313, 5);
  });

  it("re-rating keeps the count stable (upsert, not insert)", () => {
    // User already had a live row (their old 3), now changes it to 5.
    const result = computeRatingAggregate({
      cachedAverage: 4,
      cachedCount: 10,
      liveCountBefore: 1,
      liveSumBefore: 3,
      liveCountAfter: 1,
      liveSumAfter: 5,
    });
    expect(result.ratingCount).toBe(10);
    // seedSum = 4*10 - 3 = 37; seedCount = 9; (37 + 5)/10
    expect(result.ratingAverage).toBeCloseTo(42 / 10, 5);
  });

  it("returns zero average when there are no ratings at all", () => {
    expect(
      computeRatingAggregate({
        cachedAverage: 0,
        cachedCount: 0,
        liveCountBefore: 0,
        liveSumBefore: 0,
        liveCountAfter: 0,
        liveSumAfter: 0,
      }),
    ).toEqual({ ratingAverage: 0, ratingCount: 0 });
  });

  it("never lets a stale cache push the seed portion negative", () => {
    const result = computeRatingAggregate({
      cachedAverage: 1,
      cachedCount: 1,
      liveCountBefore: 5,
      liveSumBefore: 25,
      liveCountAfter: 5,
      liveSumAfter: 25,
    });
    // seedCount/seedSum clamp at 0; aggregate reflects live rows only.
    expect(result.ratingCount).toBe(5);
    expect(result.ratingAverage).toBeCloseTo(5, 5);
  });
});

describe("isFullTextQuery", () => {
  it("treats two or more words as full-text", () => {
    expect(isFullTextQuery("memory paging")).toBe(true);
    expect(isFullTextQuery("  sliding   window  routing ")).toBe(true);
  });

  it("treats a single token (e.g. a course code) as substring search", () => {
    expect(isFullTextQuery("CS302")).toBe(false);
    expect(isFullTextQuery("dbms")).toBe(false);
  });

  it("is false for empty or missing queries", () => {
    expect(isFullTextQuery("")).toBe(false);
    expect(isFullTextQuery("   ")).toBe(false);
    expect(isFullTextQuery(undefined)).toBe(false);
  });
});

describe("orderByIds", () => {
  it("reorders items to match the given id order", () => {
    const items = [{ id: "a" }, { id: "b" }, { id: "c" }];
    expect(orderByIds(items, ["c", "a", "b"]).map((i) => i.id)).toEqual(["c", "a", "b"]);
  });

  it("sinks ids missing from the order to the end, stably", () => {
    const items = [{ id: "a" }, { id: "b" }, { id: "c" }];
    expect(orderByIds(items, ["c"]).map((i) => i.id)).toEqual(["c", "a", "b"]);
  });

  it("does not mutate the input array", () => {
    const items = [{ id: "a" }, { id: "b" }];
    orderByIds(items, ["b", "a"]);
    expect(items.map((i) => i.id)).toEqual(["a", "b"]);
  });
});

describe("roundToTenth", () => {
  it("rounds to one decimal place", () => {
    expect(roundToTenth(4.96)).toBe(5);
    expect(roundToTenth(4.94)).toBe(4.9);
    expect(roundToTenth(0)).toBe(0);
  });
});
