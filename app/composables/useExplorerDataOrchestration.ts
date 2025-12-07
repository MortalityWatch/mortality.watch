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
import type { Ref, ComputedRef } from 'vue'
import type { useExplorerState } from '@/composables/useExplorerState'
import type { useExplorerHelpers } from '@/composables/useExplorerHelpers'
import type { AllChartData, DatasetRaw, Country, CountryData } from '@/model'
import { getKeyForType } from '@/model'
import { ChartPeriod, type ChartType } from '@/model/period'
import {
  getStartIndex
} from '@/lib/data'
import { useChartDataFetcher } from '@/composables/useChartDataFetcher'
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

export function useExplorerDataOrchestration(
  state: ReturnType<typeof useExplorerState>,
  helpers: ReturnType<typeof useExplorerHelpers>,
  allCountries: Ref<Record<string, Country>>,
  displayColors: ComputedRef<string[]>
) {
  // Shared data fetching logic
  const dataFetcher = useChartDataFetcher()

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

  // Date range calculations (single source of truth for date logic)
  const dateRangeCalc = useDateRangeCalculations(
    state.chartType,
    state.sliderStart,
    state.dateFrom,
    state.dateTo,
    allChartLabels
  )

  /**
   * Yearly representation of all labels (for calculating indices)
   * - For yearly charts: same as allChartLabels
   * - For other types: year portion only ['2010', '2011', ...]
   * Used by getStartIndex() to find where sliderStart begins
   */
  const allYearlyChartLabels = ref<string[]>([])

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
      const yearLabels = Array.from(
        labels.filter(v => v && typeof v === 'string').map(v => v.substring(0, 4))
      )
      return Array.from(new Set(yearLabels))
    }
  })

  /**
   * Computed baseline range - provides default baseline dates without polluting URL
   * Uses chart-type-aware baseline year as the reference point, independent of sliderStart
   * - Yearly: 2017 → 2017, 2018, 2019
   * - Fluseason/Midyear: 2016 → 2016/17, 2017/18, 2018/19 (pre-pandemic)
   * This ensures baseline stays constant when user changes the data range slider
   * Only syncs to URL when user explicitly changes baseline via slider
   */
  const baselineRange = computed(() => {
    return calculateBaselineRange(
      state.chartType.value,
      allChartLabels.value,
      allYearlyChartLabels.value
    )
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
      state.standardPopulation.value
    )[0]
  })

  const ageGroupsForFetch = computed(() => {
    return helpers.isAsmrType() ? ['all'] : state.ageGroups.value
  })

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
    // The chart will use visibleLabels range when dates are undefined
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
    return toChartFilterConfig(
      resolvedState,
      allCountries.value,
      displayColors.value,
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
    // Use original query params if saved (ensures consistency with SSR which uses original request params)
    try {
      const shortUrl = await getShortUrl(originalQueryParams.value ?? undefined)
      currentShortUrl.value = shortUrl
    } catch {
      // Silently fail - full URL will be used
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
        allYearlyChartLabels.value = Array.from(
          allChartLabels.value.filter(v => v && typeof v === 'string').map(v => v.substring(0, 4))
        )
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
   * starting from the user's chosen sliderStart year (default: 2010) and
   * respecting year 2000 restriction for non-premium users.
   *
   * Example:
   * - allChartLabels: ['1950/51', ..., '2024/25'] (all data)
   * - sliderStart: '2010'
   * - hasExtendedTimeAccess: false
   * - visibleLabels: ['2010/11', ..., '2024/25'] (from max(2010, 2000) onwards)
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
