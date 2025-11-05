import { decodeChartState } from '../../app/lib/chartState'
import { renderPlaceholderChart, renderChart } from '../utils/chartRenderer'
import type { ChartStyle } from '../../app/lib/chart/chartTypes'
import { chartRenderQueue, chartRenderThrottle } from '../utils/requestQueue'
import { generateCacheKey, getCachedChart, saveCachedChart } from '../utils/chartCache'
import {
  getClientIp,
  parseQueryParams,
  getDimensions,
  generateChartTitle,
  setChartResponseHeaders,
  fetchChartData,
  transformChartData,
  generateChartConfig,
  generateChartUrl
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

    // Decode chart state from query params
    const state = decodeChartState(queryParams)

    // Get dimensions from query or use defaults (OG image size)
    const { width, height } = getDimensions(query as Record<string, unknown>)

    // Generate chart title from state
    const title = generateChartTitle(state)

    // Generate cache key from query parameters (including width/height)
    const cacheKey = generateCacheKey({ ...queryParams, width, height })

    // Check filesystem cache first (7-day TTL)
    const cachedBuffer = await getCachedChart(cacheKey)
    if (cachedBuffer) {
      // Return cached version with 7-day Cache-Control
      setChartResponseHeaders(event, cachedBuffer, state.countries, true)
      return cachedBuffer
    }

    // Queue the chart rendering to limit concurrency
    const buffer = await chartRenderQueue.enqueue(async () => {
      try {
        // 1. Fetch and process all chart data
        const { allCountries, allLabels, allChartData, isAsmrType } = await fetchChartData(state)

        // 2. Generate chart URL for QR code
        const chartUrl = generateChartUrl(query as Record<string, unknown>)

        // 3. Transform raw data to chart-ready format
        const { chartData, isDeathsType, isLE, isPopulationType } = await transformChartData(
          state,
          allCountries,
          allLabels,
          allChartData,
          chartUrl,
          isAsmrType
        )

        // 4. Generate chart config
        const config = generateChartConfig(
          state,
          chartData,
          isDeathsType,
          isLE,
          isPopulationType,
          chartUrl
        )

        // 5. Render the chart
        return await renderChart(width, height, config, state.chartStyle as ChartStyle)
      } catch (dataError) {
        console.error('Error fetching/rendering chart data:', dataError)
        // Fall back to placeholder on data errors
        return await renderPlaceholderChart(width, height, title)
      }
    })

    // Save to filesystem cache (async, non-blocking)
    saveCachedChart(cacheKey, buffer).catch((err) => {
      console.error('Failed to save chart to cache:', err)
    })

    // Set response headers with 7-day cache
    setChartResponseHeaders(event, buffer, state.countries, false)

    return buffer
  } catch (error) {
    console.error('Error generating chart:', error)

    throw createError({
      statusCode: 500,
      message: `Failed to generate chart: ${error instanceof Error ? error.message : 'Unknown error'}`
    })
  }
})
