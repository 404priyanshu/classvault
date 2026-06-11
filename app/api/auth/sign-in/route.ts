import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSession, sessionCookieOptions, SESSION_COOKIE, verifyPassword } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { handleRouteError, jsonError } from "@/lib/server/http";
import { roleLabelOf } from "@/lib/server/notes";

const signInSchema = z.object({
  email: z.email().trim().max(254),
  password: z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  try {
    const input = signInSchema.parse(await request.json());

    // Same error for unknown email and wrong password so the endpoint does
    // not reveal which accounts exist.
    const user = await db.user.findUnique({ where: { email: input.email } });
    if (!user?.passwordHash || !verifyPassword(input.password, user.passwordHash)) {
      return jsonError("INVALID_CREDENTIALS", "Invalid email or password.", 401);
    }

    const { token, expiresAt } = await createSession(user.id);
    const response = NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      roleLabel: roleLabelOf(user),
    });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
