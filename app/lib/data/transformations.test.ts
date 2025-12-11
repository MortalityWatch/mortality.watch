import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { CountryData } from '@/model'
import { updateDataset, getDataForCountry } from './transformations'

import { fetchData } from './queries'

// Mock the queries module
vi.mock('./queries', () => ({
  fetchData: vi.fn()
}))

// Mock the utils module
vi.mock('~/utils', () => ({
  getObjectOfArrays: vi.fn((data: CountryData[]) => {
    // Simple implementation that converts array of objects to object of arrays
    if (!data || data.length === 0) return {}

    const result: Record<string, unknown[]> = {}
    const firstItem = data[0]
    if (!firstItem) return {}

    const keys = Object.keys(firstItem)

    keys.forEach((key) => {
      result[key] = data.map(item => item[key as keyof CountryData])
    })

    return result
  })
}))

describe('app/lib/data/transformations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('updateDataset', () => {
    it('should fetch data for all country/age group combinations', async () => {
      const mockData: CountryData[] = [
        { iso3c: 'USA', age_group: '0-14', date: '2020-01-01', deaths: 100, population: 10000 } as CountryData
      ]

      vi.mocked(fetchData).mockResolvedValue(mockData)

      await updateDataset('weekly', ['USA', 'GBR'], ['0-14', '15-64'])

      // Should call fetchData 4 times (2 countries × 2 age groups)
      expect(fetchData).toHaveBeenCalledTimes(4)
      expect(fetchData).toHaveBeenCalledWith('weekly', 'USA', '0-14')
      expect(fetchData).toHaveBeenCalledWith('weekly', 'USA', '15-64')
      expect(fetchData).toHaveBeenCalledWith('weekly', 'GBR', '0-14')
      expect(fetchData).toHaveBeenCalledWith('weekly', 'GBR', '15-64')
    })

    it('should organize data by age group and country', async () => {
      const mockDataUSA: CountryData[] = [
        { iso3c: 'USA', age_group: '0-14', date: '2020-01-01', deaths: 100, population: 10000 } as CountryData
      ]
      const mockDataGBR: CountryData[] = [
        { iso3c: 'GBR', age_group: '0-14', date: '2020-01-01', deaths: 50, population: 5000 } as CountryData
      ]

      vi.mocked(fetchData)
        .mockResolvedValueOnce(mockDataUSA)
        .mockResolvedValueOnce(mockDataGBR)

      const result = await updateDataset('weekly', ['USA', 'GBR'], ['0-14'])

      expect(result).toHaveProperty('0-14')
      expect(result['0-14']).toBeDefined()
      expect(result['0-14']!).toHaveProperty('USA')
      expect(result['0-14']!).toHaveProperty('GBR')
      expect(result['0-14']!['USA']).toEqual(mockDataUSA)
      expect(result['0-14']!['GBR']).toEqual(mockDataGBR)
    })

    it('should handle empty country list', async () => {
      const result = await updateDataset('weekly', [], ['0-14'])

      expect(fetchData).not.toHaveBeenCalled()
      expect(result).toEqual({})
    })

    it('should handle empty age group list', async () => {
      const result = await updateDataset('weekly', ['USA'], [])

      expect(fetchData).not.toHaveBeenCalled()
      expect(result).toEqual({})
    })

    it('should handle fetch errors gracefully', async () => {
      // Suppress console.error for this test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      vi.mocked(fetchData).mockRejectedValue(new Error('Network error'))

      const result = await updateDataset('weekly', ['USA'], ['0-14'])

      expect(result).toEqual({})
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('should respect concurrency limit', async () => {
      let activeCount = 0
      let maxActiveCount = 0

      vi.mocked(fetchData).mockImplementation(async () => {
        activeCount++
        maxActiveCount = Math.max(maxActiveCount, activeCount)

        // Simulate async work
        await new Promise(resolve => setTimeout(resolve, 10))

        activeCount--
        return []
      })

      // Request 20 combinations with concurrency limit of 5
      const countries = ['A', 'B', 'C', 'D']
      const ageGroups = ['1', '2', '3', '4', '5']
      await updateDataset('weekly', countries, ageGroups, 5)

      // Max active should not exceed concurrency limit
      expect(maxActiveCount).toBeLessThanOrEqual(5)
      expect(fetchData).toHaveBeenCalledTimes(20)
    })

    it('should flatten multiple results correctly', async () => {
      const mockData1: CountryData[] = [
        { iso3c: 'USA', age_group: '0-14', date: '2020-01-01', deaths: 100, population: 10000 } as CountryData,
        { iso3c: 'USA', age_group: '0-14', date: '2020-01-08', deaths: 110, population: 10000 } as CountryData
      ]
      const mockData2: CountryData[] = [
        { iso3c: 'USA', age_group: '0-14', date: '2020-01-15', deaths: 120, population: 10000 } as CountryData
      ]

      vi.mocked(fetchData)
        .mockResolvedValueOnce(mockData1)
        .mockResolvedValueOnce(mockData2)

      const result = await updateDataset('weekly', ['USA', 'GBR'], ['0-14'])

      // Should have all 3 entries for USA
      expect(result['0-14']!['USA']).toHaveLength(3)
    })
  })

  describe('getDataForCountry', () => {
    const mockRawData: CountryData[] = [
      { iso3c: 'USA', age_group: '0-14', date: '2020-01-01', deaths: 100, population: 10000 } as CountryData,
      { iso3c: 'USA', age_group: '0-14', date: '2020-02-01', deaths: 110, population: 10000 } as CountryData,
      { iso3c: 'USA', age_group: '0-14', date: '2020-03-01', deaths: 120, population: 10000 } as CountryData,
      { iso3c: 'GBR', age_group: '0-14', date: '2020-01-01', deaths: 50, population: 5000 } as CountryData
    ]

    it('should filter data for specific country', () => {
      const result = getDataForCountry(mockRawData, 'USA', '2020-01-01')

      expect(result).toBeDefined()
      expect(result?.iso3c).toHaveLength(3)
      expect((result?.iso3c as string[]).every(v => v === 'USA')).toBe(true)
    })

    it('should return undefined for non-existent country', () => {
      const result = getDataForCountry(mockRawData, 'XXX', '2020-01-01')

      expect(result).toBeUndefined()
    })

    it('should skip data before start date', () => {
      const result = getDataForCountry(mockRawData, 'USA', '2020-02-01')

      expect(result).toBeDefined()
      expect(result!.deaths).toHaveLength(2)
      expect(result!.deaths).toEqual([110, 120])
    })

    it('should handle start date not found', () => {
      const result = getDataForCountry(mockRawData, 'USA', '2025-01-01')

      // Should return empty or all data (depending on implementation)
      expect(result).toBeDefined()
    })

    it('should return all data if start date is first date', () => {
      const result = getDataForCountry(mockRawData, 'USA', '2020-01-01')

      expect(result).toBeDefined()
      expect(result?.deaths).toHaveLength(3)
      expect(result?.deaths).toEqual([100, 110, 120])
    })

    it('should handle empty raw data', () => {
      const result = getDataForCountry([], 'USA', '2020-01-01')

      expect(result).toBeUndefined()
    })

    it('should hide CDC suppressed values for USA data', () => {
      const usaData: CountryData[] = [
        { iso3c: 'USA', age_group: '0-14', date: '2020-01-01', deaths: 5, cmr: 0.5, population: 10000 } as CountryData,
        { iso3c: 'USA', age_group: '0-14', date: '2020-02-01', deaths: 15, cmr: 1.5, population: 10000 } as CountryData
      ]

      const result = getDataForCountry(usaData, 'USA', '2020-01-01')

      expect(result).toBeDefined()
      // First value (deaths < 10) should be NaN
      expect(isNaN(result!.deaths![0] as number)).toBe(true)
      expect(isNaN(result!.cmr![0] as number)).toBe(true)
      // Second value (deaths >= 10) should be preserved
      expect(result!.deaths![1]).toBe(15)
      expect(result!.cmr![1]).toBe(1.5)
    })

    it('should hide CDC suppressed values for USA states', () => {
      const usaStateData: CountryData[] = [
        { iso3c: 'USA-CA', age_group: '0-14', date: '2020-01-01', deaths: 8, deaths_excess: 2, population: 10000 } as CountryData,
        { iso3c: 'USA-CA', age_group: '0-14', date: '2020-02-01', deaths: 12, deaths_excess: 3, population: 10000 } as CountryData
      ]

      const result = getDataForCountry(usaStateData, 'USA-CA', '2020-01-01')

      expect(result).toBeDefined()
      // First value should be suppressed (deaths < 10)
      expect(isNaN(result!.deaths![0] as number)).toBe(true)
      expect(isNaN(result!.deaths_excess![0] as number)).toBe(true)
      // Second value should be preserved
      expect(result!.deaths![1]).toBe(12)
      expect(result!.deaths_excess![1]).toBe(3)
    })

    it('should not suppress non-USA data with low deaths', () => {
      const nonUsaData: CountryData[] = [
        { iso3c: 'ISL', age_group: '0-14', date: '2020-01-01', deaths: 5, cmr: 0.5, population: 1000 } as CountryData
      ]

      const result = getDataForCountry(nonUsaData, 'ISL', '2020-01-01')

      expect(result).toBeDefined()
      // Should not be suppressed for non-USA countries
      expect(result!.deaths![0]).toBe(5)
      expect(result!.cmr![0]).toBe(0.5)
    })

    it('should preserve non-deaths fields even when deaths are suppressed', () => {
      const usaData: CountryData[] = [
        { iso3c: 'USA', age_group: '0-14', date: '2020-01-01', deaths: 5, population: 10000 } as CountryData
      ]

      const result = getDataForCountry(usaData, 'USA', '2020-01-01')

      expect(result).toBeDefined()
      // deaths should be NaN
      expect(isNaN(result!.deaths![0] as number)).toBe(true)
      // But other fields should be preserved
      expect(result!.population![0]).toBe(10000)
    })
  })
})
