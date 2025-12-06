import { test, expect } from '@playwright/test'
import { compareCharts } from '../utils/chartComparison'
import { login } from './helpers/auth'

/**
 * Visual Parity Test: SSR vs Client Chart Rendering
 *
 * Compares the SSR-rendered chart.png with the client-side screenshot
 * to ensure visual consistency.
 *
 * Uses Twitter/X preset (600x338 @ 2x = 1200x676) for consistent dimensions.
 * Runs on chromium only with 2x deviceScaleFactor (configured in playwright.config.ts)
 */

const SSR_TIMEOUT = 30000
const MAX_DIFF_PERCENT = 15

test.describe('Chart Visual Parity: SSR vs Client', () => {
  test('default chart: SSR chart.png matches client screenshot', async ({ page, context }) => {
    // Login to dismiss tutorial and access features
    await login(page)

    // Navigate to explorer
    await page.goto('/explorer')
    await page.waitForLoadState('networkidle')

    // Wait for chart to render
    await page.waitForSelector('canvas#chart', { state: 'visible', timeout: 15000 })
    await page.waitForTimeout(1500) // Wait for Chart.js animations

    // Dismiss tutorial if visible
    const closeButton = page.getByText('×')
    if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeButton.click()
      await page.waitForTimeout(300)
    }

    // Click on Display tab and select Twitter/X size
    await page.getByRole('button', { name: 'Display' }).click()
    await page.waitForTimeout(300)
    await page.getByRole('combobox').filter({ hasText: 'Auto' }).click()
    await page.getByRole('option', { name: 'Twitter/X' }).click()
    await page.waitForTimeout(500)

    // Wait for chart to resize
    await page.waitForSelector('canvas#chart', { state: 'visible' })
    await page.waitForTimeout(1000)

    // Capture client screenshot via Screenshot button
    const [clientDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Screenshot Capture current' }).click()
    ])

    const fs = await import('fs')
    const clientPath = await clientDownload.path()
    const clientBuffer = await fs.promises.readFile(clientPath!)

    const { PNG } = await import('pngjs')
    const clientPng = PNG.sync.read(clientBuffer)
    console.log(`Client screenshot: ${clientPng.width}x${clientPng.height}`)

    // Capture SSR chart via Download Chart button (opens chart.png in new tab)
    const [ssrPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: 'Download Chart Optimized PNG' }).click()
    ])

    // Get the chart.png URL and fetch it directly to get raw PNG bytes
    const ssrUrl = ssrPage.url()
    await ssrPage.close()

    const response = await page.request.get(ssrUrl, { timeout: SSR_TIMEOUT })
    expect(response.ok()).toBeTruthy()
    const ssrBuffer = await response.body()

    const ssrPng = PNG.sync.read(ssrBuffer)
    console.log(`SSR chart.png: ${ssrPng.width}x${ssrPng.height}`)

    // Compare pixels
    const result = await compareCharts(ssrBuffer, clientBuffer)
    console.log(`Pixel difference: ${result.mismatchPercent.toFixed(2)}%`)

    // Save debug images
    if (process.env.SAVE_DEBUG_IMAGES === '1') {
      const path = await import('path')
      const debugDir = path.join(process.cwd(), 'test-results', 'debug')
      await fs.promises.mkdir(debugDir, { recursive: true })
      await fs.promises.writeFile(path.join(debugDir, 'ssr.png'), ssrBuffer)
      await fs.promises.writeFile(path.join(debugDir, 'client.png'), clientBuffer)
      await fs.promises.writeFile(path.join(debugDir, 'diff.png'), result.diffImage)
    }

    expect(result.mismatchPercent).toBeLessThan(MAX_DIFF_PERCENT)
  })

  test('SSR endpoint returns valid PNG', async ({ request }) => {
    const response = await request.get('/chart.png', { timeout: SSR_TIMEOUT })
    expect(response.ok()).toBeTruthy()
    expect(response.headers()['content-type']).toBe('image/png')

    const buffer = await response.body()
    expect(buffer.length).toBeGreaterThan(1000)
  })
})
