import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isAllowedCampusEmail } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import {
  EmailOtpConfigError,
  displayNameForEmail,
  emailOtpExpiresAt,
  emailOtpHtml,
  emailOtpSubject,
  emailOtpText,
  generateEmailOtpCode,
  hashEmailOtp,
  normalizeEmail,
} from "@/lib/server/email-otp";
import { EmailDeliveryError, sendTransactionalEmail } from "@/lib/server/email";
import { handleRouteError, jsonError } from "@/lib/server/http";
import { assertRateLimit, requestKey } from "@/lib/server/rate-limit";

export const runtime = "nodejs";

const requestSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().trim().max(254),
});

export async function POST(request: NextRequest) {
  let createdCodeId: string | null = null;
  try {
    const parsed = requestSchema.parse(await request.json());
    const email = normalizeEmail(parsed.email);
    const name = displayNameForEmail(parsed.name, email);

    // Per-target cap: limits codes sent to one address.
    await assertRateLimit({
      key: `${requestKey(request, "email-signup-start")}:${email}`,
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    // Per-source cap across all targets: stops one client from spraying codes
    // at many arbitrary campus inboxes by rotating the email field.
    await assertRateLimit({
      key: requestKey(request, "email-signup-start-source"),
      limit: 15,
      windowMs: 60 * 60 * 1000,
    });

    if (!isAllowedCampusEmail(email)) {
      return jsonError("DOMAIN_NOT_ALLOWED", "Use your campus email to create an account.", 403);
    }

    const code = generateEmailOtpCode();
    const expiresAt = emailOtpExpiresAt();
    const codeHash = hashEmailOtp(email, code);
    const now = new Date();

    const verification = await db.$transaction(async (tx) => {
      await tx.emailVerificationCode.updateMany({
        where: { email, consumedAt: null },
        data: { consumedAt: now },
      });
      await tx.emailVerificationCode.deleteMany({
        where: { email, expiresAt: { lt: now } },
      });
      return tx.emailVerificationCode.create({
        data: { email, name, codeHash, expiresAt },
      });
    });
    createdCodeId = verification.id;

    await sendTransactionalEmail({
      to: email,
      subject: emailOtpSubject(),
      text: emailOtpText(code),
      html: emailOtpHtml(code),
      idempotencyKey: `email-signup-${verification.id}`,
    });

    return NextResponse.json({
      ok: true,
      expiresAt: expiresAt.toISOString(),
      message: "Verification code sent.",
    });
  } catch (error) {
    if (createdCodeId) {
      await db.emailVerificationCode
        .update({ where: { id: createdCodeId }, data: { consumedAt: new Date() } })
        .catch(() => {});
    }
    if (error instanceof EmailOtpConfigError) {
      return jsonError("EMAIL_OTP_NOT_CONFIGURED", "Email sign-up is not configured yet.", 503);
    }
    if (error instanceof EmailDeliveryError) {
      const message =
        error.code === "not_configured"
          ? "Email sign-up is not configured yet."
          : "Could not send the verification code. Try again.";
      return jsonError("EMAIL_DELIVERY_FAILED", message, error.code === "not_configured" ? 503 : 502);
    }
    return handleRouteError(error);
  }
}
