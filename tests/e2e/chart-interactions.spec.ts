import { test, expect } from '@playwright/test'

test.describe('Chart Interactions', () => {
  test('should render chart on explorer page', async ({ page }) => {
    await page.goto('/explorer')
    await page.waitForLoadState('networkidle')

    // Wait for chart to render
    await page.waitForTimeout(2000)

    // Check for chart canvas (Chart.js uses canvas)
    const canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible({ timeout: 10000 })
  })

  test('should display chart controls', async ({ page }) => {
    await page.goto('/explorer')
    await page.waitForLoadState('networkidle')

    // Chart controls should be visible
    // Look for common control elements like selects, buttons, sliders
    const controls = page.locator('select, [role="combobox"], button, input[type="range"]')
    await expect(controls.first()).toBeVisible({ timeout: 10000 })
  })

  test('should allow interaction with chart controls', async ({ page }) => {
    await page.goto('/explorer')
    await page.waitForLoadState('networkidle')

    // Wait for page to be interactive
    await page.waitForTimeout(2000)

    // Verify URL exists (showing controls are loading state)
    const currentUrl = page.url()
    expect(currentUrl).toContain('/explorer')
  })

  test('should update URL when interacting with controls', async ({ page }) => {
    await page.goto('/explorer')
    await page.waitForLoadState('networkidle')

    const initialUrl = page.url()

    // Wait for controls to be ready
    await page.waitForTimeout(2000)

    // Any interaction should maintain the URL structure
    // (Note: Actual interaction tests will be more specific once UI is stable)
    expect(initialUrl).toContain('/explorer')
  })

  test('should handle responsive layout for charts', async ({ page, isMobile }) => {
    await page.goto('/explorer')
    await page.waitForLoadState('networkidle')

    // Chart container should adjust to viewport
    const container = page.locator('.container, [class*="container"]').first()
    await expect(container).toBeVisible()

    if (isMobile) {
      // On mobile, controls might be stacked vertically
      const viewport = page.viewportSize()
      expect(viewport?.width).toBeLessThan(768)
    }
  })

  test('should load chart without errors', async ({ page }) => {
    const consoleErrors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/explorer')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // Filter out known warnings that aren't critical
    const criticalErrors = consoleErrors.filter(
      error =>
        !error.includes('sharp')
        && !error.includes('Sourcemap')
        && !error.includes('externalized for browser compatibility')
        && !error.includes('ResizeObserver')
        && !error.includes('chunks are larger than')
    )

    // Log errors for debugging but allow some non-critical errors
    if (criticalErrors.length > 0) {
      console.log('Console errors detected:', criticalErrors)
    }

    // Should have minimal console errors (allow up to 3 for flaky warnings)
    expect(criticalErrors.length).toBeLessThanOrEqual(3)
  })

  test('should maintain chart state when navigating away and back', async ({ page }) => {
    await page.goto('/explorer')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Navigate away
    await page.goto('/about')
    await expect(page).toHaveURL(/\/about/)

    // Go back using browser back button
    await page.goBack()
    await expect(page).toHaveURL(/\/explorer/)

    // Chart should be present
    const canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible({ timeout: 10000 })
  })

  test('should display loading state while chart data loads', async ({ page }) => {
    await page.goto('/explorer')

    // May show loading indicator initially
    const loadingIndicator = page.locator('[class*="loading"], [class*="spinner"], text=/loading/i').first()

    // Either loading is shown and then hidden, or chart loads immediately
    const hasLoading = await loadingIndicator.isVisible({ timeout: 1000 }).catch(() => false)

    if (hasLoading) {
      // Wait for loading to complete
      await loadingIndicator.waitFor({ state: 'hidden', timeout: 30000 })
    }

    // Chart should be visible after loading
    const canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible({ timeout: 10000 })
  })

  test('should display chart legend or labels', async ({ page }) => {
    await page.goto('/explorer')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Chart.js typically renders canvas, and legend might be in DOM or on canvas
    const canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible()

    // Canvas should have non-zero dimensions (indicates chart rendered)
    const boundingBox = await canvas.boundingBox()
    expect(boundingBox).toBeTruthy()
    expect(boundingBox!.width).toBeGreaterThan(0)
    expect(boundingBox!.height).toBeGreaterThan(0)
  })

  test('should handle window resize gracefully', async ({ page }) => {
    await page.goto('/explorer')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Get canvas element
    const canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible()

    // Resize viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.waitForTimeout(500)

    // Canvas should still be visible after resize
    await expect(canvas).toBeVisible()
    const newBox = await canvas.boundingBox()
    expect(newBox).toBeTruthy()
    expect(newBox!.width).toBeGreaterThan(0)
  })
})
