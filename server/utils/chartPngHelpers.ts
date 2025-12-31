import { type H3Event, getRequestHeader } from 'h3'
import { dataLoader } from '../services/dataLoader'
import type { AllChartData, CountryData } from '../../app/model'
import { ChartPeriod, type ChartType } from '../../app/model/period'
import { getKeyForType } from '../../app/model/utils'
import { getFilteredChartDataFromConfig } from '../../app/lib/chart/filtering'
import { getChartColors } from '../../app/lib/chart/chartColors'
import { makeBarLineChartConfig, makeMatrixChartConfig } from '../../app/lib/chart/chartConfig'
import type { MortalityChartData } from '../../app/lib/chart/chartTypes'
import {
  resolveChartStateForRendering,
  toChartFilterConfig,
  generateUrlFromState,
  type ChartRenderState
} from '../../app/lib/state/resolution'
import { shouldShowLabels } from '../../app/lib/chart/labelVisibility'
import { metadataService } from '../../app/services/metadataService'

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
    deaths: 'deaths',
    asd: 'deaths' // ASD uses deaths as the base data key
  }

  return typeMap[type] || 'population'
}

interface ASDResult {
  asd: (number | null)[]
  asd_bl: (number | null)[]
  lower: (number | null)[]
  upper: (number | null)[]
  zscore: (number | null)[]
  labels: string[]
}

/**
 * Fetch ASD data from the stats API for SSR
 * This mirrors the client-side useASDData logic
 */
async function fetchASDDataForSSR(
  country: string,
  chartType: ChartType,
  source: string,
  ageGroups: string[],
  baselineMethod: string,
  baselineDateFrom: string | undefined,
  baselineDateTo: string | undefined,
  rawData: Awaited<ReturnType<typeof dataLoader.loadMortalityData>>
): Promise<ASDResult | null> {
  const config = useRuntimeConfig()
  const statsUrl = ((config.public?.statsUrl as string) || 'https://stats.mortality.watch').replace(/\/+$/, '')

  // Get all unique dates across age groups and filter by source
  const allDates = new Set<string>()
  const ageGroupDataMap = new Map<string, Map<string, { deaths: number | null, population: number | null }>>()

  for (const ageGroup of ageGroups) {
    const ageData = rawData[ageGroup]?.[country]
    if (!ageData) continue

    const dateMap = new Map<string, { deaths: number | null, population: number | null }>()
    for (const row of ageData) {
      if (row.source === source) {
        allDates.add(row.date)
        dateMap.set(row.date, { deaths: row.deaths ?? null, population: row.population ?? null })
      }
    }
    ageGroupDataMap.set(ageGroup, dateMap)
  }

  if (allDates.size === 0) {
    console.warn(`[SSR ASD] No data found for source "${source}"`)
    return null
  }

  // Sort dates
  const sortedDates = Array.from(allDates).sort()

  // Build age_groups array for the API
  const ageGroupsPayload: Array<{ deaths: (number | null)[], population: (number | null)[] }> = []
  const validAgeGroups: string[] = []
  const MIN_VALID_DATA_POINTS = 3

  for (const ageGroup of ageGroups) {
    const dateMap = ageGroupDataMap.get(ageGroup)
    if (!dateMap) continue

    const deaths: (number | null)[] = []
    const population: (number | null)[] = []

    for (const date of sortedDates) {
      const row = dateMap.get(date)
      if (row) {
        deaths.push(row.deaths)
        population.push(row.population)
      } else {
        deaths.push(null)
        population.push(null)
      }
    }

    // Count valid data points
    const validCount = deaths.filter((d, i) => d !== null && population[i] !== null).length
    if (validCount >= MIN_VALID_DATA_POINTS) {
      ageGroupsPayload.push({ deaths, population })
      validAgeGroups.push(ageGroup)
    }
  }

  if (ageGroupsPayload.length < 2) {
    console.warn('[SSR ASD] Insufficient age-stratified data for ASD calculation')
    return null
  }

  // Determine baseline indices
  let bs = 1
  let be = Math.min(sortedDates.length, 5)

  if (baselineDateFrom) {
    const idx = sortedDates.indexOf(baselineDateFrom)
    if (idx >= 0) bs = idx + 1
  }
  if (baselineDateTo) {
    const idx = sortedDates.indexOf(baselineDateTo)
    if (idx >= 0) be = idx + 1
  }

  bs = Math.max(1, Math.min(bs, sortedDates.length))
  be = Math.max(bs, Math.min(be, sortedDates.length))

  // Call the stats API
  const endpoint = `${statsUrl}/asd`
  const body = {
    age_groups: ageGroupsPayload,
    h: 0,
    m: baselineMethod,
    t: baselineMethod === 'lin_reg' ? 1 : 0,
    bs,
    be
  }

  try {
    const response = await $fetch<ASDResult>(endpoint, {
      method: 'POST',
      body
    })

    return {
      asd: response.asd,
      asd_bl: response.asd_bl,
      lower: response.lower,
      upper: response.upper,
      zscore: response.zscore,
      labels: sortedDates
    }
  } catch (error) {
    console.error('[SSR ASD] Failed to fetch from stats API:', error)
    return null
  }
}

/**
 * Inject ASD data into allChartData for SSR
 */
