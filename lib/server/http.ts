import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "@/lib/server/auth";
import { RateLimitError } from "@/lib/server/rate-limit";

export function jsonError(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) {
    const message = error.issues[0]
      ? `${error.issues[0].path.join(".") || "input"}: ${error.issues[0].message}`
      : "Invalid input.";
    return jsonError("INVALID_INPUT", message, 400);
  }
  if (error instanceof AuthError) {
    return jsonError("UNAUTHORIZED", error.message, 401);
  }
  if (error instanceof RateLimitError) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: error.message } },
      { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } },
    );
  }
  console.error(error);
  return jsonError("INTERNAL", "Unexpected server error.", 500);
}
