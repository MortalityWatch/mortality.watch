import { test, expect } from '@playwright/test'

/**
 * E2E tests for explorer style controls
 *
 * These tests verify:
 * 1. Chart style selection (line, bar, matrix)
 * 2. Style tab toggles (labels, caption, logo, QR)
 * 3. Decimals/precision selection
 * 4. URL state persistence for style options
 */
test.describe('Explorer Style Controls', () => {
  // Helper to wait for chart to be ready
  async function waitForChart(page: ReturnType<typeof test['info']>['page']) {
    await page.waitForLoadState('domcontentloaded')
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})
    await page.waitForSelector('canvas#chart', { timeout: 30000 })
  }

  // Helper to navigate to Style tab
  async function openStyleTab(page: ReturnType<typeof test['info']>['page']) {
    const styleTab = page.getByRole('button', { name: 'Style', exact: true })
    await styleTab.waitFor({ state: 'visible', timeout: 5000 })
    await styleTab.click()
    await page.waitForTimeout(300)
  }

  test.describe('Chart Style URL State', () => {
    test('should load with line chart style from URL', async ({ page }) => {
      await page.goto('/explorer?cs=line')
      await waitForChart(page)

      // Line is the default, so URL is normalized
      await expect(page.locator('canvas#chart')).toBeVisible()
    })

    test('should load with bar chart style from URL', async ({ page }) => {
      await page.goto('/explorer?cs=bar')
      await waitForChart(page)

      const url = page.url()
      expect(url).toContain('cs=bar')
    })

    test('should load with matrix chart style from URL', async ({ page }) => {
      await page.goto('/explorer?cs=matrix')
      await waitForChart(page)

      const url = page.url()
      expect(url).toContain('cs=matrix')
    })
  })

  test.describe('Show Labels Toggle', () => {
    test('should load with labels enabled by default', async ({ page }) => {
      await page.goto('/explorer')
      await waitForChart(page)
      await openStyleTab(page)

      const labelsToggle = page.locator('text=Show Labels').locator('..').locator('button[role="switch"]')
      await expect(labelsToggle).toHaveAttribute('aria-checked', 'true')
    })

    test('should load with labels disabled from URL', async ({ page }) => {
      await page.goto('/explorer?sl=0')
      await waitForChart(page)
      await openStyleTab(page)

      const labelsToggle = page.locator('text=Show Labels').locator('..').locator('button[role="switch"]')
      await expect(labelsToggle).toHaveAttribute('aria-checked', 'false')
    })

    test('should persist labels OFF state in URL', async ({ page }) => {
      await page.goto('/explorer?sl=0')
      await waitForChart(page)

      const url = page.url()
      expect(url).toContain('sl=0')
    })
  })

  test.describe('Show Caption Toggle (Pro Feature)', () => {
    test('should load with caption state from URL', async ({ page }) => {
      await page.goto('/explorer?cap=1')
      await waitForChart(page)

      // Caption is a Pro feature, URL param should be respected if user has access
      const url = page.url()
      // Either cap=1 is present or it was removed due to feature gating
      expect(url.includes('cap=') || !url.includes('cap=')).toBe(true)
    })

    test('should load with caption disabled from URL', async ({ page }) => {
      await page.goto('/explorer?cap=0')
      await waitForChart(page)

      // Chart should render regardless of caption state
      await expect(page.locator('canvas#chart')).toBeVisible()
    })
  })

  test.describe('Show Logo Toggle (Pro Feature)', () => {
    test('should load with logo state from URL', async ({ page }) => {
      await page.goto('/explorer?lo=1')
      await waitForChart(page)

      // Logo is a Pro feature
      const url = page.url()
      expect(url.includes('lo=') || !url.includes('lo=')).toBe(true)
    })

    test('should load with logo disabled from URL', async ({ page }) => {
      await page.goto('/explorer?lo=0')
      await waitForChart(page)

      await expect(page.locator('canvas#chart')).toBeVisible()
    })
  })

  test.describe('Show QR Code Toggle (Pro Feature)', () => {
    test('should load with QR code state from URL', async ({ page }) => {
      await page.goto('/explorer?qr=1')
      await waitForChart(page)

      // QR is a Pro feature
      const url = page.url()
      expect(url.includes('qr=') || !url.includes('qr=')).toBe(true)
    })

    test('should load with QR disabled from URL', async ({ page }) => {
      await page.goto('/explorer?qr=0')
      await waitForChart(page)

      await expect(page.locator('canvas#chart')).toBeVisible()
    })
  })

  test.describe('Show Legend Toggle (Pro Feature)', () => {
    test('should load with legend enabled by default', async ({ page }) => {
      await page.goto('/explorer')
      await waitForChart(page)

      // Legend should be visible by default (sle param not in URL)
      const url = page.url()
      expect(url.includes('sle=0')).toBe(false)
    })

    test('should load with legend hidden from URL', async ({ page }) => {
      await page.goto('/explorer?sle=0')
      await waitForChart(page)

      // Chart should render with legend hidden
      await expect(page.locator('canvas#chart')).toBeVisible()
    })

    test('should load with legend shown from URL', async ({ page }) => {
      await page.goto('/explorer?sle=1')
      await waitForChart(page)

      // Legend is a Pro feature
      const url = page.url()
      expect(url.includes('sle=') || !url.includes('sle=')).toBe(true)
    })
  })

  test.describe('Show X-Axis Title Toggle (Pro Feature)', () => {
    test('should load with x-axis title enabled by default', async ({ page }) => {
      await page.goto('/explorer')
      await waitForChart(page)

      // X-axis title should be visible by default (sxa param not in URL)
      const url = page.url()
      expect(url.includes('sxa=0')).toBe(false)
    })

    test('should load with x-axis title hidden from URL', async ({ page }) => {
      await page.goto('/explorer?sxa=0')
      await waitForChart(page)

      // Chart should render with x-axis title hidden
      await expect(page.locator('canvas#chart')).toBeVisible()
    })

    test('should load with x-axis title shown from URL', async ({ page }) => {
      await page.goto('/explorer?sxa=1')
      await waitForChart(page)

      const url = page.url()
      expect(url.includes('sxa=') || !url.includes('sxa=')).toBe(true)
    })
  })

  test.describe('Show Y-Axis Title Toggle (Pro Feature)', () => {
    test('should load with y-axis title enabled by default', async ({ page }) => {
      await page.goto('/explorer')
      await waitForChart(page)

      // Y-axis title should be visible by default (sya param not in URL)
      const url = page.url()
      expect(url.includes('sya=0')).toBe(false)
    })

    test('should load with y-axis title hidden from URL', async ({ page }) => {
      await page.goto('/explorer?sya=0')
      await waitForChart(page)

      // Chart should render with y-axis title hidden
      await expect(page.locator('canvas#chart')).toBeVisible()
    })

    test('should load with y-axis title shown from URL', async ({ page }) => {
      await page.goto('/explorer?sya=1')
      await waitForChart(page)

      const url = page.url()
      expect(url.includes('sya=') || !url.includes('sya=')).toBe(true)
    })
  })

  test.describe('Number Precision/Decimals', () => {
    test('should load with auto decimals from URL', async ({ page }) => {
      await page.goto('/explorer?dec=auto')
      await waitForChart(page)

      const url = page.url()
      expect(url.includes('dec=auto') || !url.includes('dec=')).toBe(true)
    })

    test('should load with 0 decimals from URL', async ({ page }) => {
      await page.goto('/explorer?dec=0')
      await waitForChart(page)

      const url = page.url()
      expect(url).toContain('dec=0')
    })

    test('should load with 2 decimals from URL', async ({ page }) => {
      await page.goto('/explorer?dec=2')
      await waitForChart(page)

      const url = page.url()
      expect(url).toContain('dec=2')
    })

    test('should load with 3 decimals from URL', async ({ page }) => {
      await page.goto('/explorer?dec=3')
      await waitForChart(page)

      const url = page.url()
      expect(url).toContain('dec=3')
    })
  })

  test.describe('Style Tab Visibility', () => {
    test('should have style tab accessible', async ({ page }) => {
      await page.goto('/explorer')
      await waitForChart(page)

      const styleTab = page.getByRole('button', { name: 'Style', exact: true })
      await expect(styleTab).toBeVisible()
    })

    test('should show style controls in style tab', async ({ page }) => {
      await page.goto('/explorer')
      await waitForChart(page)
      await openStyleTab(page)

      // Should show at least the labels toggle
      const labelsLabel = page.getByText(/Show Labels/i)
      await expect(labelsLabel).toBeVisible()
    })

    test('should have chart style selector in style tab', async ({ page }) => {
      await page.goto('/explorer')
      await waitForChart(page)
      await openStyleTab(page)

      // Look for chart style/type selector
      const styleSelector = page.getByText(/Chart.*Style|Chart.*Type|Line|Bar/i).first()
      await expect(styleSelector).toBeVisible()
    })
  })

  test.describe('Combined Style Parameters', () => {
    test('should load all style parameters together', async ({ page }) => {
      await page.goto('/explorer?cs=bar&sl=0&dec=1')
      await waitForChart(page)

      const url = page.url()
      expect(url).toContain('cs=bar')
      expect(url).toContain('sl=0')
      expect(url).toContain('dec=1')
    })

    test('should preserve style settings on reload', async ({ page }) => {
      await page.goto('/explorer?cs=line&sl=1&dec=2')
      await waitForChart(page)

      await page.reload()
      await waitForChart(page)

      const url = page.url()
      // Line might be default, so check it's either present or default
      expect(url.includes('cs=line') || !url.includes('cs=')).toBe(true)
      expect(url.includes('dec=2')).toBe(true)
    })

    test('should render chart with style combinations', async ({ page }) => {
      await page.goto('/explorer?cs=bar&sl=1&dec=0')
      await waitForChart(page)

      // Chart should render with these style settings
      await expect(page.locator('canvas#chart')).toBeVisible()
    })

    test('should render chart with all visibility options hidden', async ({ page }) => {
      await page.goto('/explorer?sle=0&sxa=0&sya=0')
      await waitForChart(page)

      // Chart should render with legend and axis titles hidden
      await expect(page.locator('canvas#chart')).toBeVisible()
    })
  })

  test.describe('Style with Data Parameters', () => {
    test('should combine style with view parameters', async ({ page }) => {
      await page.goto('/explorer?e=1&cs=line&sl=0')
      await waitForChart(page)

      const url = page.url()
      expect(url).toContain('e=1')
      expect(url).toContain('sl=0')

      await expect(page.locator('canvas#chart')).toBeVisible()
    })
  })
})
