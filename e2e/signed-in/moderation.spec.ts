import { randomUUID } from 'node:crypto'
import { expect, test, type Browser } from '@playwright/test'
import {
  createStudent,
  grantPlatformRole,
  publishNote,
  signIn,
  type Student,
} from './students'

async function signedInPage(browser: Browser, student: Student, next?: string) {
  const page = await (await browser.newContext()).newPage()
  await signIn(page, student, next)
  return page
}

test('a reported note is restricted by a moderator, hidden from readers, and explained to its owner', async ({
  browser,
}) => {
  test.setTimeout(60_000)
  const title = `E2E reported note ${randomUUID().slice(0, 6)}`
  const ownerMessage = `Please add the original source ${randomUUID().slice(0, 4)}`
  const [owner, reader, moderator] = await Promise.all([
    createStudent('note-owner'),
    createStudent('note-reporter'),
    createStudent('note-moderator'),
  ])
  await grantPlatformRole(moderator.id, 'platform_moderator')

  const ownerPage = await signedInPage(browser, owner)
  await publishNote(ownerPage, {
    subject: 'Databases',
    text: 'Normal forms and functional dependencies',
    title,
  })

  // The reader reports it privately from the note page.
  const readerPage = await signedInPage(browser, reader, '/dashboard/notes')
  await readerPage.goto(`/dashboard/notes?q=${encodeURIComponent(title)}`)
  await readerPage.getByRole('link', { name: title }).first().click()
  await expect(readerPage).toHaveURL(/\/dashboard\/notes\/[0-9a-f-]{36}$/)
  const noteUrl = readerPage.url()
  await readerPage.getByRole('button', { name: 'Report note' }).click()
  await readerPage.getByLabel('Reason').selectOption('copyright')
  await readerPage.getByLabel(/Details/).fill('Copied from a paid textbook.')
  await readerPage.getByRole('button', { name: 'Send private report' }).click()
  await expect(readerPage.getByRole('status')).toBeVisible()

  // A platform moderator finds it in the queue and restricts it.
  const moderatorPage = await signedInPage(browser, moderator, '/dashboard/moderation')
  const card = moderatorPage
    .locator('article')
    .filter({ has: moderatorPage.getByRole('heading', { name: title }) })
  await expect(card).toBeVisible()
  await expect(card.getByText('Copied from a paid textbook.')).toBeVisible()
  await card.getByLabel('Moderation action').selectOption('restrict')
  await card.getByLabel('Safe message for owner').fill(ownerMessage)
  await card.getByRole('button', { name: 'Save' }).click()
  await expect(card).toHaveCount(0, { timeout: 10_000 })

  // The reader can no longer open it...
  await readerPage.goto(noteUrl)
  await expect(
    readerPage.getByRole('heading', { name: 'This corner is missing.' }),
  ).toBeVisible()

  // ...and the owner is told why, in the moderator's own words only.
  await ownerPage.goto('/dashboard/vault')
  await expect(ownerPage.getByText(`Moderation update · ${title}`)).toBeVisible()
  await expect(ownerPage.getByText(ownerMessage)).toBeVisible()
  await expect(ownerPage.getByText('Copied from a paid textbook.')).toHaveCount(0)
  // The report form promises the reporter is never shown to the contributor.
  await expect(ownerPage.getByText(reader.displayName)).toHaveCount(0)
})

test('a host reports and mutes a participant, and a moderator closes the report with the cited message', async ({
  browser,
}) => {
  test.setTimeout(60_000)
  const roomName = `E2E moderated room ${randomUUID().slice(0, 6)}`
  const abusive = `You are all useless ${randomUUID().slice(0, 6)}`
  const [host, guest, moderator] = await Promise.all([
    createStudent('room-host'),
    createStudent('room-guest'),
    createStudent('room-moderator'),
  ])
  await grantPlatformRole(moderator.id, 'platform_moderator')

  const hostPage = await signedInPage(browser, host, '/dashboard/study-rooms')
  await hostPage.getByLabel('Room name').fill(roomName)
  await hostPage.getByLabel('Subject', { exact: false }).first().fill('Databases')
  await hostPage.getByRole('button', { name: 'Create study room' }).click()
  await expect(hostPage).toHaveURL(/\/dashboard\/study-rooms\/[0-9a-f-]{36}/)

  const guestPage = await signedInPage(browser, guest, '/dashboard/study-rooms')
  await guestPage
    .locator('article')
    .filter({ hasText: roomName })
    .getByRole('button', { name: 'Join room' })
    .click()
  await expect(guestPage).toHaveURL(hostPage.url())
  await guestPage.getByPlaceholder('Share a question or checkpoint…').fill(abusive)
  await guestPage.getByRole('button', { name: 'Send' }).click()
  await expect(hostPage.getByText(abusive)).toBeVisible({ timeout: 15_000 })

  // The innermost block holding both the guest's name and their controls.
  const guestRow = hostPage
    .locator('div')
    .filter({ has: hostPage.getByText(guest.displayName, { exact: true }) })
    .filter({ has: hostPage.getByRole('button', { name: 'Report', exact: true }) })
    .last()

  // Report first, citing the message: chat is deleted with the room. The
  // message arrived live, after the host's page loaded.
  await guestRow.getByRole('button', { name: 'Report', exact: true }).click()
  await hostPage.getByLabel(abusive).check()
  await hostPage.getByPlaceholder('What should a moderator know?').fill(
    'Insulting the room after being asked to stop.',
  )
  await hostPage.getByRole('button', { name: 'Send private report' }).click()
  await expect(hostPage.getByRole('button', { name: 'Send private report' })).toHaveCount(0)

  // Then mute them for the rest of the room.
  await guestRow.getByRole('button', { name: 'Mute', exact: true }).click()
  await hostPage.getByPlaceholder('Why they are being muted').fill('Insulting other members')
  await hostPage.getByRole('button', { name: 'Mute for this room' }).click()
  await expect(guestPage.getByText(/A host muted you in this room/)).toBeVisible({
    timeout: 15_000,
  })
  await expect(guestPage.getByPlaceholder('Share a question or checkpoint…')).toHaveCount(0)

  // A platform moderator sees the room, the cited message, and closes it.
  const moderatorPage = await signedInPage(browser, moderator, '/dashboard/moderation')
  const card = moderatorPage
    .locator('article')
    .filter({ has: moderatorPage.getByRole('heading', { name: roomName }) })
  await expect(card).toBeVisible()
  await expect(card.getByText(abusive)).toBeVisible()
  await card.getByRole('combobox').first().selectOption('closed')
  await card.getByPlaceholder('What you decided (required to close)').fill(
    'Warned the participant; mute was appropriate.',
  )
  await card.getByRole('button', { name: 'Save' }).first().click()
  await expect(card).toHaveCount(0, { timeout: 10_000 })
})
