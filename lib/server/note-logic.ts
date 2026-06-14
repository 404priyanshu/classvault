// Pure helpers extracted from notes.ts so the bug-prone bits (rating
// aggregation, rank re-ordering, search-mode choice) are unit-testable without
// a database. notes.ts wires these into Prisma calls.

// Seeded notes carry aggregate ratingAverage/ratingCount without per-user
// Rating rows. Derive the immutable seed portion (cached minus the live rows
// observed before this write) and fold the post-write live totals back in.
export function computeRatingAggregate(input: {
  cachedAverage: number;
  cachedCount: number;
  liveCountBefore: number;
  liveSumBefore: number;
  liveCountAfter: number;
  liveSumAfter: number;
}): { ratingAverage: number; ratingCount: number } {
  const seedCount = Math.max(0, input.cachedCount - input.liveCountBefore);
  const seedSum = Math.max(0, input.cachedAverage * input.cachedCount - input.liveSumBefore);
  const ratingCount = seedCount + input.liveCountAfter;
  const ratingAverage = ratingCount > 0 ? (seedSum + input.liveSumAfter) / ratingCount : 0;
  return { ratingAverage, ratingCount };
}

// Multi-word queries use Postgres full-text search; single words keep the
// substring match, which suits course codes like "CS302" and partial words.
export function isFullTextQuery(q: string | undefined): boolean {
  return Boolean(q && q.trim().split(/\s+/).length >= 2);
}

// Re-apply an ordering computed outside the database (ts_rank, trending
// counts) that Prisma's findMany cannot express. Ids absent from the order
// sink to the end, preserving their relative position.
export function orderByIds<T extends { id: string }>(items: T[], orderedIds: string[]): T[] {
  const rank = new Map(orderedIds.map((id, index) => [id, index] as const));
  return [...items].sort(
    (a, b) =>
      (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER),
  );
}

export function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}
