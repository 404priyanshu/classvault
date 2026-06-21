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

// Any non-empty query now goes through the unified ranked search (tsvector FTS
// blended with pg_trgm similarity), so single words and typos match too. The
// gate still toggles the rank-ordered path in listNotes (which disables the id
// cursor, since a rank order cannot resume from a keyset).
export function isFullTextQuery(q: string | undefined): boolean {
  return Boolean(q && q.trim().length > 0);
}

// Relevance weights + thresholds for the unified ranked search. Single source of
// truth: notes.ts interpolates these constants into the raw SQL, and blendScore
// mirrors the same formula so the ranking is unit-testable without a database.
export const SEARCH_WEIGHTS = { fts: 1.0, title: 0.6, subject: 0.3, code: 0.5 } as const;
export const SIMILARITY_THRESHOLD = 0.3;
export const WORD_SIMILARITY_THRESHOLD = 0.4;

// Blend the tsvector rank with trigram similarities into one comparable score.
// Higher is more relevant. Mirrors the ORDER BY expression in searchRankedIds.
export function blendScore(parts: {
  tsRank: number;
  titleSim: number;
  subjectSim: number;
  codeSim: number;
}): number {
  return (
    parts.tsRank * SEARCH_WEIGHTS.fts +
    parts.titleSim * SEARCH_WEIGHTS.title +
    parts.subjectSim * SEARCH_WEIGHTS.subject +
    parts.codeSim * SEARCH_WEIGHTS.code
  );
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
