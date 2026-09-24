import { expect, test } from '@playwright/test'
import { createStudent, signIn } from './students'

test('library filters fit beside the sidebar and fold away on phones', async ({ page }) => {
  const student = await createStudent('filters')
  await page.setViewportSize({ height: 900, width: 1280 })
  await signIn(page, student, '/dashboard/notes')

  // Every control stays inside the search form at a common laptop width.
  const form = page.getByRole('search')
  const formBox = (await form.boundingBox())!
  for (const name of ['Search', 'Apply']) {
    const box = (await form.getByRole('button', { exact: true, name }).boundingBox())!
    expect(box.x + box.width).toBeLessThanOrEqual(formBox.x + formBox.width)
  }
  await expect(page.getByRole('button', { name: /Filters/ })).toBeHidden()

  await page.setViewportSize({ height: 844, width: 390 })
  const toggle = page.getByRole('button', { name: /Filters/ })
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await expect(page.getByLabel('Sort order')).toBeHidden()

  await toggle.click()
  await page.getByLabel('Sort order').selectOption('top')
  await page.getByRole('button', { exact: true, name: 'Apply' }).click()
  await expect(page).toHaveURL(/sort=top/)

  // A filter in use starts open and is counted on the button.
  await expect(page.getByRole('button', { name: /Filters/ })).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('button', { name: /Filters/ })).toContainText('1')
})
