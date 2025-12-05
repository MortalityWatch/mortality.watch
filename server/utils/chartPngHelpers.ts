import type { H3Event } from 'h3'
import { dataLoader } from '../services/dataLoader'
import type { AllChartData, CountryData } from '../../app/model'
import { getKeyForType } from '../../app/model/utils'
import { getFilteredChartData } from '../../app/lib/chart/filtering'
import { getChartColors } from '../../app/colors'
import { makeChartConfig } from '../../app/lib/chart/chartConfig'
import { resolveChartStateForRendering, type ChartRenderState } from '../../app/lib/state/resolution'
import type { ChartStyle } from '../../app/lib/chart/chartTypes'

/**
 * Chart PNG generation helper functions
 * Extracted from chart.png.ts route to improve maintainability and testability
 *
 * Uses the unified state resolution pipeline from app/lib/state/core
 * to ensure SSR renders identically to the explorer UI.
 */

/**
 * Extract client IP address from request headers
 * @param event - H3 event object
 * @returns Client IP address or 'unknown'
 */
export function getClientIp(event: H3Event): string {
  return getRequestHeader(event, 'x-forwarded-for')
    || getRequestHeader(event, 'x-real-ip')
    || event.node.req.socket.remoteAddress
    || 'unknown'
}

/**
 * Parse query parameters from request
 * @param query - Raw query parameters
 * @returns Parsed query parameters
 */
export function parseQueryParams(query: Record<string, unknown>): Record<string, string | string[]> {
  return query as Record<string, string | string[]>
}

/**
 * Extract dimensions from query parameters with defaults
 * Default is 600×338 (Twitter/X size), rendered at 2x with devicePixelRatio
 * @param query - Query parameters
 * @returns Chart width and height
 */
export function getDimensions(query: Record<string, unknown>): { width: number, height: number } {
  const width = parseInt((query.width as string) || '600')
  const height = parseInt((query.height as string) || '338')
  return { width, height }
}

/**
 * Generate chart title from state
 * @param state - Resolved chart state
 * @returns Chart title string
 */
export function generateChartTitle(state: ChartRenderState): string {
  const countries = state.countries.join(', ')
  return `${state.type} - ${countries} (${state.chartType})`
}

/**
 * Generate filename-safe country string for Content-Disposition header
 * @param countries - Array of country codes/names
 * @returns Sanitized country string
 */
export function generateCountriesFilename(countries: string[]): string {
  if (!countries.length) return ''
  return countries.join('-')
}

/**
 * Generate response headers for chart PNG
 * @param buffer - PNG buffer
 * @param countries - Array of country codes/names
 * @param cacheHit - Whether response is from cache
 * @returns Headers object for chart PNG response
 */
export function getChartResponseHeaders(
  buffer: Buffer,
  countries: string[],
  cacheHit: boolean
): Record<string, string> {
  return {
    'Content-Type': 'image/png',
    'Content-Length': buffer.length.toString(),
    'Cache-Control': 'public, max-age=604800, immutable', // 7 days
    'X-Cache': cacheHit ? 'HIT' : 'MISS',
    'Content-Disposition': `inline; filename="mortality-chart${countries.length ? '-' + generateCountriesFilename(countries) : ''}.png"`
  }
}

/**
 * Determine the data key based on chart type
 * @param type - Chart type (cmr, asmr, le, deaths, population)
 * @returns Data key for chart data fetching
 */
export function getDataKey(type: string): string {
  if (type.startsWith('asmr')) {
    const standardPopulation = type.split('_')[1] || 'esp2013'
    return `asmr_${standardPopulation}`
  }

  const typeMap: Record<string, string> = {
    cmr: 'cmr',
    le: 'le',
    deaths: 'deaths'
  }

  return typeMap[type] || 'population'
}

/**
 * Fetch and process all chart data required for rendering using DataLoaderService
 * @param state - Resolved chart state
 * @returns Processed chart data ready for rendering
 */
export async function fetchChartData(state: ChartRenderState) {
  // 1. Load country metadata using DataLoaderService
  const allCountries = await dataLoader.loadCountryMetadata({ filterCountries: state.countries })

  // 2. Load raw dataset using DataLoaderService
  const rawData = await dataLoader.loadMortalityData({
    chartType: state.chartType,
    countries: state.countries,
    ageGroups: state.ageGroups
  })

  // 3. Get all chart labels using DataLoaderService
  const isAsmrType = state.type.startsWith('asmr')
  const allLabels = dataLoader.getAllChartLabels(
    rawData,
    isAsmrType,
    state.ageGroups,
    state.countries,
    state.chartType
  )

  // Validate that we have data to render
  if (allLabels.length === 0) {
    const countriesStr = state.countries.join(', ')
    throw new Error(
      `No data available for ${countriesStr} (${state.chartType}). `
      + 'The requested data may not exist or failed to load.'
    )
  }

  // 4. Fetch raw chart data using DataLoaderService
  const dataKey = getDataKey(state.type)

  // Get baseline keys for fetching (similar to useExplorerHelpers.getBaseKeysForFetch)
  // Population type doesn't need baseline
  // IMPORTANT: Pass isExcess=false to get baseline keys needed for calculation
  // The excess values are calculated from baseline, so we need the baseline keys
  // Pass showPredictionInterval to include PI upper/lower keys when needed
  const isPopulationType = state.type === 'population'
  const baseKeys = !isPopulationType
    ? getKeyForType(state.type, state.showBaseline, state.standardPopulation, false, state.showPredictionInterval)
    : undefined

  const allChartData: AllChartData = await dataLoader.getAllChartData({
    dataKey: dataKey as keyof CountryData,
    chartType: state.chartType,
    rawData,
    allLabels,
    startDateIndex: 0, // full range for OG images
    cumulative: state.cumulative,
    ageGroupFilter: state.ageGroups,
    countryCodeFilter: state.countries,
    baselineMethod: state.showBaseline ? state.baselineMethod : undefined,
    baselineDateFrom: state.baselineDateFrom,
    baselineDateTo: state.baselineDateTo,
    keys: baseKeys
  })

  return { allCountries, allLabels, allChartData, isAsmrType }
}

