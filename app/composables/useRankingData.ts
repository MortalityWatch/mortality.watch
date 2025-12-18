/**
 * Ranking Data Management Composable
 *
 * Manages data fetching and processing for the ranking page:
 * - Uses useDateRangeCalculations for consistent date logic
 * - Fully reactive date validation with automatic resets
 * - Shares useChartDataFetcher composable for data fetching
 * - Similar to useExplorerDataOrchestration but for ranking page
 */

import { ref, computed, watch, onMounted, type ComputedRef } from 'vue'
import type { useRankingState } from '@/composables/useRankingState'
import type { AllChartData, CountryData, Country } from '@/model'
import { ChartPeriod, type ChartType } from '@/model/period'
import { getKeyForType } from '@/model'
import { usePeriodFormat } from '@/composables/usePeriodFormat'
import { useJurisdictionFilter } from '@/composables/useJurisdictionFilter'
import { defaultBaselineToDate, getSeasonString } from '@/model/baseline'
import { showToast } from '@/toast'
import { handleError } from '@/lib/errors/errorHandler'
import { processCountryRow } from '@/lib/ranking/dataProcessing'
import type { TableRow } from '@/lib/ranking/types'
import { useChartDataFetcher } from '@/composables/useChartDataFetcher'
import { useDateRangeCalculations } from '@/composables/useDateRangeCalculations'
import { useDateRangeValidation } from '@/composables/useDateRangeValidation'
import { calculateBaselineRange } from '@/lib/baseline/calculateBaselineRange'
import { DATA_CONFIG, UI_CONFIG } from '@/lib/config/constants'

const RANKING_START_YEAR = DATA_CONFIG.RANKING_START_YEAR
const RANKING_END_YEAR = DATA_CONFIG.RANKING_END_YEAR

