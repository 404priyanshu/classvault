import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import { createStudent, publishNote, signIn } from './students'

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

test('once set up, the rail shows the student\'s own roadmap and uploads', async ({ page }) => {
  test.setTimeout(60_000)
  const suffix = randomUUID().slice(0, 6)
  const title = `E2E paging ${suffix}`
  const student = await createStudent('your-work')
  await signIn(page, student)
  await publishNote(page, {
    subject: 'Operating Systems',
    text: 'Paging, page tables, and translation lookaside buffers',
    title,
  })
  await page.goto('/dashboard/roadmaps')
  await page.getByLabel('What are you studying?').fill(`Operating Systems paging ${suffix}`)
  await page.getByRole('button', { name: 'Generate roadmap' }).click()
  await expect(page).toHaveURL(/\/dashboard\/roadmaps\/[0-9a-f-]{36}/, { timeout: 30_000 })
  const roadmapPath = new URL(page.url()).pathname

  await page.goto('/dashboard')
  await expect(page.getByRole('region', { name: 'Get set up' })).toHaveCount(0)
  await expect(page.getByText('Your notes', { exact: true })).toBeVisible()

  await expect(page.getByText('Pick up where you left off')).toBeVisible()
  await expect(page.getByText(/^0 of \d+ tasks done$/)).toBeVisible()
  await expect(page.getByRole('link', { name: 'Continue roadmap' })).toHaveAttribute(
    'href',
    roadmapPath,
  )

  await expect(page.getByText('1 note in your vault')).toBeVisible()
  const upload = page.getByRole('listitem').filter({ hasText: title })
  await expect(upload.getByText('Published')).toBeVisible()
  await upload.getByRole('link', { name: title }).click()
  await expect(page).toHaveURL(/\/dashboard\/notes\/[0-9a-f-]{36}$/)
})
