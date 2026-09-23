import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import { createStudent, signIn, usageEventsFor } from './students'

test('two students share a room and see each other’s chat', async ({ browser }) => {
  const name = `E2E sprint ${randomUUID().slice(0, 6)}`
  const [host, guest] = await Promise.all([
    createStudent('host'),
    createStudent('guest'),
  ])

  const hostPage = await (await browser.newContext()).newPage()
  await signIn(hostPage, host, '/dashboard/study-rooms')
  await hostPage.getByLabel('Room name').fill(name)
  await hostPage.getByLabel('Subject', { exact: false }).first().fill('Databases')
  await hostPage.getByRole('button', { name: 'Create study room' }).click()
  await expect(hostPage).toHaveURL(/\/dashboard\/study-rooms\/[0-9a-f-]{36}/)

  const guestPage = await (await browser.newContext()).newPage()
  await signIn(guestPage, guest, '/dashboard/study-rooms')
  await guestPage
    .locator('article')
    .filter({ hasText: name })
    .getByRole('button', { name: 'Join room' })
    .click()
  await expect(guestPage).toHaveURL(hostPage.url())

  const message = `Checkpoint ${randomUUID().slice(0, 6)}`
  await guestPage.getByPlaceholder('Share a question or checkpoint…').fill(message)
  await guestPage.getByRole('button', { name: 'Send' }).click()

  // Realtime refreshes the host's view; the message arrives without a reload.
  await expect(hostPage.getByText(message)).toBeVisible({ timeout: 15_000 })

  for (const student of [host, guest]) {
    await expect
      .poll(async () => (await usageEventsFor(student.id)).map(({ event }) => event))
      .toContain('study_room_joined')
  }
})
