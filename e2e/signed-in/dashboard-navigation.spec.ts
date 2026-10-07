import { expect, test } from '@playwright/test'
import { createStudent, signIn } from './students'

test('the sidebar groups its links and drops what a verified student no longer needs', async ({ page }) => {
  const student = await createStudent('nav-verified')
  await signIn(page, student)

  const sidebar = page.getByRole('navigation', { name: 'Dashboard navigation' })
  await expect(sidebar.getByRole('group', { name: 'Study' })).toBeVisible()
  await expect(sidebar.getByRole('group', { name: 'Yours' }).getByRole('link', { name: 'My Vault' })).toBeVisible()
  await expect(sidebar.getByRole('link', { name: 'Campus verification' })).toHaveCount(0)
  await expect(sidebar.getByRole('link', { name: 'Trash' })).toHaveCount(0)
  await expect(sidebar.getByRole('link', { name: 'Settings' })).toHaveCount(0)
  await expect(sidebar.getByRole('group', { name: 'Team' })).toHaveCount(0)

  // Trash is still one click away, inside the vault, with the vault marked current.
  await sidebar.getByRole('link', { name: 'My Vault' }).click()
  await page.getByRole('link', { name: /^Trash/ }).click()
  await expect(page).toHaveURL(/\/dashboard\/vault\?view=trash$/)
  await expect(sidebar.getByRole('link', { name: 'My Vault' })).toHaveAttribute('aria-current', 'page')

  await page.getByRole('link', { name: /Profile and settings/ }).click()
  await expect(page).toHaveURL(/\/dashboard\/settings$/)
})

test('a pending student keeps the verification link', async ({ page }) => {
  const student = await createStudent('nav-pending', { domain: 'example.com' })
  await signIn(page, student)

  await expect(
    page
      .getByRole('navigation', { name: 'Dashboard navigation' })
      .getByRole('link', { name: 'Campus verification' }),
  ).toBeVisible()
})

test('phones get a bottom tab bar for the four study areas', async ({ page }) => {
  const student = await createStudent('nav-phone')
  await page.setViewportSize({ width: 390, height: 844 })
  await signIn(page, student)

  const tabs = page.getByRole('navigation', { name: 'Main sections' })
  await expect(tabs.getByRole('link')).toHaveText(['Home', 'Library', 'Roadmaps', 'Rooms'])
  await expect(tabs.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page')

  await tabs.getByRole('link', { name: 'Rooms' }).click()
  await expect(page).toHaveURL(/\/dashboard\/study-rooms$/)
  await expect(tabs.getByRole('link', { name: 'Rooms' })).toHaveAttribute('aria-current', 'page')
})

test('the tab bar stays out of the desktop layout', async ({ page }) => {
  const student = await createStudent('nav-desktop')
  await page.setViewportSize({ width: 1440, height: 900 })
  await signIn(page, student)

  await expect(page.getByRole('navigation', { name: 'Main sections' })).toBeHidden()
})
