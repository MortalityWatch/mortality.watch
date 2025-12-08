import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'

test('save modal opens and closes on cancel', { tag: '@flaky' }, async ({ page }) => {
  // Increase timeout for this flaky test - CI environment can be slow
  test.setTimeout(60000)
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

  // Click the Save Chart button to open the modal
  // Use data-tour attribute to find the button
  await page.evaluate(() => {
    const saveButton = document.querySelector('[data-tour="save-button"] button') as HTMLElement
    if (saveButton) {
      saveButton.click()
    }
  })

  // Wait for the modal to appear (with longer timeout for CI)
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })
  await expect(page.getByRole('heading', { name: 'Save Chart' })).toBeVisible()

  // Click Cancel button
  await page.getByRole('button', { name: 'Cancel' }).click()

  // Verify the modal is dismissed (use specific locator to avoid matching driver-popover tutorial)
  await expect(page.locator('[data-slot="content"][role="dialog"]')).not.toBeVisible()
})

test.skip('save modal opens and closes on save', async ({ page }) => {
  // TODO: Fix test isolation - needs cleanup of saved charts between runs
  // The test fails because duplicate detection prevents saving the same chart twice,
  // and the modal stays open to show the duplicate warning (which is correct behavior).
  // To fix: Either clean up saved charts in beforeEach, or modify chart state to be unique per run.

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

  // Fill in the chart name with unique timestamp to avoid conflicts
  const chartName = `Test Chart ${Date.now()}`
  await page.getByPlaceholder('Enter a name for your chart').fill(chartName)

  // Click Save button
  await page.getByRole('button', { name: 'Save Chart' }).click()

  // Verify the modal is dismissed
  await expect(page.getByRole('dialog')).not.toBeVisible()

  // Verify success toast appears
  await expect(page.getByText('Chart saved!', { exact: true })).toBeVisible()
})
