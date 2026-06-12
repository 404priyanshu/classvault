import { expect, test } from "@playwright/test";

test("sign-in renders password, Google, and email OTP entry points", async ({ page }) => {
  await page.goto("/sign-in");

  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Continue with Google" })).toBeVisible();
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Create account with email" })).toBeVisible();
  await expect(page.getByLabel("Full name")).toBeVisible();
  await expect(page.getByLabel("Campus email")).toBeVisible();
  await expect(page.getByRole("button", { name: "Send verification code" })).toBeVisible();
});

test("friendly Google callback errors render on sign-in", async ({ page }) => {
  await page.goto("/sign-in?error=google_domain");

  await expect(page.getByText("Use your campus Google account to sign in.")).toBeVisible();
});
