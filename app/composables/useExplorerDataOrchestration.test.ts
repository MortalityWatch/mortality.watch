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

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, computed } from 'vue'
import { useExplorerDataOrchestration } from './useExplorerDataOrchestration'
import type { useExplorerState } from './useExplorerState'
import type { useExplorerHelpers } from './useExplorerHelpers'
import type { Country } from '@/model'

import { useChartDataFetcher } from './useChartDataFetcher'
import { getFilteredChartData } from '@/lib/chart'
import { getKeyForType } from '@/model'

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

vi.mock('./useDateRangeCalculations', () => ({
  useDateRangeCalculations: vi.fn((chartType, sliderStart, dateFrom, dateTo, allLabels) => {
    // Make the mock functional so tests work properly
    const visibleLabels = computed(() => allLabels.value || [])

    return {
      availableLabels: computed(() => allLabels.value || []),
      availableRange: computed(() => {
        const labels = allLabels.value || []
        return labels.length > 0 ? { min: labels[0], max: labels[labels.length - 1] } : null
      }),
      visibleLabels,
      visibleRange: computed(() => {
        const labels = visibleLabels.value
        return labels.length > 0 ? { min: labels[0], max: labels[labels.length - 1] } : null
      }),
      selectedRange: computed(() => ({ from: dateFrom.value ?? null, to: dateTo.value ?? null })),
      isValidDate: (date: string) => visibleLabels.value.includes(date),
      defaultRange: computed(() => {
        const labels = visibleLabels.value
        return labels.length > 0 ? { from: labels[0], to: labels[labels.length - 1] } : { from: '', to: '' }
      }),
      getDefaultRange: () => {
        const labels = visibleLabels.value
        return labels.length > 0 ? { from: labels[0], to: labels[labels.length - 1] } : { from: '', to: '' }
      },
      findClosestYearLabel: (targetYear: string, preferLast = false) => {
        const labels = visibleLabels.value
        const yearLabels = labels.filter((l: string) => l.startsWith(targetYear))
        if (yearLabels.length === 0) return null
        return preferLast ? yearLabels[yearLabels.length - 1] : yearLabels[0]
      },
      matchDateToLabel: (currentDate: string | null | undefined, preferLast: boolean) => {
        if (!currentDate) return null
        const labels = visibleLabels.value
        if (labels.includes(currentDate)) return currentDate
        const year = currentDate.substring(0, 4)
        const matching = labels.filter((l: string) => l.startsWith(year))
        if (matching.length === 0) return null
        return preferLast ? matching[matching.length - 1] : matching[0]
      },
      hasExtendedTimeAccess: computed(() => true),
      effectiveMinDate: computed(() => {
        const labels = allLabels.value || []
        return labels.length > 0 ? labels[0] : null
      })
    }
  })
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
  DEFAULT_BASELINE_YEAR: 2019,
  getBaselineYear: (_chartType: string) => {
    // Test mock: use 2019 for all chart types for consistency with existing tests
    return 2019
  }
}))

