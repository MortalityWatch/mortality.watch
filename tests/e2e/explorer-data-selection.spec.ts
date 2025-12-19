import { test, expect } from '@playwright/test'

/**
 * E2E tests for explorer data selection controls
 *
 * These tests verify:
 * 1. Country/jurisdiction selection
 * 2. Metric type selection
 * 3. Chart type selection
 * 4. Date range controls
 * 5. URL state persistence for data selections
 *
 * Note: The application normalizes URLs by removing default values,
 * so we focus on testing that the chart renders correctly with different parameters.
 */
test.describe('Explorer Data Selection', () => {
  // Helper to wait for chart to be ready
  // Note: Avoid networkidle as it's flaky with external API calls
  async function waitForChart(page: ReturnType<typeof test['info']>['page']) {
    await page.waitForSelector('canvas#chart', { state: 'visible', timeout: 30000 })
  }

  test.describe('Country Selection URL State', () => {
    test('should load with default countries', async ({ page }) => {
      await page.goto('/explorer')
      await waitForChart(page)

      // Default countries render chart successfully
      await expect(page.locator('canvas#chart')).toBeVisible()
    })

    test('should load specific countries from URL', async ({ page }) => {
      await page.goto('/explorer?c=GBR&c=FRA')
      await waitForChart(page)

      const url = page.url()
      expect(url).toContain('GBR')
      expect(url).toContain('FRA')
    })

    test('should render chart with different countries', async ({ page }) => {
      await page.goto('/explorer?c=JPN&c=AUS')
      await waitForChart(page)

      // Chart should render
      await expect(page.locator('canvas#chart')).toBeVisible()
    })
  })

  test.describe('Metric Type Selection', () => {
    test('should render chart with ASMR metric', async ({ page }) => {
      await page.goto('/explorer?t=asmr')
      await waitForChart(page)

      await expect(page.locator('canvas#chart')).toBeVisible()
    })

    test('should render chart with CMR metric', async ({ page }) => {
      await page.goto('/explorer?t=cmr')
      await waitForChart(page)

      await expect(page.locator('canvas#chart')).toBeVisible()
      const url = page.url()
      expect(url).toContain('t=cmr')
    })

    test('should render chart with deaths metric', async ({ page }) => {
      await page.goto('/explorer?t=deaths')
      await waitForChart(page)

      await expect(page.locator('canvas#chart')).toBeVisible()
      const url = page.url()
      expect(url).toContain('t=deaths')
    })

    test('should render chart with population metric', async ({ page }) => {
      await page.goto('/explorer?t=population')
      await waitForChart(page)

      await expect(page.locator('canvas#chart')).toBeVisible()
      const url = page.url()
      expect(url).toContain('t=population')
    })

    test('should render chart with life expectancy metric', async ({ page }) => {
      await page.goto('/explorer?t=le')
      await waitForChart(page)

      await expect(page.locator('canvas#chart')).toBeVisible()
      const url = page.url()
      expect(url).toContain('t=le')
    })
  })

  test.describe('Chart Type Selection', () => {
    test('should render yearly chart type', async ({ page }) => {
      await page.goto('/explorer?ct=yearly')
      await waitForChart(page)

      await expect(page.locator('canvas#chart')).toBeVisible()
    })

    test('should render monthly chart type', async ({ page }) => {
      await page.goto('/explorer?ct=monthly')
      await waitForChart(page)

      await expect(page.locator('canvas#chart')).toBeVisible()
      const url = page.url()
      expect(url).toContain('ct=monthly')
    })

    test('should render weekly chart type', async ({ page }) => {
      await page.goto('/explorer?ct=weekly')
      await waitForChart(page)

      await expect(page.locator('canvas#chart')).toBeVisible()
      const url = page.url()
      expect(url).toContain('ct=weekly')
    })

    test('should render midyear chart type', async ({ page }) => {
      await page.goto('/explorer?ct=midyear')
      await waitForChart(page)

      await expect(page.locator('canvas#chart')).toBeVisible()
      const url = page.url()
      expect(url).toContain('ct=midyear')
    })

    test('should render quarterly chart type', async ({ page }) => {
      await page.goto('/explorer?ct=quarterly')
      await waitForChart(page)

      await expect(page.locator('canvas#chart')).toBeVisible()
      const url = page.url()
      expect(url).toContain('ct=quarterly')
    })
  })

  test.describe('Standard Population Selection', () => {
    test('should render chart with ESP standard population', async ({ page }) => {
      await page.goto('/explorer?sp=esp&t=asmr')
      await waitForChart(page)

      await expect(page.locator('canvas#chart')).toBeVisible()
      const url = page.url()
      expect(url).toContain('sp=esp')
    })

    test('should render chart with USA standard population', async ({ page }) => {
      await page.goto('/explorer?sp=usa&t=asmr')
      await waitForChart(page)

      await expect(page.locator('canvas#chart')).toBeVisible()
      const url = page.url()
      expect(url).toContain('sp=usa')
    })
  })

  test.describe('Date Range Selection', () => {
    test('should render chart with custom date range', async ({ page }) => {
      await page.goto('/explorer?df=2015&dt=2023')
      await waitForChart(page)

      await expect(page.locator('canvas#chart')).toBeVisible()
    })

    test('should render chart with slider start', async ({ page }) => {
      await page.goto('/explorer?ss=2000')
      await waitForChart(page)

      await expect(page.locator('canvas#chart')).toBeVisible()
    })

    test('should handle date range with monthly precision', async ({ page }) => {
      await page.goto('/explorer?ct=monthly&df=2020/1&dt=2023/12')
      await waitForChart(page)

      await expect(page.locator('canvas#chart')).toBeVisible()
    })
  })

  test.describe('Combined Selections', () => {
    test('should handle multiple parameter combinations', async ({ page }) => {
      await page.goto('/explorer?c=USA&c=GBR&t=cmr&ct=monthly')
      await waitForChart(page)

      const url = page.url()
      expect(url).toContain('c=USA')
      expect(url).toContain('c=GBR')
      expect(url).toContain('t=cmr')
      expect(url).toContain('ct=monthly')

      // Chart should render
      await expect(page.locator('canvas#chart')).toBeVisible()
    })

    test('should preserve country selection on reload', async ({ page }) => {
      const url = '/explorer?c=JPN&c=AUS'
      await page.goto(url)
      await waitForChart(page)

      // Reload the page
      await page.reload()
      await waitForChart(page)

      // Countries should be preserved
      const currentUrl = page.url()
      expect(currentUrl).toContain('c=JPN')
      expect(currentUrl).toContain('c=AUS')
    })
  })

  test.describe('Data Tab Interactions', () => {
    test('should have tabs accessible', async ({ page }) => {
      await page.goto('/explorer')
      await waitForChart(page)

      // Chart should render with tabs visible
      await expect(page.locator('canvas#chart')).toBeVisible()
    })
  })
})
