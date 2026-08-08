import { test, expect, type Page } from '@playwright/test'

test.describe('Explorer Same Period', () => {
  async function waitForChart(page: Page) {
    await page.waitForLoadState('domcontentloaded')
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})
    await page.waitForSelector('canvas#chart', { timeout: 30000 })
  }

  test('renders monthly same-period defaults with an anchor-year selector', async ({ page }) => {
    await page.goto('/explorer?spc=1&ct=monthly&cyb=3')
    await waitForChart(page)

    await expect(page.getByText('Anchor', { exact: true })).toBeVisible()
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
})
