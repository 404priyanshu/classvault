import { NextResponse } from "next/server";
import { destroyCurrentSession, SESSION_COOKIE } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";

export async function POST() {
  try {
    await destroyCurrentSession();
    const response = NextResponse.json({ ok: true });
    response.cookies.delete(SESSION_COOKIE);
    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
