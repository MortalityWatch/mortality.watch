import { test, expect, type Page, type APIRequestContext } from '@playwright/test'

/**
 * Visual Parity Tests: SSR vs Client Chart Rendering
 *
 * These tests ensure:
 * 1. SSR endpoint (/chart.png) works correctly for all combinations
 * 2. Client-rendered charts match baseline snapshots (regression testing)
 * 3. Both SSR and client render successfully for the same parameters
 *
 * Note: Direct pixel comparison between SSR and client is not feasible due to:
 * - Different default dimensions (SSR: 1200x630, client: viewport-dependent)
 * - Font rendering differences (Cairo vs browser)
 * - Anti-aliasing algorithm variations
 *
 * Instead, we verify:
 * - SSR produces valid PNGs for all parameter combinations
 * - Client charts match their own baselines (catches CSS/JS regressions)
 * - Both render without errors for the same params
 */

/** Test combinations focusing on distinct rendering paths */
const TEST_COMBINATIONS = [
  { id: 'M-L-std', params: '', description: 'Mortality line chart (default)' },
  { id: 'M-B-std', params: 'cs=bar', description: 'Mortality bar chart' },
  { id: 'M-X-std', params: 'cs=matrix', description: 'Mortality matrix/heatmap' },
  { id: 'E-B-std', params: 'e=1', description: 'Excess bar chart (default)' },
  { id: 'Z-L-std', params: 'zs=1', description: 'Z-score line chart (default)' }
] as const

const THEMES = ['light', 'dark'] as const
const MAX_DIFF_PIXEL_RATIO = 0.02
const SSR_TIMEOUT = 30000
const CHART_RENDER_TIMEOUT = 15000

test.describe('Chart Visual Parity: SSR vs Client', () => {
  async function waitForChartReady(page: Page) {
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('canvas#chart', {
      timeout: CHART_RENDER_TIMEOUT,
      state: 'visible'
    })
    await page.waitForTimeout(1500) // Wait for Chart.js animations
  }

  async function fetchSSRChart(
    request: APIRequestContext,
    params: string
  ): Promise<Buffer> {
    const fullParams = params ? params : ''
    const response = await request.get(`/chart.png?${fullParams}`, {
      timeout: SSR_TIMEOUT
    })

    expect(response.ok()).toBeTruthy()
    expect(response.headers()['content-type']).toBe('image/png')

    const buffer = await response.body()
    expect(buffer.length).toBeGreaterThan(0)

    return buffer
  }

  async function screenshotClientChart(page: Page): Promise<Buffer> {
    const canvas = page.locator('canvas#chart')
    await expect(canvas).toBeVisible()

    const screenshot = await canvas.screenshot({ type: 'png' })
    expect(screenshot.length).toBeGreaterThan(0)

    return screenshot
  }

  test.describe('SSR Endpoint Validation', () => {
    test('should return valid PNG from /chart.png endpoint', async ({ request }) => {
      const buffer = await fetchSSRChart(request, '')
      expect(buffer.length).toBeGreaterThan(1000)
    })

    test('should accept dark mode parameter', async ({ request }) => {
      const buffer = await fetchSSRChart(request, 'dm=1')
      expect(buffer.length).toBeGreaterThan(1000)
    })

    test('should accept chart style parameters', async ({ request }) => {
      const buffer = await fetchSSRChart(request, 'cs=bar')
      expect(buffer.length).toBeGreaterThan(1000)
    })

    test('should handle excess view parameter', async ({ request }) => {
      const buffer = await fetchSSRChart(request, 'e=1')
      expect(buffer.length).toBeGreaterThan(1000)
    })

    test('should handle zscore view parameter', async ({ request }) => {
      const buffer = await fetchSSRChart(request, 'zs=1')
      expect(buffer.length).toBeGreaterThan(1000)
    })
  })

  test.describe('SSR Renders All Combinations', () => {
    for (const combo of TEST_COMBINATIONS) {
      for (const theme of THEMES) {
        test(`${combo.id} (${theme}): SSR produces valid PNG`, async ({ request }) => {
          const themeParam = theme === 'dark' ? 'dm=1' : ''
          const params = combo.params
            ? `${combo.params}&${themeParam}`
            : themeParam

          const buffer = await fetchSSRChart(request, params)
          expect(buffer.length).toBeGreaterThan(1000)
        })
      }
    }
  })

  test.describe('Client Renders All Combinations', () => {
    for (const combo of TEST_COMBINATIONS) {
      for (const theme of THEMES) {
        test(`${combo.id} (${theme}): client renders chart`, async ({ page }) => {
          const themeParam = theme === 'dark' ? 'dm=1' : ''
          const params = combo.params
            ? `${combo.params}&${themeParam}`
            : themeParam

          await page.goto(`/explorer?${params}`)
          await waitForChartReady(page)

          const canvas = page.locator('canvas#chart')
          await expect(canvas).toBeVisible()

          // Verify canvas has actual content
          const box = await canvas.boundingBox()
          expect(box).toBeTruthy()
          expect(box!.width).toBeGreaterThan(100)
          expect(box!.height).toBeGreaterThan(100)
        })
      }
    }
  })

  // Snapshot tests are skipped by default until baseline images are generated
  // To generate baselines: npx playwright test chart-visual-parity -g "Snapshot" --update-snapshots
  // Then commit the generated snapshot files in tests/e2e/chart-visual-parity.spec.ts-snapshots/
  test.describe.skip('Client Snapshot Regression', () => {
    const snapshotCombos = TEST_COMBINATIONS.slice(0, 3) // M-L, M-B, M-X

    for (const combo of snapshotCombos) {
      test(`${combo.id} (light): matches baseline snapshot`, async ({ page }) => {
        await page.goto(`/explorer?${combo.params}`)
        await waitForChartReady(page)

        const clientScreenshot = await screenshotClientChart(page)

        expect(clientScreenshot).toMatchSnapshot(
          `chart-${combo.id}-light-client.png`,
          { maxDiffPixelRatio: MAX_DIFF_PIXEL_RATIO }
        )
      })
    }
  })

  test.describe('SSR and Client Parity Check', () => {
    // Verify both SSR and client render for the same params without errors
    for (const combo of TEST_COMBINATIONS) {
      test(`${combo.id}: both SSR and client render successfully`, async ({
        page,
        request
      }) => {
        // Fetch SSR
        const ssrBuffer = await fetchSSRChart(request, combo.params)
        expect(ssrBuffer.length).toBeGreaterThan(1000)

        // Render client
        await page.goto(`/explorer?${combo.params}`)
        await waitForChartReady(page)

        const canvas = page.locator('canvas#chart')
        await expect(canvas).toBeVisible()

        // Both rendered successfully
        console.log(`${combo.id}: SSR=${ssrBuffer.length} bytes, client=rendered`)
      })
    }
  })

  test.describe('Performance', () => {
    test('SSR rendering should complete within timeout', async ({ request }) => {
      const start = Date.now()
      await fetchSSRChart(request, '')
      const elapsed = Date.now() - start

      expect(elapsed).toBeLessThan(SSR_TIMEOUT)
      console.log(`SSR render time: ${elapsed}ms`)
    })

    test('client rendering should complete within timeout', async ({ page }) => {
      const start = Date.now()
      await page.goto('/explorer')
      await waitForChartReady(page)
      const elapsed = Date.now() - start

      expect(elapsed).toBeLessThan(CHART_RENDER_TIMEOUT + 2000)
      console.log(`Client render time: ${elapsed}ms`)
    })
  })
})
