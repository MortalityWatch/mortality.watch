/**
 * Chart Data Fetcher Composable
 *
 * Shared data fetching logic for chart composables
 * and useRankingData composables.
 *
 * Provides:
 * - updateDataset: Fetch raw mortality data from database
 * - getAllChartLabels: Get date labels for chart type
 * - getAllChartData: Process data with baseline calculations
 * - Loading state management
 * - Baseline date validation
 *
 * This eliminates 250-350 lines of duplication across composables.
 */

import { ref } from 'vue'
import type { AllChartData, CountryData, DatasetRaw, NumberEntryFields } from '@/model'
import { ChartPeriod, type ChartType } from '@/model/period'
import {
  getAllChartData as fetchAllChartData,
  getAllChartLabels as fetchAllChartLabels,
  updateDataset as fetchDataset
} from '@/lib/data'
import {
  defaultBaselineFromDate,
  defaultBaselineToDate
} from '@/model/baseline'

export interface ChartDataFetchConfig {
  // Chart configuration
  chartType: ChartType
  countries: string[]
  ageGroups: string[]

  // Data key for fetching
  dataKey: keyof CountryData

  // Baseline configuration (optional - skip baseline calculations when undefined)
  baselineMethod?: string
  baselineDateFrom?: string
  baselineDateTo?: string
  baselineStartIdx?: number

  // Date range - sliderStart defines the "from" offset for allChartData (layer 2)
  sliderStart?: string

  // Options
  cumulative?: boolean
  baseKeys?: (keyof NumberEntryFields)[]
  isAsmr?: boolean

  // Progress callback
  onProgress?: (progress: number, total: number) => void
}

export interface ChartDataFetchResult {
  dataset: DatasetRaw
  allLabels: string[]
  chartData: AllChartData
  baselineDateFrom: string
  baselineDateTo: string
}

/**
 * Chart Data Fetcher Composable
 *
 * Centralizes common data fetching logic used by both explorer and ranking pages.
 */
export function useChartDataFetcher() {
  // Get stats URL from runtime config
  const config = useRuntimeConfig()
  const statsUrl = config.public.statsUrl as string | undefined

  // Loading state
  const isUpdating = ref(false)
  const updateProgress = ref(0)

  /**
   * Validate and fix baseline dates
   *
   * Ensures baseline dates are valid labels in the current chart type.
   * Falls back to defaults if invalid.
   */
  function validateBaselineDates(
    allLabels: string[],
    chartType: ChartType,
    baselineMethod: string,
    baselineFrom?: string,
    baselineTo?: string
  ): { from: string, to: string } {
    let from = baselineFrom || ''
    let to = baselineTo || ''

    // Validate from date
    if (!allLabels.includes(from)) {
      from = defaultBaselineFromDate(chartType, allLabels, baselineMethod) || ''
    }

    // Validate to date
    if (!allLabels.includes(to)) {
      to = defaultBaselineToDate(chartType) || ''
    }

    return { from, to }
  }

  /**
   * Get baseline start index using ChartPeriod
   */
  function getBaselineStartIndex(
    allLabels: string[],
    chartType: ChartType,
    baselineFrom: string
  ): number {
    const period = new ChartPeriod(allLabels, chartType)
    return period.indexOf(baselineFrom)
  }

  /**
   * Fetch complete chart data
   *
   * This is the main data fetching function that:
   * 1. Fetches raw dataset from database
   * 2. Gets all chart labels
   * 3. Validates baseline dates
   * 4. Processes data with baseline calculations
   */
  async function fetchChartData(
    fetchConfig: ChartDataFetchConfig
  ): Promise<ChartDataFetchResult | null> {
    isUpdating.value = true
    updateProgress.value = 0

    try {
      // Step 1: Fetch raw dataset
      const dataset = await fetchDataset(
        fetchConfig.chartType,
        fetchConfig.countries,
        fetchConfig.ageGroups
      )

      // Step 2: Get all chart labels from the fetched dataset
      // Pass chartType for proper chronological sorting (monthly dates need custom sort)
      const allLabels = fetchAllChartLabels(
        dataset,
        fetchConfig.isAsmr ?? false,
        fetchConfig.ageGroups,
        fetchConfig.countries,
        fetchConfig.chartType
      )

      if (!allLabels.length) {
        isUpdating.value = false
        return null
      }

      // Step 3: Validate baseline dates (only if baseline method is specified)
      let baselineFrom: string | undefined
      let baselineTo: string | undefined

      if (fetchConfig.baselineMethod) {
        const validated = validateBaselineDates(
          allLabels,
          fetchConfig.chartType,
          fetchConfig.baselineMethod,
          fetchConfig.baselineDateFrom,
          fetchConfig.baselineDateTo
        )
        baselineFrom = validated.from
        baselineTo = validated.to
      }

      // Step 4: Calculate data start index from sliderStart (layer 2 offset)
      // This slices data from sliderStart year, not from the beginning
      // Slider filtering (layer 3) happens at display time
      const dataStartIndex = fetchConfig.sliderStart
        ? getBaselineStartIndex(allLabels, fetchConfig.chartType, fetchConfig.sliderStart)
        : 0

      const chartData = await fetchAllChartData(
        fetchConfig.dataKey,
        fetchConfig.chartType,
        dataset,
        allLabels,
        dataStartIndex, // Load all data, filter at display time
        fetchConfig.cumulative ?? false,
        fetchConfig.ageGroups,
        fetchConfig.countries,
        fetchConfig.baselineMethod,
        baselineFrom,
        baselineTo,
        fetchConfig.baseKeys ?? [],
        fetchConfig.onProgress ?? ((progress, total) => {
          updateProgress.value = Math.round((progress / total) * 100)
        }),
        statsUrl
      )

      isUpdating.value = false

      return {
        dataset,
        allLabels,
        chartData,
        baselineDateFrom: baselineFrom ?? '',
        baselineDateTo: baselineTo ?? ''
      }
    } catch (error) {
      isUpdating.value = false
      throw error
    }
  }

  /**
   * Fetch dataset only (without processing)
   *
   * Useful when you only need the raw data and labels.
   */
  async function fetchDatasetOnly(
    chartType: ChartType,
    countries: string[],
    ageGroups: string[],
    isAsmr: boolean = false
  ): Promise<{ dataset: DatasetRaw, allLabels: string[] } | null> {
    isUpdating.value = true

    try {
      const dataset = await fetchDataset(chartType, countries, ageGroups)

      const allLabels = fetchAllChartLabels(
        dataset,
        isAsmr,
        ageGroups,
        countries,
        chartType
      )

      isUpdating.value = false

      if (!allLabels.length) {
        return null
      }

      return { dataset, allLabels }
    } catch (error) {
      isUpdating.value = false
      throw error
    }
  }

  return {
    // State
    isUpdating,
    updateProgress,

    // Functions
    fetchChartData,
    fetchDatasetOnly,
    validateBaselineDates,
    getBaselineStartIndex
  }
}
