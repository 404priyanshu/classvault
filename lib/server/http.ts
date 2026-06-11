import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "@/lib/server/auth";

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
  console.error(error);
  return jsonError("INTERNAL", "Unexpected server error.", 500);
}
