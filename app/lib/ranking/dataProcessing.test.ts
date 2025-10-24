import { describe, it, expect } from 'vitest'
import {
  calculateRelativeExcessArrays,
  processCountryRow,
  visibleCountryCodesForExplorer
} from './dataProcessing'
import type { ProcessCountryRowOptions } from './types'
import type { DatasetEntry, Country } from '@/model'

describe('ranking/dataProcessing', () => {
  describe('calculateRelativeExcessArrays', () => {
    it('should calculate relative excess from cumulative arrays', () => {
      const cumMetric = [100, 200, 300]
      const cumMetricLower = [90, 180, 270]
      const cumMetricUpper = [110, 220, 330]
      const cumBaseline = [80, 160, 240]

      const result = calculateRelativeExcessArrays(
        cumMetric,
        cumMetricLower,
        cumMetricUpper,
        cumBaseline
      )

      expect(result.excessCum).toEqual([1.25, 1.25, 1.25])
      expect(result.excessCumLower).toEqual([1.125, 1.125, 1.125])
      expect(result.excessCumUpper).toEqual([1.375, 1.375, 1.375])
    })

    it('should return NaN for zero baseline values', () => {
      const cumMetric = [100, 200, 300]
      const cumMetricLower = [90, 180, 270]
      const cumMetricUpper = [110, 220, 330]
      const cumBaseline = [0, 160, 0]

      const result = calculateRelativeExcessArrays(
        cumMetric,
        cumMetricLower,
        cumMetricUpper,
        cumBaseline
      )

      expect(result.excessCum[0]).toBeNaN()
      expect(result.excessCum[1]).toBe(1.25)
      expect(result.excessCum[2]).toBeNaN()
    })

    it('should return NaN for very small baseline values below threshold', () => {
      const cumMetric = [100, 200, 300]
      const cumMetricLower = [90, 180, 270]
      const cumMetricUpper = [110, 220, 330]
      const cumBaseline = [0.0001, 160, 240] // First value below MIN_BASELINE_THRESHOLD (0.01)

      const result = calculateRelativeExcessArrays(
        cumMetric,
        cumMetricLower,
        cumMetricUpper,
        cumBaseline
      )

      expect(result.excessCum[0]).toBeNaN()
      expect(result.excessCum[1]).toBe(1.25)
      expect(result.excessCum[2]).toBe(1.25)
    })

    it('should return empty arrays if any input is undefined', () => {
      const result = calculateRelativeExcessArrays(
        undefined,
        [90, 180],
        [110, 220],
        [80, 160]
      )

      expect(result.excessCum).toEqual([])
      expect(result.excessCumLower).toEqual([])
      expect(result.excessCumUpper).toEqual([])
    })

    it('should handle NaN values in baseline', () => {
      const cumMetric = [100, 200, 300]
      const cumMetricLower = [90, 180, 270]
      const cumMetricUpper = [110, 220, 330]
      const cumBaseline = [80, NaN, 240]

      const result = calculateRelativeExcessArrays(
        cumMetric,
        cumMetricLower,
        cumMetricUpper,
        cumBaseline
      )

      expect(result.excessCum[0]).toBe(1.25)
      expect(result.excessCum[1]).toBeNaN()
      expect(result.excessCum[2]).toBe(1.25)
    })
  })

  describe('visibleCountryCodesForExplorer', () => {
    it('should convert country codes to query params', () => {
      const codes = ['USA', 'GBR', 'DEU']
      const result = visibleCountryCodesForExplorer(codes)

      expect(result).toEqual(['c=USA', 'c=GBR', 'c=DEU'])
    })

    it('should handle empty array', () => {
      const result = visibleCountryCodesForExplorer([])
      expect(result).toEqual([])
    })

    it('should handle single country', () => {
      const result = visibleCountryCodesForExplorer(['USA'])
      expect(result).toEqual(['c=USA'])
    })

    it('should handle special jurisdiction codes', () => {
      const codes = ['GBRTENW', 'GBR_SCO', 'USA']
      const result = visibleCountryCodesForExplorer(codes)

      expect(result).toEqual(['c=GBRTENW', 'c=GBR_SCO', 'c=USA'])
    })
  })

  describe('processCountryRow', () => {
    // Helper to create mock metadata
    const createMockMetadata = (iso3c: string): Record<string, Country> => ({
      [iso3c]: {
        jurisdiction: `Country ${iso3c}`,
        iso_3166_1_alpha_2: iso3c.substring(0, 2).toLowerCase(),
        iso_3166_1_alpha_3: iso3c,
        name: `Country ${iso3c}`
      } as Country
    })

    // Helper to create mock country data
    const createMockCountryData = (
      excess: number[],
      baseline: number[]
    ): DatasetEntry => {
      return {
        cmr_excess: excess,
        cmr_excess_lower: excess.map(v => v * 0.9),
        cmr_excess_upper: excess.map(v => v * 1.1),
        cmr_baseline: baseline,
        cmr_baseline_lower: baseline.map(v => v * 0.9),
        cmr_baseline_upper: baseline.map(v => v * 1.1)
      } as unknown as DatasetEntry
    }

    it('should create a row with basic country info', () => {
      const options: ProcessCountryRowOptions = {
        iso3c: 'USA',
        countryData: createMockCountryData([10, 20, 30], [100, 100, 100]),
        dataKey: 'cmr',
        range: { startIndex: 0, endIndex: 3 },
        dataLabels: ['2020', '2021', '2022'],
        metaData: createMockMetadata('USA'),
        explorerLink: codes => `/explorer?c=${codes.join(',')}`,
        display: { showRelative: false, cumulative: false, hideIncomplete: false },
        totalRowKey: 'TOTAL'
      }

      const { row } = processCountryRow(options)

      expect(row.country).toBe('Country USA')
      expect(row.iso2c).toBe('us')
      expect(row.href).toBe('/explorer?c=USA')
    })

    it('should handle special flag mappings for UK regions', () => {
      const specialCodes = ['GBRTENW', 'GBR_SCO', 'GBR_NIR']

      specialCodes.forEach((code) => {
        const options: ProcessCountryRowOptions = {
          iso3c: code,
          countryData: createMockCountryData([10], [100]),
          dataKey: 'cmr',
          range: { startIndex: 0, endIndex: 1 },
          dataLabels: ['2020'],
          metaData: createMockMetadata(code),
          explorerLink: () => '/',
          display: { showRelative: false, cumulative: false, hideIncomplete: false },
          totalRowKey: 'TOTAL'
        }

        const { row } = processCountryRow(options)
        expect(row.iso2c).toBe('gb')
      })
    })

    it('should calculate absolute values when showRelative is false', () => {
      const options: ProcessCountryRowOptions = {
        iso3c: 'USA',
        countryData: createMockCountryData([10, 20, 30], [100, 100, 100]),
        dataKey: 'cmr',
        range: { startIndex: 0, endIndex: 3 },
        dataLabels: ['2020', '2021', '2022'],
        metaData: createMockMetadata('USA'),
        explorerLink: () => '/',
        display: { showRelative: false, cumulative: false, hideIncomplete: false },
        totalRowKey: 'TOTAL'
      }

      const { row } = processCountryRow(options)

      expect(row['2020']).toBe(10)
      expect(row['2021']).toBe(20)
      expect(row['2022']).toBe(30)
    })

    it('should calculate relative values when showRelative is true', () => {
      const options: ProcessCountryRowOptions = {
        iso3c: 'USA',
        countryData: createMockCountryData([10, 20, 30], [100, 100, 100]),
        dataKey: 'cmr',
        range: { startIndex: 0, endIndex: 3 },
        dataLabels: ['2020', '2021', '2022'],
        metaData: createMockMetadata('USA'),
        explorerLink: () => '/',
        display: { showRelative: true, cumulative: false, hideIncomplete: false },
        totalRowKey: 'TOTAL'
      }

      const { row } = processCountryRow(options)

      // Relative excess = metric / baseline = 10/100 = 0.1
      expect(row['2020']).toBe(0.1)
      expect(row['2021']).toBe(0.2)
      expect(row['2022']).toBe(0.3)
    })

    it('should calculate cumulative values when cumulative is true', () => {
      const options: ProcessCountryRowOptions = {
        iso3c: 'USA',
        countryData: createMockCountryData([10, 20, 30], [100, 100, 100]),
        dataKey: 'cmr',
        range: { startIndex: 0, endIndex: 3 },
        dataLabels: ['2020', '2021', '2022'],
        metaData: createMockMetadata('USA'),
        explorerLink: () => '/',
        display: { showRelative: false, cumulative: true, hideIncomplete: false },
        totalRowKey: 'TOTAL'
      }

      const { row } = processCountryRow(options)

      // Cumulative sum: 10, 30, 60
      expect(row['2020']).toBe(10)
      expect(row['2021']).toBe(30)
      expect(row['2022']).toBe(60)
    })

    it('should include lower and upper bounds for each period', () => {
      const options: ProcessCountryRowOptions = {
        iso3c: 'USA',
        countryData: createMockCountryData([10, 20], [100, 100]),
        dataKey: 'cmr',
        range: { startIndex: 0, endIndex: 2 },
        dataLabels: ['2020', '2021'],
        metaData: createMockMetadata('USA'),
        explorerLink: () => '/',
        display: { showRelative: false, cumulative: false, hideIncomplete: false },
        totalRowKey: 'TOTAL'
      }

      const { row } = processCountryRow(options)

      // Lower bound = 0.9 * value
      expect(row['2020_l']).toBe(9)
      expect(row['2021_l']).toBe(18)

      // Upper bound = 1.1 * value
      expect(row['2020_u']).toBe(11)
      expect(row['2021_u']).toBe(22)
    })

    it('should include TOTAL column with cumulative sum', () => {
      const options: ProcessCountryRowOptions = {
        iso3c: 'USA',
        countryData: createMockCountryData([10, 20, 30], [100, 100, 100]),
        dataKey: 'cmr',
        range: { startIndex: 0, endIndex: 3 },
        dataLabels: ['2020', '2021', '2022'],
        metaData: createMockMetadata('USA'),
        explorerLink: () => '/',
        display: { showRelative: false, cumulative: false, hideIncomplete: false },
        totalRowKey: 'TOTAL'
      }

      const { row } = processCountryRow(options)

      // Total = cumulative sum of all values = 10 + 20 + 30 = 60
      expect(row.TOTAL).toBe(60)
    })

    it('should convert NaN values to 0 in absolute mode', () => {
      // Create data with NaN values
      const dataWithNaN = createMockCountryData([10, NaN, 30], [100, 100, 100])

      const options: ProcessCountryRowOptions = {
        iso3c: 'USA',
        countryData: dataWithNaN,
        dataKey: 'cmr',
        range: { startIndex: 0, endIndex: 3 },
        dataLabels: ['2020', '2021', '2022'],
        metaData: createMockMetadata('USA'),
        explorerLink: () => '/',
        display: { showRelative: false, cumulative: false, hideIncomplete: false },
        totalRowKey: 'TOTAL'
      }

      const { row } = processCountryRow(options)

      expect(row['2020']).toBe(10)
      // NaN gets converted to 0 by the || 0 fallback
      expect(row['2021']).toBe(0)
      expect(row['2022']).toBe(30)
    })

    it('should treat NaN-converted-to-0 as valid data', () => {
      // NaN values get converted to 0, which is treated as valid
      const dataWithNaN = createMockCountryData([10, NaN, 30], [100, 100, 100])

      const options: ProcessCountryRowOptions = {
        iso3c: 'USA',
        countryData: dataWithNaN,
        dataKey: 'cmr',
        range: { startIndex: 0, endIndex: 3 },
        dataLabels: ['2020', '2021', '2022'],
        metaData: createMockMetadata('USA'),
        explorerLink: () => '/',
        display: { showRelative: false, cumulative: false, hideIncomplete: true },
        totalRowKey: 'TOTAL'
      }

      const { hasData } = processCountryRow(options)

      // NaN becomes 0, which passes the isNaN check, so all data is "complete"
      expect(hasData).toBe(true)
    })

    it('should return hasData=true when hideIncomplete is true and data is complete', () => {
      const options: ProcessCountryRowOptions = {
        iso3c: 'USA',
        countryData: createMockCountryData([10, 20, 30], [100, 100, 100]),
        dataKey: 'cmr',
        range: { startIndex: 0, endIndex: 3 },
        dataLabels: ['2020', '2021', '2022'],
        metaData: createMockMetadata('USA'),
        explorerLink: () => '/',
        display: { showRelative: false, cumulative: false, hideIncomplete: true },
        totalRowKey: 'TOTAL'
      }

      const { hasData } = processCountryRow(options)

      expect(hasData).toBe(true)
    })

    it('should return hasData=true when hideIncomplete is false and some data exists', () => {
      const dataWithNaN = createMockCountryData([10, NaN, NaN], [100, 100, 100])

      const options: ProcessCountryRowOptions = {
        iso3c: 'USA',
        countryData: dataWithNaN,
        dataKey: 'cmr',
        range: { startIndex: 0, endIndex: 3 },
        dataLabels: ['2020', '2021', '2022'],
        metaData: createMockMetadata('USA'),
        explorerLink: () => '/',
        display: { showRelative: false, cumulative: false, hideIncomplete: false },
        totalRowKey: 'TOTAL'
      }

      const { hasData } = processCountryRow(options)

      expect(hasData).toBe(true)
    })

    it('should handle data range slicing correctly', () => {
      // Data has 5 values, but we only want index 1-3
      const options: ProcessCountryRowOptions = {
        iso3c: 'USA',
        countryData: createMockCountryData([10, 20, 30, 40, 50], [100, 100, 100, 100, 100]),
        dataKey: 'cmr',
        range: { startIndex: 1, endIndex: 4 }, // Take indices 1, 2, 3
        dataLabels: ['2021', '2022', '2023'],
        metaData: createMockMetadata('USA'),
        explorerLink: () => '/',
        display: { showRelative: false, cumulative: false, hideIncomplete: false },
        totalRowKey: 'TOTAL'
      }

      const { row } = processCountryRow(options)

      expect(row['2021']).toBe(20)
      expect(row['2022']).toBe(30)
      expect(row['2023']).toBe(40)
      expect(row['2020']).toBeUndefined() // Should not exist
      expect(row['2024']).toBeUndefined() // Should not exist
    })
  })
})
