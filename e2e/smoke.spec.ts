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

test.describe('roadmap demo', () => {
  test('generates the sample plan and reveals interactive phases', async ({
    page,
  }) => {
    await page.goto('/')

    await page.getByLabel('Your topic').fill('Operating Systems')
    await page.getByRole('button', { name: 'Generate my roadmap' }).click()

    await expect(page.getByText('Roadmap ready')).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByText('Foundations').first()).toBeVisible()
    await expect(page.getByText('sources:').first()).toBeVisible()

    const firstTask = page.getByRole('button', { name: /Mark "Skim overview notes/ })
    await firstTask.click()
    await expect(firstTask).toHaveAccessibleName(/as not done/)
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

  test('roadmap workspace redirects unauthenticated visitors to sign-in', async ({
    page,
  }) => {
    await page.goto('/dashboard/roadmaps')

    await expect(page).toHaveURL(
      /\/auth\/sign-in\?next=%2Fdashboard%2Froadmaps/,
    )
  })

  test('roadmap detail redirects unauthenticated visitors to sign-in', async ({
    page,
  }) => {
    await page.goto('/dashboard/roadmaps/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')

    await expect(page).toHaveURL(
      /\/auth\/sign-in\?next=%2Fdashboard%2Froadmaps%2Faaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/,
    )
  })

  test('My Vault redirects unauthenticated visitors to sign-in', async ({
    page,
  }) => {
    await page.goto('/dashboard/vault?view=trash')

    await expect(page).toHaveURL(
      /\/auth\/sign-in\?next=%2Fdashboard%2Fvault%3Fview%3Dtrash/,
    )
  })

  test('purge endpoint rejects requests without its scheduler secret', async ({
    request,
  }) => {
    const response = await request.get('/api/cron/purge-notes')

    expect(response.status()).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
  })
})
