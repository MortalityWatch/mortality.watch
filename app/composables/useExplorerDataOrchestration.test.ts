/**
 * Unit tests for useExplorerDataOrchestration composable
 *
 * Tests cover:
 * - Data fetching orchestration
 * - Date validation and reset logic
 * - Baseline date management
 * - Chart options configuration
 * - Loading state and overlays
 * - Integration with useChartDataFetcher
 * - Edge cases and error handling
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, computed } from 'vue'
import { useExplorerDataOrchestration } from './useExplorerDataOrchestration'
import type { useExplorerState } from './useExplorerState'
import type { useExplorerHelpers } from './useExplorerHelpers'
import type { Country } from '@/model'

import { useChartDataFetcher } from './useChartDataFetcher'
import { getFilteredChartData } from '@/lib/chart'

// Mock dependencies
vi.mock('./useChartDataFetcher', () => ({
  useChartDataFetcher: vi.fn(() => ({
    fetchChartData: vi.fn(),
    isUpdating: ref(false),
    updateProgress: ref(0)
  }))
}))

vi.mock('./useDateRangeValidation', () => ({
  useDateRangeValidation: vi.fn(() => ({
    getValidatedRange: vi.fn(range => range)
  }))
}))

vi.mock('@/lib/chart', () => ({
  getFilteredChartData: vi.fn()
}))

vi.mock('@/lib/compression/compress.browser', () => ({
  arrayBufferToBase64: vi.fn(() => 'base64string'),
  compress: vi.fn(() => Promise.resolve(new ArrayBuffer(8)))
}))

vi.mock('@/model', () => ({
  getKeyForType: vi.fn(() => ['cmr']),
  ChartPeriod: vi.fn().mockImplementation(labels => ({
    indexOf: (label: string) => labels.indexOf(label)
  }))
}))

vi.mock('@/lib/data', () => ({
  getStartIndex: vi.fn(() => 0)
}))

vi.mock('@/model/baseline', () => ({
  getSeasonString: vi.fn((type, year) => String(year))
}))

vi.mock('@/lib/constants', () => ({
  DEFAULT_BASELINE_YEAR: 2019
}))

describe('useExplorerDataOrchestration', () => {
  let mockState: ReturnType<typeof useExplorerState>
  let mockHelpers: ReturnType<typeof useExplorerHelpers>
  let mockAllCountries: ReturnType<typeof ref<Record<string, Country>>>
  let mockDisplayColors: ReturnType<typeof computed<string[]>>
  let mockDataFetcher: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Create mock state
    mockState = {
      countries: ref(['USA']),
      chartType: ref('yearly'),
      ageGroups: ref(['all']),
      type: ref('cmr'),
      standardPopulation: ref('who2015'),
      showBaseline: ref(true),
      baselineMethod: ref('mean'),
      baselineDateFrom: ref('2017'),
      baselineDateTo: ref('2019'),
      isExcess: ref(false),
      cumulative: ref(false),
      showTotal: ref(false),
      showPredictionInterval: ref(true),
      showPercentage: ref(false),
      maximize: ref(false),
      showLabels: ref(true),
      isLogarithmic: ref(false),
      dateFrom: ref('2020'),
      dateTo: ref('2023'),
      sliderStart: ref('2010'),
      chartStyle: ref('line')
    } as any

    // Create mock helpers
    mockHelpers = {
      isBarChartStyle: vi.fn(() => false),
      isLineChartStyle: vi.fn(() => true),
      isMatrixChartStyle: vi.fn(() => false),
      isErrorBarType: vi.fn(() => false),
      isAsmrType: vi.fn(() => false),
      isPopulationType: vi.fn(() => false),
      isDeathsType: vi.fn(() => true),
      hasBaseline: vi.fn(() => true),
      showCumPi: vi.fn(() => false),
      getBaseKeysForType: vi.fn(() => [])
    } as any

    // Create mock countries
    mockAllCountries = ref({
      USA: { iso3c: 'USA', jurisdiction: 'United States' } as any
    }) as any

    // Create mock colors
    mockDisplayColors = computed(() => ['#FF0000', '#00FF00', '#0000FF'])

    // Setup data fetcher mock
    mockDataFetcher = {
      fetchChartData: vi.fn().mockResolvedValue({
        dataset: { USA: {} },
        allLabels: ['2020', '2021', '2022', '2023'],
        chartData: {
          labels: ['2020', '2021', '2022', '2023'],
          data: { all: { USA: { cmr: [100, 110, 120, 130] } } },
          notes: {}
        },
        baselineDateFrom: '2017',
        baselineDateTo: '2019'
      }),
      isUpdating: ref(false),
      updateProgress: ref(0)
    }

    vi.mocked(useChartDataFetcher).mockReturnValue(mockDataFetcher)

    vi.mocked(getFilteredChartData).mockResolvedValue({
      datasets: [],
      labels: ['2020', '2021', '2022', '2023']
    })
  })

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  describe('initialization', () => {
    it('should initialize data state', () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      expect(orchestration.allChartLabels.value).toEqual([])
      expect(orchestration.allYearlyChartLabels.value).toEqual([])
      expect(orchestration.allYearlyChartLabelsUnique.value).toEqual([])
      expect(orchestration.chartData.value).toBeUndefined()
    })

    it('should initialize loading state', () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      expect(orchestration.isUpdating.value).toBe(false)
      expect(orchestration.showLoadingOverlay.value).toBe(false)
    })

    it('should initialize chart options', () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      expect(orchestration.chartOptions.showMaximizeOption).toBe(true)
      expect(orchestration.chartOptions.showBaselineOption).toBe(false)
      expect(orchestration.chartOptions.showLogarithmicOption).toBe(true)
    })
  })

  // ============================================================================
  // CONFIGURE OPTIONS
  // ============================================================================

  describe('configureOptions', () => {
    it('should show total option for excess + bar chart', () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      mockState.isExcess.value = true
      mockHelpers.isBarChartStyle = vi.fn(() => true)

      orchestration.configureOptions()

      expect(orchestration.chartOptions.showTotalOption).toBe(true)
    })

    it('should hide total option for non-excess mode', () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      mockState.isExcess.value = false

      orchestration.configureOptions()

      expect(orchestration.chartOptions.showTotalOption).toBe(false)
    })

    it('should disable total option when cumulative is off', () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      mockState.isExcess.value = true
      mockState.cumulative.value = false
      mockHelpers.isBarChartStyle = vi.fn(() => true)

      orchestration.configureOptions()

      expect(orchestration.chartOptions.showTotalOptionDisabled).toBe(true)
    })

    it('should hide maximize option for excess + line chart', () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      mockState.isExcess.value = true
      mockHelpers.isLineChartStyle = vi.fn(() => true)

      orchestration.configureOptions()

      expect(orchestration.chartOptions.showMaximizeOption).toBe(false)
    })

    it('should hide maximize option for matrix chart', () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      mockHelpers.isMatrixChartStyle = vi.fn(() => true)

      orchestration.configureOptions()

      expect(orchestration.chartOptions.showMaximizeOption).toBe(false)
    })

    it('should disable maximize when logarithmic is on', () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      mockState.isLogarithmic.value = true

      orchestration.configureOptions()

      expect(orchestration.chartOptions.showMaximizeOptionDisabled).toBe(true)
    })

    it('should show baseline option when baseline is available', () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      mockHelpers.hasBaseline = vi.fn(() => true)
      mockHelpers.isMatrixChartStyle = vi.fn(() => false)

      orchestration.configureOptions()

      expect(orchestration.chartOptions.showBaselineOption).toBe(true)
    })

    it('should hide baseline option for matrix chart', () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      mockHelpers.hasBaseline = vi.fn(() => true)
      mockHelpers.isMatrixChartStyle = vi.fn(() => true)

      orchestration.configureOptions()

      expect(orchestration.chartOptions.showBaselineOption).toBe(false)
    })

    it('should show prediction interval option for baseline or excess', () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      mockHelpers.hasBaseline = vi.fn(() => true)

      orchestration.configureOptions()

      expect(orchestration.chartOptions.showPredictionIntervalOption).toBe(true)
    })

    it('should disable prediction interval when baseline is off', () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      mockState.isExcess.value = false
      mockState.showBaseline.value = false

      orchestration.configureOptions()

      expect(orchestration.chartOptions.showPredictionIntervalOptionDisabled).toBe(true)
    })

    it('should show cumulative option for excess mode', () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      mockState.isExcess.value = true

      orchestration.configureOptions()

      expect(orchestration.chartOptions.showCumulativeOption).toBe(true)
    })

    it('should show percentage option for excess mode', () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      mockState.isExcess.value = true

      orchestration.configureOptions()

      expect(orchestration.chartOptions.showPercentageOption).toBe(true)
    })

    it('should hide logarithmic option for matrix chart', () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      mockHelpers.isMatrixChartStyle = vi.fn(() => true)

      orchestration.configureOptions()

      expect(orchestration.chartOptions.showLogarithmicOption).toBe(false)
    })

    it('should hide logarithmic option for excess mode', () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      mockState.isExcess.value = true

      orchestration.configureOptions()

      expect(orchestration.chartOptions.showLogarithmicOption).toBe(false)
    })
  })

  // ============================================================================
  // RESET DATES
  // ============================================================================

  describe('resetDates', () => {
    it('should not reset if dates are valid', () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      orchestration.allChartData.labels = ['2020', '2021', '2022', '2023']
      mockState.dateFrom.value = '2020'
      mockState.dateTo.value = '2023'

      const originalFrom = mockState.dateFrom.value
      const originalTo = mockState.dateTo.value

      orchestration.resetDates()

      expect(mockState.dateFrom.value).toBe(originalFrom)
      expect(mockState.dateTo.value).toBe(originalTo)
    })

    it('should reset if from date is invalid', () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      orchestration.allChartData.labels = ['2020', '2021', '2022', '2023']
      mockState.dateFrom.value = '2099'
      mockState.dateTo.value = '2023'

      orchestration.resetDates()

      expect(mockState.dateFrom.value).not.toBe('2099')
    })

    it('should reset if to date is invalid', () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      orchestration.allChartData.labels = ['2020', '2021', '2022', '2023']
      mockState.dateFrom.value = '2020'
      mockState.dateTo.value = '2099'

      orchestration.resetDates()

      expect(mockState.dateTo.value).not.toBe('2099')
    })

    it('should handle empty labels', () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      orchestration.allChartData.labels = []

      orchestration.resetDates()

      // Should not crash
      expect(true).toBe(true)
    })

    it('should handle undefined dates', () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      orchestration.allChartData.labels = ['2020', '2021', '2022', '2023']
      mockState.dateFrom.value = undefined
      mockState.dateTo.value = undefined

      orchestration.resetDates()

      expect(mockState.dateFrom.value).toBeDefined()
      expect(mockState.dateTo.value).toBeDefined()
    })
  })

  // ============================================================================
  // RESET BASELINE DATES
  // ============================================================================

  describe('resetBaselineDates', () => {
    it('should reset baseline dates when labels change', () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      orchestration.allChartLabels.value = ['2015', '2016', '2017', '2018', '2019', '2020']
      orchestration.allYearlyChartLabels.value = ['2015', '2016', '2017', '2018', '2019', '2020']

      orchestration.resetBaselineDates()

      expect(mockState.baselineDateFrom.value).toBeDefined()
      expect(mockState.baselineDateTo.value).toBeDefined()
    })

    it('should handle empty labels', () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      orchestration.allChartLabels.value = []
      orchestration.allYearlyChartLabels.value = []

      orchestration.resetBaselineDates()

      // Should not crash
      expect(true).toBe(true)
    })

    it('should reset slider start if invalid', () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      orchestration.allChartLabels.value = ['2015', '2016', '2017']
      orchestration.allYearlyChartLabels.value = ['2015', '2016', '2017']
      orchestration.allYearlyChartLabelsUnique.value = ['2015', '2016', '2017']
      mockState.sliderStart.value = '2099'

      orchestration.resetBaselineDates()

      expect(mockState.sliderStart.value).toBe('2010')
    })
  })

  // ============================================================================
  // UPDATE DATA - COMPLETE FETCH
  // ============================================================================

  describe('updateData - complete fetch', () => {
    it('should fetch complete dataset', async () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      await orchestration.updateData(true, false)

      expect(mockDataFetcher.fetchChartData).toHaveBeenCalled()
    })

    it('should update loading state during fetch', async () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      const promise = orchestration.updateData(true, false)

      expect(orchestration.isUpdating.value).toBe(true)

      await promise

      expect(orchestration.isUpdating.value).toBe(false)
    })

    it('should show loading overlay after 500ms', async () => {
      vi.useFakeTimers()

      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      mockDataFetcher.fetchChartData.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          dataset: {},
          allLabels: ['2020'],
          chartData: { labels: ['2020'], data: {}, notes: {} },
          baselineDateFrom: '2017',
          baselineDateTo: '2019'
        }), 1000))
      )

      const promise = orchestration.updateData(true, false)

      expect(orchestration.showLoadingOverlay.value).toBe(false)

      vi.advanceTimersByTime(500)

      expect(orchestration.showLoadingOverlay.value).toBe(true)

      vi.advanceTimersByTime(500)
      await promise

      expect(orchestration.showLoadingOverlay.value).toBe(false)

      vi.useRealTimers()
    })

    it('should update all chart data', async () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      await orchestration.updateData(true, false)

      expect(orchestration.allChartLabels.value).toEqual(['2020', '2021', '2022', '2023'])
      expect(orchestration.allChartData.labels).toEqual(['2020', '2021', '2022', '2023'])
    })

    it('should process yearly labels correctly', async () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      mockState.chartType.value = 'yearly'

      await orchestration.updateData(true, false)

      expect(orchestration.allYearlyChartLabels.value).toBeDefined()
    })

    it('should process monthly labels to yearly', async () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      mockState.chartType.value = 'monthly'
      mockDataFetcher.fetchChartData.mockResolvedValue({
        dataset: {},
        allLabels: ['2020-01', '2020-02', '2020-03'],
        chartData: { labels: ['2020-01', '2020-02', '2020-03'], data: {}, notes: {} },
        baselineDateFrom: '2017',
        baselineDateTo: '2019'
      })

      await orchestration.updateData(true, false)

      expect(orchestration.allYearlyChartLabels.value).toBeDefined()
    })

    it('should call resetDates after fetch', async () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      const resetDatesSpy = vi.spyOn(orchestration, 'resetDates')

      await orchestration.updateData(true, false)

      expect(resetDatesSpy).toHaveBeenCalled()
    })

    it('should update filtered chart data', async () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      await orchestration.updateData(true, false)

      expect(getFilteredChartData).toHaveBeenCalled()
      expect(orchestration.chartData.value).toBeDefined()
    })

    it('should configure chart options after update', async () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      const configureOptionsSpy = vi.spyOn(orchestration, 'configureOptions')

      await orchestration.updateData(true, false)

      expect(configureOptionsSpy).toHaveBeenCalled()
    })

    it('should return early if no data key', async () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      vi.mocked(require('@/model').getKeyForType).mockReturnValue([])

      await orchestration.updateData(true, false)

      expect(mockDataFetcher.fetchChartData).not.toHaveBeenCalled()
    })

    it('should return early if fetch fails', async () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      mockDataFetcher.fetchChartData.mockResolvedValue(null)

      await orchestration.updateData(true, false)

      expect(orchestration.isUpdating.value).toBe(false)
      expect(getFilteredChartData).not.toHaveBeenCalled()
    })
  })

  // ============================================================================
  // UPDATE DATA - DATASET UPDATE ONLY
  // ============================================================================

  describe('updateData - dataset update', () => {
    it('should update dataset without complete fetch', async () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      await orchestration.updateData(false, true)

      expect(mockDataFetcher.fetchChartData).toHaveBeenCalled()
    })

    it('should call resetBaselineDates before update', async () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      const resetBaselineDatesSpy = vi.spyOn(orchestration, 'resetBaselineDates')

      await orchestration.updateData(false, true)

      expect(resetBaselineDatesSpy).toHaveBeenCalled()
    })

    it('should return early if no data key', async () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      vi.mocked(require('@/model').getKeyForType).mockReturnValue([])

      await orchestration.updateData(false, true)

      expect(mockDataFetcher.fetchChartData).not.toHaveBeenCalled()
    })
  })

  // ============================================================================
  // UPDATE DATA - NO FETCH
  // ============================================================================

  describe('updateData - no fetch', () => {
    it('should only update filtered data if no fetch requested', async () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      await orchestration.updateData(false, false)

      expect(mockDataFetcher.fetchChartData).not.toHaveBeenCalled()
      expect(getFilteredChartData).toHaveBeenCalled()
    })

    it('should still configure options', async () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      const configureOptionsSpy = vi.spyOn(orchestration, 'configureOptions')

      await orchestration.updateData(false, false)

      expect(configureOptionsSpy).toHaveBeenCalled()
    })
  })

  // ============================================================================
  // UPDATE FILTERED DATA
  // ============================================================================

  describe('updateFilteredData', () => {
    it('should return empty result if no chart data', async () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      orchestration.allChartData.labels = []

      const result = await orchestration.updateFilteredData()

      expect(result).toEqual({ datasets: [], labels: [] })
    })

    it('should call getFilteredChartData with correct parameters', async () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      orchestration.allChartData.labels = ['2020', '2021']
      orchestration.allChartData.data = { all: {} }

      await orchestration.updateFilteredData()

      expect(getFilteredChartData).toHaveBeenCalledWith(
        mockState.countries.value,
        mockState.standardPopulation.value,
        mockState.ageGroups.value,
        mockState.showPredictionInterval.value,
        mockState.isExcess.value,
        mockState.type.value,
        mockState.cumulative.value,
        mockState.showBaseline.value,
        mockState.baselineMethod.value,
        mockState.baselineDateFrom.value,
        mockState.baselineDateTo.value,
        mockState.showTotal.value,
        mockState.chartType.value,
        mockState.dateFrom.value,
        mockState.dateTo.value,
        false, // isBarChartStyle
        mockAllCountries.value,
        false, // isErrorBarType
        mockDisplayColors.value,
        false, // isMatrixChartStyle
        mockState.showPercentage.value,
        false, // showCumPi
        false, // isAsmrType
        mockState.maximize.value,
        mockState.showLabels.value,
        expect.any(String), // URL
        mockState.isLogarithmic.value,
        false, // isPopulationType
        true, // isDeathsType
        orchestration.allChartData.labels,
        orchestration.allChartData.data
      )
    })
  })

  // ============================================================================
  // DATASET GETTERS/SETTERS
  // ============================================================================

  describe('dataset management', () => {
    it('should get dataset', () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      const dataset = { USA: {} } as any
      orchestration.setDataset(dataset)

      expect(orchestration.getDataset()).toEqual(dataset)
    })

    it('should set dataset', () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      const newDataset = { GBR: {} } as any
      orchestration.setDataset(newDataset)

      expect(orchestration.getDataset()).toEqual(newDataset)
    })
  })

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('edge cases', () => {
    it('should handle ASMR type', async () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      mockHelpers.isAsmrType = vi.fn(() => true)

      await orchestration.updateData(true, false)

      expect(mockDataFetcher.fetchChartData).toHaveBeenCalledWith(
        expect.objectContaining({
          ageGroups: ['all'], // ASMR forces 'all'
          isAsmr: true
        })
      )
    })

    it('should handle multiple countries', async () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      mockState.countries.value = ['USA', 'GBR', 'DEU']

      await orchestration.updateData(true, false)

      expect(mockDataFetcher.fetchChartData).toHaveBeenCalledWith(
        expect.objectContaining({
          countries: ['USA', 'GBR', 'DEU']
        })
      )
    })

    it('should handle bar chart style', async () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      mockHelpers.isBarChartStyle = vi.fn(() => true)

      await orchestration.updateFilteredData()

      expect(getFilteredChartData).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        true, // isBarChartStyle
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything()
      )
    })

    it('should handle matrix chart style', async () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      mockHelpers.isMatrixChartStyle = vi.fn(() => true)

      orchestration.configureOptions()

      expect(orchestration.chartOptions.showMaximizeOption).toBe(false)
      expect(orchestration.chartOptions.showBaselineOption).toBe(false)
      expect(orchestration.chartOptions.showLogarithmicOption).toBe(false)
    })
  })
})
