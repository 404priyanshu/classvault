import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

const EMAIL_OTP_TTL_MS = 10 * 60 * 1000;
export const EMAIL_OTP_MAX_ATTEMPTS = 5;

export class EmailOtpConfigError extends Error {
  constructor() {
    super("EMAIL_OTP_SECRET is required in production.");
  }
}

function envValue(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function emailOtpSecret() {
  const configured = envValue("EMAIL_OTP_SECRET");
  if (configured) return configured;
  if (process.env.NODE_ENV !== "production") return "classvault-dev-email-otp-secret";
  return null;
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function displayNameForEmail(name: string | null | undefined, email: string) {
  const trimmed = name?.trim();
  if (trimmed) return trimmed;
  return normalizeEmail(email).split("@")[0] || "ClassVault student";
}

export function generateEmailOtpCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function emailOtpExpiresAt(now = Date.now()) {
  return new Date(now + EMAIL_OTP_TTL_MS);
}

export function hashEmailOtp(email: string, code: string) {
  const secret = emailOtpSecret();
  if (!secret) throw new EmailOtpConfigError();
  return createHmac("sha256", secret).update(`${normalizeEmail(email)}:${code}`).digest("hex");
}

export function emailOtpMatches(email: string, code: string, expectedHash: string) {
  const actualHash = hashEmailOtp(email, code);
  const actual = Buffer.from(actualHash, "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function emailOtpSubject() {
  return "Your ClassVault verification code";
}

export function emailOtpText(code: string) {
  return [
    `Your ClassVault verification code is ${code}.`,
    "It expires in 10 minutes.",
    "If you did not request this, you can ignore this email.",
  ].join("\n");
}

export function emailOtpHtml(code: string) {
  return [
    "<div style=\"font-family:Arial,sans-serif;color:#111827;line-height:1.5\">",
    "<h1 style=\"font-size:18px;margin:0 0 12px\">ClassVault verification code</h1>",
    "<p style=\"margin:0 0 12px\">Use this code to finish creating your ClassVault account.</p>",
    `<p style=\"font-size:28px;font-weight:700;letter-spacing:6px;margin:0 0 12px\">${code}</p>`,
    "<p style=\"margin:0;color:#4b5563\">This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>",
    "</div>",
  ].join("");
}
