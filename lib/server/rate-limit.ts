import { db } from "@/lib/server/db";

export class RateLimitError extends Error {
  constructor(readonly retryAfterSeconds: number) {
    super("Too many requests.");
  }
}

export function requestKey(request: Request, scope: string, userId?: string | null) {
  if (userId) return `${scope}:user:${userId}`;
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  return `${scope}:ip:${forwardedFor || realIp || "unknown"}`;
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
  const bucket = await db.rateLimit.findUnique({ where: { key } });
  if (!bucket || now.getTime() - bucket.windowStart.getTime() > windowMs) {
    await db.rateLimit.upsert({
      where: { key },
      create: { key, count: 1, windowStart: now },
      update: { count: 1, windowStart: now },
    });
    return;
  }

  if (bucket.count >= limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((windowMs - (now.getTime() - bucket.windowStart.getTime())) / 1000),
    );
    throw new RateLimitError(retryAfterSeconds);
  }

  await db.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 } },
  });
}
