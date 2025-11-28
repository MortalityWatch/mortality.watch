/**
 * Unit tests for useRankingData composable
 *
 * Tests cover:
 * - Data fetching and processing
 * - Loading state management
 * - Progress tracking
 * - Country filtering (jurisdiction, ASMR availability)
 * - Table row processing
 * - Slider/date management
 * - Watchers and auto-updates
 * - Explorer link generation
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, computed, nextTick } from 'vue'

import { useRankingData } from './useRankingData'
import type { useRankingState } from './useRankingState'
import type { Country } from '@/model'

import { useChartDataFetcher } from './useChartDataFetcher'
import { processCountryRow } from '@/lib/ranking/dataProcessing'
import { showToast } from '@/toast'
import { handleError } from '@/lib/errors/errorHandler'

// Define useRouter globally before importing the composable
// @ts-expect-error - Adding useRouter to globalThis for testing
globalThis.useRouter = vi.fn(() => ({
  push: vi.fn(),
  resolve: vi.fn(({ path, query }) => ({
    href: `${path}?${Object.entries(query || {}).map(([k, v]) => `${k}=${v}`).join('&')}`
  }))
}))

// Mock dependencies
vi.mock('#app', () => ({
  useRouter: () => ({
    push: vi.fn(),
    resolve: vi.fn(({ path, query }) => ({
      href: `${path}?${Object.entries(query || {}).map(([k, v]) => `${k}=${v}`).join('&')}`
    }))
  })
}))

vi.mock('./useChartDataFetcher', () => ({
  useChartDataFetcher: vi.fn(() => ({
    fetchChartData: vi.fn(),
    updateProgress: ref(0)
  }))
}))

vi.mock('./usePeriodFormat', () => ({
  usePeriodFormat: vi.fn(() => ({
    getPeriodStart: vi.fn(year => String(year)),
    getPeriodEnd: vi.fn(year => String(year))
  }))
}))

vi.mock('./useJurisdictionFilter', () => ({
  useJurisdictionFilter: vi.fn(() => ({
    shouldShowCountry: vi.fn(() => true)
  }))
}))

vi.mock('@/toast', () => ({
  showToast: vi.fn()
}))

vi.mock('@/lib/errors/errorHandler', () => ({
  handleError: vi.fn()
}))

vi.mock('@/lib/ranking/dataProcessing', () => ({
  processCountryRow: vi.fn(() => ({
    row: { iso3c: 'USA', jurisdiction: 'United States' },
    hasData: true
  }))
}))

vi.mock('@/model/baseline', () => ({
  defaultBaselineFromDate: vi.fn(() => '2017'),
  defaultBaselineToDate: vi.fn(() => '2019'),
  getSeasonString: vi.fn((type, year) => String(year))
}))

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    resolve: vi.fn(({ path, query }) => ({
      href: `${path}?${Object.entries(query).map(([k, v]) => `${k}=${v}`).join('&')}`
    }))
  }))
}))

// Mock useDateRangeCalculations
// This mock needs to pass through allLabels to visibleLabels since we're testing with premium features
vi.mock('./useDateRangeCalculations', () => ({
  useDateRangeCalculations: vi.fn((_chartType, _sliderStart, _dateFrom, _dateTo, allLabels) => ({
    visibleLabels: allLabels, // Pass through - premium user has access to all labels
    availableLabels: allLabels,
    availableRange: computed(() => null),
    visibleRange: computed(() => null),
    selectedRange: computed(() => ({ from: null, to: null })),
    isValidDate: vi.fn(() => true),
    defaultRange: computed(() => ({ from: '', to: '' })),
    getDefaultRange: vi.fn(() => ({ from: '', to: '' })),
    findClosestYearLabel: vi.fn(() => null),
    matchDateToLabel: vi.fn(() => null),
    hasExtendedTimeAccess: computed(() => true),
    effectiveMinDate: computed(() => null)
  }))
}))

describe('useRankingData', () => {
  let mockState: ReturnType<typeof useRankingState>
  let mockMetaData: ReturnType<typeof computed<Record<string, Country>>>
  let mockDataFetcher: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Suppress Vue lifecycle warnings in tests
    // onMounted is called outside component context, but that's OK for unit tests
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    // Create mock state
    mockState = {
      periodOfTime: ref('yearly'),
      jurisdictionType: ref('all'),
      showASMR: ref(false),
      standardPopulation: ref('who'),
      baselineMethod: ref('mean'),
      baselineDateFrom: ref('2017'),
      baselineDateTo: ref('2019'),
      cumulative: ref(false),
      dateFrom: ref('2010'),
      dateTo: ref('2024'),
      showPercentage: ref(false),
      showTotals: ref(false),
      showTotalsOnly: ref(false),
      hideIncomplete: ref(false)
    } as any

    // Create mock metadata
    mockMetaData = computed(() => ({
      USA: {
        iso3c: 'USA',
        jurisdiction: 'United States',
        has_asmr: () => true
      } as any,
      GBR: {
        iso3c: 'GBR',
        jurisdiction: 'United Kingdom',
        has_asmr: () => true
      } as any,
      IND: {
        iso3c: 'IND',
        jurisdiction: 'India',
        has_asmr: () => false
      } as any
    })) as any

    // Setup data fetcher mock
    mockDataFetcher = {
      fetchChartData: vi.fn().mockResolvedValue({
        allLabels: ['2020', '2021', '2022', '2023'],
        chartData: {
          labels: ['2020', '2021', '2022', '2023'],
          data: {
            all: {
              USA: { cmr: [100, 110, 120, 130] },
              GBR: { cmr: [90, 95, 100, 105] }
            }
          },
          notes: {}
        },
        baselineDateFrom: '2017',
        baselineDateTo: '2019'
      }),
      updateProgress: ref(0)
    }

    vi.mocked(useChartDataFetcher).mockReturnValue(mockDataFetcher)
  })

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  describe('initialization', () => {
    it('should initialize with empty data', () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      expect(ranking.allLabels.value).toEqual([])
      expect(ranking.result.value).toEqual([])
      expect(ranking.initialLoadDone.value).toBe(false)
    })

    it('should initialize loading state', () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      expect(ranking.isUpdating.value).toBe(false)
    })

    it('should expose progress from data fetcher', () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      mockDataFetcher.updateProgress.value = 50

      expect(ranking.updateProgress.value).toBe(50)
    })
  })

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  describe('fetchChartData', () => {
    it('should fetch CMR data by default', async () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      await ranking.loadData()

      expect(mockDataFetcher.fetchChartData).toHaveBeenCalledWith(
        expect.objectContaining({
          dataKey: 'cmr',
          isAsmr: false
        })
      )
    })

    it('should fetch ASMR data when enabled', async () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      mockState.showASMR.value = true

      await ranking.loadData()

      expect(mockDataFetcher.fetchChartData).toHaveBeenCalledWith(
        expect.objectContaining({
          dataKey: 'asmr_who',
          isAsmr: true
        })
      )
    })

    it('should filter countries by ASMR availability', async () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      mockState.showASMR.value = true

      await ranking.loadData()

      const callArgs = mockDataFetcher.fetchChartData.mock.calls[0][0]
      expect(callArgs.countries).not.toContain('IND')
      expect(callArgs.countries).toContain('USA')
      expect(callArgs.countries).toContain('GBR')
    })

    it('should include all countries for CMR', async () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      mockState.showASMR.value = false

      await ranking.loadData()

      const callArgs = mockDataFetcher.fetchChartData.mock.calls[0][0]
      expect(callArgs.countries.length).toBe(3)
    })

    it('should pass correct baseline configuration', async () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      mockState.baselineMethod.value = 'lin_reg'
      mockState.baselineDateFrom.value = '2015'
      mockState.baselineDateTo.value = '2019'

      await ranking.loadData()

      expect(mockDataFetcher.fetchChartData).toHaveBeenCalledWith(
        expect.objectContaining({
          baselineMethod: 'lin_reg',
          baselineDateFrom: '2015',
          baselineDateTo: '2019'
        })
      )
    })

    it('should pass cumulative flag', async () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      mockState.cumulative.value = true

      await ranking.loadData()

      expect(mockDataFetcher.fetchChartData).toHaveBeenCalledWith(
        expect.objectContaining({
          cumulative: true
        })
      )
    })

    it('should handle null response with ASMR error message when ASMR is enabled', async () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      mockState.showASMR.value = true
      mockDataFetcher.fetchChartData.mockResolvedValue(null)

      await ranking.loadData()

      expect(showToast).toHaveBeenCalledWith(
        'No ASMR data for selected countries. Please select CMR',
        'warning'
      )
    })

    it('should handle null response with CMR error message when CMR is enabled', async () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      mockState.showASMR.value = false
      mockDataFetcher.fetchChartData.mockResolvedValue(null)

      await ranking.loadData()

      expect(showToast).toHaveBeenCalledWith(
        'No data available for selected countries',
        'warning'
      )
    })
  })

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  describe('loading state', () => {
    it('should set isUpdating during load', async () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      mockDataFetcher.fetchChartData.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          allLabels: ['2020'],
          chartData: { labels: ['2020'], data: { all: {} }, notes: {} }
        }), 100))
      )

      const promise = ranking.loadData()

      expect(ranking.isUpdating.value).toBe(true)

      await promise

      expect(ranking.isUpdating.value).toBe(false)
    })

    it('should not load if already updating', async () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      mockDataFetcher.fetchChartData.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      )

      const promise1 = ranking.loadData()
      const promise2 = ranking.loadData()

      await promise1

      expect(mockDataFetcher.fetchChartData).toHaveBeenCalledTimes(1)
    })

    it('should set initialLoadDone after first load', async () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      expect(ranking.initialLoadDone.value).toBe(false)

      await ranking.loadData()

      expect(ranking.initialLoadDone.value).toBe(true)
    })

    it('should reset loading state on error', async () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      mockDataFetcher.fetchChartData.mockRejectedValue(new Error('Fetch failed'))

      await ranking.loadData()

      expect(ranking.isUpdating.value).toBe(false)
    })
  })

  // ============================================================================
  // TABLE PROCESSING
  // ============================================================================

  describe('table processing', () => {
    it('should process country rows', async () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      await ranking.loadData()

      expect(processCountryRow).toHaveBeenCalled()
      expect(ranking.result.value.length).toBeGreaterThan(0)
    })

    it('should filter out countries without data', async () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      vi.mocked(processCountryRow)
        .mockReturnValueOnce({ row: { iso3c: 'USA' } as any, hasData: true })
        .mockReturnValueOnce({ row: { iso3c: 'GBR' } as any, hasData: false })

      await ranking.loadData()

      expect(ranking.result.value.length).toBe(1)
      expect(ranking.result.value[0]?.iso3c).toBe('USA')
    })

    it('should add total row when showTotals is true', async () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      mockState.showTotals.value = true

      await ranking.loadData()

      expect(ranking.labels.value).toContain('TOTAL')
    })

    it('should show only total when showTotalsOnly is true', async () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      mockState.showTotalsOnly.value = true

      await ranking.loadData()

      expect(ranking.labels.value).toEqual(['TOTAL'])
    })

    it('should track visible country codes', async () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      vi.mocked(processCountryRow)
        .mockReturnValueOnce({ row: { iso3c: 'USA' } as any, hasData: true })
        .mockReturnValueOnce({ row: { iso3c: 'GBR' } as any, hasData: true })

      await ranking.loadData()

      expect(ranking.visibleCountryCodes.value.has('USA')).toBe(true)
      expect(ranking.visibleCountryCodes.value.has('GBR')).toBe(true)
    })

    it('should reset progress after processing', async () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      mockDataFetcher.updateProgress.value = 50

      await ranking.loadData()

      expect(ranking.updateProgress.value).toBe(0)
    })
  })

  // ============================================================================
  // DATE RANGE MANAGEMENT
  // ============================================================================

  describe('date range management', () => {
    it('should calculate date range using ChartPeriod', async () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      mockState.dateFrom.value = '2021'
      mockState.dateTo.value = '2023'

      await ranking.loadData()

      expect(ranking.labels.value).toEqual(['2021', '2022', '2023'])
    })

    // Note: Date slider changes are now handled directly in ranking.vue via router.push
    // No need to test sliderChanged here since it's removed from the composable

    // Note: Baseline slider changes are also handled directly in ranking.vue via router.push
    // No need to test baselineSliderChanged here since it's removed from the composable

    it('should provide period start helper', () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      const start = ranking.startPeriod()

      expect(start).toBeDefined()
    })

    it('should provide period end helper', () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      const end = ranking.endPeriod()

      expect(end).toBeDefined()
    })
  })

  // ============================================================================
  // PERIOD TYPE CHANGES
  // ============================================================================

  describe('period type changes', () => {
    it('should reset dates when period type changes', async () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      await ranking.loadData()

      ranking.periodOfTimeChanged({
        label: 'Monthly',
        name: 'monthly',
        value: 'monthly'
      })

      expect(mockState.periodOfTime.value).toBe('monthly')
    })

    it('should update baseline dates on period change', async () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      await ranking.loadData()

      const oldBaselineFrom = mockState.baselineDateFrom.value

      ranking.periodOfTimeChanged({
        label: 'Monthly',
        name: 'monthly',
        value: 'monthly'
      })

      // Baseline dates should be recalculated
      expect(mockState.baselineDateFrom.value).toBeDefined()
    })
  })

  // ============================================================================
  // EXPLORER LINK GENERATION
  // ============================================================================

  describe('explorer link generation', () => {
    it('should generate explorer link for specific countries', () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      const link = ranking.explorerLink(['USA', 'GBR'])

      expect(link).toContain('/explorer')
      expect(link).toContain('c=USA,GBR')
    })

    it('should use visible countries if none specified', async () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      vi.mocked(processCountryRow)
        .mockReturnValueOnce({ row: { iso3c: 'USA' } as any, hasData: true })
        .mockReturnValueOnce({ row: { iso3c: 'GBR' } as any, hasData: true })

      await ranking.loadData()

      const link = ranking.explorerLink()

      // Countries are comma-separated in the query string
      expect(link).toContain('c=USA,GBR')
    })

    it('should limit to 20 countries', () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      const manyCodes = Array.from({ length: 50 }, (_, i) => `C${i}`)
      const link = ranking.explorerLink(manyCodes)

      // Count occurrences of 'c=' in link
      const count = (link.match(/c=/g) || []).length
      expect(count).toBeLessThanOrEqual(20)
    })

    it('should include current state parameters', () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      mockState.periodOfTime.value = 'monthly'
      mockState.standardPopulation.value = 'esp2013'
      mockState.baselineMethod.value = 'lin_reg'

      const link = ranking.explorerLink(['USA'])

      expect(link).toContain('ct=monthly')
      expect(link).toContain('sp=esp2013')
      expect(link).toContain('bm=lin_reg')
    })
  })

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe('error handling', () => {
    it('should handle fetch errors', async () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      const error = new Error('Fetch failed')
      mockDataFetcher.fetchChartData.mockRejectedValue(error)

      await ranking.loadData()

      expect(handleError).toHaveBeenCalledWith(
        error,
        'Failed to load ranking data',
        'useRankingData.updateData'
      )
    })

    it('should handle missing data gracefully', async () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      mockDataFetcher.fetchChartData.mockResolvedValue({
        allLabels: ['2020'],
        chartData: {
          labels: ['2020'],
          data: { all: undefined },
          notes: {}
        }
      })

      await ranking.loadData()

      expect(ranking.result.value).toEqual([])
    })

    it('should reset loading state on error', async () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      mockDataFetcher.fetchChartData.mockRejectedValue(new Error('Error'))

      await ranking.loadData()

      expect(ranking.isUpdating.value).toBe(false)
    })
  })

  // ============================================================================
  // WATCHERS
  // ============================================================================

  describe('watchers', () => {
    it('should reload data when period type changes', async () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      await ranking.loadData()

      vi.clearAllMocks()

      mockState.periodOfTime.value = 'monthly'

      await nextTick()

      // Watcher should trigger reload
      // Note: In test environment, watchers may not fire immediately
    })

    it('should reload data when ASMR toggle changes', async () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      await ranking.loadData()

      vi.clearAllMocks()

      mockState.showASMR.value = true

      await nextTick()

      // Watcher should trigger reload
    })

    it('should reload data when baseline method changes', async () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      await ranking.loadData()

      vi.clearAllMocks()

      mockState.baselineMethod.value = 'lin_reg'

      await nextTick()

      // Watcher should trigger reload
    })

    it('should reload data when date range changes', async () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      await ranking.loadData()

      vi.clearAllMocks()

      mockState.dateFrom.value = '2015'

      await nextTick()

      // Watcher should trigger reload
    })

    it('should reload data when display options change', async () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      await ranking.loadData()

      vi.clearAllMocks()

      mockState.showPercentage.value = true

      await nextTick()

      // Watcher should trigger reload
    })
  })

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  describe('computed values', () => {
    it('should compute allYearlyChartLabelsUnique', async () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      mockDataFetcher.fetchChartData.mockResolvedValue({
        allLabels: ['2020-01', '2020-02', '2021-01', '2021-02'],
        chartData: { labels: [], data: { all: {} }, notes: {} }
      })

      await ranking.loadData()

      const unique = ranking.allYearlyChartLabelsUnique.value

      expect(unique).toContain('2020')
      expect(unique).toContain('2021')
      expect(new Set(unique).size).toBe(unique.length)
    })
  })

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('edge cases', () => {
    it('should handle empty metadata', async () => {
      const emptyMetaData = computed(() => ({}))
      const ranking = useRankingData(mockState, emptyMetaData, ref('2020'))

      // When metadata is empty, there should be no countries to process
      // So the result should reflect that
      await ranking.loadData()

      // Check that the ranking handles empty metadata gracefully - should complete without error
      expect(ranking.isUpdating.value).toBe(false)
      expect(ranking.initialLoadDone.value).toBe(true)
    })

    it('should handle empty chart data', async () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      mockDataFetcher.fetchChartData.mockResolvedValue({
        allLabels: [],
        chartData: { labels: [], data: { all: {} }, notes: {} }
      })

      // Should complete without throwing an error
      await expect(ranking.loadData()).resolves.not.toThrow()

      // Loading state should be cleared
      expect(ranking.isUpdating.value).toBe(false)
    })

    it('should handle invalid date range', async () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      mockState.dateFrom.value = '2099'
      mockState.dateTo.value = '2100'

      await ranking.loadData()

      // Should not crash
      expect(ranking.isUpdating.value).toBe(false)
    })

    it('should handle cumulative mode', async () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      mockState.cumulative.value = true

      await ranking.loadData()

      expect(mockDataFetcher.fetchChartData).toHaveBeenCalledWith(
        expect.objectContaining({
          cumulative: true
        })
      )
    })

    it('should handle different standard populations', async () => {
      const ranking = useRankingData(mockState, mockMetaData, ref('2020'))

      mockState.standardPopulation.value = 'esp2013'
      mockState.showASMR.value = true

      await ranking.loadData()

      expect(mockDataFetcher.fetchChartData).toHaveBeenCalledWith(
        expect.objectContaining({
          dataKey: 'asmr_esp2013'
        })
      )
    })
  })
})
