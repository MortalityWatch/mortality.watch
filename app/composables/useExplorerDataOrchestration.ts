/**
 * Explorer Data Orchestration Composable
 *
 * Orchestrates data fetching and filtering logic for the explorer page.
 * Uses useDateRangeCalculations for all date logic.
 *
 * Provides:
 * - Data fetching orchestration (updateData)
 * - Data filtering (updateFilteredData)
 * - Reactive date validation (via watchers)
 * - Computed baseline range (baselineRange)
 * - Chart options configuration (configureOptions)
 *
 * This separates data orchestration concerns from UI component logic,
 * making explorer.vue more focused and maintainable.
 */

import { computed, reactive, ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { useExplorerState } from '@/composables/useExplorerState'
import type { useExplorerHelpers } from '@/composables/useExplorerHelpers'
import type { AllChartData, DatasetRaw, Country, CountryData } from '@/model'
import { getKeyForType } from '@/model'
import { ChartPeriod, type ChartType } from '@/model/period'
import {
  getStartIndex
} from '@/lib/data'
import { useChartDataFetcher } from '@/composables/useChartDataFetcher'
import { useASDData } from '@/composables/useASDData'
import { alignASDToChartLabels } from '@/lib/asd'
import { metadataService } from '@/services/metadataService'
import { getFilteredChartDataFromConfig } from '@/lib/chart'
import type { MortalityChartData } from '@/lib/chart/chartTypes'
import type { ChartStateSnapshot } from '@/lib/chart/types'
import { useDateRangeValidation } from '@/composables/useDateRangeValidation'
import { useDateRangeCalculations } from '@/composables/useDateRangeCalculations'
import { UI_CONFIG } from '@/lib/config/constants'
import { calculateBaselineRange } from '@/lib/baseline/calculateBaselineRange'
import { useShortUrl } from '@/composables/useShortUrl'
import {
  resolveChartStateFromSnapshot,
  toChartFilterConfig,
  generateUrlFromState
} from '@/lib/state/resolution'
import { logger } from '@/lib/logger'
import { getUniqueYears } from '@/lib/utils/dates'

/**
 * Source information for a country's data
 */
export interface CountrySourceInfo {
  /** Data source name (e.g., "eurostat", "cdc", "un") */
  source: string
  /** Age groups used for age-stratified calculations (ASD, ASMR, LE) */
  ageGroups?: string[]
}

const log = logger.withPrefix('ExplorerDataOrchestration')

export function useExplorerDataOrchestration(
  state: ReturnType<typeof useExplorerState>,
  helpers: ReturnType<typeof useExplorerHelpers>,
  allCountries: Ref<Record<string, Country>>
) {
  // Shared data fetching logic
  const dataFetcher = useChartDataFetcher()

  // ASD data fetching (Age-Standardized Deaths)
  // Lazy initialized to avoid useRuntimeConfig issues in tests
  let asdDataInstance: ReturnType<typeof useASDData> | null = null
  const getASDData = () => {
    if (!asdDataInstance) {
      asdDataInstance = useASDData()
    }
    return asdDataInstance
  }

  // Short URL handling for QR codes
  // Store original query params to ensure consistent hashing with SSR
  // (URL may be modified by state resolution before short URL is computed)
  const { getShortUrl } = useShortUrl()
  const currentShortUrl = ref<string | null>(null)
  const originalQueryParams = ref<Record<string, string | string[] | undefined> | null>(null)

  /**
   * Save the original query params before any URL modification.
   * Must be called at the start of page initialization, before StateResolver.applyResolvedState.
   */
  const saveOriginalQueryParams = (query: Record<string, string | string[] | undefined>) => {
    originalQueryParams.value = { ...query }
  }

  // Validation
  const { getValidatedRange } = useDateRangeValidation()

  // Data state
  let dataset: DatasetRaw

  /**
   * All available date labels for selected countries/chart type
   * Example (fluseason): ['1950/51', '1951/52', ..., '2024/25']
   * Updated when data is fetched from server
   */
  const allChartLabels = ref<string[]>([])

  /**
   * Yearly representation of all labels (for calculating indices)
   * - For yearly charts: same as allChartLabels
   * - For other types: year portion only ['2010', '2011', ...]
   * Used by getStartIndex() to find where sliderStart begins
   * NOTE: Moved before dateRangeCalc to enable baseline range calculation
   */
  const allYearlyChartLabels = ref<string[]>([])

  /**
   * Computed baseline range - provides default baseline dates without polluting URL
   * Uses chart-type-aware baseline year as the reference point, independent of sliderStart
   * - Yearly: 2017 → 2017, 2018, 2019
   * - Fluseason/Midyear: 2016 → 2016/17, 2017/18, 2018/19 (pre-pandemic)
   * This ensures baseline stays constant when user changes the data range slider
   * Only syncs to URL when user explicitly changes baseline via slider
   * NOTE: Moved before dateRangeCalc to enable effective baseline calculation
   */
  const baselineRange = computed(() => {
    return calculateBaselineRange(
      state.chartType.value,
      allChartLabels.value,
      allYearlyChartLabels.value
    )
  })

  // Date range calculations (single source of truth for date logic)
  const dateRangeCalc = useDateRangeCalculations(
    state.chartType,
    state.sliderStart,
    state.dateFrom,
    state.dateTo,
    allChartLabels
  )

  /**
   * Unique years available for the date range picker "From" dropdown
   * Shows ALL available years without filtering
   * Used by DateRangePicker component
   */
  const allYearlyChartLabelsUnique = computed(() => {
    const labels = dateRangeCalc.availableLabels.value
    if (labels.length === 0) return []

    if (state.chartType.value === 'yearly') {
      return labels
    } else {
      return getUniqueYears(labels)
    }
  })

  /**
   * Chart data for current selection (filtered by dateFrom/dateTo)
   * WARNING: labels here are a SUBSET of allChartLabels
   * Do NOT use for slider range - use visibleLabels instead
   */
  const allChartData = reactive<AllChartData>({
    labels: [],
    data: {},
    notes: {
      noData: undefined,
      noAsmr: undefined
    }
  })
  const chartData = ref<MortalityChartData | undefined>(undefined)

  /**
   * Source information for currently displayed data.
   * Maps country ISO3C code to source info (source name and age groups for ASD).
   * Updated when data is fetched.
   */
  const dataSourceInfo = ref<Map<string, CountrySourceInfo>>(new Map())

  // Loading state
  const isUpdating = ref<boolean>(false)
  const showLoadingOverlay = ref<boolean>(false)
  let loadingTimeout: ReturnType<typeof setTimeout> | null = null

  // Chart options
  const chartOptions = reactive({
    showMaximizeOption: true,
    showMaximizeOptionDisabled: false,
    showBaselineOption: false,
    showPredictionIntervalOption: false,
    showPredictionIntervalOptionDisabled: false,
    showCumulativeOption: false,
    showTotalOption: false,
    showTotalOptionDisabled: false,
    showPercentageOption: false,
    showLogarithmicOption: true
  })

  // URL generation uses the shared generateUrlFromState function from resolution module

  // Memoized computations
  const dataKey = computed(() => {
    return getKeyForType(
      state.type.value,
      state.showBaseline.value,
      state.standardPopulation.value,
      false, // isExcess
      false, // includePi
      {
        leAdjusted: state.leAdjusted.value,
        chartType: state.chartType.value
      }
    )[0]
  })

  const ageGroupsForFetch = computed(() => {
    return helpers.isAsmrType() ? ['all'] : state.ageGroups.value
  })

  /**
   * Extract source information from the loaded dataset.
   * Uses the appropriate source column based on the metric type:
   * - ASMR types: source_asmr
   * - LE types: source (LE uses same data source as deaths)
   * - Other types: source
   * For ASD, source info is set separately in fetchAndInjectASDData.
   *
   * Also fetches age groups from metadata for age-stratified metrics (ASMR, LE).
   */
  const extractSourcesFromDataset = async (datasetToExtract: DatasetRaw, countries: string[]) => {
    // Don't overwrite ASD source info
    if (state.type.value === 'asd') return

    const sources = new Map<string, CountrySourceInfo>()
    const metricType = state.type.value
    const isAsmrMetric = metricType === 'asmr'
    const isLeMetric = metricType === 'le'
    const chartType = state.chartType.value as ChartType

    // For age-stratified metrics, get age groups from metadata
    const needsAgeGroups = isAsmrMetric || isLeMetric

    // Pre-fetch source -> age groups mapping for all countries if needed
    const sourceAgeGroupsMap = new Map<string, Map<string, string[]>>()
    if (needsAgeGroups) {
      try {
        // Ensure metadata is loaded before accessing
        await metadataService.load()
        for (const country of countries) {
          sourceAgeGroupsMap.set(country, metadataService.getSourcesWithAgeGroups(country, chartType))
        }
      } catch {
        log.warn('Could not load metadata for age groups')
      }
    }

    for (const country of countries) {
      // Look through age groups to find data for this country
      for (const ageGroup of Object.keys(datasetToExtract)) {
        const countryData = datasetToExtract[ageGroup]?.[country]
        if (countryData && countryData.length > 0) {
          // Get source from the most recent data row
          // Use source_asmr for ASMR metrics, otherwise use source
          for (let i = countryData.length - 1; i >= 0; i--) {
            const row = countryData[i]
            if (row) {
              const sourceValue = isAsmrMetric ? (row.source_asmr || row.source) : row.source
              if (sourceValue) {
                const sourceInfo: CountrySourceInfo = { source: sourceValue }

                // Get age groups for the specific source used
                if (needsAgeGroups) {
                  const countrySourcesMap = sourceAgeGroupsMap.get(country)
                  let ageGroups = countrySourcesMap?.get(sourceValue)

                  // Fallback: if source not found in map, try getBestSourceForCountry
                  if (!ageGroups || ageGroups.length === 0) {
                    const bestSource = metadataService.getBestSourceForCountry(country, chartType)
                    if (bestSource?.ageGroups) {
                      ageGroups = bestSource.ageGroups
                    }
                  }

                  if (ageGroups && ageGroups.length > 0) {
                    sourceInfo.ageGroups = ageGroups
                  }
                }

                sources.set(country, sourceInfo)
                break
              }
            }
          }
          if (sources.has(country)) break
        }
      }
    }

    dataSourceInfo.value = sources
  }

  /**
   * Fetch and inject ASD data into allChartData when type is 'asd'.
   *
   * ASD (Age-Standardized Deaths) uses the Levitt method which:
   * 1. Fetches all age groups for the selected source
   * 2. Calls the stats API /asd endpoint with age-stratified data
   * 3. Injects the returned asd/asd_bl values into the dataset
   *
   * The DataTransformationPipeline then uses data['asd'] and data['asd_bl']
   * to display the age-standardized values.
   */
  const fetchAndInjectASDData = async () => {
    // Only fetch ASD data when ASD metric is selected
    if (state.type.value !== 'asd') return

    const countries = state.countries.value
    const chartType = state.chartType.value as ChartType

    // Get baseline date range
    const baselineDateFrom = state.baselineDateFrom.value ?? baselineRange.value?.from
    const baselineDateTo = state.baselineDateTo.value ?? baselineRange.value?.to

    const asdDataComposable = getASDData()

    // Fetch ASD data for each country using its best available source
    // This allows each country to use its optimal source independently
    // (e.g., USA uses CDC from 1999, Sweden uses eurostat from 2000)
    type ASDResultNonNull = NonNullable<Awaited<ReturnType<typeof asdDataComposable.fetchASDForCountry>>>
    const results = new Map<string, ASDResultNonNull>()

    // Track ASD source info for display
    const asdSourceInfo = new Map<string, CountrySourceInfo>()

    try {
      for (const country of countries) {
        // Get the best source for this country (longest history)
        const sourceInfo = metadataService.getBestSourceForCountry(country, chartType)

        if (!sourceInfo) {
          log.warn(`No source with age groups available for ${country}`)
          continue
        }

        const { source, ageGroups } = sourceInfo

        // Track source info for display below chart
        asdSourceInfo.set(country, { source, ageGroups })

        const result = await asdDataComposable.fetchASDForCountry(
          country,
          chartType,
          source,
          ageGroups,
          state.baselineMethod.value,
          baselineDateFrom,
          baselineDateTo,
          state.baselineMethod.value === 'lin_reg'
        )

        if (result) {
          results.set(country, result)
        }
      }

      // Update the dataSourceInfo with ASD-specific source info
      dataSourceInfo.value = asdSourceInfo

      // Inject ASD data into allChartData for each country
      // The data structure is: allChartData.data[ageGroup][iso3c]
      // ASD data must be aligned to allChartData.labels (NOT allChartLabels.value!)
      // allChartData.labels may be a subset (e.g., 2005-2025) while allChartLabels.value is the full range (1950-2025)
      const chartLabels = allChartData.labels

      for (const [iso3c, asdResult] of results) {
        // Align ASD data to chart labels using shared helper
        // This ensures identical alignment logic with SSR
        const aligned = alignASDToChartLabels(asdResult, chartLabels)

        // Find the age group key (usually 'all' for the combined view)
        for (const ag of Object.keys(allChartData.data)) {
          const countryData = allChartData.data[ag]?.[iso3c]
          if (countryData) {
            // Inject aligned ASD arrays using the standard naming convention
            // expected by getKeyForType (asd_baseline, not asd_bl)
            const record = countryData as Record<string, unknown>
            record['asd'] = aligned.asd
            record['asd_baseline'] = aligned.asd_bl
            record['asd_baseline_lower'] = aligned.lower
            record['asd_baseline_upper'] = aligned.upper
            record['asd_zscore'] = aligned.zscore
          }
        }
      }
    } catch (error) {
      log.error('Failed to fetch ASD data', error)
    }
  }

  // Configure chart options based on current state
  const configureOptions = () => {
    chartOptions.showTotalOption = state.isExcess.value && helpers.isBarChartStyle()
    chartOptions.showTotalOptionDisabled = !state.cumulative.value
    chartOptions.showMaximizeOption
      = !(state.isExcess.value && helpers.isLineChartStyle()) && !helpers.isMatrixChartStyle()
    chartOptions.showMaximizeOptionDisabled
      = state.showLogarithmic.value || (state.isExcess.value && !chartOptions.showTotalOption)
    // Baseline option: disabled in zscore view (baseline is implicit in z-score calculation)
    chartOptions.showBaselineOption = helpers.hasBaseline() && !helpers.isMatrixChartStyle() && !state.isZScore.value
    chartOptions.showPredictionIntervalOption
      = chartOptions.showBaselineOption || (state.isExcess.value && !helpers.isMatrixChartStyle())
    // PI disabled: when no baseline shown (unless excess), cumulative without PI support, or in zscore view
    chartOptions.showPredictionIntervalOptionDisabled
      = (!state.isExcess.value && !state.showBaseline.value)
        || (state.cumulative.value && !helpers.showCumPi())
        || state.isZScore.value
    chartOptions.showCumulativeOption = state.isExcess.value
    chartOptions.showPercentageOption = state.isExcess.value
    chartOptions.showLogarithmicOption = !helpers.isMatrixChartStyle() && !state.isExcess.value
  }

  /**
   * Watch for data availability and initialize dates reactively
   *
   * Date Range Refactor: Replaced resetDates() with reactive watcher
   *
   * This watcher automatically validates and initializes dates when:
   * 1. Data is first loaded (visibleLabels becomes available)
   * 2. Chart type changes (may invalidate current selection)
   * 3. sliderStart changes (visible range changes)
   *
   * NOTE: View changes are NOT watched here - they are handled by the
   * StateResolver system in handleViewChanged(). This prevents the watcher
   * from interfering with view transitions and ensures dates are preserved
   * when switching between mortality/excess/zscore views.
   *
   * Logic:
   * 1. If current dateFrom/dateTo are valid, keep them (preserve user selection)
   * 2. Otherwise, set to default range (first to last visible label)
   * 3. Try to preserve year when chart type changes (e.g., yearly → fluseason)
   */
  watch([dateRangeCalc.visibleLabels, state.chartType], () => {
    const labels = dateRangeCalc.visibleLabels.value
    if (labels.length === 0) return

    // Get default range from composable (using computed property for performance)
    const { from: defaultFrom, to: defaultTo } = dateRangeCalc.defaultRange.value

    // If default range is empty, we can't do anything yet
    if (!defaultFrom || !defaultTo) return

    // Check if current range is valid
    const currentFrom = state.dateFrom.value
    const currentTo = state.dateTo.value
    const hasValidRange = currentFrom && currentTo
      && dateRangeCalc.isValidDate(currentFrom)
      && dateRangeCalc.isValidDate(currentTo)

    // If current range is valid, preserve it
    if (hasValidRange) {
      return
    }

    // Don't auto-initialize dates if user never set them (keeps URL clean)
    const userNeverSetDates = !state.isUserSet('dateFrom') && !state.isUserSet('dateTo')
    if (userNeverSetDates) {
      return
    }

    // If user set invalid dates, correct them
    // Try to preserve user's selection by matching years
    const matchedFrom = dateRangeCalc.matchDateToLabel(currentFrom, false) ?? defaultFrom
    const matchedTo = dateRangeCalc.matchDateToLabel(currentTo, true) ?? defaultTo

    // Validate the matched range
    const period = new ChartPeriod(labels, state.chartType.value as ChartType)
    const validatedRange = getValidatedRange(
      { from: matchedFrom, to: matchedTo },
      period,
      { from: defaultFrom, to: defaultTo }
    )

    // Update state only if values changed
    if (validatedRange.from !== currentFrom) {
      state.dateFrom.value = validatedRange.from
    }
    if (validatedRange.to !== currentTo) {
      state.dateTo.value = validatedRange.to
    }
  })

  /**
   * Create a state snapshot from current refs.
   * Used when no explicit snapshot is provided to updateFilteredData.
   */
  const createStateSnapshot = (): ChartStateSnapshot => ({
    countries: state.countries.value,
    type: state.type.value,
    chartType: state.chartType.value as ChartType,
    chartStyle: state.chartStyle.value,
    ageGroups: state.ageGroups.value,
    standardPopulation: state.standardPopulation.value,
    view: state.view.value,
    isExcess: state.isExcess.value,
    isZScore: state.isZScore.value,
    dateFrom: state.dateFrom.value,
    dateTo: state.dateTo.value,
    sliderStart: state.sliderStart.value,
    baselineDateFrom: state.baselineDateFrom.value,
    baselineDateTo: state.baselineDateTo.value,
    showBaseline: state.showBaseline.value,
    baselineMethod: state.baselineMethod.value,
    cumulative: state.cumulative.value,
    showTotal: state.showTotal.value,
    maximize: state.maximize.value,
    showPredictionInterval: state.showPredictionInterval.value,
    showLabels: state.showLabels.value,
    showPercentage: state.showPercentage.value,
    showLogarithmic: state.showLogarithmic.value,
    leAdjusted: state.leAdjusted.value,
    userColors: state.userColors.value,
    decimals: state.decimals.value
  })

  /**
   * Build ChartFilterConfig from a state snapshot.
   *
   * Uses the unified resolution pipeline (resolveChartStateFromSnapshot + toChartFilterConfig)
   * to ensure identical behavior between client and SSR chart rendering.
   */
  const buildFilterConfig = (snapshot: ChartStateSnapshot) => {
    // Use the unified resolution function - same logic as SSR
    const resolvedState = resolveChartStateFromSnapshot(snapshot, allChartLabels.value)

    // Build URL from resolved state using the shared function (same as SSR)
    const fullUrl = generateUrlFromState(resolvedState)

    // Use short URL if available, otherwise fall back to full URL
    const url = currentShortUrl.value || fullUrl

    // Convert to ChartFilterConfig using the unified converter
    // Colors are computed internally by toChartFilterConfig
    return toChartFilterConfig(
      resolvedState,
      allCountries.value,
      url
    )
  }

  /**
   * Update filtered chart data.
   *
   * @param snapshot - Optional state snapshot. If not provided, reads from current refs.
   *                   Providing a snapshot ensures consistent state during view transitions.
   */
  const updateFilteredData = async (snapshot?: ChartStateSnapshot): Promise<MortalityChartData> => {
    if (!allChartData || !allChartData.labels || !allChartData.data) {
      return { datasets: [], labels: [] } as unknown as MortalityChartData
    }

    // Compute short URL first (instant with local hash computation)
    // This also fires a non-blocking POST to store the mapping in DB
    // Use current route.query to ensure QR code reflects current chart state
    // Fix for #443: originalQueryParams was only saved on mount and became stale
    try {
      const shortUrl = await getShortUrl()
      currentShortUrl.value = shortUrl
    } catch (error) {
      // Log but don't fail - full URL will be used as fallback
      log.warn('Failed to generate short URL, using full URL', { error })
    }

    // Use provided snapshot or create one from current refs
    const stateSnapshot = snapshot ?? createStateSnapshot()

    // Build filter config from snapshot (uses currentShortUrl)
    const config = buildFilterConfig(stateSnapshot)

    // Use the new config-based function
    return getFilteredChartDataFromConfig(config, allChartData.labels, allChartData.data)
  }

  /**
   * Main data update function.
   *
   * @param shouldDownloadDataset - Whether to fetch fresh data from server
   * @param shouldUpdateDataset - Whether to update the dataset (recalculate baseline, etc)
   * @param snapshot - Optional state snapshot for consistent rendering during view transitions.
   *                   If provided, chart data is generated from this snapshot instead of current refs.
   */
  const updateData = async (
    shouldDownloadDataset: boolean,
    shouldUpdateDataset: boolean,
    snapshot?: ChartStateSnapshot
  ) => {
    isUpdating.value = true

    // Only show loading overlay if update takes longer than configured delay
    loadingTimeout = setTimeout(() => {
      showLoadingOverlay.value = true
    }, UI_CONFIG.LOADING_OVERLAY_DELAY)

    if (shouldDownloadDataset) {
      // Use shared data fetcher for complete data fetch
      // Use memoized dataKey for performance
      const key = dataKey.value
      if (!key) {
        isUpdating.value = false
        return
      }

      // Two-pass approach for initial load when baseline dates aren't available yet
      // Pass 1: If baseline range not computed (allChartLabels empty), fetch labels first
      // Pass 2: Then fetch full data with baseline calculation
      const needsBaselineDates = !state.baselineDateFrom.value && !state.baselineDateTo.value
      const baselineRangeNotReady = !baselineRange.value?.from || !baselineRange.value?.to

      if (needsBaselineDates && baselineRangeNotReady) {
        // Pass 1: Fetch dataset to get labels (no baseline calculation)
        const preliminary = await dataFetcher.fetchDatasetOnly(
          state.chartType.value as ChartType,
          state.countries.value,
          ageGroupsForFetch.value,
          helpers.isAsmrType()
        )

        if (preliminary) {
          // Update labels so baselineRange computed property can calculate
          allChartLabels.value = preliminary.allLabels
          if (state.chartType.value === 'yearly') {
            allYearlyChartLabels.value = preliminary.allLabels
          } else {
            allYearlyChartLabels.value = getUniqueYears(preliminary.allLabels)
          }
          // baselineRange.value will now be computed from allChartLabels
        }
      }

      // Pass 2 (or only pass if baseline dates were already available): Full fetch with baseline
      const result = await dataFetcher.fetchChartData({
        chartType: state.chartType.value as ChartType,
        countries: state.countries.value,
        ageGroups: ageGroupsForFetch.value, // Use memoized age groups
        dataKey: key as keyof CountryData,
        baselineMethod: state.baselineMethod.value,
        baselineDateFrom: state.baselineDateFrom.value ?? baselineRange.value?.from,
        baselineDateTo: state.baselineDateTo.value ?? baselineRange.value?.to,
        baselineStartIdx: undefined, // Will be calculated from labels
        sliderStart: state.sliderStart.value, // Layer 2 offset
        cumulative: helpers.showCumPi(),
        baseKeys: helpers.getBaseKeysForFetch(),
        isAsmr: helpers.isAsmrType()
      })

      if (!result) {
        isUpdating.value = false
        return
      }

      // Update local state
      dataset = result.dataset
      allChartLabels.value = result.allLabels

      // Process yearly labels (for index calculations)
      // Note: allYearlyChartLabelsUnique is now a computed property
      if (state.chartType.value === 'yearly') {
        allYearlyChartLabels.value = allChartLabels.value
      } else {
        allYearlyChartLabels.value = getUniqueYears(allChartLabels.value)
      }

      // Only update baseline dates in URL if user has explicitly set them
      // Otherwise keep them undefined to avoid polluting URL
      if (state.isUserSet('baselineDateFrom')) {
        state.baselineDateFrom.value = result.baselineDateFrom
      }
      if (state.isUserSet('baselineDateTo')) {
        state.baselineDateTo.value = result.baselineDateTo
      }

      Object.assign(allChartData, result.chartData)

      // Extract source info from dataset for display below chart
      await extractSourcesFromDataset(dataset, state.countries.value)

      // Fetch and inject ASD data if in ASD view (this also updates dataSourceInfo for ASD)
      await fetchAndInjectASDData()
      // Note: Date validation now handled by reactive watcher
    } else if (shouldUpdateDataset) {
      // Update chart data only (reuse existing dataset)

      // Use memoized dataKey for performance
      const key = dataKey.value
      if (!key) {
        isUpdating.value = false
        return
      }

      const result = await dataFetcher.fetchChartData({
        chartType: state.chartType.value as ChartType,
        countries: state.countries.value,
        ageGroups: ageGroupsForFetch.value, // Use memoized age groups
        dataKey: key as keyof CountryData,
        baselineMethod: state.baselineMethod.value,
        baselineDateFrom: state.baselineDateFrom.value ?? baselineRange.value?.from,
        baselineDateTo: state.baselineDateTo.value ?? baselineRange.value?.to,
        baselineStartIdx: getStartIndex(allYearlyChartLabels.value || [], state.sliderStart.value),
        sliderStart: state.sliderStart.value, // Layer 2 offset
        cumulative: helpers.showCumPi(),
        baseKeys: helpers.getBaseKeysForFetch(),
        isAsmr: helpers.isAsmrType()
      })

      if (!result) {
        isUpdating.value = false
        return
      }

      // Only update state if user explicitly set baseline dates (not using computed defaults)
      // This prevents baseline dates from polluting URL on initial load
      if (state.isUserSet('baselineDateFrom')) {
        state.baselineDateFrom.value = result.baselineDateFrom
      }
      if (state.isUserSet('baselineDateTo')) {
        state.baselineDateTo.value = result.baselineDateTo
      }

      Object.assign(allChartData, result.chartData)

      // Extract source info from dataset for display below chart
      await extractSourcesFromDataset(dataset, state.countries.value)

      // Fetch and inject ASD data if in ASD view (this also updates dataSourceInfo for ASD)
      await fetchAndInjectASDData()
      // Note: Date validation now handled by reactive watcher
    }

    // Update filtered chart datasets
    // Pass snapshot if provided for consistent rendering during view transitions
    const filteredData = await updateFilteredData(snapshot)
    chartData.value = filteredData as MortalityChartData

    configureOptions()

    // Clear the loading timeout and hide overlay
    if (loadingTimeout) {
      clearTimeout(loadingTimeout)
      loadingTimeout = null
    }
    showLoadingOverlay.value = false

    isUpdating.value = false
  }

  /**
   * Visible labels respecting sliderStart and feature gating
   *
   * Date Range Refactor: Directly expose useDateRangeCalculations.visibleLabels
   *
   * This represents the FULL RANGE that should be available on the slider,
   * starting from the user's chosen sliderStart year (default: current year - 20)
   * and respecting year 2000 restriction for non-premium users.
   *
   * Example (in 2025):
   * - allChartLabels: ['1950/51', ..., '2024/25'] (all data)
   * - sliderStart: '2005' (2025 - 20)
   * - hasExtendedTimeAccess: false
   * - visibleLabels: ['2005/06', ..., '2024/25'] (from sliderStart onwards)
   *
   * Used by:
   * - Explorer DateRangePicker for slider range
   * - Watcher for initial date selection
   *
   * Note: The actual selected range (dateFrom/dateTo) can be a subset of this.
   */
  const visibleLabels = dateRangeCalc.visibleLabels

  return {
    // Data state
    allChartLabels,
    visibleLabels,
    allYearlyChartLabels,
    allYearlyChartLabelsUnique,
    allChartData,
    chartData,
    getDataset: () => dataset,
    setDataset: (newDataset: DatasetRaw) => {
      dataset = newDataset
    },

    // Source information for display below chart
    dataSourceInfo,

    // Loading state
    isUpdating,
    showLoadingOverlay,

    // Chart options
    chartOptions,

    // Functions
    updateData,
    updateFilteredData,
    configureOptions,
    createStateSnapshot,

    // Date range helpers
    defaultRange: dateRangeCalc.defaultRange,
    getDefaultRange: dateRangeCalc.getDefaultRange, // Kept for backward compatibility
    baselineRange,

    // Short URL for QR codes and sharing
    currentShortUrl,
    saveOriginalQueryParams
  }
}
