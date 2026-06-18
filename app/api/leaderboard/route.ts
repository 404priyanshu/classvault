import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { assertRateLimit, requestKey } from "@/lib/server/rate-limit";
import { getLeaderboard } from "@/lib/server/leaderboard";

export async function GET(request: NextRequest) {
  try {
    await assertRateLimit({
      key: requestKey(request, "leaderboard"),
      limit: 60,
      windowMs: 60 * 1000,
    });
    const user = await getCurrentUser();
    return NextResponse.json(await getLeaderboard(user?.id ?? null));
  } catch (error) {
    return handleRouteError(error);
  }
}