/**
 * Transform raw chart data into chart-ready format
 *
 * Uses the unified state resolution from app/lib/state/core to ensure
 * SSR renders identically to the explorer UI.
 *
 * @param state - Resolved chart state (from resolveChartStateForRendering)
 * @param allCountries - Country metadata
 * @param allLabels - Chart labels
 * @param allChartData - Raw chart data
 * @param chartUrl - Chart URL for QR code
 * @param isAsmrType - Whether chart is ASMR type
 * @returns Filtered and formatted chart data
 */
export async function transformChartData(
  state: ChartRenderState,
  allCountries: Awaited<ReturnType<typeof dataLoader.loadCountryMetadata>>,
  allLabels: string[],
  allChartData: AllChartData,
  chartUrl: string,
  isAsmrType: boolean
) {
  const colors = getChartColors()

  // Derive flags from resolved state
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
    state.baselineDateFrom,
    state.baselineDateTo,
    state.showTotal,
    state.chartType,
    state.dateFrom, // Already resolved to effective value
    state.dateTo, // Already resolved to effective value
    isBarChartStyle,
    allCountries,
    isErrorBarType,
    colors,
    isMatrixChartStyle,
    state.showPercentage,
    showCumPi,
    isAsmrType,
    state.maximize,
    state.showLabels,
    chartUrl,
    state.showLogarithmic,
    isPopulationType,
    isDeathsType,
    state.view,
    allLabels,
    allChartData.data
  )

  return { chartData, isDeathsType, isLE, isPopulationType, isExcess: state.isExcess }
}

/**
 * Generate chart configuration object
 * @param state - Resolved chart state
 * @param chartData - Transformed chart data
 * @param isDeathsType - Whether chart is deaths type
 * @param isLE - Whether chart is life expectancy type
 * @param isPopulationType - Whether chart is population type
 * @param chartUrl - Chart URL for QR code
 * @returns Chart configuration object
 */
export function generateChartConfig(
  state: ChartRenderState,
  chartData: unknown,
  isDeathsType: boolean,
  isLE: boolean,
  isPopulationType: boolean,
  chartUrl: string
) {
  const config = makeChartConfig(
    state.chartStyle as ChartStyle,
    chartData as unknown as Array<Record<string, unknown>>,
    isDeathsType,
    state.isExcess,
    isLE,
    isPopulationType,
    state.showLabels,
    state.showPercentage,
    state.showPredictionInterval
  )

  // Add the chart URL for QR code
  const configOptions = config.options as Record<string, unknown> || {}
  const plugins = configOptions.plugins as Record<string, unknown> || {}
  plugins.qrCodeUrl = chartUrl

  return config
}

/**
 * Generate chart URL from base URL and query parameters
 * @param query - Query parameters
 * @returns Full chart URL
 * @deprecated Use generateChartUrlFromState for resolved state
 */
export function generateChartUrl(query: Record<string, unknown>): string {
  const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'https://www.mortality.watch'
  return `${siteUrl}/explorer?${new URLSearchParams(query as Record<string, string>).toString()}`
}

/**
 * Generate chart URL from resolved state
 * This ensures the QR code URL matches what the client would generate
 * @param state - Resolved chart state
 * @returns Full chart URL with all state parameters
 */
export function generateChartUrlFromState(state: ChartRenderState): string {
  const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'https://www.mortality.watch'

  // Build URL params from resolved state using the same keys as fieldEncoders
  const params = new URLSearchParams()

  // Core fields
  if (state.countries.length) params.set('c', state.countries.join(','))
  params.set('t', state.type)
  params.set('ct', state.chartType)
  params.set('cs', state.chartStyle)

  // Date range
  if (state.dateFrom) params.set('df', state.dateFrom)
  if (state.dateTo) params.set('dt', state.dateTo)
  if (state.sliderStart) params.set('ss', state.sliderStart)

  // Baseline
  if (state.showBaseline) params.set('sb', '1')
  params.set('bm', state.baselineMethod)
  if (state.baselineDateFrom) params.set('bf', state.baselineDateFrom)
  if (state.baselineDateTo) params.set('bt', state.baselineDateTo)

  // Display options
  if (state.ageGroups.length && state.ageGroups[0] !== 'all') params.set('ag', state.ageGroups.join(','))
  if (state.standardPopulation && state.standardPopulation !== 'esp') params.set('sp', state.standardPopulation)
  if (state.cumulative) params.set('ce', '1')
  if (state.showTotal) params.set('st', '1')
  if (state.maximize) params.set('m', '1')
  if (state.showPredictionInterval) params.set('pi', '1')
  if (state.showLabels) params.set('sl', '1')
  if (state.showPercentage) params.set('p', '1')
  if (state.showLogarithmic) params.set('lg', '1')

  // View indicators
  if (state.isExcess) params.set('e', '1')
  if (state.isZScore) params.set('zs', '1')

  // Optional
  if (state.userColors?.length) params.set('uc', state.userColors.join(','))
  if (state.decimals && state.decimals !== 'auto') params.set('dec', state.decimals)

  return `${siteUrl}/explorer?${params.toString()}`
}

// Re-export the unified state resolution function for use in chart.png route
export { resolveChartStateForRendering, type ChartRenderState }
