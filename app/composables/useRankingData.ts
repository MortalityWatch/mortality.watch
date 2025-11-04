/**
 * Ranking Data Management Composable
 *
 * Phase 10.3: Refactored to use shared useChartDataFetcher composable
 *
 * Previous phases:
 * - Phase 10.1.2: Extract data fetching and processing logic from ranking.vue
 * - Similar to useExplorerDataOrchestration (Phase 9.2) but for ranking page
 */

import { ref, computed, watch, onMounted, type ComputedRef } from 'vue'
import type { useRankingState } from '@/composables/useRankingState'
import type { AllChartData, CountryData, Country } from '@/model'
import { ChartPeriod, type ChartType } from '@/model/period'
import { getKeyForType } from '@/model'
import { usePeriodFormat } from '@/composables/usePeriodFormat'
import { useJurisdictionFilter } from '@/composables/useJurisdictionFilter'
import { defaultBaselineFromDate, defaultBaselineToDate, getSeasonString } from '@/model/baseline'
import { showToast } from '@/toast'
import { handleError } from '@/lib/errors/errorHandler'
import { processCountryRow } from '@/lib/ranking/dataProcessing'
import type { TableRow } from '@/lib/ranking/types'
import { useChartDataFetcher } from '@/composables/useChartDataFetcher'
import { DATA_CONFIG, UI_CONFIG } from '@/lib/config/constants'

const RANKING_START_YEAR = DATA_CONFIG.RANKING_START_YEAR
const RANKING_END_YEAR = DATA_CONFIG.RANKING_END_YEAR

export function useRankingData(
  state: ReturnType<typeof useRankingState>,
  metaData: ComputedRef<Record<string, Country>>
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

  // Slider management
  let sliderValueNeedsUpdate = false

  // Table row key
  const total_row_key = DATA_CONFIG.TOTAL_ROW_KEY

  // ============================================================================
  // COMPUTED - Derived Values
  // ============================================================================

  const allYearlyChartLabelsUnique = computed(() => {
    const allYearlyChartLabels = Array.from(
      allLabels.value.map(v => v.substring(0, 4))
    )
    return Array.from(new Set(allYearlyChartLabels))
  })

  const key = (): keyof CountryData =>
    (state.showASMR.value
      ? 'asmr_' + state.standardPopulation.value
      : 'cmr') as keyof CountryData

  const startPeriod = (): string =>
    getPeriodStart(RANKING_START_YEAR, state.periodOfTime.value)

  const endPeriod = (): string =>
    getPeriodEnd(RANKING_END_YEAR, state.periodOfTime.value)

  // ============================================================================
  // HELPERS - Utilities
  // ============================================================================

  /**
   * Reset baseline slider to default values if needed
   */
  const maybeResetBaselineSlider = () => {
    if (!sliderValueNeedsUpdate) return

    const newFrom = startPeriod()
    const newTo = endPeriod()
    const newBaselineFrom
      = defaultBaselineFromDate(
        state.periodOfTime.value || 'yearly',
        allLabels.value,
        state.baselineMethod.value || 'mean'
      ) || ''
    const newBaselineTo = defaultBaselineToDate(state.periodOfTime.value || 'yearly') || ''

    state.dateFrom.value = newFrom
    state.dateTo.value = newTo
    state.baselineDateFrom.value = newBaselineFrom
    state.baselineDateTo.value = newBaselineTo
    sliderValueNeedsUpdate = false
  }

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
    const type = state.showASMR.value ? 'asmr' : 'cmr'
    const dataKey = key()
    const periodOfTime = state.periodOfTime.value || 'yearly'

    // Filter countries based on jurisdiction and ASMR availability
    const countryFilter = Object.keys(metaData.value).filter((iso3c) => {
      // Check jurisdiction filter
      if (!shouldShowCountry(iso3c, state.jurisdictionType.value)) {
        return false
      }

      // Check ASMR availability if needed
      if (state.showASMR.value) {
        return metaData.value[iso3c]?.has_asmr() ?? false
      }

      return true
    })

    const ageFilter = ['all']

    // Use shared data fetcher
    const result = await dataFetcher.fetchChartData({
      chartType: periodOfTime as ChartType,
      countries: countryFilter,
      ageGroups: ageFilter,
      dataKey,
      baselineMethod: state.baselineMethod.value || 'mean',
      baselineDateFrom: state.baselineDateFrom.value,
      baselineDateTo: state.baselineDateTo.value,
      cumulative: state.cumulative.value,
      isAsmr: type === 'asmr',
      baseKeys: getKeyForType(type, true, state.standardPopulation.value || 'who2015')
    })

    if (!result) {
      showToast('No ASMR data for selected countries. Please select CMR', 'warning')
      return null
    }

    // Update local state
    allLabels.value = result.allLabels
    maybeResetBaselineSlider()

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
      const dateFrom = state.dateFrom.value
      const dateTo = state.dateTo.value
      const chartType = state.periodOfTime.value || 'yearly'
      const period = new ChartPeriod(
        allChartData.value?.labels || [],
        chartType as ChartType
      )
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
            showRelative: state.showRelative.value,
            cumulative: state.cumulative.value,
            hideIncomplete: state.hideIncomplete.value
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
   * Handle date slider changes
   */
  const sliderChanged = (val: string[]) => {
    state.dateFrom.value = val[0] || ''
    state.dateTo.value = val[1] || ''
  }

  /**
   * Handle baseline slider changes
   */
  const baselineSliderChanged = (val: string[]) => {
    state.baselineDateFrom.value = val[0] || ''
    state.baselineDateTo.value = val[1] || ''
  }

  /**
   * Handle period type changes
   */
  const periodOfTimeChanged = (val: { label: string, name: string, value: string }) => {
    state.periodOfTime.value = val.value
    sliderValueNeedsUpdate = true

    // Reset dates to defaults for new period type
    const defaultFrom = getPeriodStart(RANKING_START_YEAR, val.value)
    const defaultTo = getPeriodEnd(RANKING_END_YEAR, val.value)

    // Reset baseline dates
    const baselineMethod = state.baselineMethod.value || 'mean'
    const baselineStartYear
      = baselineMethod === 'lin_reg' ? 2010 : baselineMethod === 'mean' ? 2017 : 2015
    const defaultBaselineFrom = getSeasonString(val.value, baselineStartYear)
    const defaultBaselineTo = defaultBaselineToDate(val.value) || ''

    state.dateFrom.value = defaultFrom
    state.dateTo.value = defaultTo
    state.baselineDateFrom.value = defaultBaselineFrom
    state.baselineDateTo.value = defaultBaselineTo
  }

  // ============================================================================
  // WATCHERS - Auto-update data
  // ============================================================================

  // Watch for state changes that require data reload
  watch(
    [
      () => state.periodOfTime.value,
      () => state.jurisdictionType.value,
      () => state.showASMR.value,
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
      () => state.showRelative.value,
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
    allChartData,
    result,
    labels,
    visibleCountryCodes,
    allYearlyChartLabelsUnique,

    // Loading state
    isUpdating,
    updateProgress,
    initialLoadDone,

    // Methods
    loadData,
    explorerLink,
    sliderChanged,
    baselineSliderChanged,
    periodOfTimeChanged,

    // Helpers
    startPeriod,
    endPeriod
  }
}
