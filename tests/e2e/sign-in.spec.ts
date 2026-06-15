import { expect, test } from "@playwright/test";

test("sign-in renders returning-user auth entry points", async ({ page }) => {
  await page.goto("/sign-in");

  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Continue with Google" })).toBeVisible();
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("link", { name: "New here? Start signup" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Create your account" })).toHaveCount(0);
});

test("sign-up renders email verification and onboarding progress", async ({ page }) => {
  await page.goto("/sign-up");

  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
  await expect(page.getByLabel("Full name")).toBeVisible();
  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(page.getByRole("button", { name: "Send verification code" })).toBeVisible();
  await expect(page.getByText("Step 1 of 5")).toBeVisible();
});

test("friendly Google callback errors render on sign-in", async ({ page }) => {
  await page.goto("/sign-in?error=google_domain");

  await expect(page.getByText("Use your campus Google account to sign in.")).toBeVisible();
});
