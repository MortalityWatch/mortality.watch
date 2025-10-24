import { decodeChartState } from '../../app/lib/chartState'
import { renderPlaceholderChart } from '../utils/chartRenderer'
// TODO: These imports will be needed for full chart rendering implementation
// import { renderChart } from '../utils/chartRenderer'
// import { makeChartConfig } from '../../app/lib/chart/chartConfig'
// import type { ChartStyle } from '../../app/lib/chart/chartTypes'
// import { getAllChartData, loadCountryMetadata, updateDataset } from '../../app/data'

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

    // TODO: Implement full data fetching pipeline
    // This requires:
    // 1. Loading metadata with loadCountryMetadata()
    // 2. Loading raw dataset with updateDataset()
    // 3. Fetching chart data with getAllChartData()
    // 4. Generating config with makeChartConfig()
    //
    // For now, use placeholder until data pipeline is set up
    try {
      // const metadata = await loadCountryMetadata()
      // const rawData = await updateDataset(...)
      // const chartData = await getAllChartData(...)
      //
      // const config = makeChartConfig(
      //   state.chartStyle as ChartStyle,
      //   chartData as unknown as Array<Record<string, unknown>>,
      //   state.type === 'deaths',
      //   state.isExcess,
      //   state.type === 'le',
      //   state.type === 'population',
      //   state.showLabels,
      //   state.showPercentage ?? false,
      //   state.showPredictionInterval
      // )
      //
      // // Add the chart URL for QR code
      // const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'https://www.mortality.watch'
      // const chartUrl = `${siteUrl}/explorer?${new URLSearchParams(query as Record<string, string>).toString()}`
      // const configOptions = config.options as Record<string, unknown> || {}
      // const plugins = configOptions.plugins as Record<string, unknown> || {}
      // plugins.qrCodeUrl = chartUrl
      //
      // buffer = await renderChart(width, height, config, state.chartStyle as ChartStyle)

      // Temporary: Use placeholder
      buffer = await renderPlaceholderChart(width, height, title)
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
