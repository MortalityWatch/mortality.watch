import { test, expect } from '@playwright/test'

/**
 * E2E tests for explorer baseline controls
 *
 * These tests verify:
 * 1. Baseline method selection URL state
 * 2. Baseline period selection URL state
 * 3. Baseline toggle interactions
 * 4. Baseline constraints with different views
 *
 * Note: The application normalizes URLs by removing default values,
 * so we test that state is applied correctly, not just URL strings.
 */
test.describe('Explorer Baseline Controls', () => {
  // Helper to wait for chart to be ready
  async function waitForChart(page: ReturnType<typeof test['info']>['page']) {
    await page.waitForLoadState('domcontentloaded')
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})
    await page.waitForSelector('canvas#chart', { timeout: 30000 })
  }

  // Helper to navigate to Baseline tab
  async function openBaselineTab(page: ReturnType<typeof test['info']>['page']) {
    const baselineTab = page.getByRole('button', { name: 'Baseline', exact: true })
    await baselineTab.waitFor({ state: 'visible', timeout: 5000 })
    await baselineTab.click()
    await page.waitForTimeout(300)
  }

  // Helper to navigate to Display tab
  async function openDisplayTab(page: ReturnType<typeof test['info']>['page']) {
    const displayTab = page.getByRole('button', { name: 'Display', exact: true })
    await displayTab.waitFor({ state: 'visible', timeout: 5000 })
    await displayTab.click()
    await page.waitForTimeout(300)
  }

  test.describe('Baseline Method URL State', () => {
    test('should render chart with median baseline method', async ({ page }) => {
      await page.goto('/explorer?bm=median')
      await waitForChart(page)

      // Chart should render successfully
      await expect(page.locator('canvas#chart')).toBeVisible()
      // URL should preserve non-default baseline method
      const url = page.url()
      expect(url).toContain('bm=median')
    })

    test('should render chart with linear regression baseline', async ({ page }) => {
      await page.goto('/explorer?bm=lin_reg')
      await waitForChart(page)

      await expect(page.locator('canvas#chart')).toBeVisible()
      const url = page.url()
      expect(url).toContain('bm=lin_reg')
    })

    test('should render chart with naive baseline method', async ({ page }) => {
      await page.goto('/explorer?bm=naive')
      await waitForChart(page)

      await expect(page.locator('canvas#chart')).toBeVisible()
      const url = page.url()
      expect(url).toContain('bm=naive')
    })

    test('should render chart with exponential baseline method', async ({ page }) => {
      await page.goto('/explorer?bm=exp')
      await waitForChart(page)

      await expect(page.locator('canvas#chart')).toBeVisible()
      const url = page.url()
      expect(url).toContain('bm=exp')
    })

    test('should render chart with default baseline method', async ({ page }) => {
      await page.goto('/explorer')
      await waitForChart(page)

      // Chart should render with default baseline
      await expect(page.locator('canvas#chart')).toBeVisible()
    })
  })

  test.describe('Baseline Period URL State', () => {
    test('should render chart with custom baseline period', async ({ page }) => {
      // Use non-default period that will be preserved
      await page.goto('/explorer?bm=median&bdf=2010&bdt=2014')
      await waitForChart(page)

      // Chart should render successfully
      await expect(page.locator('canvas#chart')).toBeVisible()
    })

    test('should render chart with another baseline period', async ({ page }) => {
      await page.goto('/explorer?bm=lin_reg&bdf=2015&bdt=2018')
      await waitForChart(page)

      await expect(page.locator('canvas#chart')).toBeVisible()
    })
  })

  test.describe('Baseline Toggle State', () => {
    test('should load with baseline enabled by default', async ({ page }) => {
      await page.goto('/explorer')
      await waitForChart(page)

      // sb=0 should NOT be in URL (baseline is ON by default)
      const url = page.url()
      expect(url).not.toContain('sb=0')
    })

    test('should load with baseline disabled from URL', async ({ page }) => {
      await page.goto('/explorer?sb=0')
      await waitForChart(page)
      await openDisplayTab(page)

      // Find the baseline toggle
      const baselineToggle = page.locator('text=Baseline').locator('..').locator('button[role="switch"]')
      await expect(baselineToggle).toHaveAttribute('aria-checked', 'false')
    })

    test('should load with baseline explicitly enabled from URL', async ({ page }) => {
      await page.goto('/explorer?sb=1')
      await waitForChart(page)
      await openDisplayTab(page)

      const baselineToggle = page.locator('text=Baseline').locator('..').locator('button[role="switch"]')
      await expect(baselineToggle).toHaveAttribute('aria-checked', 'true')
    })
  })

  test.describe('Prediction Interval (95% PI) Toggle', () => {
    test('should render chart with PI enabled', async ({ page }) => {
      await page.goto('/explorer?pi=1')
      await waitForChart(page)

      // Chart should render with PI enabled
      await expect(page.locator('canvas#chart')).toBeVisible()
    })

    test('should load with PI disabled (default)', async ({ page }) => {
      await page.goto('/explorer')
      await waitForChart(page)

      // pi=1 should NOT be in URL (PI is OFF by default)
      const url = page.url()
      expect(url).not.toContain('pi=1')
    })

    test('should show PI toggle when baseline is enabled', async ({ page }) => {
      await page.goto('/explorer?sb=1')
      await waitForChart(page)
      await openDisplayTab(page)

      // Look for PI toggle
      const piToggle = page.locator('text=95% PI').locator('..').locator('button[role="switch"]')
      const isVisible = await piToggle.isVisible().catch(() => false)

      // PI toggle should be visible when baseline is on
      expect(isVisible).toBe(true)
    })
  })

  test.describe('Baseline Constraints', () => {
    test('should enforce baseline for excess view', async ({ page }) => {
      // Try to load excess view with baseline off
      await page.goto('/explorer?e=1&sb=0')
      await waitForChart(page)

      // StateResolver should enforce baseline for excess
      const url = page.url()
      expect(url).toContain('e=1')
      // Baseline should be corrected to ON
      expect(url).not.toContain('sb=0')
    })

    test('should enforce baseline for zscore view', async ({ page }) => {
      // Try to load zscore view with baseline off
      await page.goto('/explorer?zs=1&sb=0')
      await waitForChart(page)

      // StateResolver should enforce baseline for zscore
      const url = page.url()
      expect(url).toContain('zs=1')
      // Baseline should be corrected to ON
      expect(url).not.toContain('sb=0')
    })

    test('should disable baseline toggle in zscore view', async ({ page }) => {
      await page.goto('/explorer?zs=1')
      await waitForChart(page)
      await openDisplayTab(page)

      const baselineToggle = page.locator('text=Baseline').locator('..').locator('button[role="switch"]')
      await expect(baselineToggle).toBeDisabled()
    })

    test('should disable PI toggle in zscore view', async ({ page }) => {
      await page.goto('/explorer?zs=1')
      await waitForChart(page)
      await openDisplayTab(page)

      const piToggle = page.locator('text=95% PI').locator('..').locator('button[role="switch"]')
      await expect(piToggle).toBeDisabled()
    })
  })

  test.describe('Baseline Tab Visibility', () => {
    test('should have baseline tab accessible', async ({ page }) => {
      await page.goto('/explorer')
      await waitForChart(page)

      const baselineTab = page.getByRole('button', { name: 'Baseline', exact: true })
      await expect(baselineTab).toBeVisible()
    })

    test('should show baseline tab content', async ({ page }) => {
      await page.goto('/explorer')
      await waitForChart(page)
      await openBaselineTab(page)

      // Should be able to access baseline tab - check that some content is visible
      // The chart should still be visible when baseline tab is open
      await expect(page.locator('canvas#chart')).toBeVisible()
    })
  })

  test.describe('Combined Baseline Parameters', () => {
    test('should render chart with multiple baseline parameters', async ({ page }) => {
      await page.goto('/explorer?bm=median&pi=1')
      await waitForChart(page)

      await expect(page.locator('canvas#chart')).toBeVisible()
      // Non-default method should be preserved
      const url = page.url()
      expect(url).toContain('bm=median')
    })

    test('should preserve non-default baseline settings on reload', async ({ page }) => {
      await page.goto('/explorer?bm=lin_reg')
      await waitForChart(page)

      await page.reload()
      await waitForChart(page)

      const url = page.url()
      expect(url).toContain('bm=lin_reg')
    })
  })
})
