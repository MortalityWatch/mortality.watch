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
  generateChartUrl,
  resolveChartStateForRendering
} from '../utils/chartPngHelpers'
import { dataLoader } from '../services/dataLoader'
import { renderChart } from '../utils/chartRenderer'

/**
 * Server-side chart PNG rendering endpoint
 *
 * Uses the unified state resolution pipeline (resolveChartStateForRendering)
 * to ensure SSR renders identically to the explorer UI.
 *
 * Resolution flow:
 * 1. Parse query params → preliminary state (for data loading)
 * 2. Load data to get allLabels
 * 3. Resolve full state with allLabels (applies constraints + effective defaults)
 * 4. Transform and render chart
 */
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
        // Generate chart URL for QR code
        const chartUrl = generateChartUrl(queryParams)

        // Step 1: Do preliminary state resolution to get data loading params
        // We need allLabels to compute effective date range, but we need
        // countries/chartType/ageGroups to load data first
        const preliminaryState = resolveChartStateForRendering(queryParams, [])

        // Step 2: Load data to get allLabels
        const rawData = await dataLoader.loadMortalityData({
          chartType: preliminaryState.chartType,
          countries: preliminaryState.countries,
          ageGroups: preliminaryState.ageGroups
        })

        const isAsmrType = preliminaryState.type.startsWith('asmr')
        const allLabels = dataLoader.getAllChartLabels(
          rawData,
          isAsmrType,
          preliminaryState.ageGroups,
          preliminaryState.countries,
          preliminaryState.chartType
        )

        // Validate that we have data to render
        if (allLabels.length === 0) {
          const countriesStr = preliminaryState.countries.join(', ')
          throw new Error(
            `No data available for ${countriesStr} (${preliminaryState.chartType}). `
            + 'The requested data may not exist or failed to load.'
          )
        }

        // Step 3: Now resolve full state with allLabels
        // This applies constraints AND computes effective date ranges
        const state = resolveChartStateForRendering(queryParams, allLabels)

        // Step 4: Fetch all required chart data with resolved state
        const { allCountries, allChartData } = await fetchChartData(state)

        // Step 5: Transform data into chart-ready format
        const { chartData, isDeathsType, isLE, isPopulationType } = await transformChartData(
          state,
          allCountries,
          allLabels,
          allChartData,
          chartUrl,
          isAsmrType
        )

        // Step 6: Generate chart configuration
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

        // Step 7: Render chart using server-side Canvas renderer
        return await renderChart(width, height, chartConfig, chartType, darkMode)
      } catch (renderError) {
        logger.error('Error rendering chart:', renderError instanceof Error ? renderError : new Error(String(renderError)))
        throw renderError
      }
    })

    // Save to filesystem cache (async, non-blocking)
    saveCachedChart(cacheKey, buffer).catch((err) => {
      logger.error('Failed to save chart to cache:', err instanceof Error ? err : new Error(String(err)))
    })

    // Set response headers with 7-day cache
    setResponseHeaders(event, getChartResponseHeaders(buffer, [], false))

    return buffer
  } catch (error) {
    logger.error('Error generating chart:', error instanceof Error ? error : new Error(String(error)))

    throw createError({
      statusCode: 500,
      message: `Failed to generate chart: ${error instanceof Error ? error.message : 'Unknown error'}`
    })
  }
})
