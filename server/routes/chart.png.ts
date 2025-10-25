import { decodeChartState } from '../../app/lib/chartState'
import { renderPlaceholderChart, renderChart } from '../utils/chartRenderer'
import { makeChartConfig } from '../../app/lib/chart/chartConfig'
import type { ChartStyle } from '../../app/lib/chart/chartTypes'
import { getAllChartData, loadCountryMetadata, updateDataset, getAllChartLabels } from '../../app/data'
import type { AllChartData } from '../../app/model'

export default defineEventHandler(async (event) => {
  try {
    // Get query parameters
    const query = getQuery(event)

    // Decode chart state from query params
    const state = decodeChartState(query as Record<string, string | string[]>)

    // Get dimensions from query or use defaults (OG image size)
    const width = parseInt((query.width as string) || '1200')
    const height = parseInt((query.height as string) || '630')

    // Generate chart title from state
    const countries = state.countries.join(', ')
    const title = `${state.type} - ${countries} (${state.chartType})`

    let buffer: Buffer

    try {
      // 1. Load country metadata (ensures metadata is cached for data fetching)
      await loadCountryMetadata({ allowCache: true })

      // 2. Load raw dataset with all necessary parameters
      const rawData = await updateDataset(
        state.chartType,
        state.ageGroupFilter,
        state.countries,
        { allowCache: true }
      )

      // 3. Get all chart labels
      const allLabels = getAllChartLabels(state.chartType, rawData)

      // 4. Fetch chart data
      const dataKey = state.type === 'cmr'
        ? 'cmr'
        : state.type === 'asmr'
          ? `asmr_${state.standardPopulation}`
          : state.type === 'le'
            ? 'le'
            : state.type === 'deaths'
              ? 'deaths'
              : 'population'

      const chartData: AllChartData = await getAllChartData(
        dataKey as keyof typeof rawData.all,
        state.chartType,
        rawData,
        allLabels,
        0, // startDateIndex - full range for OG images
        state.cumulative,
        state.ageGroupFilter,
        state.countries,
        state.showBaseline ? state.baselineMethod : undefined,
        state.baselineDateFrom,
        state.baselineDateTo
      )

      // 5. Generate chart config
      const config = makeChartConfig(
        state.chartStyle as ChartStyle,
        chartData as unknown as Array<Record<string, unknown>>,
        state.type === 'deaths',
        state.isExcess,
        state.type === 'le',
        state.type === 'population',
        state.showLabels,
        state.showPercentage ?? false,
        state.showPredictionInterval
      )

      // 6. Add the chart URL for QR code
      const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'https://www.mortality.watch'
      const chartUrl = `${siteUrl}/explorer?${new URLSearchParams(query as Record<string, string>).toString()}`
      const configOptions = config.options as Record<string, unknown> || {}
      const plugins = configOptions.plugins as Record<string, unknown> || {}
      plugins.qrCodeUrl = chartUrl

      // 7. Render the chart
      buffer = await renderChart(width, height, config, state.chartStyle as ChartStyle)
    } catch (dataError) {
      console.error('Error fetching/rendering chart data:', dataError)
      // Fall back to placeholder on data errors
      buffer = await renderPlaceholderChart(width, height, title)
    }

    // Set response headers
    setResponseHeaders(event, {
      'Content-Type': 'image/png',
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
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
