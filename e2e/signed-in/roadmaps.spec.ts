import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import { createStudent, publishNote, signIn, usageEventsFor } from './students'

test('a student generates a roadmap that cites a note they can read', async ({ page }) => {
  // Publishing, extraction, and generation all run for real.
  test.setTimeout(60_000)
  const suffix = randomUUID().slice(0, 6)
  const title = `E2E process scheduling ${suffix}`
  const student = await createStudent('roadmap')
  await signIn(page, student)
  await publishNote(page, {
    subject: 'Operating Systems',
    text: 'Round robin and shortest job first scheduling',
    title,
  })

  await page.goto('/dashboard/roadmaps')
  await page.getByLabel('What are you studying?').fill(`Operating Systems scheduling ${suffix}`)
  await page.getByRole('button', { name: 'Generate roadmap' }).click()

  await expect(page).toHaveURL(/\/dashboard\/roadmaps\/[0-9a-f-]{36}/, { timeout: 30_000 })
  await expect(page.getByText(title).first()).toBeVisible()
  await expect
    .poll(async () => (await usageEventsFor(student.id)).map(({ event }) => event))
    .toContain('roadmap_generated')
})
