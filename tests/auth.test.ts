import { afterEach, describe, expect, it } from "vitest";
import { isAllowedCampusEmail, roleForEmail } from "@/lib/server/auth";
import {
  emailOtpMatches,
  generateEmailOtpCode,
  hashEmailOtp,
  normalizeEmail,
} from "@/lib/server/email-otp";

const originalAllowedDomains = process.env.ALLOWED_EMAIL_DOMAINS;
const originalAdminEmails = process.env.ADMIN_EMAILS;
const originalEmailOtpSecret = process.env.EMAIL_OTP_SECRET;

afterEach(() => {
  if (originalAllowedDomains === undefined) {
    delete process.env.ALLOWED_EMAIL_DOMAINS;
  } else {
    process.env.ALLOWED_EMAIL_DOMAINS = originalAllowedDomains;
  }

  if (originalAdminEmails === undefined) {
    delete process.env.ADMIN_EMAILS;
  } else {
    process.env.ADMIN_EMAILS = originalAdminEmails;
  }

  if (originalEmailOtpSecret === undefined) {
    delete process.env.EMAIL_OTP_SECRET;
  } else {
    process.env.EMAIL_OTP_SECRET = originalEmailOtpSecret;
  }
});

describe("campus auth policy", () => {
  it("allows every verified Google email when no campus domains are configured", () => {
    delete process.env.ALLOWED_EMAIL_DOMAINS;

    expect(isAllowedCampusEmail("student@example.com")).toBe(true);
  });

  it("allows only configured campus domains when ALLOWED_EMAIL_DOMAINS is set", () => {
    process.env.ALLOWED_EMAIL_DOMAINS = "classvault.edu, uni.example";

    expect(isAllowedCampusEmail("student@classvault.edu")).toBe(true);
    expect(isAllowedCampusEmail("person@UNI.EXAMPLE")).toBe(true);
    expect(isAllowedCampusEmail("student@gmail.com")).toBe(false);
  });

  it("promotes configured admin emails without changing other users", () => {
    process.env.ADMIN_EMAILS = "admin@classvault.edu";

    expect(roleForEmail("admin@classvault.edu")).toBe("ADMIN");
    expect(roleForEmail("mod@classvault.edu", "MODERATOR")).toBe("MODERATOR");
  });
});

describe("email OTP helpers", () => {
  it("normalizes email addresses before hashing", () => {
    process.env.EMAIL_OTP_SECRET = "test-secret";
    const hash = hashEmailOtp("STUDENT@ClassVault.edu ", "123456");

    expect(normalizeEmail(" STUDENT@ClassVault.edu ")).toBe("student@classvault.edu");
    expect(emailOtpMatches("student@classvault.edu", "123456", hash)).toBe(true);
    expect(emailOtpMatches("student@classvault.edu", "654321", hash)).toBe(false);
  });

  it("generates six-digit codes", () => {
    expect(generateEmailOtpCode()).toMatch(/^\d{6}$/);
  });
});
