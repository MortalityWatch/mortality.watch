import { decodeChartState } from '../../app/lib/chartState'
import { renderPlaceholderChart, renderChart } from '../utils/chartRenderer'
import { makeChartConfig } from '../../app/lib/chart/chartConfig'
import type { ChartStyle } from '../../app/lib/chart/chartTypes'
import { getAllChartData, loadCountryMetadata, updateDataset, getAllChartLabels } from '../../app/lib/data'
import type { AllChartData, CountryData } from '../../app/model'
import { getFilteredChartData } from '../../app/lib/chart/filtering'
import { getChartColors } from '../../app/colors'
import { decompress, base64ToArrayBuffer } from '../../app/lib/compression/compress.node'
import { chartRenderQueue, chartRenderThrottle } from '../utils/requestQueue'
import { generateCacheKey, getCachedChart, saveCachedChart } from '../utils/chartCache'

export default defineEventHandler(async (event) => {
  try {
    // Get client IP for throttling
    const clientIp = getRequestHeader(event, 'x-forwarded-for')
      || getRequestHeader(event, 'x-real-ip')
      || event.node.req.socket.remoteAddress
      || 'unknown'

    // Check throttle limit
    if (!chartRenderThrottle.check(clientIp)) {
      const remaining = chartRenderThrottle.getRemaining(clientIp)
      throw createError({
        statusCode: 429,
        message: 'Too many requests. Please try again later.',
        data: { remaining, resetIn: 60 }
      })
    }
    // Get query parameters
    const query = getQuery(event)

    // Support both compressed (qr) and expanded query params
    let queryParams = query as Record<string, string | string[]>

    // If compressed state is provided via 'qr' param, decompress it
    if (query.qr && typeof query.qr === 'string') {
      try {
        const decodedQr = decodeURIComponent(query.qr)
        const arrayBuffer = base64ToArrayBuffer(decodedQr)
        const decompressedJson = decompress(arrayBuffer)
        const compressedState = JSON.parse(decompressedJson)
        // Merge compressed state into query params (compressed takes precedence)
        queryParams = { ...query, ...compressedState }
      } catch (err) {
        console.error('Failed to decompress qr parameter:', err)
        // Fall back to using query params as-is
      }
    }

    // Decode chart state from query params
    const state = decodeChartState(queryParams)

    // Get dimensions from query or use defaults (OG image size)
    const width = parseInt((query.width as string) || '1200')
    const height = parseInt((query.height as string) || '630')

    // Generate chart title from state
    const countries = state.countries.join(', ')
    const title = `${state.type} - ${countries} (${state.chartType})`

    // Generate cache key from query parameters (including width/height)
    const cacheKey = generateCacheKey({ ...queryParams, width, height })

    // Check filesystem cache first (7-day TTL)
    const cachedBuffer = await getCachedChart(cacheKey)
    if (cachedBuffer) {
      // Return cached version with 7-day Cache-Control
      setResponseHeaders(event, {
        'Content-Type': 'image/png',
        'Content-Length': cachedBuffer.length.toString(),
        'Cache-Control': 'public, max-age=604800, immutable', // 7 days
        'X-Cache': 'HIT',
        'Content-Disposition': `inline; filename="mortality-chart-${countries.replace(/,/g, '_')}.png"`
      })
      return cachedBuffer
    }

    // Queue the chart rendering to limit concurrency
    const buffer = await chartRenderQueue.enqueue(async () => {
      try {
      // 1. Load country metadata (ensures metadata is cached for data fetching)
        const allCountries = await loadCountryMetadata({ filterCountries: state.countries })

        // 2. Load raw dataset with all necessary parameters
        const rawData = await updateDataset(
          state.chartType,
          state.countries,
          state.ageGroups
        )

        // 3. Get all chart labels
        const isAsmrType = state.type.startsWith('asmr')
        const allLabels = getAllChartLabels(
          rawData,
          isAsmrType,
          state.ageGroups,
          state.countries,
          state.chartType
        )

        // 4. Fetch raw chart data
        const dataKey = state.type === 'cmr'
          ? 'cmr'
          : state.type === 'asmr'
            ? `asmr_${state.standardPopulation}`
            : state.type === 'le'
              ? 'le'
              : state.type === 'deaths'
                ? 'deaths'
                : 'population'

        const allChartData: AllChartData = await getAllChartData(
          dataKey as keyof CountryData,
          state.chartType,
          rawData,
          allLabels,
          0, // startDateIndex - full range for OG images
          state.cumulative,
          state.ageGroups,
          state.countries,
          state.showBaseline ? state.baselineMethod : undefined,
          state.baselineDateFrom,
          state.baselineDateTo
        )

        // 5. Get chart colors
        const colors = getChartColors()

        // 6. Transform raw data to chart-ready format with titles, datasets, etc.
        const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'https://www.mortality.watch'
        const chartUrl = `${siteUrl}/explorer?${new URLSearchParams(query as Record<string, string>).toString()}`

        const isBarChartStyle = state.chartStyle === 'bar'
        const isErrorBarType = state.chartType === 'yearly' && state.showPredictionInterval
        const isMatrixChartStyle = state.chartStyle === 'matrix'
        const showCumPi = state.cumulative && state.showPredictionInterval
        const isDeathsType = state.type === 'deaths'
        const isPopulationType = state.type === 'population'
        const isLE = state.type === 'le'

        const chartData = await getFilteredChartData(
          state.countries,
          state.standardPopulation,
          state.ageGroups,
          state.showPredictionInterval,
          state.isExcess,
          state.type,
          state.cumulative,
          state.showBaseline,
          state.baselineMethod,
          state.baselineDateFrom || '',
          state.baselineDateTo || '',
          state.showTotal,
          state.chartType,
          allLabels[0] || '', // dateFrom - full range
          allLabels[allLabels.length - 1] || '', // dateTo - full range
          isBarChartStyle,
          allCountries,
          isErrorBarType,
          colors,
          isMatrixChartStyle,
          state.showPercentage ?? false,
          showCumPi,
          isAsmrType,
          state.maximize,
          state.showLabels,
          chartUrl,
          state.isLogarithmic,
          isPopulationType,
          isDeathsType,
          allLabels,
          allChartData.data
        )

        // 7. Generate chart config
        const config = makeChartConfig(
          state.chartStyle as ChartStyle,
          chartData as unknown as Array<Record<string, unknown>>,
          isDeathsType,
          state.isExcess,
          isLE,
          isPopulationType,
          state.showLabels,
          state.showPercentage ?? false,
          state.showPredictionInterval
        )

        // 8. Add the chart URL for QR code
        const configOptions = config.options as Record<string, unknown> || {}
        const plugins = configOptions.plugins as Record<string, unknown> || {}
        plugins.qrCodeUrl = chartUrl

        // 9. Render the chart
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
    setResponseHeaders(event, {
      'Content-Type': 'image/png',
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'public, max-age=604800, immutable', // 7 days
      'X-Cache': 'MISS',
      'Content-Disposition': `inline; filename="mortality-chart-${countries.replace(/,/g, '_')}.png"`
    })

    return buffer
  } catch (error) {
    console.error('Error generating chart:', error)

    throw createError({
      statusCode: 500,
      message: `Failed to generate chart: ${error instanceof Error ? error.message : 'Unknown error'}`
    })
  }
})
