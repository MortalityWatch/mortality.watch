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
import type { AllChartData, DatasetRaw, Country } from '@/model'
import { getKeyForType } from '@/model'
import { ChartPeriod, type ChartType } from '@/model/period'
import {
  getStartIndex
} from '@/lib/data'
import { useChartDataFetcher } from '@/composables/useChartDataFetcher'
import { getFilteredChartData } from '@/lib/chart'
import type { MortalityChartData } from '@/lib/chart/chartTypes'
import { useDateRangeValidation } from '@/composables/useDateRangeValidation'
import { useDateRangeCalculations } from '@/composables/useDateRangeCalculations'
import { UI_CONFIG } from '@/lib/config/constants'
import {
  arrayBufferToBase64,
  compress
} from '@/lib/compression/compress.browser'
import { calculateBaselineRange } from '@/lib/baseline/calculateBaselineRange'

export function useExplorerDataOrchestration(
  state: ReturnType<typeof useExplorerState>,
  helpers: ReturnType<typeof useExplorerHelpers>,
  allCountries: Ref<Record<string, Country>>,
  displayColors: ComputedRef<string[]>
) {
  // Shared data fetching logic
  const dataFetcher = useChartDataFetcher()

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

  // Helper to generate short URL
  const makeUrl = async () => {
    const base = 'https://mortality.watch/?qr='
    const query = JSON.stringify(window.location)
    const encodedQuery = arrayBufferToBase64(await compress(query))
    return base + encodeURIComponent(encodedQuery)
  }

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
      = state.isLogarithmic.value || (state.isExcess.value && !chartOptions.showTotalOption)
    chartOptions.showBaselineOption = helpers.hasBaseline() && !helpers.isMatrixChartStyle()
    chartOptions.showPredictionIntervalOption
      = chartOptions.showBaselineOption || (state.isExcess.value && !helpers.isMatrixChartStyle())
    chartOptions.showPredictionIntervalOptionDisabled
      = (!state.isExcess.value && !state.showBaseline.value) || (state.cumulative.value && !helpers.showCumPi())
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

  // Update filtered chart data
  const updateFilteredData = async () => {
    if (!allChartData || !allChartData.labels || !allChartData.data) {
      return { datasets: [], labels: [] }
    }

    // Use default range (last ~10 years) when dates are undefined
    // This ensures chart shows a reasonable recent window without polluting URL
    const defaultRange = dateRangeCalc.defaultRange.value
    const visibleRange = dateRangeCalc.visibleRange.value

    // Fall back to visible range if default range is empty (data not loaded yet)
    const effectiveDateFrom = state.dateFrom.value ?? (defaultRange.from || visibleRange?.min)
    const effectiveDateTo = state.dateTo.value ?? (defaultRange.to || visibleRange?.max)

    // Use baselineRange when baseline dates are undefined
    // This prevents baseline dates from polluting URL on initial load
    const effectiveBaselineFrom = state.baselineDateFrom.value ?? baselineRange.value?.from
    const effectiveBaselineTo = state.baselineDateTo.value ?? baselineRange.value?.to

    return await getFilteredChartData(
      state.countries.value,
      state.standardPopulation.value,
      state.ageGroups.value,
      state.showPredictionInterval.value,
      state.isExcess.value,
      state.type.value,
      state.cumulative.value,
      state.showBaseline.value,
      state.baselineMethod.value,
      effectiveBaselineFrom,
      effectiveBaselineTo,
      state.showTotal.value,
      state.chartType.value,
      effectiveDateFrom,
      effectiveDateTo,
      helpers.isBarChartStyle(),
      allCountries.value, // This is the country metadata, not the selected countries
      helpers.isErrorBarType(),
      displayColors.value, // Use displayColors which handles 8+ countries
      helpers.isMatrixChartStyle(),
      state.showPercentage.value,
      helpers.showCumPi(),
      helpers.isAsmrType(),
      state.maximize.value,
      state.showLabels.value,
      await makeUrl(),
      state.isLogarithmic.value,
      helpers.isPopulationType(),
      helpers.isDeathsType(),
      state.view.value,
      allChartData.labels,
      allChartData.data
    )
  }

  // Main data update function
  const updateData = async (
    shouldDownloadDataset: boolean,
    shouldUpdateDataset: boolean
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
        dataKey: key,
        baselineMethod: state.baselineMethod.value,
        baselineDateFrom: state.baselineDateFrom.value ?? baselineRange.value?.from,
        baselineDateTo: state.baselineDateTo.value ?? baselineRange.value?.to,
        baselineStartIdx: undefined, // Will be calculated from labels
        cumulative: helpers.showCumPi(),
        baseKeys: helpers.getBaseKeysForType(),
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
        dataKey: key,
        baselineMethod: state.baselineMethod.value,
        baselineDateFrom: state.baselineDateFrom.value ?? baselineRange.value?.from,
        baselineDateTo: state.baselineDateTo.value ?? baselineRange.value?.to,
        baselineStartIdx: getStartIndex(allYearlyChartLabels.value || [], state.sliderStart.value),
        cumulative: helpers.showCumPi(),
        baseKeys: helpers.getBaseKeysForType(),
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
    const filteredData = await updateFilteredData()
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

    // Date range helpers
    defaultRange: dateRangeCalc.defaultRange,
    getDefaultRange: dateRangeCalc.getDefaultRange, // Kept for backward compatibility
    baselineRange
  }
}
