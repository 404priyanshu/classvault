import { afterEach, describe, expect, it } from "vitest";
import { isAllowedCampusEmail, roleForEmail } from "@/lib/server/auth";
import { collegeOtpHtml, isAllowedCollegeEmail } from "@/lib/server/college-verification";
import {
  emailOtpMatches,
  generateEmailOtpCode,
  hashEmailOtp,
  normalizeEmail,
} from "@/lib/server/email-otp";
import { isEmailDeliveryConfigured } from "@/lib/server/email";

const originalAllowedDomains = process.env.ALLOWED_EMAIL_DOMAINS;
const originalAdminEmails = process.env.ADMIN_EMAILS;
const originalEmailOtpSecret = process.env.EMAIL_OTP_SECRET;
const originalEmailProvider = process.env.EMAIL_PROVIDER;
const originalEmailFrom = process.env.EMAIL_FROM;
const originalResendApiKey = process.env.RESEND_API_KEY;
const originalAwsSesRegion = process.env.AWS_SES_REGION;
const originalAwsRegion = process.env.AWS_REGION;

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

  if (originalEmailProvider === undefined) {
    delete process.env.EMAIL_PROVIDER;
  } else {
    process.env.EMAIL_PROVIDER = originalEmailProvider;
  }

  if (originalEmailFrom === undefined) {
    delete process.env.EMAIL_FROM;
  } else {
    process.env.EMAIL_FROM = originalEmailFrom;
  }

  if (originalResendApiKey === undefined) {
    delete process.env.RESEND_API_KEY;
  } else {
    process.env.RESEND_API_KEY = originalResendApiKey;
  }

  if (originalAwsSesRegion === undefined) {
    delete process.env.AWS_SES_REGION;
  } else {
    process.env.AWS_SES_REGION = originalAwsSesRegion;
  }

  if (originalAwsRegion === undefined) {
    delete process.env.AWS_REGION;
  } else {
    process.env.AWS_REGION = originalAwsRegion;
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

describe("college verification policy", () => {
  it("allows only supported college email suffixes", () => {
    expect(isAllowedCollegeEmail("student@classvault.edu")).toBe(true);
    expect(isAllowedCollegeEmail("student@iit.ac.in")).toBe(true);
    expect(isAllowedCollegeEmail("student@college.edu.in")).toBe(true);
    expect(isAllowedCollegeEmail("student@gmail.com")).toBe(false);
    expect(isAllowedCollegeEmail("student@college.edu.evil")).toBe(false);
  });

  it("escapes college name in verification email HTML", () => {
    const html = collegeOtpHtml("123456", "<ClassVault & Co>");

    expect(html).toContain("&lt;ClassVault &amp; Co&gt;");
    expect(html).not.toContain("<ClassVault & Co>");
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

describe("email delivery configuration", () => {
  it("detects AWS SES configuration", () => {
    process.env.EMAIL_PROVIDER = "ses";
    process.env.EMAIL_FROM = "ClassVault <no-reply@classvault.edu>";
    process.env.AWS_SES_REGION = "us-east-1";
    delete process.env.RESEND_API_KEY;

    expect(isEmailDeliveryConfigured()).toBe(true);
  });

  it("does not treat incomplete SES configuration as production-ready", () => {
    process.env.EMAIL_PROVIDER = "ses";
    delete process.env.EMAIL_FROM;
    process.env.AWS_SES_REGION = "us-east-1";

    expect(isEmailDeliveryConfigured()).toBe(false);
  });
});
