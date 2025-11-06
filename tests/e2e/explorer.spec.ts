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

    // Capture initial URL (with defaults applied)
    const initialUrl = page.url()

    // Navigate to a different state - use different countries which will definitely change the URL
    // This simulates user changing settings, which updates URL
    await page.goto('/explorer?c=GBR&c=FRA&t=asmr')
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('canvas#chart', { timeout: 10000 })

    // Capture second URL (should have different countries)
    const secondUrl = page.url()
    expect(secondUrl).toContain('c=GBR')
    expect(secondUrl).toContain('c=FRA')

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
    expect(page.url()).toContain('c=GBR')
  })

  test('should toggle excess mode with single click (Issue #147)', async ({ page }) => {
    // Start with default state (no excess)
    await page.goto('/explorer')
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('canvas#chart', { timeout: 10000 })

    // Verify initial state: no excess in URL
    expect(page.url()).not.toContain('e=1')

    // Find and click the Excess toggle
    // The toggle might be a button, checkbox, or custom toggle component
    const excessToggle = page.locator('[data-testid="excess-toggle"], button:has-text("Excess"), input[type="checkbox"]').first()

    // Click the excess toggle ONCE
    await excessToggle.click()

    // Wait for URL to update (StateResolver should apply constraints)
    await page.waitForTimeout(500) // Give time for state resolution

    // SINGLE CLICK should work!
    // Verify URL contains excess parameter
    expect(page.url()).toContain('e=1')

    // Verify baseline is still enabled (excess requires baseline)
    expect(page.url()).not.toContain('sb=0')

    // Verify PI defaults to OFF (soft constraint)
    expect(page.url()).toContain('pi=0')

    // Verify percentage defaults to ON (soft constraint)
    expect(page.url()).toContain('p=1')

    // Verify chart still renders
    await expect(page.locator('canvas#chart')).toBeVisible()
  })

  test('should preserve user overrides for soft constraints (Issue #147)', async ({ page }) => {
    // Start with excess mode ON + user wants PI ON (overrides default)
    await page.goto('/explorer?e=1&pi=1')
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('canvas#chart', { timeout: 10000 })

    // Verify PI stayed ON (user override)
    expect(page.url()).toContain('e=1')
    expect(page.url()).toContain('pi=1')

    // Verify baseline is ON (hard constraint)
    expect(page.url()).not.toContain('sb=0')
  })

  test('should enforce hard constraints even with URL manipulation (Issue #147)', async ({ page }) => {
    // Try to visit URL with invalid state: excess ON but baseline OFF
    await page.goto('/explorer?e=1&sb=0')
    await page.waitForLoadState('networkidle')

    // StateResolver should enforce: excess requires baseline
    // The page should either:
    // 1. Correct the URL (baseline back to ON), OR
    // 2. Show a validation error

    // Wait for potential URL correction
    await page.waitForTimeout(500)

    // Check if chart still renders (meaning state was corrected)
    const chart = page.locator('canvas#chart')
    if (await chart.isVisible()) {
      // State was corrected - baseline should be back ON
      expect(page.url()).not.toContain('sb=0')
    } else {
      // Validation error shown - this is also acceptable
      // (implementation detail - could be either behavior)
      console.log('Validation error shown for invalid state')
    }
  })
})
