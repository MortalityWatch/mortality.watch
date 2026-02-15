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
 * - fetchChartDataProgressive: Progressive loading with baseline injection
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
  zScoreMode?: 'auto' | 'classic' | 'robust'

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

// Progressive loading interfaces
export interface ProgressiveChartDataResult {
  dataset: DatasetRaw
  allLabels: string[]
  chartData: AllChartData
  baselineDateFrom: string
  baselineDateTo: string
  // Baseline injection function for progressive updates
  injectBaselines: () => Promise<AllChartData>
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
   * Shared helper: Fetch dataset with labels
   *
   * Eliminates duplication between fetchChartData and fetchChartDataProgressive
   */
  async function fetchDatasetWithLabels(
    fetchConfig: ChartDataFetchConfig
  ): Promise<{ dataset: DatasetRaw, allLabels: string[] } | null> {
    // Step 1: Fetch raw dataset
    const dataset = await fetchDataset(
      fetchConfig.chartType,
      fetchConfig.countries,
      fetchConfig.ageGroups
    )

    // Step 2: Get all chart labels from the fetched dataset
    const allLabels = fetchAllChartLabels(
      dataset,
      fetchConfig.isAsmr ?? false,
      fetchConfig.ageGroups,
      fetchConfig.countries,
      fetchConfig.chartType
    )

    if (!allLabels.length) {
      return null
    }

    return { dataset, allLabels }
  }

  /**
   * Shared helper: Validate and prepare baseline configuration
   *
   * Eliminates duplication between fetchChartData and fetchChartDataProgressive
   */
  function validateAndPrepareBaselines(
    fetchConfig: ChartDataFetchConfig,
    allLabels: string[]
  ): { baselineFrom?: string, baselineTo?: string } {
    if (!fetchConfig.baselineMethod) {
      return { baselineFrom: undefined, baselineTo: undefined }
    }

    const validated = validateBaselineDates(
      allLabels,
      fetchConfig.chartType,
      fetchConfig.baselineMethod,
      fetchConfig.baselineDateFrom,
      fetchConfig.baselineDateTo
    )

    return {
      baselineFrom: validated.from,
      baselineTo: validated.to
    }
  }

  /**
   * Shared helper: Calculate data start index
   *
   * Eliminates duplication between fetchChartData and fetchChartDataProgressive
   */
  function calculateDataStartIndex(
    fetchConfig: ChartDataFetchConfig,
    allLabels: string[]
  ): number {
    return fetchConfig.sliderStart
      ? getBaselineStartIndex(allLabels, fetchConfig.chartType, fetchConfig.sliderStart)
      : 0
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
      // Step 1: Fetch dataset with labels (shared helper)
      const datasetResult = await fetchDatasetWithLabels(fetchConfig)
      if (!datasetResult) {
        isUpdating.value = false
        return null
      }
      const { dataset, allLabels } = datasetResult

      // Step 2: Validate and prepare baseline configuration (shared helper)
      const { baselineFrom, baselineTo } = validateAndPrepareBaselines(fetchConfig, allLabels)

      // Step 3: Calculate data start index (shared helper)
      const dataStartIndex = calculateDataStartIndex(fetchConfig, allLabels)

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
        statsUrl,
        fetchConfig.zScoreMode && fetchConfig.zScoreMode !== 'auto' ? fetchConfig.zScoreMode : undefined
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

  /**
   * Progressive chart data fetcher for improved LCP performance
   *
   * Phase 1: Returns chart data immediately with mortality data only (~1s LCP)
   * Phase 2: Provides baseline injection function to add baselines when ready
   *
   * This eliminates the 3.1s LCP caused by blocking on baseline API calls.
   */
  async function fetchChartDataProgressive(
    fetchConfig: ChartDataFetchConfig
  ): Promise<ProgressiveChartDataResult | null> {
    isUpdating.value = true
    updateProgress.value = 0

    try {
      // Phase 1: Fetch dataset with labels (shared helper)
      const datasetResult = await fetchDatasetWithLabels(fetchConfig)
      if (!datasetResult) {
        isUpdating.value = false
        return null
      }
      const { dataset, allLabels } = datasetResult

      // Calculate data start index (shared helper)
      const dataStartIndex = calculateDataStartIndex(fetchConfig, allLabels)

      // Create initial chart data WITHOUT baseline calculations
      // Import the getAllChartData function but skip baseline parameter
      const { getAllChartData: getAllChartDataInternal } = await import('@/lib/data/aggregations')

      const initialChartDataResult = await getAllChartDataInternal(
        fetchConfig.dataKey,
        fetchConfig.chartType,
        dataset,
        allLabels,
        dataStartIndex,
        fetchConfig.cumulative ?? false,
        fetchConfig.ageGroups,
        fetchConfig.countries,
        undefined, // No baseline method - this prevents baseline calculations
        undefined, // No baseline from
        undefined, // No baseline to
        fetchConfig.baseKeys ?? [],
        () => {}, // No progress tracking needed for phase 1
        statsUrl
      )

      const initialChartData: AllChartData = {
        data: initialChartDataResult.data,
        labels: initialChartDataResult.labels,
        notes: initialChartDataResult.notes
      }

      // Validate and prepare baseline configuration for later use (shared helper)
      const { baselineFrom, baselineTo } = validateAndPrepareBaselines(fetchConfig, allLabels)

      // Phase 2: Create baseline injection function for later use
      const injectBaselines = async (): Promise<AllChartData> => {
        if (!fetchConfig.baselineMethod || !baselineFrom || !baselineTo) {
          // No baselines to inject, return current data
          return initialChartData
        }

        // Calculate baselines and inject them into the existing chart data
        const baselineChartDataResult = await getAllChartDataInternal(
          fetchConfig.dataKey,
          fetchConfig.chartType,
          dataset,
          allLabels,
          dataStartIndex,
          fetchConfig.cumulative ?? false,
          fetchConfig.ageGroups,
          fetchConfig.countries,
          fetchConfig.baselineMethod, // Now include baseline method
          baselineFrom,
          baselineTo,
          fetchConfig.baseKeys ?? [],
          fetchConfig.onProgress ?? ((progress, total) => {
            updateProgress.value = Math.round((progress / total) * 100)
          }),
          statsUrl
        )

        return {
          data: baselineChartDataResult.data,
          labels: baselineChartDataResult.labels,
          notes: baselineChartDataResult.notes
        }
      }

      isUpdating.value = false

      return {
        dataset,
        allLabels,
        chartData: initialChartData,
        baselineDateFrom: baselineFrom ?? '',
        baselineDateTo: baselineTo ?? '',
        injectBaselines
      }
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
    fetchChartDataProgressive,
    fetchDatasetOnly,
    validateBaselineDates,
    getBaselineStartIndex
  }
}
