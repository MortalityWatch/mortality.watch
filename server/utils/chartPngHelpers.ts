import { type H3Event, getRequestHeader } from 'h3'
import { dataLoader } from '../services/dataLoader'
import type { AllChartData, CountryData, DatasetEntry } from '../../app/model'
import { ChartPeriod, type ChartType } from '../../app/model/period'
import { getKeyForType } from '../../app/model/utils'
import { getFilteredChartDataFromConfig } from '../../app/lib/chart/filtering'
import { makeBarLineChartConfig, makeMatrixChartConfig } from '../../app/lib/chart/chartConfig'
import type { MortalityChartData } from '../../app/lib/chart/chartTypes'
import {
  resolveChartStateForRendering,
  toChartFilterConfig,
  generateUrlFromState,
  computeShowCumPi,
  type ChartRenderState
} from '../../app/lib/state/resolution'
import { shouldShowLabels } from '../../app/lib/chart/labelVisibility'
import { metadataService } from '../../app/services/metadataService'
import { findCommonAdjustedEndLabel } from '../../app/lib/chart/steepDropDetection'
import {
  fetchASDFromStatsApi,
  buildAgeGroupInputs,
  alignASDToChartLabels,
  type ASDResult
} from '../../app/lib/asd'

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
 * Extract device pixel ratio from query parameters with default
 * Default is 2 for high-quality OG images, use 1 for thumbnails
 * @param query - Query parameters
 * @returns Device pixel ratio (1-3)
 */
export function getDevicePixelRatio(query: Record<string, unknown>): number {
  const dp = parseInt((query.dp as string) || '2')
  return Math.max(1, Math.min(3, dp))
}

/**
 * Extract zoom level from query parameters with default
 * Zoom renders chart at larger internal size, then scales down.
 * z > 1: text/elements appear larger (render bigger, scale down)
 * z < 1: text/elements appear smaller (render smaller, scale up)
 * Default is 1 (no zoom).
 * @param query - Query parameters
 * @returns Zoom level (0.25-4)
 */
