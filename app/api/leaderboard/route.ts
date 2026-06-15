import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { getLeaderboard } from "@/lib/server/leaderboard";

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json(await getLeaderboard(user?.id ?? null));
  } catch (error) {
    return handleRouteError(error);
  }
}
