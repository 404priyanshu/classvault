import { normalizeEmail } from "@/lib/server/email-otp";

const COLLEGE_EMAIL_SUFFIXES = [".edu", ".edu.in", ".ac.in"];

export function isAllowedCollegeEmail(email: string) {
  const normalized = normalizeEmail(email);
  return COLLEGE_EMAIL_SUFFIXES.some((suffix) => normalized.endsWith(suffix));
}

export function collegeOtpSubject() {
  return "Your ClassVault college verification code";
}

export function collegeOtpText(code: string, collegeName: string) {
  return [
    `Your ClassVault college verification code for ${collegeName} is ${code}.`,
    "It expires in 10 minutes.",
    "If you did not request this, you can ignore this email.",
  ].join("\n");
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "\"":
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

export function collegeOtpHtml(code: string, collegeName: string) {
  const escapedCollegeName = escapeHtml(collegeName);
  return [
    "<div style=\"font-family:Arial,sans-serif;color:#111827;line-height:1.5\">",
    "<h1 style=\"font-size:18px;margin:0 0 12px\">ClassVault college verification</h1>",
    `<p style=\"margin:0 0 12px\">Use this code to verify your ${escapedCollegeName} student email.</p>`,
    `<p style=\"font-size:28px;font-weight:700;letter-spacing:6px;margin:0 0 12px\">${code}</p>`,
    "<p style=\"margin:0;color:#4b5563\">This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>",
    "</div>",
  ].join("");
}
