import { chromium } from 'playwright'
import { chartRenderQueue, chartRenderThrottle } from '../utils/requestQueue'
import { generateCacheKey, getCachedChart, saveCachedChart } from '../utils/chartCache'
import {
  getClientIp,
  parseQueryParams,
  getDimensions,
  getChartResponseHeaders
} from '../utils/chartPngHelpers'

export default defineEventHandler(async (event) => {
  try {
    // Get client IP for throttling
    const clientIp = getClientIp(event)

    // Check throttle limit
    if (!chartRenderThrottle.check(clientIp)) {
      const remaining = chartRenderThrottle.getRemaining(clientIp)
      throw createError({
        statusCode: 429,
        message: 'Too many requests. Please try again later.',
        data: { remaining, resetIn: 60 }
      })
    }

    // Get and parse query parameters
    const query = getQuery(event)
    const queryParams = parseQueryParams(query as Record<string, unknown>)

    // Get dimensions from query or use defaults (OG image size)
    const { width, height } = getDimensions(query as Record<string, unknown>)

    // Generate cache key from query parameters (including width/height)
    const cacheKey = generateCacheKey({ ...queryParams, width, height })

    // Check filesystem cache first (7-day TTL)
    const cachedBuffer = await getCachedChart(cacheKey)
    if (cachedBuffer) {
      // Return cached version with 7-day Cache-Control
      setResponseHeaders(event, getChartResponseHeaders(cachedBuffer, [], true))
      return cachedBuffer
    }

    // Queue the screenshot rendering to limit concurrency
    const buffer = await chartRenderQueue.enqueue(async () => {
      let browser
      try {
        // Build the URL for the explorer page with all query params
        // Always use localhost for screenshots (can't screenshot external URL from server)
        const baseUrl = 'http://localhost:3000'

        // Remove width/height from query params (not part of chart state)
        const { width: _w, height: _h, ...chartParams } = queryParams
        const params = new URLSearchParams()
        Object.entries(chartParams).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v))
          } else {
            params.set(key, String(value))
          }
        })

        const explorerUrl = `${baseUrl}/explorer?${params.toString()}`

        logger.info('Screenshotting explorer page:', { url: explorerUrl })

        // Launch headless browser
        browser = await chromium.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        })

        const context = await browser.newContext({
          viewport: { width, height },
          deviceScaleFactor: 2, // 2x for high-DPI/retina displays
          // Set color scheme based on dm parameter
          colorScheme: queryParams.dm === '1' ? 'dark' : 'light'
        })

        const page = await context.newPage()

        // Navigate to explorer page with tutorial disabled
        await page.goto(`${explorerUrl}&skipTutorial=1`, {
          waitUntil: 'networkidle',
          timeout: 30000
        })

        // Wait for the chart canvas to load
        await page.waitForSelector('canvas', { timeout: 10000 })

        // Hide everything except the chart container
        await page.addStyleTag({
          content: `
            header { display: none !important; }
            footer { display: none !important; }
            #nuxt-devtools-container { display: none !important; }
            #nuxt-devtools { display: none !important; }
            [data-nuxt-devtools] { display: none !important; }
            .nuxt-devtools-overlay { display: none !important; }
            .nuxt-loading-indicator { display: none !important; }
            /* Hide everything except the chart */
            body > div:first-child > div:first-child > div:not(:has(canvas)) { display: none !important; }
          `
        })

        // Find the chart container element and take a screenshot
        const chartContainer = await page.locator('canvas').first()

        // Take screenshot of just the chart canvas
        const screenshot = await chartContainer.screenshot({
          type: 'png'
        })

        await browser.close()

        return Buffer.from(screenshot)
      } catch (screenshotError) {
        if (browser) {
          await browser.close().catch(() => {})
        }
        logger.error('Error taking explorer screenshot:', screenshotError instanceof Error ? screenshotError : new Error(String(screenshotError)))
        throw screenshotError
      }
    })

    // Save to filesystem cache (async, non-blocking)
    saveCachedChart(cacheKey, buffer).catch((err) => {
      logger.error('Failed to save chart screenshot to cache:', err instanceof Error ? err : new Error(String(err)))
    })

    // Set response headers with 7-day cache
    setResponseHeaders(event, getChartResponseHeaders(buffer, [], false))

    return buffer
  } catch (error) {
    logger.error('Error generating chart screenshot:', error instanceof Error ? error : new Error(String(error)))

    throw createError({
      statusCode: 500,
      message: `Failed to generate chart screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`
    })
  }
})
