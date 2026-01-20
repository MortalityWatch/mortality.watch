/**
 * Unit tests for useChartDataFetcher composable
 *
 * Tests cover:
 * - Data fetching success and error scenarios
 * - Loading state management
 * - Baseline date validation and fallback
 * - Progress tracking
 * - Cache integration (via lib/data functions)
 * - Edge cases (empty data, invalid dates, etc.)
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useChartDataFetcher } from './useChartDataFetcher'
import type { ChartType } from '@/model/period'
import type { DatasetRaw, AllChartData, CountryData } from '@/model'

import {
  updateDataset as fetchDataset,
  getAllChartLabels as fetchAllChartLabels,
  getAllChartData as fetchAllChartData
} from '@/lib/data'
import {
  defaultBaselineFromDate,
  defaultBaselineToDate
} from '@/model/baseline'

// Mock dependencies
vi.mock('@/lib/data', () => ({
  updateDataset: vi.fn(),
  getAllChartLabels: vi.fn(),
  getAllChartData: vi.fn()
}))

vi.mock('@/model/baseline', () => ({
  defaultBaselineFromDate: vi.fn(),
  defaultBaselineToDate: vi.fn()
}))

// Mock useRuntimeConfig
vi.stubGlobal('useRuntimeConfig', () => ({
  public: {
    statsUrl: 'https://stats.mortality.watch/'
  }
}))

describe('useChartDataFetcher', () => {
  const mockDataset: DatasetRaw = {
    USA: {
      all: [
        { cmr: 100, asmr_who: 50 } as any
      ]
    }
  }

  const mockLabels = ['2020', '2021', '2022']

  const mockChartData: AllChartData = {
    labels: mockLabels,
    data: {
      all: {
        USA: {
          cmr: [100, 110, 120]
        } as any
      }
    },
    notes: {
      noData: undefined,
      noAsmr: undefined
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fetchDataset).mockResolvedValue(mockDataset)
    vi.mocked(fetchAllChartLabels).mockReturnValue(mockLabels)
    vi.mocked(fetchAllChartData).mockResolvedValue(mockChartData)
    vi.mocked(defaultBaselineFromDate).mockReturnValue('2017')
    vi.mocked(defaultBaselineToDate).mockReturnValue('2019')
  })

  // ============================================================================
  // BASIC FUNCTIONALITY
  // ============================================================================

  describe('fetchChartData', () => {
    it('should fetch complete chart data successfully', async () => {
      const fetcher = useChartDataFetcher()

      const result = await fetcher.fetchChartData({
        chartType: 'yearly' as ChartType,
        countries: ['USA'],
        ageGroups: ['all'],
        dataKey: 'cmr' as keyof CountryData,
        baselineMethod: 'mean',
        baselineDateFrom: '2017',
        baselineDateTo: '2019'
      })

      expect(result).toBeDefined()
      expect(result?.dataset).toEqual(mockDataset)
      expect(result?.allLabels).toEqual(mockLabels)
      expect(result?.chartData).toEqual(mockChartData)
    })

    it('should return validated baseline dates', async () => {
      const fetcher = useChartDataFetcher()

      const result = await fetcher.fetchChartData({
        chartType: 'yearly' as ChartType,
        countries: ['USA'],
        ageGroups: ['all'],
        dataKey: 'cmr' as keyof CountryData,
        baselineMethod: 'mean',
        baselineDateFrom: '2017',
        baselineDateTo: '2019'
      })

      expect(result?.baselineDateFrom).toBe('2017')
      expect(result?.baselineDateTo).toBe('2019')
    })

    it('should pass correct parameters to data fetching functions', async () => {
      const fetcher = useChartDataFetcher()

      await fetcher.fetchChartData({
        chartType: 'yearly' as ChartType,
        countries: ['USA', 'GBR'],
        ageGroups: ['all', '0-14'],
        dataKey: 'cmr' as keyof CountryData,
        baselineMethod: 'mean',
        baselineDateFrom: '2017',
        baselineDateTo: '2019',
        cumulative: true,
        isAsmr: false
      })

      expect(fetchDataset).toHaveBeenCalledWith(
        'yearly',
        ['USA', 'GBR'],
        ['all', '0-14']
      )

      expect(fetchAllChartLabels).toHaveBeenCalledWith(
        mockDataset,
        false,
        ['all', '0-14'],
        ['USA', 'GBR'],
        'yearly'
      )
    })
  })

  // ============================================================================
  // LOADING STATE MANAGEMENT
  // ============================================================================

  describe('loading state', () => {
    it('should set isUpdating to true during fetch', async () => {
      const fetcher = useChartDataFetcher()

      // Mock slow fetch
      vi.mocked(fetchDataset).mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve(mockDataset), 100))
      )

      const promise = fetcher.fetchChartData({
        chartType: 'yearly' as ChartType,
        countries: ['USA'],
        ageGroups: ['all'],
        dataKey: 'cmr' as keyof CountryData,
        baselineMethod: 'mean'
      })

      expect(fetcher.isUpdating.value).toBe(true)
      await promise
      expect(fetcher.isUpdating.value).toBe(false)
    })

    it('should reset isUpdating on error', async () => {
      const fetcher = useChartDataFetcher()

      vi.mocked(fetchDataset).mockRejectedValue(new Error('Network error'))

      await expect(fetcher.fetchChartData({
        chartType: 'yearly' as ChartType,
        countries: ['USA'],
        ageGroups: ['all'],
        dataKey: 'cmr' as keyof CountryData,
        baselineMethod: 'mean'
      })).rejects.toThrow('Network error')

      expect(fetcher.isUpdating.value).toBe(false)
    })

    it('should reset isUpdating even if getAllChartData throws', async () => {
      const fetcher = useChartDataFetcher()

      vi.mocked(fetchAllChartData).mockRejectedValue(new Error('Processing error'))

      await expect(fetcher.fetchChartData({
        chartType: 'yearly' as ChartType,
        countries: ['USA'],
        ageGroups: ['all'],
        dataKey: 'cmr' as keyof CountryData,
        baselineMethod: 'mean'
      })).rejects.toThrow('Processing error')

      expect(fetcher.isUpdating.value).toBe(false)
    })
  })

  // ============================================================================
  // PROGRESS TRACKING
  // ============================================================================

  describe('progress tracking', () => {
    it('should initialize progress to 0', () => {
      const fetcher = useChartDataFetcher()
      expect(fetcher.updateProgress.value).toBe(0)
    })

    it('should update progress during data fetching', async () => {
      const fetcher = useChartDataFetcher()
      let progressCallback: ((progress: number, total: number) => void) | undefined

      vi.mocked(fetchAllChartData).mockImplementation(async (...args: any[]) => {
        // Progress callback is second to last arg (last is statsUrl)
        progressCallback = args[args.length - 2] as (progress: number, total: number) => void
        if (progressCallback) {
          progressCallback(50, 100)
        }
        return mockChartData
      })

      await fetcher.fetchChartData({
        chartType: 'yearly' as ChartType,
        countries: ['USA'],
        ageGroups: ['all'],
        dataKey: 'cmr' as keyof CountryData,
        baselineMethod: 'mean'
      })

      expect(fetcher.updateProgress.value).toBe(50)
    })

    it('should use custom progress callback if provided', async () => {
      const fetcher = useChartDataFetcher()
      const customCallback = vi.fn()
      let progressCallback: ((progress: number, total: number) => void) | undefined

      vi.mocked(fetchAllChartData).mockImplementation(async (...args: any[]) => {
        // Progress callback is second to last arg (last is statsUrl)
        progressCallback = args[args.length - 2] as (progress: number, total: number) => void
        if (progressCallback) {
          progressCallback(75, 100)
        }
        return mockChartData
      })

      await fetcher.fetchChartData({
        chartType: 'yearly' as ChartType,
        countries: ['USA'],
        ageGroups: ['all'],
        dataKey: 'cmr' as keyof CountryData,
        baselineMethod: 'mean',
        onProgress: customCallback
      })

      expect(customCallback).toHaveBeenCalledWith(75, 100)
    })
  })

  // ============================================================================
  // BASELINE DATE VALIDATION
  // ============================================================================

  describe('validateBaselineDates', () => {
    it('should return valid dates unchanged', () => {
      const fetcher = useChartDataFetcher()

      const result = fetcher.validateBaselineDates(
        mockLabels,
        'yearly' as ChartType,
        'mean',
        '2020',
        '2021'
      )

      expect(result.from).toBe('2020')
      expect(result.to).toBe('2021')
    })

    it('should fallback to defaults for invalid from date', () => {
      const fetcher = useChartDataFetcher()

      const result = fetcher.validateBaselineDates(
        mockLabels,
        'yearly' as ChartType,
        'mean',
        '2099', // Invalid date not in labels
        '2021'
      )

      expect(result.from).toBe('2017')
      expect(defaultBaselineFromDate).toHaveBeenCalledWith(
        'yearly',
        mockLabels,
        'mean'
      )
    })

    it('should fallback to defaults for invalid to date', () => {
      const fetcher = useChartDataFetcher()

      const result = fetcher.validateBaselineDates(
        mockLabels,
        'yearly' as ChartType,
        'mean',
        '2020',
        '2099' // Invalid date not in labels
      )

      expect(result.to).toBe('2019')
      expect(defaultBaselineToDate).toHaveBeenCalledWith('yearly')
    })

    it('should fallback when dates are undefined', () => {
      const fetcher = useChartDataFetcher()

      const result = fetcher.validateBaselineDates(
        mockLabels,
        'yearly' as ChartType,
        'mean',
        undefined,
        undefined
      )

      expect(result.from).toBe('2017')
      expect(result.to).toBe('2019')
    })

    it('should handle empty strings as invalid dates', () => {
      const fetcher = useChartDataFetcher()

      const result = fetcher.validateBaselineDates(
        mockLabels,
        'yearly' as ChartType,
        'mean',
        '',
        ''
      )

      expect(result.from).toBe('2017')
      expect(result.to).toBe('2019')
    })
  })

  // ============================================================================
  // BASELINE START INDEX
  // ============================================================================

  describe('getBaselineStartIndex', () => {
    it('should return correct index for valid date', () => {
      const fetcher = useChartDataFetcher()

      const index = fetcher.getBaselineStartIndex(
        mockLabels,
        'yearly' as ChartType,
        '2021'
      )

      expect(index).toBe(1)
    })

    it('should return closest date index for date not in labels', () => {
      const fetcher = useChartDataFetcher()

      const index = fetcher.getBaselineStartIndex(
        mockLabels,
        'yearly' as ChartType,
        '2099'
      )

      // ChartPeriod.indexOf has smart fallback - returns closest date (2022 at index 2)
      expect(index).toBe(2)
    })

    it('should handle first label', () => {
      const fetcher = useChartDataFetcher()

      const index = fetcher.getBaselineStartIndex(
        mockLabels,
        'yearly' as ChartType,
        '2020'
      )

      expect(index).toBe(0)
    })

    it('should handle last label', () => {
      const fetcher = useChartDataFetcher()

      const index = fetcher.getBaselineStartIndex(
        mockLabels,
        'yearly' as ChartType,
        '2022'
      )

      expect(index).toBe(2)
    })
  })

  // ============================================================================
  // FETCH DATASET ONLY
  // ============================================================================

  describe('fetchDatasetOnly', () => {
    it('should fetch dataset and labels without processing', async () => {
      const fetcher = useChartDataFetcher()

      const result = await fetcher.fetchDatasetOnly(
        'yearly' as ChartType,
        ['USA'],
        ['all'],
        false
      )

      expect(result).toBeDefined()
      expect(result?.dataset).toEqual(mockDataset)
      expect(result?.allLabels).toEqual(mockLabels)
      expect(fetchAllChartData).not.toHaveBeenCalled()
    })

    it('should return null when no labels available', async () => {
      const fetcher = useChartDataFetcher()

      vi.mocked(fetchAllChartLabels).mockReturnValue([])

      const result = await fetcher.fetchDatasetOnly(
        'yearly' as ChartType,
        ['USA'],
        ['all']
      )

      expect(result).toBeNull()
    })

    it('should manage loading state', async () => {
      const fetcher = useChartDataFetcher()

      vi.mocked(fetchDataset).mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve(mockDataset), 100))
      )

      const promise = fetcher.fetchDatasetOnly(
        'yearly' as ChartType,
        ['USA'],
        ['all']
      )

      expect(fetcher.isUpdating.value).toBe(true)
      await promise
      expect(fetcher.isUpdating.value).toBe(false)
    })

    it('should reset loading state on error', async () => {
      const fetcher = useChartDataFetcher()

      vi.mocked(fetchDataset).mockRejectedValue(new Error('Fetch failed'))

      await expect(fetcher.fetchDatasetOnly(
        'yearly' as ChartType,
        ['USA'],
        ['all']
      )).rejects.toThrow('Fetch failed')

      expect(fetcher.isUpdating.value).toBe(false)
    })
  })

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe('error handling', () => {
    it('should propagate dataset fetch errors', async () => {
      const fetcher = useChartDataFetcher()

      vi.mocked(fetchDataset).mockRejectedValue(new Error('Database error'))

      await expect(fetcher.fetchChartData({
        chartType: 'yearly' as ChartType,
        countries: ['USA'],
        ageGroups: ['all'],
        dataKey: 'cmr' as keyof CountryData,
        baselineMethod: 'mean'
      })).rejects.toThrow('Database error')
    })

    it('should propagate chart data processing errors', async () => {
      const fetcher = useChartDataFetcher()

      vi.mocked(fetchAllChartData).mockRejectedValue(new Error('Processing failed'))

      await expect(fetcher.fetchChartData({
        chartType: 'yearly' as ChartType,
        countries: ['USA'],
        ageGroups: ['all'],
        dataKey: 'cmr' as keyof CountryData,
        baselineMethod: 'mean'
      })).rejects.toThrow('Processing failed')
    })

    it('should return null when no labels are available', async () => {
      const fetcher = useChartDataFetcher()

      vi.mocked(fetchAllChartLabels).mockReturnValue([])

      const result = await fetcher.fetchChartData({
        chartType: 'yearly' as ChartType,
        countries: ['USA'],
        ageGroups: ['all'],
        dataKey: 'cmr' as keyof CountryData,
        baselineMethod: 'mean'
      })

      expect(result).toBeNull()
    })
  })

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('edge cases', () => {
    it('should handle empty countries array', async () => {
      const fetcher = useChartDataFetcher()

      await fetcher.fetchChartData({
        chartType: 'yearly' as ChartType,
        countries: [],
        ageGroups: ['all'],
        dataKey: 'cmr' as keyof CountryData,
        baselineMethod: 'mean'
      })

      expect(fetchDataset).toHaveBeenCalledWith('yearly', [], ['all'])
    })

    it('should handle empty age groups array', async () => {
      const fetcher = useChartDataFetcher()

      await fetcher.fetchChartData({
        chartType: 'yearly' as ChartType,
        countries: ['USA'],
        ageGroups: [],
        dataKey: 'cmr' as keyof CountryData,
        baselineMethod: 'mean'
      })

      expect(fetchDataset).toHaveBeenCalledWith('yearly', ['USA'], [])
    })

    it('should handle ASMR data type', async () => {
      const fetcher = useChartDataFetcher()

      await fetcher.fetchChartData({
        chartType: 'yearly' as ChartType,
        countries: ['USA'],
        ageGroups: ['all'],
        dataKey: 'asmr_who' as keyof CountryData,
        baselineMethod: 'mean',
        isAsmr: true
      })

      expect(fetchAllChartLabels).toHaveBeenCalledWith(
        mockDataset,
        true,
        ['all'],
        ['USA'],
        'yearly'
      )
    })

    it('should handle cumulative mode', async () => {
      const fetcher = useChartDataFetcher()

      await fetcher.fetchChartData({
        chartType: 'yearly' as ChartType,
        countries: ['USA'],
        ageGroups: ['all'],
        dataKey: 'cmr' as keyof CountryData,
        baselineMethod: 'mean',
        cumulative: true
      })

      expect(fetchAllChartData).toHaveBeenCalledWith(
        'cmr',
        'yearly',
        mockDataset,
        mockLabels,
        expect.any(Number),
        true,
        ['all'],
        ['USA'],
        'mean',
        '2017',
        '2019',
        [],
        expect.any(Function),
        'https://stats.mortality.watch/'
      )
    })

    it('should always load all data (ignore baselineStartIdx)', async () => {
      const fetcher = useChartDataFetcher()

      await fetcher.fetchChartData({
        chartType: 'yearly' as ChartType,
        countries: ['USA'],
        ageGroups: ['all'],
        dataKey: 'cmr' as keyof CountryData,
        baselineMethod: 'mean',
        baselineStartIdx: 5
      })

      // Now we always pass 0 as startDateIndex to load ALL data
      // Filtering happens later at display time
      expect(fetchAllChartData).toHaveBeenCalledWith(
        'cmr',
        'yearly',
        mockDataset,
        mockLabels,
        0, // Always 0, not baselineStartIdx
        false,
        ['all'],
        ['USA'],
        'mean',
        '2017',
        '2019',
        [],
        expect.any(Function),
        'https://stats.mortality.watch/'
      )
    })

    it('should handle different baseline methods', async () => {
      const fetcher = useChartDataFetcher()

      vi.mocked(defaultBaselineFromDate).mockReturnValue('2010')

      await fetcher.fetchChartData({
        chartType: 'yearly' as ChartType,
        countries: ['USA'],
        ageGroups: ['all'],
        dataKey: 'cmr' as keyof CountryData,
        baselineMethod: 'lin_reg'
      })

      expect(defaultBaselineFromDate).toHaveBeenCalledWith(
        'yearly',
        mockLabels,
        'lin_reg'
      )
    })
  })
})
