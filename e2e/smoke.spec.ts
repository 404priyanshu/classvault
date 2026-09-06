import { expect, test } from '@playwright/test'

test.describe('marketing landing page', () => {
  test('renders the hero and primary calls to action', async ({ page }) => {
    await page.goto('/')

    await expect(
      page.getByRole('heading', {
        level: 1,
        name: /Good notes. Great company. You’ve got this./,
      }),
    ).toBeVisible()
    await expect(
      page.getByText('Early access at Bennett University. Come make yourself at home.', {
        exact: true,
      }),
    ).toBeVisible()
    await expect(
      page.locator('a[href="/auth/sign-up"]').first(),
    ).toBeVisible()
  })

  test('hero points to signup and the interactive product preview', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'Find your study place' }).first()).toHaveAttribute('href', '/auth/sign-up')
    await page.getByRole('link', { name: 'Take a peek' }).click()
    await expect(page.getByRole('tab', { name: /Notes/ })).toBeVisible()
  })

  test('mobile menu closes with Escape and restores focus', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    const menu = page.getByRole('button', { name: 'Open navigation menu' })
    await expect(page.locator('#landing-mobile-navigation')).toHaveAttribute('inert', '')
    await menu.click()
    await expect(page.getByRole('link', { name: '01 Product' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(menu).toBeFocused()
    await expect(menu).toHaveAttribute('aria-expanded', 'false')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })

  test('privacy questions expand and retain the My Vault destination', async ({ page }) => {
    await page.goto('/')
    await page.getByText('Can I take my notes back?', { exact: true }).click()
    await expect(page.getByRole('link', { name: 'My Vault', exact: true }).first()).toHaveAttribute('href', '/dashboard/vault')
    await expect(page.getByText(/Deleted notes move to Trash/)).toBeVisible()
  })

  test('focus demo can start, pause, and reset', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Start a focus demo' }).click()
    await expect(page.locator('#rooms time')).not.toHaveText('25:00')
    await page.getByRole('button', { name: 'Pause demo' }).click()
    await expect(page.getByRole('button', { name: 'Start a focus demo' })).toBeVisible()
    await page.getByRole('button', { name: 'Reset focus demo' }).click()
    await expect(page.locator('#rooms time')).toHaveText('25:00')
  })

  test('does not advertise capabilities the product lacks', async ({ page }) => {
    await page.goto('/')
    const body = await page.locator('body').innerText()

    // Roadmap generation is deterministic and makes no model call, study rooms
    // carry no WebRTC media, and there is no billing to upgrade through. Each
    // of these shipped as a claim once; a test is cheaper than noticing again.
    expect(body).not.toMatch(/\bAI\b/i)
    expect(body).not.toMatch(/video|audio/i)
    expect(body).not.toMatch(/upgrade to pro/i)
    expect(body).not.toMatch(/studying now|most popular/i)
  })

  test('renders every section without running client scripts', async ({ request }) => {
    // Framer serializes `initial` into the server HTML, so animating opacity
    // from 0 once shipped forty-six elements at opacity:0 and left crawlers,
    // social preview renderers, and hidden tabs with a blank page below the
    // hero. Reveals move on transform only; this keeps it that way.
    const html = await (await request.get('/')).text()
    const withoutScripts = html.replace(/<script[\s\S]*?<\/script>/g, '')

    expect(withoutScripts).not.toMatch(/opacity:0[^.\d]/)

    for (const section of [
      'Built for the beautiful chaos of college.',
      'Bennett University',
      'Come on in. Have a look around.',
      'College is a lot.',
      'Make yourself',
      'New here? You’ll fit right in.',
    ]) {
      expect(withoutScripts).toContain(section)
    }
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

test.describe('product walkthrough', () => {
  test('product tabs support arrow keys and Home/End', async ({ page }) => {
    await page.goto('/')
    const notes = page.getByRole('tab', { name: /Notes/ })
    await notes.focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByRole('tab', { name: /Roadmaps/ })).toBeFocused()
    await expect(page.getByRole('tab', { name: /Roadmaps/ })).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('End')
    await expect(page.getByRole('tab', { name: /Access/ })).toBeFocused()
    await page.keyboard.press('Home')
    await expect(notes).toBeFocused()
  })

  test('switches between the product surfaces', async ({ page }) => {
    await page.goto('/')

    const roadmapsTab = page.getByRole('tab', { name: /Roadmaps/ })
    await roadmapsTab.click()
    await expect(roadmapsTab).toHaveAttribute('aria-selected', 'true')
    // "Core concepts" appears in both the phase rail and the mockup heading.
    await expect(
      page.getByText('Core concepts', { exact: true }).first(),
    ).toBeVisible()
    await expect(
      page.getByText('Source record', { exact: true }).first(),
    ).toBeVisible()

    const roomsTab = page.getByRole('tab', { name: /Study rooms/ })
    await roomsTab.click()
    await expect(roomsTab).toHaveAttribute('aria-selected', 'true')
    await expect(
      page.getByText('Synced focus timer', { exact: true }),
    ).toBeVisible()
    await expect(page.getByText('Room chat', { exact: true })).toBeVisible()

    const accessTab = page.getByRole('tab', { name: /Access/ })
    await accessTab.click()
    await expect(accessTab).toHaveAttribute('aria-selected', 'true')
    await expect(
      page.getByText('Viewer / surface matrix', { exact: true }),
    ).toBeVisible()
    await expect(
      page.getByText('Database enforced', { exact: true }),
    ).toBeVisible()
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

  test('settings redirects unauthenticated visitors to sign-in', async ({
    page,
  }) => {
    await page.goto('/dashboard/settings')

    await expect(page).toHaveURL(
      /\/auth\/sign-in\?next=%2Fdashboard%2Fsettings/,
    )
  })

  test('study-room lobby redirects unauthenticated visitors to sign-in', async ({
    page,
  }) => {
    await page.goto('/dashboard/study-rooms')

    await expect(page).toHaveURL(
      /\/auth\/sign-in\?next=%2Fdashboard%2Fstudy-rooms/,
    )
  })

  test('study-room detail redirects unauthenticated visitors to sign-in', async ({
    page,
  }) => {
    await page.goto(
      '/dashboard/study-rooms/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    )

    await expect(page).toHaveURL(
      /\/auth\/sign-in\?next=%2Fdashboard%2Fstudy-rooms%2Faaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/,
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

  test('study-room purge rejects requests without its scheduler secret', async ({
    request,
  }) => {
    const response = await request.get('/api/cron/purge-study-rooms')

    expect(response.status()).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
  })
})
