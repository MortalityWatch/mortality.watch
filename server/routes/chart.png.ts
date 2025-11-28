import { chartRenderQueue, chartRenderThrottle } from '../utils/requestQueue'
import { generateCacheKey, getCachedChart, saveCachedChart } from '../utils/chartCache'
import {
  getClientIp,
  parseQueryParams,
  getDimensions,
  getChartResponseHeaders,
  fetchChartData,
  transformChartData,
  generateChartConfig,
  generateChartUrl
} from '../utils/chartPngHelpers'
import { decodeChartState } from '../../app/lib/chartState'
import { renderChart } from '../utils/chartRenderer'

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

    // Check for dark mode parameter
    const darkMode = queryParams.dm === '1' || queryParams.dm === 'true'

    // Get dimensions from query or use defaults (OG image size)
    const { width, height } = getDimensions(query as Record<string, unknown>)

    // Generate cache key from query parameters (including width/height and dark mode)
    const cacheKey = generateCacheKey({ ...queryParams, width, height, dm: darkMode ? '1' : '0' })

    // Check filesystem cache first (7-day TTL)
    const cachedBuffer = await getCachedChart(cacheKey)
    if (cachedBuffer) {
      // Return cached version with 7-day Cache-Control
      setResponseHeaders(event, getChartResponseHeaders(cachedBuffer, [], true))
      return cachedBuffer
    }

    // Queue the chart rendering to limit concurrency
    const buffer = await chartRenderQueue.enqueue(async () => {
      try {
        // Decode chart state from query parameters
        const state = decodeChartState(queryParams)

        // Generate chart URL for QR code
        const chartUrl = generateChartUrl(queryParams)

        // Fetch all required chart data
        const { allCountries, allLabels, allChartData, isAsmrType } = await fetchChartData(state)

        // Transform data into chart-ready format
        const { chartData, isDeathsType, isLE, isPopulationType } = await transformChartData(
          state,
          allCountries,
          allLabels,
          allChartData,
          chartUrl,
          isAsmrType,
          queryParams
        )

        // Generate chart configuration
        const chartConfig = generateChartConfig(
          state,
          chartData,
          isDeathsType,
          isLE,
          isPopulationType,
          chartUrl
        )

        // Determine chart type for renderer
        const chartType = state.chartStyle === 'bar'
          ? 'bar'
          : state.chartStyle === 'matrix'
            ? 'matrix'
            : 'line'

        // Render chart using server-side Canvas renderer
        return await renderChart(width, height, chartConfig, chartType, darkMode)
      } catch (renderError) {
        logger.error('Error rendering chart:', renderError instanceof Error ? renderError : new Error(String(renderError)))
        throw renderError
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
