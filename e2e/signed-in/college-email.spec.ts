import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import {
  adminClient,
  confirmationLinkFor,
  confirmationTarget,
  createStudent,
  signIn,
} from './students'

test('a student who signed up with Gmail verifies their campus with their college email', async ({
  baseURL,
  page,
}) => {
  test.setTimeout(60_000)
  const student = await createStudent('gmail', { domain: 'gmail.com' })
  const collegeEmail = `e2e-college-${randomUUID().slice(0, 8)}@bennett.edu.in`

  await signIn(page, student, '/dashboard/verification')
  await expect(page.getByText('pending', { exact: true })).toBeVisible()

  // An address on another domain is refused before any email is sent.
  await page.getByLabel('College email').fill(`riya-${randomUUID().slice(0, 4)}@gmail.com`)
  await page.getByRole('button', { name: 'Send confirmation link' }).click()
  await expect(page.getByText('Use an address ending in @bennett.edu.in')).toBeVisible()

  await page.getByLabel('College email').fill(collegeEmail)
  await page.getByRole('button', { name: 'Send confirmation link' }).click()
  await expect(page.getByText(`Check ${collegeEmail}`)).toBeVisible()

  // Secure email change asks both addresses to confirm, in either order.
  for (const address of [student.email, collegeEmail]) {
    await page.goto(
      await confirmationTarget(await confirmationLinkFor(address), baseURL!),
    )
  }

  await page.goto('/dashboard/verification')
  await expect(page.getByText('Your campus-only notes and rooms are available.')).toBeVisible()
  await expect(page.getByLabel('College email')).toHaveCount(0)

  const { data: membership } = await adminClient()
    .from('university_memberships')
    .select('status, academic_email')
    .eq('user_id', student.id)
    .single()
  expect(membership).toEqual({ academic_email: collegeEmail, status: 'verified' })
})
