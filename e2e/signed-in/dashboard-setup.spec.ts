import { expect, test } from '@playwright/test'
import { createStudent, signIn } from './students'

test('a new verified student sees setup steps instead of zero counts', async ({ page }) => {
  const student = await createStudent('setup-verified')
  await signIn(page, student)

  const setup = page.getByRole('region', { name: 'Get set up' })
  await expect(setup).toBeVisible()
  await expect(setup.getByText('1 of 3 done')).toBeVisible()
  await expect(setup.getByRole('heading', { name: 'Verify your campus (done)' })).toBeVisible()
  await expect(setup.getByRole('link', { name: 'Upload a note' })).toHaveAttribute(
    'href',
    '/dashboard/notes/new',
  )
  await expect(page.getByText('Your notes', { exact: true })).toBeHidden()
  await expect(page.getByRole('navigation', { name: 'Quick study actions' })).toHaveCount(0)
  await expect(page.locator('header').getByText('✓ Campus verified')).toBeVisible()
})

test('a pending student is sent to verification from the header and the checklist', async ({ page }) => {
  const student = await createStudent('setup-pending', { domain: 'example.com' })
  await signIn(page, student)

  const setup = page.getByRole('region', { name: 'Get set up' })
  await expect(setup.getByText('0 of 3 done')).toBeVisible()
  await expect(setup.getByRole('link', { name: 'Go to verification' })).toHaveAttribute(
    'href',
    '/dashboard/verification',
  )

  await page.locator('header').getByRole('link', { name: /Verify your campus/ }).click()
  await expect(page).toHaveURL(/\/dashboard\/verification$/)
})
