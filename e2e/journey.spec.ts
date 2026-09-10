import { expect, test } from '@playwright/test'

test.describe('signup journey', () => {
  test('keeps the account form usable on a narrow phone', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 })
    await page.goto('/auth/sign-up')
    await expect(
      page.getByRole('heading', { name: 'Come on in.' }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Google', exact: true }),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Phone', exact: true }),
    ).toHaveAttribute('href', '/auth/phone?next=%2Fonboarding')
    await page
      .getByRole('button', { name: 'Show password', exact: true })
      .click()
    await expect(page.locator('input[name="password"]')).toHaveAttribute(
      'type',
      'text',
    )
    await page
      .getByRole('button', { name: 'Hide password', exact: true })
      .click()
    await expect(page.locator('input[name="password"]')).toHaveAttribute(
      'type',
      'password',
    )
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true)
  })

  test('explains confirmation without claiming verified membership', async ({
    page,
  }) => {
    await page.goto('/auth/check-email?email=student%40example.test')
    await expect(
      page.getByRole('heading', { name: 'Check your inbox.' }),
    ).toBeVisible()
    await expect(
      page.getByText('student@example.test', { exact: true }),
    ).toBeVisible()
    await expect(page.getByText(/Confirm your email before/)).toBeVisible()
  })

  test('protects the saved-profile welcome route', async ({ page }) => {
    await page.goto('/onboarding/welcome')
    await expect(page).toHaveURL(
      /\/auth\/sign-in\?next=%2Fonboarding%2Fwelcome/,
    )
  })

  test('clears stale signup URL errors without replacing the form', async ({
    page,
  }) => {
    await page.goto('/auth/sign-up?error=Try+again')
    await expect(page.getByText(/Try again/)).toBeVisible()
    await expect(page).toHaveURL(/\/auth\/sign-up$/)
    await page.reload()
    await expect(page.getByText(/Try again/)).toHaveCount(0)
  })
})