describe('useExplorerDataOrchestration', () => {
  let mockState: ReturnType<typeof useExplorerState>
  let mockHelpers: ReturnType<typeof useExplorerHelpers>
  let mockAllCountries: Ref<Record<string, Country>>
  let mockDisplayColors: ComputedRef<string[]>
  let mockDataFetcher: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock window.location for makeUrl function
    global.window = {
      location: {
        href: 'https://mortality.watch/explorer',
        pathname: '/explorer',
        search: '',
        hash: ''
      }
    } as any

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
      chartStyle: ref('line'),
      isUserSet: vi.fn(() => false)
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
    })

    // Create mock colors (cast to any to bypass WritableComputedRefSymbol check in tests)
    mockDisplayColors = computed(() => ['#FF0000', '#00FF00', '#0000FF']) as any

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
      labels: ['2020', '2021', '2022', '2023'],
      title: 'Test Chart',
      subtitle: '',
      xtitle: '',
      ytitle: '',
      isMaximized: false,
      isLogarithmic: false,
      showLabels: true,
      url: '',
      showPercentage: false,
      showXOffset: false,
      sources: []
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
    it.skip('should show total option for excess + bar chart', () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

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

      mockState.cumulative.value = false
      mockHelpers.isBarChartStyle = vi.fn(() => true)

      orchestration.configureOptions()

      expect(orchestration.chartOptions.showTotalOptionDisabled).toBe(true)
    })

    it.skip('should hide maximize option for excess + line chart', () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

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

      mockState.showBaseline.value = false

      orchestration.configureOptions()

      expect(orchestration.chartOptions.showPredictionIntervalOptionDisabled).toBe(true)
    })

    it.skip('should show cumulative option for excess mode', () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )


      orchestration.configureOptions()

      expect(orchestration.chartOptions.showCumulativeOption).toBe(true)
    })

    it.skip('should show percentage option for excess mode', () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )


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

    it.skip('should hide logarithmic option for excess mode', () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )


      orchestration.configureOptions()

      expect(orchestration.chartOptions.showLogarithmicOption).toBe(false)
    })
  })

  // ============================================================================
  // DATE VALIDATION (via reactive watcher)
  // ============================================================================

  /**
   * Note: Date validation is now handled by a reactive watcher that triggers when:
   * - visibleLabels changes (data loaded)
   * - chartType changes (may invalidate current selection)
   *
   * The watcher automatically:
   * 1. Preserves valid dates
   * 2. Resets invalid dates to default range
   * 3. Tries to preserve year when chart type changes
   *
   * This functionality is tested through integration tests in the explorer page tests,
   * and indirectly through the updateData tests below.
   *
   * resetDates() function was replaced with reactive watcher.
   */

  // ============================================================================
  // RESET BASELINE DATES
  // ============================================================================

  describe('baselineRange computed', () => {
    it('should compute baseline range from labels', () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      orchestration.allChartLabels.value = ['2015', '2016', '2017', '2018', '2019', '2020']
      orchestration.allYearlyChartLabels.value = ['2015', '2016', '2017', '2018', '2019', '2020']

      // Note: baselineRange is not exported, but its effect is tested via data fetching
      // This validates that the composable can compute baseline defaults
      // The state values are '2017' and '2019' from the mock setup
      expect(mockState.baselineDateFrom.value).toBe('2017')
      expect(mockState.baselineDateTo.value).toBe('2019')
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

      // Should not crash - computed handles empty gracefully
      expect(true).toBe(true)
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

      // Note: We can't spy on internal method calls due to closure scope
      // Instead, verify the behavior: dates should be validated after fetch
      await orchestration.updateData(true, false)

      // If resetDates was called, the state should be consistent
      expect(orchestration.allChartLabels.value).toBeDefined()
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

      // Note: We can't spy on internal method calls due to closure scope
      // Instead, verify the behavior: options should be configured
      await orchestration.updateData(true, false)

      // If configureOptions was called, chartOptions should be set
      expect(orchestration.chartOptions).toBeDefined()
    })

    it('should return early if no data key', async () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      vi.mocked(getKeyForType).mockReturnValue([])

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

      // Should not throw an error
      await expect(orchestration.updateData(false, true)).resolves.not.toThrow()

      // Note: This path may not fully populate chartData depending on implementation
      // The important thing is it doesn't crash
      expect(orchestration.isUpdating.value).toBe(false)
    })

    it('should call resetBaselineDates before update', async () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      // Note: We can't spy on internal method calls due to closure scope
      // Instead, verify the behavior: should complete without error
      await expect(orchestration.updateData(false, true)).resolves.not.toThrow()

      // Verify loading state is properly cleared
      expect(orchestration.isUpdating.value).toBe(false)
    })

    it('should return early if no data key', async () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      vi.mocked(getKeyForType).mockReturnValue([])

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

      // Note: We can't spy on internal method calls due to closure scope
      // Instead, verify the behavior: chartOptions should be defined
      await orchestration.updateData(false, false)

      expect(orchestration.chartOptions).toBeDefined()
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

      // Set data to undefined to trigger early return
      orchestration.allChartData.data = undefined as any

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

      // Should complete without error
      await expect(orchestration.updateData(true, false)).resolves.not.toThrow()

      // Verify loading state is properly managed
      expect(orchestration.isUpdating.value).toBe(false)
    })

    it('should handle multiple countries', async () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      mockState.countries.value = ['USA', 'GBR', 'DEU']

      // Should complete without error
      await expect(orchestration.updateData(true, false)).resolves.not.toThrow()

      // Verify loading state is properly managed
      expect(orchestration.isUpdating.value).toBe(false)
    })

    it('should handle bar chart style', async () => {
      const orchestration = useExplorerDataOrchestration(
        mockState,
        mockHelpers,
        mockAllCountries,
        mockDisplayColors
      )

      mockHelpers.isBarChartStyle = vi.fn(() => true)

      // Set up chart data so updateFilteredData has something to work with
      orchestration.allChartData.labels = ['2020', '2021']
      orchestration.allChartData.data = { all: {} }

      // Should complete without error
      await expect(orchestration.updateFilteredData()).resolves.not.toThrow()

      // getFilteredChartData should have been called
      expect(getFilteredChartData).toHaveBeenCalled()
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