export function useRankingData(
  state: ReturnType<typeof useRankingState>,
  metaData: ComputedRef<Record<string, Country>>,
  sliderStart: Ref<string>
) {
  const { getPeriodStart, getPeriodEnd } = usePeriodFormat()
  const { shouldShowCountry } = useJurisdictionFilter()

  // Shared data fetching logic
  const dataFetcher = useChartDataFetcher()

  // ============================================================================
  // STATE - Data Refs
  // ============================================================================

  const allLabels = ref<string[]>([])
  const allChartData = ref<AllChartData>()
  const result = ref<TableRow[]>([])
  const labels = ref<string[]>()
  const visibleCountryCodes = ref<Set<string>>(new Set<string>())

  // Loading state - local management for full operation
  const isUpdating = ref(false)
  // Progress tracking from data fetcher (for getAllChartData operation)
  const updateProgress = dataFetcher.updateProgress
  const initialLoadDone = ref(false)

  // Table row key
  const total_row_key = DATA_CONFIG.TOTAL_ROW_KEY

  // ============================================================================
  // DATE RANGE CALCULATIONS - Feature gating and filtering
  // ============================================================================

  // Date range calculations (single source of truth for date logic)
  const dateRangeCalc = useDateRangeCalculations(
    computed(() => state.periodOfTime.value || 'yearly'),
    sliderStart,
    state.dateFrom,
    state.dateTo,
    allLabels
  )

  // Validation
  const { getValidatedRange } = useDateRangeValidation()

  /**
   * Watch for data availability and validate dates reactively
   *
   * Similar to Explorer's date watcher - ensures dates are valid when:
   * 1. Data is first loaded (visibleLabels becomes available)
   * 2. sliderStart changes (visible range changes)
   *
   * NOTE: We do NOT watch periodOfTime here because periodOfTimeChanged() already
   * sets correct dates for the new period type. Watching periodOfTime would cause
   * a race condition where the watcher runs before the new labels are loaded,
   * trying to validate old-format dates against new-format labels.
   *
   * Logic:
   * 1. If current dateFrom/dateTo are valid, keep them (preserve user selection)
   * 2. Otherwise, correct invalid dates to closest valid dates
   */
  watch([dateRangeCalc.visibleLabels], () => {
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
    const userNeverSetDates = currentFrom === undefined && currentTo === undefined
    if (userNeverSetDates) {
      return
    }

    // If user set invalid dates, correct them
    // Try to preserve user's selection by matching years
    const matchedFrom = dateRangeCalc.matchDateToLabel(currentFrom, false) ?? defaultFrom
    const matchedTo = dateRangeCalc.matchDateToLabel(currentTo, true) ?? defaultTo

    // Validate the matched range
    const period = new ChartPeriod(labels, state.periodOfTime.value as ChartType)
    const validatedRange = getValidatedRange(
      { from: matchedFrom, to: matchedTo },
      period,
      { from: defaultFrom, to: defaultTo }
    )

    // IMPORTANT: Use batchUpdate to update both dates in a single router.push
    // This prevents race condition where sequential state updates each trigger
    // separate router.push calls that read from stale route.query
    const dateFromChanged = validatedRange.from !== currentFrom
    const dateToChanged = validatedRange.to !== currentTo

    if (dateFromChanged || dateToChanged) {
      const updates: { dateFrom?: string, dateTo?: string } = {}
      if (dateFromChanged) updates.dateFrom = validatedRange.from
      if (dateToChanged) updates.dateTo = validatedRange.to
      state.batchUpdate(updates)
    }
  })

  // ============================================================================
  // COMPUTED - Derived Values
  // ============================================================================

  // Note: visibleLabels is now provided by dateRangeCalc and respects feature gating
  // allYearlyChartLabelsUnique uses availableLabels (unfiltered) for the dropdown options
  // This ensures the "From" dropdown shows all available years, not just those after sliderStart
  const allYearlyChartLabelsUnique = computed(() => {
    const availableLabels = dateRangeCalc.availableLabels.value
    const allYearlyChartLabels = Array.from(
      availableLabels.filter(v => v).map(v => v.substring(0, 4))
    )
    return Array.from(new Set(allYearlyChartLabels))
  })

  /**
   * Computed baseline range
   * Provides smart defaults for baseline period based on chart type and available data
   * Uses preferred baseline year (2016 for fluseason, 2017 for yearly) - independent of user's date range
   */
  const baselineRange = computed(() => {
    return calculateBaselineRange(
      state.periodOfTime.value || 'yearly',
      allLabels.value,
      allYearlyChartLabelsUnique.value
    )
  })

  const key = (): keyof CountryData => {
    const metricType = state.metricType.value
    if (metricType === 'asmr') {
      return `asmr_${state.standardPopulation.value}` as keyof CountryData
    }
    if (metricType === 'le') {
      return 'le' as keyof CountryData
    }
    return 'cmr' as keyof CountryData
  }

  const startPeriod = (): string =>
    getPeriodStart(RANKING_START_YEAR, state.periodOfTime.value)

  const endPeriod = (): string =>
    getPeriodEnd(RANKING_END_YEAR, state.periodOfTime.value)

  // ============================================================================
  // HELPERS - Utilities
  // ============================================================================

  /**
   * Create explorer link for a country or countries
   * Limits to 20 countries to avoid URL/API limitations
   *
   * Note: Uses Vue Router's query object format which will automatically
   * serialize arrays as repeated query parameters (c=USA&c=SWE)
   */
  const explorerLink = (countryCodes?: string[]): string => {
    const codes = countryCodes || Array.from(visibleCountryCodes.value)
    // Limit countries to avoid overwhelming the API
    const limitedCodes = codes.slice(0, UI_CONFIG.MAX_EXPLORER_COUNTRIES)

    const router = useRouter()
    const route = router.resolve({
      path: '/explorer',
      query: {
        c: limitedCodes, // Array will be serialized as c=USA&c=SWE
        ct: state.periodOfTime.value || 'yearly',
        df: state.dateFrom.value,
        dt: state.dateTo.value,
        sp: state.standardPopulation.value,
        bm: state.baselineMethod.value || 'mean'
      }
    })

    return route.href
  }

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  /**
   * Fetch and prepare chart data using shared fetcher
   */
  const fetchChartData = async () => {
    const metricType = state.metricType.value
    const dataKey = key()
    const periodOfTime = state.periodOfTime.value || 'yearly'

    // Filter countries based on jurisdiction and metric availability
    const countryFilter = Object.keys(metaData.value).filter((iso3c) => {
      // Check jurisdiction filter
      if (!shouldShowCountry(iso3c, state.jurisdictionType.value)) {
        return false
      }

      // Check ASMR availability if needed
      if (metricType === 'asmr') {
        return metaData.value[iso3c]?.has_asmr() ?? false
      }

      // Note: LE availability could be checked here if needed
      // For now, assume LE data is available for all countries with CMR data

      return true
    })

    const ageFilter = ['all']

    // Determine base type for getKeyForType
    const baseType = metricType === 'le' ? 'le' : metricType

    // In absolute mode, skip baseline calculations entirely (no stats API calls needed)
    const isAbsoluteMode = state.displayMode.value === 'absolute'

    // Use shared data fetcher
    const result = await dataFetcher.fetchChartData({
      chartType: periodOfTime as ChartType,
      countries: countryFilter,
      ageGroups: ageFilter,
      dataKey,
      // Skip baseline method in absolute mode to avoid stats API calls
      baselineMethod: isAbsoluteMode ? undefined : (state.baselineMethod.value || 'mean'),
      baselineDateFrom: isAbsoluteMode ? undefined : state.baselineDateFrom.value,
      baselineDateTo: isAbsoluteMode ? undefined : state.baselineDateTo.value,
      sliderStart: sliderStart.value, // Layer 2 offset
      cumulative: state.cumulative.value,
      isAsmr: metricType === 'asmr',
      baseKeys: getKeyForType(baseType, true, state.standardPopulation.value || 'who')
    })

    if (!result) {
      const errorMessages: Record<string, string> = {
        asmr: 'No ASMR data for selected countries. Please select CMR',
        le: 'No Life Expectancy data for selected countries',
        cmr: 'No data available for selected countries'
      }
      showToast(errorMessages[metricType] ?? errorMessages.cmr!, 'warning')
      return null
    }

    // Update local state
    allLabels.value = result.allLabels

    return result.chartData
  }

  /**
   * Load and process data
   */
  const loadData = async () => {
    if (isUpdating.value) return
    isUpdating.value = true

    try {
      // Fetch and prepare data
      const chartData = await fetchChartData()
      if (!chartData) {
        isUpdating.value = false
        return
      }

      allChartData.value = chartData
      updateProgress.value = 0

      // Calculate date range indices using ChartPeriod
      // Use computed defaults if dates are not set in URL
      const chartType = state.periodOfTime.value || 'yearly'
      const allLabelsArray = allChartData.value?.labels || []

      // Early exit if no labels available
      if (allLabelsArray.length === 0) {
        isUpdating.value = false
        return
      }

      const period = new ChartPeriod(allLabelsArray, chartType as ChartType)

      // Compute defaults: from 2019/20 (or earliest) to latest
      const targetStart = chartType === 'yearly' ? '2019' : '2019/20'
      const defaultStartIndex = allLabelsArray.findIndex(label => label >= targetStart)
      const defaultFrom = allLabelsArray[defaultStartIndex >= 0 ? defaultStartIndex : 0]
      const defaultTo = allLabelsArray[allLabelsArray.length - 1]

      const dateFrom = state.dateFrom.value ?? defaultFrom
      const dateTo = state.dateTo.value ?? defaultTo

      const startIndex = period.indexOf(dateFrom || '')
      const endIndex = period.indexOf(dateTo || '') + 1

      // Prepare labels
      const dataLabels = [...(allChartData.value?.labels.slice(startIndex, endIndex) || [])]
      const newLabels = [...dataLabels]
      if (state.showTotals.value) newLabels.push(total_row_key)

      // Process all countries
      const newResult: TableRow[] = []
      const newVisibleCountryCodes = new Set<string>()

      if (!allChartData.value?.data?.all) {
        isUpdating.value = false
        return
      }

      const dataKey = key()
      const hideIncomplete = state.hideIncomplete.value

      for (const [iso3c, countryData] of Object.entries(allChartData.value.data.all)) {
        const { row, hasData } = processCountryRow({
          iso3c,
          countryData,
          dataKey,
          range: { startIndex, endIndex },
          dataLabels,
          metaData: metaData.value,
          explorerLink,
          display: {
            showPercentage: state.showPercentage.value,
            cumulative: state.cumulative.value,
            hideIncomplete,
            displayMode: state.displayMode.value
          },
          totalRowKey: total_row_key
        })

        if (hasData) {
          newVisibleCountryCodes.add(iso3c)
          newResult.push(row)
        }
      }

      // Update all refs at once
      labels.value = state.showTotalsOnly.value ? ['TOTAL'] : newLabels
      result.value = newResult
      visibleCountryCodes.value = newVisibleCountryCodes

      if (!initialLoadDone.value) {
        initialLoadDone.value = true
      }
    } catch (error) {
      handleError(error, 'Failed to load ranking data', 'useRankingData.updateData')
    } finally {
      isUpdating.value = false
    }
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle period type changes
   *
   * Resets dates to defaults for the new period type.
   * Uses "2019/20 to latest" defaults to match the page's initial load behavior.
   *
   * IMPORTANT: Uses batchUpdate to batch all state updates into a single router.push
   * to prevent race condition where sequential state updates each trigger separate
   * router.push calls that read from stale route.query.
   */
  const periodOfTimeChanged = (val: string) => {
    // Calculate defaults for new period type
    // Use 2019/2020 as start (consistent with page's initial load defaults)
    // For yearly: 2019, for fluseason/midyear: 2019/20, for quarterly: 2020 Q1, for monthly: 2020 Jan
    const defaultStartYear = val === 'yearly' ? 2019 : 2020
    const defaultFrom = getPeriodStart(defaultStartYear, val)
    const defaultTo = getPeriodEnd(RANKING_END_YEAR, val)

    // Reset baseline dates
    const baselineMethod = state.baselineMethod.value || 'mean'
    const baselineStartYear
      = baselineMethod === 'lin_reg' ? 2010 : baselineMethod === 'mean' ? 2017 : 2015
    const defaultBaselineFrom = getSeasonString(val, baselineStartYear)
    const defaultBaselineTo = defaultBaselineToDate(val) || ''

    // BATCH all updates into single router.push via batchUpdate to avoid race condition
    state.batchUpdate({
      periodOfTime: val,
      dateFrom: defaultFrom,
      dateTo: defaultTo,
      baselineDateFrom: defaultBaselineFrom,
      baselineDateTo: defaultBaselineTo
    })
  }

  // ============================================================================
  // WATCHERS - Auto-update data
  // ============================================================================

  // Watch for state changes that require data reload
  watch(
    [
      () => state.periodOfTime.value,
      () => state.jurisdictionType.value,
      () => state.metricType.value,
      () => state.displayMode.value,
      () => state.standardPopulation.value,
      () => state.baselineMethod.value,
      () => state.cumulative.value
    ],
    loadData,
    { deep: true }
  )

  // Watch for display changes that only require table reprocessing
  watch(
    [
      () => state.dateFrom.value,
      () => state.dateTo.value,
      () => state.baselineDateFrom.value,
      () => state.baselineDateTo.value,
      () => state.showPercentage.value,
      () => state.showTotals.value,
      () => state.showTotalsOnly.value,
      () => state.hideIncomplete.value
    ],
    loadData,
    { deep: true }
  )

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  onMounted(loadData)

  // ============================================================================
  // RETURN PUBLIC API
  // ============================================================================

  return {
    // Data
    allLabels,
    visibleLabels: dateRangeCalc.visibleLabels, // Feature-gated labels for UI
    allChartData,
    result,
    labels,
    visibleCountryCodes,
    allYearlyChartLabelsUnique,
    baselineRange,

    // Loading state
    isUpdating,
    updateProgress,
    initialLoadDone,

    // Methods
    loadData,
    explorerLink,
    periodOfTimeChanged,

    // Helpers
    startPeriod,
    endPeriod
  }
}
