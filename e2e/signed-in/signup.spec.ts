import { expect, test } from '@playwright/test'
import {
  adminClient,
  confirmationLinkFor,
  passCaptcha,
  confirmationTarget,
  uniqueEmail,
} from './students'

test('a new student signs up, confirms by email, and finishes setup with a verified campus', async ({
  baseURL,
  page,
}) => {
  const email = uniqueEmail('signup')

  await page.goto('/auth/sign-up')
  await page.getByLabel('Name').fill('E2E Newcomer')
  await page.getByLabel('Email').fill(email)
  await page.locator('#signup-password').fill('E2e-correct-horse-42')
  await passCaptcha(page)
  await page.getByRole('button', { name: 'Create free account' }).click()
  await expect(page).toHaveURL(/\/auth\/check-email/)

  await page.goto(
    await confirmationTarget(await confirmationLinkFor(email), baseURL!),
  )
  await expect(page).toHaveURL(/\/onboarding/)

  const next = page.getByRole('button', { name: 'Continue' })
  await page.getByLabel('Display name').fill('E2E Newcomer')
  await next.click()

  await page.getByRole('combobox').fill('Bennett')
  await page.getByRole('option', { name: /Bennett University/ }).click()
  await next.click()

  await page.getByText('B.Tech', { exact: true }).click()
  await page.getByLabel('Graduation year').fill(String(new Date().getFullYear() + 2))
  await next.click()

  await page.getByText('Ace my exams').click()
  await next.click()

  await page.getByText('Study groups').click()
  await page.getByRole('button', { name: 'Finish setup' }).click()
  await expect(page).toHaveURL(/\/onboarding\/welcome|\/dashboard/, { timeout: 15_000 })

  // The campus is verified because the confirmed address is on Bennett's
  // domain, decided by the database rather than anything the form sent.
  const admin = adminClient()
  const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const user = users.users.find((candidate) => candidate.email === email)
  expect(user?.email_confirmed_at).toBeTruthy()
  const { data: membership } = await admin
    .from('university_memberships')
    .select('status')
    .eq('user_id', user!.id)
    .single()
  expect(membership?.status).toBe('verified')
})
