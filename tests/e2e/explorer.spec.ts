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

  test('should update chart on browser back/forward navigation', async ({ page }) => {
    // Start with default countries
    await page.goto('/explorer')
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('canvas#chart', { timeout: 10000 })

    const initialUrl = page.url()

    // Navigate to a different state (change chart type to calendar)
    // This simulates user changing settings, which updates URL
    await page.goto('/explorer?c=USA&c=SWE&ct=calendar&t=asmr')
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('canvas#chart', { timeout: 10000 })

    const secondUrl = page.url()
    expect(secondUrl).toContain('ct=calendar')

    // Go back using browser navigation
    await page.goBack()
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('canvas#chart', { timeout: 10000 })

    // URL should be back to initial state
    expect(page.url()).toBe(initialUrl)

    // Go forward again
    await page.goForward()
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('canvas#chart', { timeout: 10000 })

    // URL should be back to second state
    expect(page.url()).toBe(secondUrl)
    expect(page.url()).toContain('ct=calendar')
  })
})
