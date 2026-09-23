import { expect, test } from '@playwright/test'
import { createStudent, signIn } from './students'

test('a confirmed, onboarded student signs in and reaches the dashboard', async ({ page }) => {
  const student = await createStudent('signin')
  await signIn(page, student)
  await expect(page.getByText(student.displayName).first()).toBeVisible()
})
