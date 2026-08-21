import { expect, test } from '@playwright/test'

test.describe('marketing landing page', () => {
  test('renders the hero and primary calls to action', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(
      page.getByText(/ClassVault puts trusted, student-rated notes/i),
    ).toBeVisible()
    await expect(
      page.locator('a[href="/auth/sign-up"]').first(),
    ).toBeVisible()
  })

  test('sends hardened security headers', async ({ request }) => {
    const response = await request.get('/')
    const headers = response.headers()

    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['x-frame-options']).toBe('DENY')
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(headers['strict-transport-security']).toContain('max-age=')

    const csp = headers['content-security-policy']
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain('challenges.cloudflare.com')
    expect(csp).toContain('frame-ancestors \'none\'')
  })
})

test.describe('authentication routes', () => {
  test('sign-in renders the email form and OAuth providers', async ({
    page,
  }) => {
    await page.goto('/auth/sign-in')

    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Google' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'GitHub' })).toBeVisible()
  })

  test('sign-up renders the registration form', async ({ page }) => {
    await page.goto('/auth/sign-up')

    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]').first()).toBeVisible()
  })

  test('phone route offers India as the default country', async ({ page }) => {
    await page.goto('/auth/phone')

    await expect(page.locator('select[name="countryCode"]')).toHaveValue('+91')
  })
})

test.describe('protected routes', () => {
  test('dashboard redirects unauthenticated visitors to sign-in', async ({
    page,
  }) => {
    await page.goto('/dashboard')

    await expect(page).toHaveURL(/\/auth\/sign-in\?next=%2Fdashboard/)
  })

  test('notes library redirects unauthenticated visitors to sign-in', async ({
    page,
  }) => {
    await page.goto('/dashboard/notes')

    await expect(page).toHaveURL(/\/auth\/sign-in\?next=%2Fdashboard%2Fnotes/)
  })
})
