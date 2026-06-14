import { NextResponse, type NextRequest } from "next/server";
import { requireCurrentUser } from "@/lib/server/auth";
import {
  collegeOtpHtml,
  collegeOtpSubject,
  collegeOtpText,
  isAllowedCollegeEmail,
} from "@/lib/server/college-verification";
import { db } from "@/lib/server/db";
import {
  EMAIL_OTP_MAX_ATTEMPTS,
  EmailOtpConfigError,
  emailOtpExpiresAt,
  emailOtpMatches,
  generateEmailOtpCode,
  hashEmailOtp,
  normalizeEmail,
} from "@/lib/server/email-otp";
import { EmailDeliveryError, sendTransactionalEmail } from "@/lib/server/email";
import { handleRouteError, jsonError } from "@/lib/server/http";
import { assertRateLimit, requestKey } from "@/lib/server/rate-limit";
import { serializeUser } from "@/lib/server/users";
import {
  collegeVerificationStartSchema,
  collegeVerificationVerifySchema,
} from "@/lib/server/validation";

export const runtime = "nodejs";

function invalidCode() {
  return jsonError("INVALID_CODE", "Invalid or expired verification code.", 401);
}

export async function POST(request: NextRequest) {
  let createdCodeId: string | null = null;
  try {
    const user = await requireCurrentUser();
    const parsed = collegeVerificationStartSchema.parse(await request.json());
    const collegeName = parsed.collegeName;
    const collegeEmail = normalizeEmail(parsed.collegeEmail);

    await assertRateLimit({
      key: `${requestKey(request, "college-verification-start", user.id)}:${collegeEmail}`,
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });

    if (!isAllowedCollegeEmail(collegeEmail)) {
      return jsonError("DOMAIN_NOT_ALLOWED", "Use an official college email ending in .edu, .edu.in, or .ac.in.", 403);
    }

    const code = generateEmailOtpCode();
    const expiresAt = emailOtpExpiresAt();
    const codeHash = hashEmailOtp(collegeEmail, code);
    const now = new Date();

    const verification = await db.$transaction(async (tx) => {
      await tx.collegeVerificationCode.updateMany({
        where: { userId: user.id, consumedAt: null },
        data: { consumedAt: now },
      });
      await tx.collegeVerificationCode.deleteMany({
        where: { expiresAt: { lt: now } },
      });
      return tx.collegeVerificationCode.create({
        data: { userId: user.id, collegeName, email: collegeEmail, codeHash, expiresAt },
      });
    });
    createdCodeId = verification.id;

    await sendTransactionalEmail({
      to: collegeEmail,
      subject: collegeOtpSubject(),
      text: collegeOtpText(code, collegeName),
      html: collegeOtpHtml(code, collegeName),
      idempotencyKey: `college-verification-${verification.id}`,
    });

    return NextResponse.json({
      ok: true,
      expiresAt: expiresAt.toISOString(),
      message: "Verification code sent.",
    });
  } catch (error) {
    if (createdCodeId) {
      await db.collegeVerificationCode
        .update({ where: { id: createdCodeId }, data: { consumedAt: new Date() } })
        .catch(() => {});
    }
    if (error instanceof EmailOtpConfigError) {
      return jsonError("EMAIL_OTP_NOT_CONFIGURED", "College verification is not configured yet.", 503);
    }
    if (error instanceof EmailDeliveryError) {
      const message =
        error.code === "not_configured"
          ? "College verification email is not configured yet."
          : "Could not send the verification code. Try again.";
      return jsonError("EMAIL_DELIVERY_FAILED", message, error.code === "not_configured" ? 503 : 502);
    }
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const parsed = collegeVerificationVerifySchema.parse(await request.json());
    const collegeEmail = normalizeEmail(parsed.collegeEmail);

    await assertRateLimit({
      key: `${requestKey(request, "college-verification-verify", user.id)}:${collegeEmail}`,
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });

    if (!isAllowedCollegeEmail(collegeEmail)) {
      return jsonError("DOMAIN_NOT_ALLOWED", "Use an official college email ending in .edu, .edu.in, or .ac.in.", 403);
    }

    const now = new Date();
    const verification = await db.collegeVerificationCode.findFirst({
      where: { userId: user.id, email: collegeEmail, consumedAt: null },
      orderBy: { createdAt: "desc" },
    });
    if (!verification || verification.expiresAt <= now) {
      if (verification) {
        await db.collegeVerificationCode
          .update({ where: { id: verification.id }, data: { consumedAt: now } })
          .catch(() => {});
      }
      return invalidCode();
    }

    if (verification.attempts >= EMAIL_OTP_MAX_ATTEMPTS) {
      await db.collegeVerificationCode.update({
        where: { id: verification.id },
        data: { consumedAt: now },
      });
      return invalidCode();
    }

    if (!emailOtpMatches(collegeEmail, parsed.code, verification.codeHash)) {
      await db.collegeVerificationCode.update({
        where: { id: verification.id },
        data: {
          attempts: { increment: 1 },
          consumedAt: verification.attempts + 1 >= EMAIL_OTP_MAX_ATTEMPTS ? now : undefined,
        },
      });
      return invalidCode();
    }

    const updated = await db.$transaction(async (tx) => {
      await tx.collegeVerificationCode.update({
        where: { id: verification.id },
        data: { consumedAt: now },
      });
      return tx.user.update({
        where: { id: user.id },
        data: {
          collegeName: verification.collegeName,
          collegeEmail,
          collegeVerifiedAt: now,
        },
      });
    });

    return NextResponse.json(serializeUser(updated));
  } catch (error) {
    if (error instanceof EmailOtpConfigError) {
      return jsonError("EMAIL_OTP_NOT_CONFIGURED", "College verification is not configured yet.", 503);
    }
    return handleRouteError(error);
  }
}

export async function DELETE() {
  try {
    const user = await requireCurrentUser();
    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        collegeName: null,
        collegeEmail: null,
        collegeVerifiedAt: null,
      },
    });
    await db.collegeVerificationCode.updateMany({
      where: { userId: user.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    return NextResponse.json(serializeUser(updated));
  } catch (error) {
    return handleRouteError(error);
  }
}
