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
    const cacheKey = generateCacheKey({ ...queryParams, width, height, type: 'ranking' })

    // Skip cache in dev mode for easier debugging
    const isDev = import.meta.dev

    // Check filesystem cache first (7-day TTL) - skip in dev mode
    if (!isDev) {
      const cachedBuffer = await getCachedChart(cacheKey)
      if (cachedBuffer) {
        // Return cached version with 7-day Cache-Control
        setResponseHeaders(event, getChartResponseHeaders(cachedBuffer, [], true))
        return cachedBuffer
      }
    }

    // Queue the screenshot rendering to limit concurrency
    const buffer = await chartRenderQueue.enqueue(async () => {
      let browser
      try {
        // Build the URL for the ranking page with all query params
        // Always use localhost for screenshots (can't screenshot external URL from server)
        // Use PORT env var (set by Dokku/production) or default to 3000 (dev)
        const port = process.env.PORT || process.env.NITRO_PORT || '3000'
        const baseUrl = `http://localhost:${port}`

        // Remove width/height from query params (not part of ranking state)
        const { width: _w, height: _h, ...rankingParams } = queryParams
        const params = new URLSearchParams()
        Object.entries(rankingParams).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v))
          } else {
            params.set(key, String(value))
          }
        })

        const rankingUrl = `${baseUrl}/ranking?${params.toString()}`

        logger.info('Screenshotting ranking page:', { url: rankingUrl })

        // Launch headless browser
        browser = await chromium.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        })

        // Use a very wide viewport to ensure the full table width is captured
        // Height doesn't matter since we're screenshotting just the table element
        const context = await browser.newContext({
          viewport: { width: 2400, height: 1600 },
          deviceScaleFactor: 2, // 2x for high-DPI/retina displays
          // Set color scheme based on dm parameter
          colorScheme: queryParams.dm === '1' ? 'dark' : 'light'
        })

        const page = await context.newPage()

        // Navigate to ranking page with tutorial disabled
        await page.goto(`${rankingUrl}&skipTutorial=1`, {
          waitUntil: 'networkidle',
          timeout: 30000
        })

        // Wait for the table to load
        await page.waitForSelector('table', { timeout: 10000 })

        // Hide header, navigation, footer, and dev overlays
        await page.addStyleTag({
          content: `
            header { display: none !important; }
            footer { display: none !important; }
            #nuxt-devtools-container { display: none !important; }
            #nuxt-devtools { display: none !important; }
            [data-nuxt-devtools] { display: none !important; }
            .nuxt-devtools-overlay { display: none !important; }
            .nuxt-loading-indicator { display: none !important; }
          `
        })

        // Find the table element and take a screenshot of just the table
        const tableElement = await page.locator('table').first()

        // Take screenshot of just the table element (full height)
        const screenshot = await tableElement.screenshot({
          type: 'png'
        })

        await browser.close()

        return Buffer.from(screenshot)
      } catch (screenshotError) {
        if (browser) {
          await browser.close().catch(() => {})
        }
        logger.error('Error taking ranking screenshot:', screenshotError instanceof Error ? screenshotError : new Error(String(screenshotError)))
        throw screenshotError
      }
    })

    // Save to filesystem cache (async, non-blocking) - skip in dev mode
    if (!isDev) {
      saveCachedChart(cacheKey, buffer).catch((err) => {
        logger.error('Failed to save ranking screenshot to cache:', err instanceof Error ? err : new Error(String(err)))
      })
    }

    // Set response headers with 7-day cache
    setResponseHeaders(event, getChartResponseHeaders(buffer, [], false))

    return buffer
  } catch (error) {
    logger.error('Error generating ranking screenshot:', error instanceof Error ? error : new Error(String(error)))

    throw createError({
      statusCode: 500,
      message: `Failed to generate ranking screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`
    })
  }
})
