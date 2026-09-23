import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import { createStudent, publishNote, signIn, usageEventsFor } from './students'

test('a published note can be found, opened, and downloaded by another student', async ({
  browser,
}) => {
  const title = `E2E congestion control ${randomUUID().slice(0, 6)}`
  const [uploader, reader] = await Promise.all([
    createStudent('uploader'),
    createStudent('reader'),
  ])

  // The uploader publishes a PDF through the real private-storage pipeline.
  const uploaderPage = await (await browser.newContext()).newPage()
  await signIn(uploaderPage, uploader)
  await publishNote(uploaderPage, {
    subject: 'Computer Networks',
    text: 'TCP congestion window notes',
    title,
  })

  // Another student searches for it, opens it, and downloads it.
  const readerPage = await (await browser.newContext()).newPage()
  await signIn(readerPage, reader, '/dashboard/notes')
  await readerPage.getByPlaceholder('Search note titles…').fill(title)
  await readerPage.getByPlaceholder('Search note titles…').press('Enter')
  await readerPage.getByRole('link', { name: title }).first().click()
  await expect(readerPage.getByRole('heading', { name: title })).toBeVisible()

  const downloadStarted = readerPage.waitForEvent('download')
  await readerPage.getByRole('link', { name: 'Download note' }).click()
  const download = await downloadStarted
  expect(download.suggestedFilename()).toMatch(/\.pdf$/)

  // Each step reached the usage ledger, attributed to the right student.
  await expect
    .poll(async () => (await usageEventsFor(uploader.id)).map(({ event }) => event))
    .toContain('note_uploaded')
  await expect
    .poll(async () => (await usageEventsFor(reader.id)).map(({ event }) => event))
    .toEqual(['notes_searched', 'note_opened', 'note_downloaded'])
  const [search] = await usageEventsFor(reader.id)
  expect(search.found_results).toBe(true)
})
