import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  applyUserBootstrap,
  createSession,
  sessionCookieOptions,
  SESSION_COOKIE,
  verifyPassword,
} from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { handleRouteError, jsonError } from "@/lib/server/http";
import { roleLabelOf } from "@/lib/server/notes";
import { assertRateLimit, requestKey } from "@/lib/server/rate-limit";

const signInSchema = z.object({
  email: z.email().trim().max(254),
  password: z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  try {
    const input = signInSchema.parse(await request.json());
    await assertRateLimit({
      key: `${requestKey(request, "auth")}:${input.email.toLowerCase()}`,
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });

    // Same error for unknown email and wrong password so the endpoint does
    // not reveal which accounts exist.
    const user = await db.user.findUnique({ where: { email: input.email } });
    if (!user?.passwordHash || !verifyPassword(input.password, user.passwordHash)) {
      return jsonError("INVALID_CREDENTIALS", "Invalid email or password.", 401);
    }

    const bootstrappedUser = await applyUserBootstrap(user);
    const { token, expiresAt } = await createSession(bootstrappedUser.id);
    const response = NextResponse.json({
      id: bootstrappedUser.id,
      name: bootstrappedUser.name,
      email: bootstrappedUser.email,
      role: bootstrappedUser.role,
      department: bootstrappedUser.department,
      semester: bootstrappedUser.semester,
      roleLabel: roleLabelOf(bootstrappedUser),
    });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
