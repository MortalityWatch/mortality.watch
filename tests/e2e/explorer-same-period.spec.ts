import { test, expect, type Page } from '@playwright/test'

test.describe('Explorer Same Period', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('mortality-watch-tutorial-explorer-completed', 'true')
    })
  })

  async function waitForChart(page: Page) {
    await page.waitForLoadState('domcontentloaded')
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})
    await page.waitForSelector('canvas#chart', { timeout: 30000 })
  }

  test('renders monthly same-period defaults with an anchor-year selector', async ({ page }) => {
    await page.goto('/explorer?spc=1&ct=monthly&cyb=3')
    await waitForChart(page)

    await expect(page.getByText('Anchor', { exact: true })).toBeVisible()
    await expect(page.getByText(/2026 Jan - 2026 Dec/)).toBeVisible()
    await page.waitForTimeout(1000)
    await expect(page.getByText('Date range adjusted to available data')).toHaveCount(0)
    await expect(page.getByText(/2026 Jan - 2026 Dec/)).toBeVisible()
    await expect(page.locator('canvas#chart')).toBeVisible()

    const hasRenderedPixels = await page.locator('canvas#chart').evaluate((canvas) => {
      const ctx = (canvas as HTMLCanvasElement).getContext('2d')
      if (!ctx) return false
      const { width, height } = canvas as HTMLCanvasElement
      const sample = ctx.getImageData(0, 0, width, height).data
      for (let index = 0; index < sample.length; index += 4) {
        if (sample[index + 3] !== 0 && (sample[index] !== 255 || sample[index + 1] !== 255 || sample[index + 2] !== 255)) {
          return true
        }
      }
      return false
    })
    expect(hasRenderedPixels).toBe(true)
  })

  test('preserves single-month bar comparison when switching analysis modes away and back', async ({ page }) => {
    await page.goto('/explorer?spc=1&c=DEU&ct=monthly&cs=bar&df=2026+Jun&dt=2026+Jun&m=1')
    await waitForChart(page)

    await expect(page.getByText(/2026 Jun - 2026 Jun/)).toBeVisible()
    expect(new URL(page.url()).searchParams.get('cs')).toBe('bar')
    expect(new URL(page.url()).searchParams.get('m')).toBe('1')

    await page.getByText('Raw Values', { exact: true }).click()
    await expect(page.getByText('From', { exact: true })).toBeVisible()

    await page.getByText('Same Period', { exact: true }).click()
    await expect(page.getByText('Anchor', { exact: true })).toBeVisible()
    await expect(page.getByText(/2026 Jun - 2026 Jun/)).toBeVisible()

    const params = new URL(page.url()).searchParams
    expect(params.get('spc')).toBe('1')
    expect(params.get('cs')).toBe('bar')
    expect(params.get('m')).toBe('1')
    expect(params.get('df')).toBe('2026 Jun')
    expect(params.get('dt')).toBe('2026 Jun')
    const chart = page.locator('canvas#chart')
    await expect(chart).toBeVisible()
    await expect(chart).toHaveAttribute('aria-label', /Series: 2021, 2022, 2023, 2024, 2025, 2026/)
  })
})
