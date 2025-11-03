import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'

test('save modal opens and closes on cancel', async ({ page }) => {
  // Login first
  await login(page)

  // Navigate to Explorer (use first() when multiple matches)
  await page.getByRole('link', { name: 'Explorer' }).first().click()

  // Wait for page to load and close any welcome/tutorial modals
  await page.waitForLoadState('networkidle')

  // Close jurisdiction selection modal if present (use first matching button)
  const closeButtons = page.getByRole('button', { name: 'Close' })
  const count = await closeButtons.count()
  if (count > 0) {
    await closeButtons.first().click()
  }

  // Close tutorial if present - force click through overlay
  try {
    await page.getByText('×').first().click({ timeout: 2000, force: true })
    await page.waitForTimeout(500)
  } catch {
    // Tutorial not present, continue
  }

  // Click the Save Chart button to open the modal (force to bypass any overlays)
  await page.getByRole('button', { name: /Save Chart|Bookmark/i }).click({ force: true })

  // Verify the modal is visible
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Save Chart' })).toBeVisible()

  // Click Cancel button
  await page.getByRole('button', { name: 'Cancel' }).click()

  // Verify the modal is dismissed
  await expect(page.getByRole('dialog')).not.toBeVisible()
})

test('save modal opens and closes on save', async ({ page }) => {
  // Login first
  await login(page)

  // Navigate to Explorer (use first() when multiple matches)
  await page.getByRole('link', { name: 'Explorer' }).first().click()

  // Wait for page to load and close any welcome/tutorial modals
  await page.waitForLoadState('networkidle')

  // Close jurisdiction selection modal if present (use first matching button)
  const closeButtons = page.getByRole('button', { name: 'Close' })
  const count = await closeButtons.count()
  if (count > 0) {
    await closeButtons.first().click()
  }

  // Close tutorial if present - force click through overlay
  try {
    await page.getByText('×').first().click({ timeout: 2000, force: true })
    await page.waitForTimeout(500)
  } catch {
    // Tutorial not present, continue
  }

  // Click the Save Chart button to open the modal (force to bypass any overlays)
  await page.getByRole('button', { name: /Save Chart|Bookmark/i }).click({ force: true })

  // Verify the modal is visible
  await expect(page.getByRole('dialog')).toBeVisible()

  // Fill in the chart name
  await page.getByPlaceholder('Enter a name for your chart').fill('Test Chart')

  // Click Save button
  await page.getByRole('button', { name: 'Save Chart' }).click()

  // Verify the modal is dismissed
  await expect(page.getByRole('dialog')).not.toBeVisible()

  // Verify success toast appears
  await expect(page.getByText('Chart saved!', { exact: true })).toBeVisible()
})
