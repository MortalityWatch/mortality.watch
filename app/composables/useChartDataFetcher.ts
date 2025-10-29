/**
 * Chart Data Fetcher Composable
 *
 * Phase 10.3: Extract shared data fetching logic from useExplorerDataOrchestration
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

  // Baseline configuration
  baselineMethod: string
  baselineDateFrom?: string
  baselineDateTo?: string
  baselineStartIdx?: number

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
    config: ChartDataFetchConfig
  ): Promise<ChartDataFetchResult | null> {
    isUpdating.value = true
    updateProgress.value = 0

    try {
      // Step 1: Fetch raw dataset
      const dataset = await fetchDataset(
        config.chartType,
        config.countries,
        config.ageGroups
      )

      // Step 2: Get all chart labels
      const allLabels = fetchAllChartLabels(
        dataset,
        config.isAsmr ?? false,
        config.ageGroups,
        config.countries,
        config.chartType
      )

      if (!allLabels.length) {
        isUpdating.value = false
        return null
      }

      // Step 3: Validate baseline dates
      const { from: baselineFrom, to: baselineTo } = validateBaselineDates(
        allLabels,
        config.chartType,
        config.baselineMethod,
        config.baselineDateFrom,
        config.baselineDateTo
      )

      // Step 4: Get baseline start index
      const baselineStartIdx
        = config.baselineStartIdx
          ?? getBaselineStartIndex(allLabels, config.chartType, baselineFrom)

      // Step 5: Fetch processed chart data
      const chartData = await fetchAllChartData(
        config.dataKey,
        config.chartType,
        dataset,
        allLabels,
        baselineStartIdx,
        config.cumulative ?? false,
        config.ageGroups,
        config.countries,
        config.baselineMethod,
        baselineFrom,
        baselineTo,
        config.baseKeys ?? [],
        config.onProgress ?? ((progress, total) => {
          updateProgress.value = Math.round((progress / total) * 100)
        })
      )

      isUpdating.value = false

      return {
        dataset,
        allLabels,
        chartData,
        baselineDateFrom: baselineFrom,
        baselineDateTo: baselineTo
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