async function injectASDDataForSSR(
  state: ChartRenderState,
  allChartData: AllChartData,
  rawData: Awaited<ReturnType<typeof dataLoader.loadMortalityData>>,
  ageGroups: string[]
): Promise<void> {
  if (state.type !== 'asd') return

  // Ensure metadata is loaded
  await metadataService.load()

  const chartType = state.chartType as ChartType

  // Get the source for these age groups
  const sourcesMap = metadataService.getCommonSourcesWithAgeGroups(state.countries, chartType)
  if (sourcesMap.size === 0) {
    console.warn('[SSR ASD] No sources with age groups available')
    return
  }

  // Get the source name
  const [source] = Array.from(sourcesMap.entries())[0]!

  const chartLabels = allChartData.labels

  for (const country of state.countries) {
    const asdResult = await fetchASDDataForSSR(
      country,
      chartType,
      source,
      ageGroups,
      state.baselineMethod,
      state.baselineDateFrom,
      state.baselineDateTo,
      rawData
    )

    if (!asdResult) continue

    // Create alignment map
    const asdLabelToIndex = new Map<string, number>()
    asdResult.labels.forEach((label, idx) => asdLabelToIndex.set(label, idx))

    // Align ASD data to chart labels
    const alignArray = (arr: (number | null)[]): (number | null)[] => {
      return chartLabels.map((label) => {
        const idx = asdLabelToIndex.get(label)
        return idx !== undefined ? (arr[idx] ?? null) : null
      })
    }

    const alignedAsd = alignArray(asdResult.asd)
    const alignedAsdBl = alignArray(asdResult.asd_bl)
    const alignedLower = alignArray(asdResult.lower)
    const alignedUpper = alignArray(asdResult.upper)
    const alignedZscore = alignArray(asdResult.zscore)

    // Inject into allChartData
    for (const ag of Object.keys(allChartData.data)) {
      const countryData = allChartData.data[ag]?.[country]
      if (countryData) {
        const record = countryData as unknown as Record<string, unknown>
        record['asd'] = alignedAsd
        record['asd_baseline'] = alignedAsdBl
        record['asd_baseline_lower'] = alignedLower
        record['asd_baseline_upper'] = alignedUpper
        record['asd_zscore'] = alignedZscore
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
  let ageGroupsToLoad = state.ageGroups
  let asdAgeGroups: string[] = []
  if (state.type === 'asd') {
    await metadataService.load()
    const chartType = state.chartType as ChartType
    const sourcesMap = metadataService.getCommonSourcesWithAgeGroups(state.countries, chartType)
    if (sourcesMap.size > 0) {
      const [, ageGroups] = Array.from(sourcesMap.entries())[0]!
      if (ageGroups && ageGroups.length > 0) {
        asdAgeGroups = ageGroups
        // Include both 'all' (for chart display) and age-stratified (for ASD calculation)
        ageGroupsToLoad = [...new Set(['all', ...ageGroups])]
        console.log('[SSR ASD] Loading age groups:', ageGroupsToLoad)
      }
    }
  }

  // Load raw dataset using DataLoaderService
  const rawData = await dataLoader.loadMortalityData({
    chartType: state.chartType,
    countries: state.countries,
    ageGroups: ageGroupsToLoad
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
  // IMPORTANT: Always pass showBaseline=true (via !isPopulationType) to ensure baseline keys
  // are included for calculation. The excess values are calculated from baseline data,
  // so we always need the baseline keys even when baseline display is off.
  // This matches the client's getBaseKeysForFetch which passes !isPopulationType(), not showBaseline.
  const isPopulationType = state.type === 'population'
  const baseKeys = !isPopulationType
    ? getKeyForType(state.type, !isPopulationType, state.standardPopulation, false, state.showPredictionInterval)
    : undefined

  // Calculate startDateIndex from sliderStart to match client behavior
  // This ensures baseline indices are calculated on the same label array as the client
  const period = new ChartPeriod(allLabels, state.chartType as ChartType)
  const startDateIndex = state.sliderStart ? period.indexOf(state.sliderStart) : 0

  const allChartData: AllChartData = await dataLoader.getAllChartData({
    dataKey: dataKey as keyof CountryData,
    chartType: state.chartType,
    rawData,
    allLabels,
    startDateIndex,
    cumulative: state.cumulative,
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
  if (state.type === 'asd' && asdAgeGroups.length > 0) {
    await injectASDDataForSSR(state, allChartData, rawData, asdAgeGroups)
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
  // Use user-defined colors if provided, otherwise fall back to default theme colors
  const defaultColors = getChartColors(state.darkMode)
  const colors = state.userColors && state.userColors.length > 0
    ? [...state.userColors, ...defaultColors.slice(state.userColors.length)]
    : defaultColors

  // Use the unified toChartFilterConfig - same function as client
  const config = toChartFilterConfig(state, allCountries, colors, chartUrl)

  // Use getFilteredChartDataFromConfig - same function as client
  const chartData = getFilteredChartDataFromConfig(config, allLabels, allChartData.data)

  // Derive return flags from config (already computed in toChartFilterConfig)
  const isDeathsType = config.isDeathsType
  const isPopulationType = config.isPopulationType
  const isLE = state.type === 'le'

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
      true // isSSR
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
      state.chartStyle as 'bar' | 'line'
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

// Re-export the unified state resolution function for use in chart.png route
export { resolveChartStateForRendering, type ChartRenderState }
