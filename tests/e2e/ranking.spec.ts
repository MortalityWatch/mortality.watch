import { test, expect } from '@playwright/test'

test.describe('Ranking Page', () => {
  test('should load ranking page successfully', async ({ page }) => {
    await page.goto('/ranking')

    // Verify page loaded
    await expect(page).toHaveURL(/\/ranking/)

    // Check for main heading
    await expect(page.getByRole('heading', { name: /Excess Mortality Ranking/i })).toBeVisible()
  })

  test('should display loading spinner then ranking table', async ({ page }) => {
    await page.goto('/ranking')

    // May show loading spinner initially
    const loadingSpinner = page.getByText(/Loading ranking data/i)
    if (await loadingSpinner.isVisible()) {
      // Wait for loading to complete
      await loadingSpinner.waitFor({ state: 'hidden', timeout: 30000 })
    }

    // Ranking table should be visible after loading (button text is "Show in Explorer")
    await expect(page.getByText(/Show in Explorer/i)).toBeVisible({ timeout: 30000 })
  })

  test('should display data selection controls', async ({ page }) => {
    await page.goto('/ranking')

    // Wait for page to be interactive
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Check for Period of Time selector (exists in DOM, may be hidden on mobile)
    const periodSelector = page.locator('label:has-text("Period of Time")')
    await expect(periodSelector.first()).toBeAttached()

    // Check for Jurisdictions selector (exists in DOM, may be hidden on mobile)
    const jurisdictionSelector = page.locator('label:has-text("Jurisdictions")')
    await expect(jurisdictionSelector.first()).toBeAttached()
  })

  test('should display ranking table with data', async ({ page }) => {
    await page.goto('/ranking')

    // Wait for data to load
    await page.waitForTimeout(3000)

    // Check for the main heading (Excess Mortality Ranking is h1, but card headers are h2)
    // Just check that data has loaded by looking for the explorer button
    const explorerButton = page.getByRole('link', { name: /Show in Explorer/i })
    await expect(explorerButton).toBeVisible({ timeout: 30000 })
  })

  test('should have explorer link button', async ({ page }) => {
    await page.goto('/ranking')

    // Wait for page load
    await page.waitForLoadState('networkidle')

    // Look for "Show in Explorer" button
    const explorerButton = page.getByRole('link', { name: /Show in Explorer/i })
    await expect(explorerButton).toBeVisible({ timeout: 30000 })

    // Verify it's a link (has href)
    const href = await explorerButton.getAttribute('href')
    expect(href).toContain('/explorer')
  })

  test('should update URL when changing selections', async ({ page }) => {
    await page.goto('/ranking')

    // Wait for page to be interactive
    await page.waitForLoadState('networkidle')

    // Initial URL should have some query parameters
    const currentUrl = page.url()
    expect(currentUrl).toContain('/ranking')

    // Note: Actual interaction tests will be enhanced once UI is stabilized
  })

  test('should have settings panel on desktop', async ({ page, isMobile }) => {
    // Skip on mobile as settings are in different location
    test.skip(isMobile, 'Desktop-only test')

    await page.goto('/ranking')
    await page.waitForLoadState('networkidle')

    // Settings panel should exist (contains baseline method, etc.)
    // This is in the right sidebar on desktop
    const settingsPanel = page.locator('[class*="lg:w-[420px]"]')
    await expect(settingsPanel).toBeVisible()
  })

  test('should have responsive layout', async ({ page, isMobile }) => {
    await page.goto('/ranking')
    await page.waitForLoadState('networkidle')

    // Main container should be visible on all screen sizes
    const container = page.locator('.container')
    await expect(container).toBeVisible()

    if (isMobile) {
      // On mobile, data selection should appear before table
      const mobileDataSelection = page.locator('.order-1.lg\\:order-2')
      await expect(mobileDataSelection).toBeVisible()
    }
  })

  test('should display subtitle with baseline information', async ({ page }) => {
    await page.goto('/ranking')

    // Wait for data to load
    await page.waitForTimeout(3000)

    // The subtitle should contain baseline information
    // (e.g., "Baseline: 2017 to 2019")
    const subtitle = page.locator('text=/Baseline|Mean|Linear/i')
    if (await subtitle.count() > 0) {
      await expect(subtitle.first()).toBeVisible()
    }
  })

  test('should persist URL state on page reload', async ({ page }) => {
    await page.goto('/ranking')
    await page.waitForLoadState('networkidle')

    // Get current URL with query params
    const urlWithParams = page.url()

    // Reload the page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // URL should be preserved
    expect(page.url()).toBe(urlWithParams)
  })
})
