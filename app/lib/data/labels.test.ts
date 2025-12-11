import { describe, it, expect } from 'vitest'
import type { DatasetRaw, CountryData } from '@/model'
import { getLabels, getAllChartLabels, getStartIndex } from './labels'

describe('app/lib/data/labels', () => {
  describe('getLabels', () => {
    it('should sort labels alphabetically for non-monthly chart types', () => {
      const labels = ['2023', '2021', '2022', '2020']
      const result = getLabels('yearly', labels)

      expect(result).toEqual(['2020', '2021', '2022', '2023'])
    })

    it('should sort labels by year-month for monthly chart type', () => {
      const labels = ['2022-Jun', '2021-Dec', '2022-Jan', '2021-Nov']
      const result = getLabels('monthly', labels)

      // Should be sorted chronologically
      expect(result).toEqual(['2021-Nov', '2021-Dec', '2022-Jan', '2022-Jun'])
    })

    it('should handle weekly labels', () => {
      const labels = ['2023-W10', '2023-W05', '2023-W15']
      const result = getLabels('weekly', labels)

      expect(result).toEqual(['2023-W05', '2023-W10', '2023-W15'])
    })

    it('should handle quarterly labels', () => {
      const labels = ['2023-Q3', '2023-Q1', '2023-Q4', '2023-Q2']
      const result = getLabels('quarterly', labels)

      expect(result).toEqual(['2023-Q1', '2023-Q2', '2023-Q3', '2023-Q4'])
    })

    it('should handle empty array', () => {
      const result = getLabels('yearly', [])

      expect(result).toEqual([])
    })

    it('should handle single label', () => {
      const result = getLabels('yearly', ['2023'])

      expect(result).toEqual(['2023'])
    })

    it('should sort in place (mutates original array)', () => {
      const labels = ['2023', '2021', '2022']

      const result = getLabels('yearly', labels)

      // Function mutates the original array
      expect(labels).toEqual(['2021', '2022', '2023'])
      expect(result).toEqual(['2021', '2022', '2023'])
      expect(result).toBe(labels) // Same reference
    })
  })

  describe('getAllChartLabels', () => {
    const mockRawData: DatasetRaw = {
      'all': {
        USA: [
          { iso3c: 'USA', age_group: 'all', date: '2021', cmr: 10 } as CountryData,
          { iso3c: 'USA', age_group: 'all', date: '2022', cmr: 11 } as CountryData,
          { iso3c: 'USA', age_group: 'all', date: '2023', cmr: 12 } as CountryData
        ],
        GBR: [
          { iso3c: 'GBR', age_group: 'all', date: '2021', cmr: 8 } as CountryData,
          { iso3c: 'GBR', age_group: 'all', date: '2022', cmr: 9 } as CountryData
        ]
      },
      '0-14': {
        USA: [
          { iso3c: 'USA', age_group: '0-14', date: '2022', cmr: 5 } as CountryData,
          { iso3c: 'USA', age_group: '0-14', date: '2023', cmr: 6 } as CountryData
        ]
      }
    }

    it('should get all unique labels from raw data', () => {
      const result = getAllChartLabels(mockRawData, false)

      expect(result).toContain('2021')
      expect(result).toContain('2022')
      expect(result).toContain('2023')
      expect(result.length).toBe(3)
    })

    it('should filter by age group', () => {
      const result = getAllChartLabels(mockRawData, false, ['0-14'])

      // Only labels from '0-14' age group
      expect(result).toContain('2022')
      expect(result).toContain('2023')
      expect(result).not.toContain('2021')
      expect(result.length).toBe(2)
    })

    it('should filter by country code', () => {
      const result = getAllChartLabels(mockRawData, false, undefined, ['GBR'])

      // Only labels from GBR
      expect(result).toContain('2021')
      expect(result).toContain('2022')
      expect(result).not.toContain('2023')
      expect(result.length).toBe(2)
    })

    it('should filter by both age group and country', () => {
      const result = getAllChartLabels(mockRawData, false, ['0-14'], ['USA'])

      expect(result).toContain('2022')
      expect(result).toContain('2023')
      expect(result.length).toBe(2)
    })

    it('should use asmr_who for ASMR type data', () => {
      const asmrData: DatasetRaw = {
        all: {
          USA: [
            { iso3c: 'USA', age_group: 'all', date: '2021', asmr_who: 100 } as CountryData,
            { iso3c: 'USA', age_group: 'all', date: '2022', asmr_who: 105 } as CountryData
          ]
        }
      }

      const result = getAllChartLabels(asmrData, true)

      expect(result).toContain('2021')
      expect(result).toContain('2022')
      expect(result.length).toBe(2)
    })

    it('should exclude entries with undefined metric values', () => {
      const dataWithUndefined: DatasetRaw = {
        all: {
          USA: [
            { iso3c: 'USA', age_group: 'all', date: '2021', cmr: 10 } as CountryData,
            { iso3c: 'USA', age_group: 'all', date: '2022', cmr: undefined } as CountryData,
            { iso3c: 'USA', age_group: 'all', date: '2023', cmr: 12 } as CountryData
          ]
        }
      }

      const result = getAllChartLabels(dataWithUndefined, false)

      // Should only include dates where cmr is defined
      expect(result).toContain('2021')
      expect(result).not.toContain('2022')
      expect(result).toContain('2023')
      expect(result.length).toBe(2)
    })

    it('should handle monthly chart type with custom sorting', () => {
      const monthlyData: DatasetRaw = {
        all: {
          USA: [
            { iso3c: 'USA', age_group: 'all', date: '2022-Jun', cmr: 10 } as CountryData,
            { iso3c: 'USA', age_group: 'all', date: '2022-Jan', cmr: 11 } as CountryData,
            { iso3c: 'USA', age_group: 'all', date: '2021-Dec', cmr: 9 } as CountryData,
            { iso3c: 'USA', age_group: 'all', date: '2022-Mar', cmr: 12 } as CountryData
          ]
        }
      }

      const result = getAllChartLabels(monthlyData, false, undefined, undefined, 'monthly')

      // Should be sorted chronologically
      expect(result).toEqual(['2021-Dec', '2022-Jan', '2022-Mar', '2022-Jun'])
    })

    it('should handle empty raw data', () => {
      const result = getAllChartLabels({}, false)

      expect(result).toEqual([])
    })

    it('should handle missing age group in raw data', () => {
      const result = getAllChartLabels(mockRawData, false, ['99-99'])

      expect(result).toEqual([])
    })

    it('should handle missing country in age group', () => {
      const result = getAllChartLabels(mockRawData, false, undefined, ['XXX'])

      expect(result).toEqual([])
    })

    it('should return sorted labels for yearly type', () => {
      const result = getAllChartLabels(mockRawData, false)

      // Should be sorted
      expect(result[0]).toBe('2021')
      expect(result[result.length - 1]).toBe('2023')
    })
  })

  describe('getStartIndex', () => {
    const labels = ['2020', '2021', '2022', '2023', '2024']

    it('should return correct index for matching label', () => {
      expect(getStartIndex(labels, '2020')).toBe(0)
      expect(getStartIndex(labels, '2022')).toBe(2)
      expect(getStartIndex(labels, '2024')).toBe(4)
    })

    it('should use smart fallback for non-matching labels', () => {
      // ChartPeriod finds closest year: 2030 -> 2024 (last), 1990 -> 2020 (first)
      expect(getStartIndex(labels, '2030')).toBe(4) // closest to last year
      expect(getStartIndex(labels, '1990')).toBe(0) // closest to first year
    })

    it('should return 0 for empty string', () => {
      expect(getStartIndex(labels, '')).toBe(0)
    })

    it('should return 0 for undefined labels array', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(getStartIndex(undefined as any, '2022')).toBe(0)
    })

    it('should return 0 for empty labels array', () => {
      expect(getStartIndex([], '2022')).toBe(0)
    })

    it('should handle first element match', () => {
      expect(getStartIndex(labels, '2020')).toBe(0)
    })

    it('should handle last element match', () => {
      expect(getStartIndex(labels, '2024')).toBe(4)
    })

    it('should handle middle element match', () => {
      expect(getStartIndex(labels, '2022')).toBe(2)
    })

    it('should return index of first occurrence if duplicates exist', () => {
      const duplicateLabels: string[] = ['2020', '2021', '2022', '2021', '2023']
      expect(getStartIndex(duplicateLabels, '2021')).toBe(1)
    })
  })
})
