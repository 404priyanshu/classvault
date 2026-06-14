import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import type { UserRole } from "@/lib/api-types";
import {
  applyUserBootstrap,
  createSession,
  isAllowedCampusEmail,
  roleForEmail,
  sessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import {
  EMAIL_OTP_MAX_ATTEMPTS,
  EmailOtpConfigError,
  displayNameForEmail,
  emailOtpMatches,
  normalizeEmail,
} from "@/lib/server/email-otp";
import { handleRouteError, jsonError } from "@/lib/server/http";
import { assertRateLimit, requestKey } from "@/lib/server/rate-limit";
import { serializeUser } from "@/lib/server/users";

export const runtime = "nodejs";

const verifySchema = z.object({
  email: z.email().trim().max(254),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the six-digit code."),
});

function invalidCode() {
  return jsonError("INVALID_CODE", "Invalid or expired verification code.", 401);
}

export async function POST(request: NextRequest) {
  try {
    const parsed = verifySchema.parse(await request.json());
    const email = normalizeEmail(parsed.email);

    await assertRateLimit({
      key: `${requestKey(request, "email-signup-verify")}:${email}`,
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });

    if (!isAllowedCampusEmail(email)) {
      return jsonError("DOMAIN_NOT_ALLOWED", "Use your campus email to create an account.", 403);
    }

    const now = new Date();
    const verification = await db.emailVerificationCode.findFirst({
      where: { email, consumedAt: null },
      orderBy: { createdAt: "desc" },
    });
    if (!verification || verification.expiresAt <= now) {
      if (verification) {
        await db.emailVerificationCode
          .update({ where: { id: verification.id }, data: { consumedAt: now } })
          .catch(() => {});
      }
      return invalidCode();
    }

    if (verification.attempts >= EMAIL_OTP_MAX_ATTEMPTS) {
      await db.emailVerificationCode.update({
        where: { id: verification.id },
        data: { consumedAt: now },
      });
      return invalidCode();
    }

    if (!emailOtpMatches(email, parsed.code, verification.codeHash)) {
      await db.emailVerificationCode.update({
        where: { id: verification.id },
        data: {
          attempts: { increment: 1 },
          consumedAt:
            verification.attempts + 1 >= EMAIL_OTP_MAX_ATTEMPTS ? now : undefined,
        },
      });
      return invalidCode();
    }

    const user = await db.$transaction(async (tx) => {
      await tx.emailVerificationCode.update({
        where: { id: verification.id },
        data: { consumedAt: now },
      });

      const existing = await tx.user.findUnique({ where: { email } });
      if (existing) {
        const role = roleForEmail(email, existing.role as UserRole);
        return tx.user.update({
          where: { id: existing.id },
          data: { role },
        });
      }

      return tx.user.create({
        data: {
          email,
          name: displayNameForEmail(verification.name, email),
          role: roleForEmail(email),
        },
      });
    });

    const bootstrappedUser = await applyUserBootstrap(user);
    const { token, expiresAt } = await createSession(bootstrappedUser.id);
    const response = NextResponse.json(serializeUser(bootstrappedUser));
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
    return response;
  } catch (error) {
    if (error instanceof EmailOtpConfigError) {
      return jsonError("EMAIL_OTP_NOT_CONFIGURED", "Email sign-up is not configured yet.", 503);
    }
    return handleRouteError(error);
  }
}
