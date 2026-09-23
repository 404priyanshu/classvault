import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import { createStudent, grantPlatformRole, signIn } from './students'

test('only a platform administrator can open the usage page', async ({ browser }) => {
  const [student, admin] = await Promise.all([
    createStudent('usage-student'),
    createStudent('usage-admin'),
  ])
  await grantPlatformRole(admin.id, 'platform_admin')

  // The student leaves a search that finds nothing for the admin to see.
  const studentPage = await (await browser.newContext()).newPage()
  await signIn(studentPage, student, '/dashboard/notes')
  await studentPage.goto(
    `/dashboard/notes?q=${encodeURIComponent(`nothing here ${randomUUID()}`)}`,
  )
  await expect(studentPage.getByText(/Nobody has shared/)).toBeVisible()
  await expect(studentPage.getByRole('link', { exact: true, name: 'Usage' })).toHaveCount(0)
  // The dashboard streams, so notFound() renders the missing-page view after
  // a 200 has already gone out; what matters is that no usage data does.
  await studentPage.goto('/dashboard/usage')
  await expect(
    studentPage.getByRole('heading', { name: 'This corner is missing.' }),
  ).toBeVisible()
  await expect(studentPage.getByText('Active students this week')).toHaveCount(0)

  const adminPage = await (await browser.newContext()).newPage()
  await signIn(adminPage, admin)
  await adminPage.getByRole('link', { exact: true, name: 'Usage' }).first().click()
  await expect(adminPage).toHaveURL(/\/dashboard\/usage$/)
  await expect(adminPage.getByRole('heading', { name: 'Usage', level: 1 })).toBeVisible()

  const searches = adminPage
    .locator('div')
    .filter({ has: adminPage.getByText('Searches, last 7 days', { exact: true }) })
    .last()
  await expect(searches.getByText(/^\d+$/)).not.toHaveText('0')
  await expect(searches.getByText(/found nothing$/)).not.toHaveText('0 found nothing')
  await expect(adminPage.getByRole('table').first()).toBeVisible()
})