export function getZoomLevel(query: Record<string, unknown>): number {
  const z = parseFloat((query.z as string) || '1')
  return Math.max(0.25, Math.min(4, z))
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
 * Fetch ASD data from the stats API for SSR
 *
 * Uses the shared ASD module for the core calculation logic,
 * ensuring identical behavior with the client-side useASDData.
 */
async function fetchASDDataForSSR(
  country: string,
  _chartType: ChartType,
  source: string,
  ageGroups: string[],
  baselineMethod: string,
  baselineDateFrom: string | undefined,
  baselineDateTo: string | undefined,
  rawData: Awaited<ReturnType<typeof dataLoader.loadMortalityData>>
): Promise<ASDResult | null> {
  const config = useRuntimeConfig()
  const statsUrl = ((config.public?.statsUrl as string) || 'https://stats.mortality.watch').replace(/\/+$/, '')

  // Build age group inputs using shared helper
  const ageGroupInputs = buildAgeGroupInputs(
    ageGroups,
    source,
    ageGroup => rawData[ageGroup]?.[country]
  )

  if (!ageGroupInputs) {
    console.warn(`[SSR ASD] No data found for source "${source}"`)
    return null
  }

  try {
    // Call shared ASD fetch function
    const result = await fetchASDFromStatsApi(ageGroupInputs, {
      statsUrl,
      baselineMethod,
      baselineDateFrom,
      baselineDateTo,
      useTrend: baselineMethod === 'lin_reg'
    })

    if (!result) {
      console.warn('[SSR ASD] Insufficient age-stratified data for ASD calculation')
    }

    return result
  } catch (error) {
    console.error('[SSR ASD] Failed to fetch from stats API:', error)
    return null
  }
}

/**
 * Inject ASD data into allChartData for SSR
 *
 * Uses per-country source selection - each country uses its best available source
 * (with longest history), allowing USA to use CDC (from 1999) while Sweden uses
 * eurostat (from 2000).
 *
 * Uses the shared alignASDToChartLabels helper for consistent alignment logic.
 */
async function injectASDDataForSSR(
  state: ChartRenderState,
  allChartData: AllChartData,
  rawData: Awaited<ReturnType<typeof dataLoader.loadMortalityData>>,
  countryInfo: Map<string, { source: string, ageGroups: string[] }>
): Promise<void> {
  if (state.type !== 'asd') return

  const chartType = state.chartType as ChartType
  const chartLabels = allChartData.labels

  for (const country of state.countries) {
    const info = countryInfo.get(country)
    if (!info) {
      console.warn(`[SSR ASD] No source info for ${country}`)
      continue
    }

    const asdResult = await fetchASDDataForSSR(
      country,
      chartType,
      info.source,
      info.ageGroups,
      state.baselineMethod,
      state.baselineDateFrom,
      state.baselineDateTo,
      rawData
    )

    if (!asdResult) continue

    // Align ASD data to chart labels using shared helper
    const aligned = alignASDToChartLabels(asdResult, chartLabels)

    // Inject into allChartData
    for (const ag of Object.keys(allChartData.data)) {
      const countryData = allChartData.data[ag]?.[country]
      if (countryData) {
        const record = countryData as unknown as Record<string, unknown>
        record['asd'] = aligned.asd
        record['asd_baseline'] = aligned.asd_bl
        record['asd_baseline_lower'] = aligned.lower
        record['asd_baseline_upper'] = aligned.upper
        record['asd_zscore'] = aligned.zscore
      }
    }
  }
}

/**
 * Fetch and process all chart data required for rendering using DataLoaderService
 * @param state - Resolved chart state
 * @returns Processed chart data ready for rendering
 */
export async function fetchChartData(state: ChartRenderState) {
  // 1. Load country metadata using DataLoaderService
  const allCountries = await dataLoader.loadCountryMetadata({ filterCountries: state.countries })

  // 2. For ASD, we need to load age-stratified data for the ASD calculation
  // Plus 'all' for the chart display
  // Each country uses its best available source (longest history)
  let ageGroupsToLoad = state.ageGroups
  const asdCountryInfo = new Map<string, { source: string, ageGroups: string[] }>()
  if (state.type === 'asd') {
    await metadataService.load()
    const chartType = state.chartType as ChartType

    // Collect all age groups needed across all countries
    const allAgeGroups = new Set<string>()

    for (const country of state.countries) {
      const sourceInfo = metadataService.getBestSourceForCountry(country, chartType)
      if (sourceInfo) {
        asdCountryInfo.set(country, {
          source: sourceInfo.source,
          ageGroups: sourceInfo.ageGroups
        })
        sourceInfo.ageGroups.forEach(ag => allAgeGroups.add(ag))
      }
    }

    if (allAgeGroups.size > 0) {
      // Include both 'all' (for chart display) and age-stratified (for ASD calculation)
      ageGroupsToLoad = [...new Set(['all', ...allAgeGroups])]
    }
  }

  // Load raw dataset using DataLoaderService
  const rawData = await dataLoader.loadMortalityData({
    chartType: state.chartType,
    countries: state.countries,
    ageGroups: ageGroupsToLoad
  })

  // 3. Get all chart labels using DataLoaderService
  // Use state.ageGroups (typically ['all']) to match client behavior
  // The age-stratified groups are only used for ASD calculation, not for label range
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
  // Use getKeyForType to compute dataKey - matches client's dataKey computed property
  // in useExplorerDataOrchestration.ts which uses getKeyForType(...)[0]
  const dataKey = getKeyForType(
    state.type,
    state.showBaseline,
    state.standardPopulation,
    false, // isExcess
    false, // includePi
    { leAdjusted: state.leAdjusted, chartType: state.chartType }
  )[0]

  // Get baseline keys for fetching (similar to useExplorerHelpers.getBaseKeysForFetch)
  // Population type doesn't need baseline
  // IMPORTANT: Always pass showBaseline=true (via !isPopulationType) to ensure baseline keys
  // are included for calculation. The excess values are calculated from baseline data,
  // so we always need the baseline keys even when baseline display is off.
  // This matches the client's getBaseKeysForFetch which passes !isPopulationType(), not showBaseline.
  const isPopulationType = state.type === 'population'
  const baseKeys = !isPopulationType
    ? getKeyForType(state.type, !isPopulationType, state.standardPopulation, false, state.showPredictionInterval, { leAdjusted: state.leAdjusted, chartType: state.chartType })
    : undefined

  // Calculate startDateIndex from sliderStart to match client behavior
  // This ensures baseline indices are calculated on the same label array as the client
  const period = new ChartPeriod(allLabels, state.chartType as ChartType)
  const startDateIndex = state.sliderStart ? period.indexOf(state.sliderStart) : 0

  // Use shared computeShowCumPi - same logic as client-side useExplorerHelpers.showCumPi()
  // This determines whether the /cum endpoint is used for cumulative baseline calculations
  const showCumPi = computeShowCumPi(state.cumulative, state.chartType, state.baselineMethod)

  const allChartData: AllChartData = await dataLoader.getAllChartData({
    dataKey: dataKey as keyof CountryData,
    chartType: state.chartType,
    rawData,
    allLabels,
    startDateIndex,
    cumulative: showCumPi,
    ageGroupFilter: state.ageGroups,
    countryCodeFilter: state.countries,
    // Always pass baselineMethod - excess mode needs baselines to calculate excess values
    // even though the baseline line itself isn't displayed
    baselineMethod: state.baselineMethod,
    baselineDateFrom: state.baselineDateFrom,
    baselineDateTo: state.baselineDateTo,
    keys: baseKeys
  })

  // Inject ASD data if type is 'asd'
  if (state.type === 'asd' && asdCountryInfo.size > 0) {
    await injectASDDataForSSR(state, allChartData, rawData, asdCountryInfo)
  }

  return { allCountries, allLabels, allChartData, isAsmrType }
}

/**
 * Transform raw chart data into chart-ready format
 *
 * Uses the unified toChartFilterConfig function to ensure SSR renders
 * identically to the explorer UI. Both paths now use the same conversion.
 *
 * @param state - Resolved chart state (from resolveChartStateForRendering)
 * @param allCountries - Country metadata
 * @param allLabels - Chart labels
 * @param allChartData - Raw chart data
 * @param chartUrl - Chart URL for QR code
 * @param _isAsmrType - Whether chart is ASMR type (now derived in toChartFilterConfig)
 * @returns Filtered and formatted chart data
 */
export async function transformChartData(
  state: ChartRenderState,
  allCountries: Awaited<ReturnType<typeof dataLoader.loadCountryMetadata>>,
  allLabels: string[],
  allChartData: AllChartData,
  chartUrl: string,
  _isAsmrType: boolean
) {
  // Use the unified toChartFilterConfig - colors computed internally
  const config = toChartFilterConfig(state, allCountries, chartUrl)

  // Use getFilteredChartDataFromConfig - same function as client
  const chartData = getFilteredChartDataFromConfig(config, allLabels, allChartData.data)

  // Derive return flags from config (already computed in toChartFilterConfig)
  const isDeathsType = config.isDeathsType
  const isPopulationType = config.isPopulationType
  const isLE = state.type === 'le'

  return { chartData, isDeathsType, isLE, isPopulationType, isExcess: state.isExcess }
}

/**
 * Check if chart data is empty (no valid data points in any dataset)
 * This catches cases like LE for countries with incompatible age group data
 */
export function isChartDataEmpty(chartData: MortalityChartData): boolean {
  // No datasets at all
  if (!chartData.datasets || chartData.datasets.length === 0) {
    return true
  }

  // Check if all datasets are empty or have only null/undefined values
  for (const dataset of chartData.datasets) {
    const data = dataset.data as (number | null | undefined | { y?: number | null })[]
    if (!data || data.length === 0) continue

    // Check if dataset has at least one valid data point
    for (const point of data) {
      if (point === null || point === undefined) continue
      // Handle object data points (e.g., { x, y } format)
      if (typeof point === 'object' && 'y' in point) {
        if (point.y !== null && point.y !== undefined) return false
      } else if (typeof point === 'number') {
        return false
      }
    }
  }

  return true
}

/**
 * Generate chart configuration object
 * @param state - Resolved chart state
 * @param chartData - Transformed chart data
 * @param isDeathsType - Whether chart is deaths type
 * @param isLE - Whether chart is life expectancy type
 * @param isPopulationType - Whether chart is population type
 * @param chartUrl - Chart URL for QR code
 * @param chartWidth - Chart width in pixels for label visibility calculation
 * @returns Chart configuration object
 */
export function generateChartConfig(
  state: ChartRenderState,
  chartData: unknown,
  isDeathsType: boolean,
  isLE: boolean,
  isPopulationType: boolean,
  chartUrl: string,
  chartWidth: number = 600
): Record<string, unknown> {
  // Use makeBarLineChartConfig or makeMatrixChartConfig directly to pass all params
  const isDark = state.darkMode ?? false

  // Cast chartData to MortalityChartData (structure is validated upstream)
  const data = chartData as unknown as MortalityChartData

  // Calculate effective showLabels with auto-hide logic
  // The client auto-hides labels when there are too many data points (dataPoints > chartWidth/20)
  // SSR needs to apply the same logic to match client behavior
  const dataPointCount = data.labels?.length || 0

  // When showLabels is true, pass undefined to enable auto-calculation
  // When showLabels is false, pass false to force labels off (user override)
  const userOverride = state.showLabels ? undefined : false
  const effectiveShowLabels = shouldShowLabels(dataPointCount, chartWidth, userOverride)

  // Override data.showLabels with effective value (same as client-side MortalityChart.vue)
  // This ensures bar/line charts also respect the auto-hide logic
  const dataWithEffectiveLabels = { ...data, showLabels: effectiveShowLabels }

  // Determine userTier for feature gating:
  // - If showLogo or showQrCode are explicitly false (e.g., for thumbnails), pass undefined
  //   to bypass tier-based enforcement and respect the explicit values
  // - Otherwise, pass 0 (PUBLIC tier) to enforce logo/QR for unauthenticated SSR
  const userTier = (!state.showLogo || !state.showQrCode) ? undefined : 0

  if (state.chartStyle === 'matrix') {
    const config = makeMatrixChartConfig(
      dataWithEffectiveLabels,
      state.isExcess,
      isLE,
      state.showPredictionInterval,
      state.showPercentage,
      dataWithEffectiveLabels.showLabels, // Use from data object for consistency
      isDeathsType,
      isPopulationType,
      state.showQrCode,
      state.showLogo,
      isDark,
      state.decimals,
      userTier,
      state.showCaption,
      state.showTitle,
      true, // isSSR
      state.showLegend,
      state.showXAxisTitle,
      state.showYAxisTitle,
      false // autoHideLegend - disabled for SSR, only used for explicit thumbnail requests
    )

    // Add the chart URL for QR code (only if showQrCode is true)
    if (state.showQrCode) {
      const configOptions = config.options as Record<string, unknown> || {}
      const plugins = configOptions.plugins as Record<string, unknown> || {}
      plugins.qrCodeUrl = chartUrl
    }

    return config as unknown as Record<string, unknown>
  } else {
    const config = makeBarLineChartConfig(
      dataWithEffectiveLabels,
      state.isExcess,
      state.showPredictionInterval,
      state.showPercentage,
      isDeathsType,
      isPopulationType,
      state.showQrCode,
      state.showLogo,
      state.decimals,
      isDark,
      userTier,
      state.showCaption,
      state.showTitle,
      true, // isSSR
      state.chartStyle as 'bar' | 'line',
      state.showLegend,
      state.showXAxisTitle,
      state.showYAxisTitle,
      false // autoHideLegend - disabled for SSR, only used for explicit thumbnail requests
    )

    // Add the chart URL for QR code (only if showQrCode is true)
    if (state.showQrCode) {
      const configOptions = config.options as Record<string, unknown> || {}
      const plugins = configOptions.plugins as Record<string, unknown> || {}
      plugins.qrCodeUrl = chartUrl
    }

    return config as unknown as Record<string, unknown>
  }
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
  return generateUrlFromState(state, siteUrl)
}

/**
 * Apply steep drop adjustment to chart state
 *
 * When hideSteepDrop is enabled, this function detects artificial drops
 * in recent data (caused by reporting delays) and adjusts dateTo to
 * exclude the affected periods.
 *
 * IMPORTANT: This only applies when the user hasn't explicitly set dateTo.
 * If the user specifies a date range, we respect their choice.
 *
 * @param state - Resolved chart state
 * @param allChartData - Fetched chart data containing labels and data series
 * @param queryParams - Original URL query params to check if dateTo was explicitly set
 * @returns Adjusted state with modified dateTo if steep drop detected
 */
export function applySteepDropAdjustment(
  state: ChartRenderState,
  allChartData: AllChartData,
  queryParams: Record<string, string | string[]>
): ChartRenderState {
  // Only apply if hideSteepDrop is enabled
  if (!state.hideSteepDrop) {
    return state
  }

  // Don't adjust if user explicitly set dateTo in URL
  // (dt is the URL key for dateTo)
  if (queryParams.dt) {
    return state
  }

  const labels = allChartData.labels
  if (labels.length === 0) {
    return state
  }

  // Extract data arrays for all countries and age groups
  // We use the primary metric field (deaths or asmr) for detection
  const dataArrays: (number | null)[][] = []
  const isAsmrType = state.type.startsWith('asmr')
  const metricField = isAsmrType
    ? `asmr_${state.standardPopulation}` as keyof DatasetEntry
    : 'deaths' as keyof DatasetEntry

  for (const ageGroup of state.ageGroups) {
    const ageData = allChartData.data[ageGroup]
    if (!ageData) continue

    for (const country of state.countries) {
      const countryData = ageData[country]
      if (!countryData) continue

      const metricData = countryData[metricField] as (number | null)[] | undefined
      if (metricData && Array.isArray(metricData)) {
        dataArrays.push(metricData)
      }
    }
  }

  if (dataArrays.length === 0) {
    return state
  }

  // Detect steep drop and get adjusted end label
  const adjustedEndLabel = findCommonAdjustedEndLabel(
    dataArrays,
    labels,
    state.chartType
  )

  if (!adjustedEndLabel) {
    return state
  }

  // Return new state with adjusted dateTo
  return {
    ...state,
    dateTo: adjustedEndLabel
  }
}

// Re-export the unified state resolution function for use in chart.png route
export { resolveChartStateForRendering, type ChartRenderState }
