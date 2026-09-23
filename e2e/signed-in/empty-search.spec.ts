import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import { pdfWithText } from './pdf'
import { createStudent, signIn, usageEventsFor } from './students'

test('a search that finds nothing invites the student to share that note', async ({ page }) => {
  const topic = `E2E compiler design ${randomUUID().slice(0, 6)}`
  const student = await createStudent('empty-search')
  await signIn(page, student, '/dashboard/notes')

  const search = page.getByPlaceholder('Search note titles…')
  await search.fill(topic)
  await search.press('Enter')
  await expect(
    page.getByRole('heading', { name: `Nobody has shared “${topic}” yet` }),
  ).toBeVisible()

  await page.getByRole('link', { name: 'Share notes on this' }).click()
  await expect(page).toHaveURL(/\/dashboard\/notes\/new\?title=/)
  await expect(page.getByLabel('Title')).toHaveValue(topic)

  // A file set before hydration never reaches React's state; retry until the
  // form shows it has the file.
  await expect(async () => {
    await page.locator('input[type="file"]').setInputFiles({
      buffer: pdfWithText('Lexing, parsing, and code generation'),
      mimeType: 'application/pdf',
      name: 'compilers.pdf',
    })
    await expect(page.getByText('compilers.pdf', { exact: true })).toBeVisible({
      timeout: 1_000,
    })
  }).toPass({ timeout: 15_000 })
  // A course the seeded catalog lacks, published with the default Public
  // access: the pairing that used to be refused.
  await page.getByLabel('Subject').fill(`Compiler Design ${randomUUID().slice(0, 4)}`)
  await page.getByLabel('Note type').selectOption('lecture_notes')
  await page.getByRole('button', { name: 'Publish note' }).click()
  await expect(page).toHaveURL(/\/dashboard(\?|$)/, { timeout: 20_000 })

  // The same search now finds the note the prompt led to.
  await page.goto(`/dashboard/notes?q=${encodeURIComponent(topic)}`)
  await expect(page.getByRole('link', { name: topic }).first()).toBeVisible()

  const events = await usageEventsFor(student.id)
  expect(events.find(({ event }) => event === 'notes_searched')?.found_results).toBe(false)
  expect(events.map(({ event }) => event)).toContain('note_uploaded')
})
