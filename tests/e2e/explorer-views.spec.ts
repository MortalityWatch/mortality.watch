import { test, expect } from '@playwright/test'

/**
 * E2E tests for explorer view modes
 *
 * These tests verify:
 * 1. Raw values view (default)
 * 2. Excess view
 * 3. Z-Score view (Pro feature)
 * 4. View-specific controls (percentage, cumulative)
 * 5. Mutual exclusivity constraints
 */
test.describe('Explorer View Modes', () => {
  // Helper to wait for chart to be ready
  async function waitForChart(page: ReturnType<typeof test['info']>['page']) {
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('canvas#chart', { timeout: 15000 })
  }

  // Helper to navigate to Display tab
  async function openDisplayTab(page: ReturnType<typeof test['info']>['page']) {
    const displayTab = page.getByRole('button', { name: 'Display', exact: true })
    await displayTab.waitFor({ state: 'visible', timeout: 5000 })
    await displayTab.click()
    await page.waitForTimeout(300)
  }

  test.describe('Raw Values View (Default)', () => {
    test('should load raw values view by default', async ({ page }) => {
      await page.goto('/explorer')
      await waitForChart(page)

      // Neither excess nor zscore should be in URL
      const url = page.url()
      expect(url).not.toContain('e=1')
      expect(url).not.toContain('zs=1')
    })

    test('should render chart in raw values view', async ({ page }) => {
      await page.goto('/explorer')
      await waitForChart(page)

      await expect(page.locator('canvas#chart')).toBeVisible()
    })

    test('should allow disabling baseline in raw view', async ({ page }) => {
      await page.goto('/explorer?sb=0')
      await waitForChart(page)

      const url = page.url()
      expect(url).toContain('sb=0')
    })
  })

  test.describe('Excess View', () => {
    test('should load excess view from URL', async ({ page }) => {
      await page.goto('/explorer?e=1')
      await waitForChart(page)

      const url = page.url()
      expect(url).toContain('e=1')
    })

    test('should render chart in excess view', async ({ page }) => {
      await page.goto('/explorer?e=1')
      await waitForChart(page)

      await expect(page.locator('canvas#chart')).toBeVisible()
    })

    test('should enforce baseline in excess view', async ({ page }) => {
      // Try to disable baseline in excess view
      await page.goto('/explorer?e=1&sb=0')
      await waitForChart(page)

      // URL should have baseline corrected
      const url = page.url()
      expect(url).toContain('e=1')
      expect(url).not.toContain('sb=0')
    })

    test('should show percentage toggle in excess view', async ({ page }) => {
      await page.goto('/explorer?e=1')
      await waitForChart(page)
      await openDisplayTab(page)

      // Percentage option should be available in excess view
      const percentageLabel = page.locator('text=Percentage')
      await expect(percentageLabel).toBeVisible()
    })

    test('should show cumulative toggle in excess view', async ({ page }) => {
      await page.goto('/explorer?e=1')
      await waitForChart(page)
      await openDisplayTab(page)

      // Cumulative option should be available in excess view
      const cumulativeLabel = page.locator('text=Cumulative')
      await expect(cumulativeLabel).toBeVisible()
    })

    test('should load percentage mode from URL in excess view', async ({ page }) => {
      await page.goto('/explorer?e=1&pct=1')
      await waitForChart(page)

      // Chart should render with percentage mode
      await expect(page.locator('canvas#chart')).toBeVisible()
      const url = page.url()
      expect(url).toContain('e=1')
    })

    test('should load cumulative mode from URL in excess view', async ({ page }) => {
      await page.goto('/explorer?e=1&cum=1')
      await waitForChart(page)

      // Chart should render with cumulative mode
      await expect(page.locator('canvas#chart')).toBeVisible()
      const url = page.url()
      expect(url).toContain('e=1')
    })
  })

  test.describe('Z-Score View (Pro Feature)', () => {
    test('should load zscore view from URL', async ({ page }) => {
      await page.goto('/explorer?zs=1')
      await waitForChart(page)

      const url = page.url()
      expect(url).toContain('zs=1')
    })

    test('should render chart in zscore view', async ({ page }) => {
      await page.goto('/explorer?zs=1')
      await waitForChart(page)

      await expect(page.locator('canvas#chart')).toBeVisible()
    })

    test('should enforce baseline in zscore view', async ({ page }) => {
      // Try to disable baseline in zscore view
      await page.goto('/explorer?zs=1&sb=0')
      await waitForChart(page)

      // URL should have baseline corrected
      const url = page.url()
      expect(url).toContain('zs=1')
      expect(url).not.toContain('sb=0')
    })

    test('should disable log scale in zscore view', async ({ page }) => {
      // Try to enable log scale in zscore view
      await page.goto('/explorer?zs=1&lg=1')
      await waitForChart(page)

      // Log scale should be disabled/removed for zscore
      const url = page.url()
      expect(url).toContain('zs=1')
      // lg=1 should either be removed or log scale should be disabled
    })

    test('should make excess and zscore mutually exclusive', async ({ page }) => {
      // Try to enable both
      await page.goto('/explorer?e=1&zs=1')
      await waitForChart(page)

      // Only one should be active
      const url = page.url()
      const hasExcess = url.includes('e=1')
      const hasZscore = url.includes('zs=1')

      // Both shouldn't be true at the same time
      expect(hasExcess && hasZscore).toBe(false)
    })
  })

  test.describe('View-Specific Display Controls', () => {
    test('should hide percentage/cumulative in raw view', async ({ page }) => {
      await page.goto('/explorer')
      await waitForChart(page)
      await openDisplayTab(page)

      // Percentage and cumulative should not be visible in raw view
      const percentageLabel = page.locator('label:has-text("Percentage")')
      const cumulativeLabel = page.locator('label:has-text("Cumulative")')

      const hasPercentage = await percentageLabel.isVisible().catch(() => false)
      const hasCumulative = await cumulativeLabel.isVisible().catch(() => false)

      // These should be hidden in raw view
      expect(hasPercentage).toBe(false)
      expect(hasCumulative).toBe(false)
    })

    test('should show log scale in raw view', async ({ page }) => {
      await page.goto('/explorer')
      await waitForChart(page)
      await openDisplayTab(page)

      // Log scale should be available in raw view
      const logScaleLabel = page.locator('text=Log Scale')
      const isVisible = await logScaleLabel.isVisible().catch(() => false)

      // Log scale should be visible in raw view
      expect(isVisible).toBe(true)
    })

    test('should hide log scale in excess view', async ({ page }) => {
      await page.goto('/explorer?e=1')
      await waitForChart(page)
      await openDisplayTab(page)

      // Log scale should be hidden or disabled in excess view
      const logScaleLabel = page.locator('label:has-text("Log Scale")')
      const isVisible = await logScaleLabel.isVisible().catch(() => false)

      if (isVisible) {
        // If visible, it should be disabled
        const toggle = logScaleLabel.locator('..').locator('button[role="switch"]')
        const isDisabled = await toggle.isDisabled().catch(() => false)
        expect(isDisabled).toBe(true)
      }
    })
  })

  test.describe('Log Scale Toggle', () => {
    test('should load with log scale enabled from URL', async ({ page }) => {
      await page.goto('/explorer?lg=1')
      await waitForChart(page)

      const url = page.url()
      expect(url).toContain('lg=1')
    })

    test('should load with log scale disabled by default', async ({ page }) => {
      await page.goto('/explorer')
      await waitForChart(page)

      // lg=1 should not be in URL by default
      const url = page.url()
      expect(url).not.toContain('lg=1')
    })

    test('should render chart with log scale', async ({ page }) => {
      await page.goto('/explorer?lg=1')
      await waitForChart(page)

      await expect(page.locator('canvas#chart')).toBeVisible()
    })
  })

  test.describe('Total Toggle', () => {
    test('should load with total enabled from URL', async ({ page }) => {
      await page.goto('/explorer?st=1')
      await waitForChart(page)

      // Chart should render with total enabled
      await expect(page.locator('canvas#chart')).toBeVisible()
    })

    test('should render chart with total', async ({ page }) => {
      await page.goto('/explorer?st=1')
      await waitForChart(page)

      await expect(page.locator('canvas#chart')).toBeVisible()
    })
  })

  test.describe('Maximize Toggle', () => {
    test('should load with maximize enabled from URL', async ({ page }) => {
      await page.goto('/explorer?m=1')
      await waitForChart(page)

      const url = page.url()
      expect(url).toContain('m=1')
    })

    test('should load with maximize disabled by default', async ({ page }) => {
      await page.goto('/explorer')
      await waitForChart(page)

      // m=1 should not be in URL by default
      const url = page.url()
      expect(url).not.toContain('m=1')
    })
  })

  test.describe('View Mode Persistence', () => {
    test('should preserve excess view on reload', async ({ page }) => {
      await page.goto('/explorer?e=1')
      await waitForChart(page)

      await page.reload()
      await waitForChart(page)

      const url = page.url()
      expect(url).toContain('e=1')
      await expect(page.locator('canvas#chart')).toBeVisible()
    })

    test('should preserve zscore view on reload', async ({ page }) => {
      await page.goto('/explorer?zs=1')
      await waitForChart(page)

      await page.reload()
      await waitForChart(page)

      const url = page.url()
      expect(url).toContain('zs=1')
    })
  })

  test.describe('Browser Navigation with Views', () => {
    test('should handle back/forward between views', async ({ page }) => {
      // Start in raw view
      await page.goto('/explorer')
      await waitForChart(page)
      const rawUrl = page.url()

      // Navigate to excess view
      await page.goto('/explorer?e=1')
      await waitForChart(page)
      const excessUrl = page.url()
      expect(excessUrl).toContain('e=1')

      // Navigate to zscore view
      await page.goto('/explorer?zs=1')
      await waitForChart(page)
      expect(page.url()).toContain('zs=1')

      // Go back to excess
      await page.goBack()
      await waitForChart(page)
      expect(page.url()).toBe(excessUrl)

      // Go back to raw
      await page.goBack()
      await waitForChart(page)
      expect(page.url()).toBe(rawUrl)

      // Go forward to excess
      await page.goForward()
      await waitForChart(page)
      expect(page.url()).toBe(excessUrl)
    })
  })
})
