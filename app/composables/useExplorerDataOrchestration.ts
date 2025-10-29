/**
 * Explorer Data Orchestration Composable
 *
 * Phase 10.3: Refactored to use shared useChartDataFetcher composable
 *
 * Previous phases:
 * - Phase 9.2: Extract data fetching and filtering logic from explorer.vue
 *
 * Provides:
 * - Data fetching orchestration (updateData)
 * - Data filtering (updateFilteredData)
 * - Date validation and reset (resetDates, resetBaselineDates)
 * - Chart options configuration (configureOptions)
 *
 * This separates data orchestration concerns from UI component logic,
 * making explorer.vue more focused and maintainable.
 */

import { reactive, ref } from 'vue'
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
import { getSeasonString } from '@/model/baseline'
import {
  arrayBufferToBase64,
  compress
} from '@/lib/compression/compress.browser'
import { DEFAULT_BASELINE_YEAR } from '@/lib/constants'

const MIN_BASELINE_SPAN = 3

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
  const allChartLabels = ref<string[]>([])
  const allYearlyChartLabels = ref<string[]>([])
  const allYearlyChartLabelsUnique = ref<string[]>([])
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

  // Reset main date range
  const resetDates = () => {
    if (!allChartData || !allChartData.labels) return
    const labels = allChartData.labels
    if (labels.length === 0) return

    // Only reset if values are missing or don't match
    // Don't reset if user has manually selected a different range
    if (state.dateFrom.value && state.dateTo.value && labels.includes(state.dateFrom.value) && labels.includes(state.dateTo.value)) {
      // Values are valid, don't change them
      return
    }

    // Date Slider - validate and correct range
    const sliderStartStr = getSeasonString(state.chartType.value, Number(state.sliderStart.value))
    const defaultFrom = labels.includes(sliderStartStr) ? sliderStartStr : labels[0]!
    const defaultTo = labels[labels.length - 1]!

    // Try to preserve user's selection by finding matching labels based on year
    let currentFrom = state.dateFrom.value
    let currentTo = state.dateTo.value

    // Helper function to find closest year in labels
    const findClosestYear = (targetYear: string, preferLast: boolean = false): string => {
      const targetYearNum = parseInt(targetYear)
      const availableYears = Array.from(new Set(labels.map(l => parseInt(l.substring(0, 4)))))

      // Find the closest year
      const closestYear = availableYears.reduce((prev, curr) =>
        Math.abs(curr - targetYearNum) < Math.abs(prev - targetYearNum) ? curr : prev
      )

      // Find labels for that year
      const yearLabels = labels.filter(l => l.startsWith(closestYear.toString()))
      return preferLast ? yearLabels[yearLabels.length - 1]! : yearLabels[0]!
    }

    // If current values don't exist in new labels, try to find closest match by year
    if (currentFrom && !labels.includes(currentFrom)) {
      const fromYear = currentFrom.substring(0, 4)
      const matchingLabel = labels.find(l => l.startsWith(fromYear))
      // If exact year doesn't exist, find closest year instead of falling back to default
      currentFrom = matchingLabel || findClosestYear(fromYear, false)
    }

    if (currentTo && !labels.includes(currentTo)) {
      const toYear = currentTo.substring(0, 4)
      // Find the last label that starts with the year (to prefer end of year)
      const matchingLabels = labels.filter(l => l.startsWith(toYear))
      // If exact year doesn't exist, find closest year instead of falling back to default
      currentTo = (matchingLabels.length > 0 ? matchingLabels[matchingLabels.length - 1] : findClosestYear(toYear, true))!
    }

    const period = new ChartPeriod(labels, state.chartType.value as ChartType)
    const validatedRange = getValidatedRange(
      { from: currentFrom ?? defaultFrom, to: currentTo ?? defaultTo },
      period,
      { from: defaultFrom, to: defaultTo }
    )

    if (validatedRange.from !== state.dateFrom.value || !state.dateFrom.value) {
      state.dateFrom.value = validatedRange.from
    }
    if (validatedRange.to !== state.dateTo.value || !state.dateTo.value) {
      state.dateTo.value = validatedRange.to
    }
  }

  // Reset baseline date range
  const resetBaselineDates = () => {
    if (!allChartLabels.value || !allYearlyChartLabels.value) return
    const labels = allChartLabels.value.slice(
      getStartIndex(allYearlyChartLabels.value, state.sliderStart.value)
    )
    if (labels.length === 0) return

    // Validate baseline range with minimum span requirement
    const defaultFrom = labels[0]!
    const defaultToIndex = Math.min(labels.length - 1, MIN_BASELINE_SPAN)
    const defaultTo = labels[defaultToIndex]!

    const period = new ChartPeriod(labels, state.chartType.value as ChartType)
    const validatedRange = getValidatedRange(
      { from: state.baselineDateFrom.value ?? defaultFrom, to: state.baselineDateTo.value ?? defaultTo },
      period,
      { from: defaultFrom, to: defaultTo },
      MIN_BASELINE_SPAN
    )

    if (validatedRange.from !== state.baselineDateFrom.value || !state.baselineDateFrom.value) {
      state.baselineDateFrom.value = validatedRange.from
    }
    if (validatedRange.to !== state.baselineDateTo.value || !state.baselineDateTo.value) {
      state.baselineDateTo.value = validatedRange.to
    }

    // Start Select - reset to default if current value is invalid
    if (state.sliderStart.value && !allYearlyChartLabelsUnique.value?.includes(state.sliderStart.value)) {
      state.sliderStart.value = '2010'
    }
  }

  // Update filtered chart data
  const updateFilteredData = async () => {
    if (!allChartData || !allChartData.labels || !allChartData.data) {
      return { datasets: [], labels: [] }
    }

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
      state.baselineDateFrom.value,
      state.baselineDateTo.value,
      state.showTotal.value,
      state.chartType.value,
      state.dateFrom.value,
      state.dateTo.value,
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

    // Only show loading overlay if update takes longer than 500ms
    loadingTimeout = setTimeout(() => {
      showLoadingOverlay.value = true
    }, 500)

    if (shouldDownloadDataset) {
      // Use shared data fetcher for complete data fetch
      const key = getKeyForType(
        state.type.value,
        state.showBaseline.value,
        state.standardPopulation.value
      )[0]
      if (!key) {
        isUpdating.value = false
        return
      }

      const result = await dataFetcher.fetchChartData({
        chartType: state.chartType.value as ChartType,
        countries: state.countries.value,
        ageGroups: helpers.isAsmrType() ? ['all'] : state.ageGroups.value,
        dataKey: key,
        baselineMethod: state.baselineMethod.value,
        baselineDateFrom: state.baselineDateFrom.value,
        baselineDateTo: state.baselineDateTo.value,
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

      // Process yearly labels
      if (state.chartType.value === 'yearly') {
        allYearlyChartLabels.value = allChartLabels.value
        allYearlyChartLabelsUnique.value = allChartLabels.value.filter(
          x => parseInt(x) <= DEFAULT_BASELINE_YEAR
        )
      } else {
        allYearlyChartLabels.value = Array.from(
          allChartLabels.value.map(v => v.substring(0, 4))
        )
        allYearlyChartLabelsUnique.value = Array.from(
          new Set(allYearlyChartLabels.value)
        ).filter(x => parseInt(x) <= DEFAULT_BASELINE_YEAR)
      }

      // Update validated baseline dates from result
      state.baselineDateFrom.value = result.baselineDateFrom
      state.baselineDateTo.value = result.baselineDateTo

      Object.assign(allChartData, result.chartData)
      resetDates()
    } else if (shouldUpdateDataset) {
      // Update chart data only (reuse existing dataset)
      resetBaselineDates()

      const key = getKeyForType(
        state.type.value,
        state.showBaseline.value,
        state.standardPopulation.value
      )[0]
      if (!key) {
        isUpdating.value = false
        return
      }

      const result = await dataFetcher.fetchChartData({
        chartType: state.chartType.value as ChartType,
        countries: state.countries.value,
        ageGroups: helpers.isAsmrType() ? ['all'] : state.ageGroups.value,
        dataKey: key,
        baselineMethod: state.baselineMethod.value,
        baselineDateFrom: state.baselineDateFrom.value,
        baselineDateTo: state.baselineDateTo.value,
        baselineStartIdx: getStartIndex(allYearlyChartLabels.value || [], state.sliderStart.value),
        cumulative: helpers.showCumPi(),
        baseKeys: helpers.getBaseKeysForType(),
        isAsmr: helpers.isAsmrType()
      })

      if (!result) {
        isUpdating.value = false
        return
      }

      // Update validated baseline dates from result
      state.baselineDateFrom.value = result.baselineDateFrom
      state.baselineDateTo.value = result.baselineDateTo

      Object.assign(allChartData, result.chartData)
      resetDates()
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

  return {
    // Data state
    allChartLabels,
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
    resetDates,
    resetBaselineDates,
    configureOptions
  }
}
