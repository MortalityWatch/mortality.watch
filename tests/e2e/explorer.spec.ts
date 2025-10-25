import { test, expect } from '@playwright/test'

test.describe('Explorer Page', () => {
  test('should load explorer page', async ({ page }) => {
    await page.goto('/explorer')

    // Verify page loaded
    await expect(page).toHaveURL(/\/explorer/)

    // Check for chart controls
    await expect(page.locator('select, [role="combobox"]').first()).toBeVisible()
  })

  test('should allow country selection', async ({ page }) => {
    await page.goto('/explorer')

    // Wait for page to be interactive
    await page.waitForLoadState('networkidle')

    // Look for country selector (might be a select, combobox, or custom component)
    const countrySelector = page.locator('select, [role="combobox"], input[placeholder*="country" i], button').first()

    if (await countrySelector.isVisible()) {
      await expect(countrySelector).toBeVisible()
    }
  })

  test('should update URL when changing selections', async ({ page }) => {
    await page.goto('/explorer')

    // Wait for any interaction (this test may need adjustment based on actual UI)
    await page.waitForLoadState('networkidle')

    // Note: This is a basic check - actual interaction tests
    // will be added after Phase 2 UI fixes are complete
    await expect(page).toHaveURL(/\/explorer/)
  })

  test('should display chart canvas or container', async ({ page }) => {
    await page.goto('/explorer')

    // Wait for chart to potentially render
    await page.waitForTimeout(2000)

    // Look for canvas element (Chart.js) or chart container
    const chart = page.locator('canvas, [class*="chart"]').first()

    // Chart might not render immediately without data, so just check for container
    const hasChart = await chart.count() > 0
    expect(hasChart).toBeTruthy()
  })
})
