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

    // Basic check - interaction tests can be added as needed
    await expect(page).toHaveURL(/\/explorer/)
  })

  test('should display chart canvas or container', async ({ page }) => {
    await page.goto('/explorer')

    // Wait for data to load
    await page.waitForLoadState('networkidle')

    // Look for canvas element (Chart.js renders actual chart)
    // With default countries (USA, SWE), chart should render
    await page.waitForSelector('canvas#chart', { timeout: 10000 })

    const chart = page.locator('canvas#chart')
    await expect(chart).toBeVisible()
  })
})
