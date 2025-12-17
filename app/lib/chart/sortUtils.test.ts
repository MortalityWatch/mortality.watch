import { describe, it, expect } from 'vitest'
import {
  getLastValidValue,
  sortDatasetsByLatestValue,
  reorderCountriesByLabels
} from './sortUtils'

describe('sortUtils', () => {
  describe('getLastValidValue', () => {
    it('should return 0 for empty or undefined data', () => {
      expect(getLastValidValue(undefined)).toBe(0)
      expect(getLastValidValue([])).toBe(0)
    })

    it('should extract last valid number from array', () => {
      expect(getLastValidValue([1, 2, 3, 4, 5])).toBe(5)
      expect(getLastValidValue([10, 20, 30])).toBe(30)
    })

    it('should skip trailing null/NaN values', () => {
      expect(getLastValidValue([1, 2, 3, null])).toBe(3)
      expect(getLastValidValue([1, 2, 3, NaN])).toBe(3)
      expect(getLastValidValue([1, 2, 3, null, NaN, null])).toBe(3)
    })

    it('should handle object data points with y property', () => {
      const data = [
        { y: 10 },
        { y: 20 },
        { y: 30 }
      ]
      expect(getLastValidValue(data)).toBe(30)
    })

    it('should skip null y values in objects', () => {
      const data = [
        { y: 10 },
        { y: 20 },
        { y: null }
      ]
      expect(getLastValidValue(data)).toBe(20)
    })

    it('should handle mixed number and object data', () => {
      const data = [
        10,
        { y: 20 },
        30
      ]
      expect(getLastValidValue(data)).toBe(30)
    })

    it('should return 0 if all values are null/NaN', () => {
      expect(getLastValidValue([null, null, null])).toBe(0)
      expect(getLastValidValue([NaN, NaN])).toBe(0)
      expect(getLastValidValue([{ y: null }, { y: null }])).toBe(0)
    })

    it('should handle negative values', () => {
      expect(getLastValidValue([-5, -10, -15])).toBe(-15)
      expect(getLastValidValue([5, 10, -20])).toBe(-20)
    })
  })

  describe('sortDatasetsByLatestValue', () => {
    it('should return empty array for empty datasets', () => {
      expect(sortDatasetsByLatestValue([])).toEqual([])
    })

    it('should filter out datasets without labels', () => {
      const datasets = [
        { label: 'USA', data: [1, 2, 3] },
        { data: [10, 20, 30] }, // no label
        { label: '', data: [5, 6, 7] }, // empty label
        { label: 'Sweden', data: [4, 5, 6] }
      ]
      const result = sortDatasetsByLatestValue(datasets)
      expect(result).toHaveLength(2)
      expect(result).toContain('USA')
      expect(result).toContain('Sweden')
    })

    it('should sort by absolute last value descending', () => {
      const datasets = [
        { label: 'Low', data: [1, 2, 5] },
        { label: 'High', data: [10, 20, 100] },
        { label: 'Medium', data: [5, 10, 50] }
      ]
      const result = sortDatasetsByLatestValue(datasets)
      expect(result).toEqual(['High', 'Medium', 'Low'])
    })

    it('should sort by absolute value (negative values)', () => {
      const datasets = [
        { label: 'Positive', data: [10, 20, 30] },
        { label: 'NegativeHigh', data: [-10, -20, -100] },
        { label: 'NegativeLow', data: [-5, -10, -15] }
      ]
      const result = sortDatasetsByLatestValue(datasets)
      // -100 has highest absolute value, then 30, then -15
      expect(result).toEqual(['NegativeHigh', 'Positive', 'NegativeLow'])
    })

    it('should handle datasets with object data points', () => {
      const datasets = [
        { label: 'A', data: [{ y: 10 }, { y: 20 }, { y: 30 }] },
        { label: 'B', data: [{ y: 100 }, { y: 200 }, { y: 300 }] },
        { label: 'C', data: [{ y: 1 }, { y: 2 }, { y: 3 }] }
      ]
      const result = sortDatasetsByLatestValue(datasets)
      expect(result).toEqual(['B', 'A', 'C'])
    })

    it('should handle trailing null values correctly', () => {
      const datasets = [
        { label: 'HasNull', data: [100, 200, null] }, // last valid is 200
        { label: 'NoNull', data: [10, 20, 30] } // last valid is 30
      ]
      const result = sortDatasetsByLatestValue(datasets)
      expect(result).toEqual(['HasNull', 'NoNull'])
    })
  })

  describe('reorderCountriesByLabels', () => {
    it('should reorder countries based on labels', () => {
      const sortedLabels = ['Sweden', 'USA', 'Germany']
      const currentCountries = ['USA', 'DEU', 'SWE']
      const nameToCode = {
        Sweden: 'SWE',
        USA: 'USA',
        Germany: 'DEU'
      }
      const result = reorderCountriesByLabels(sortedLabels, currentCountries, nameToCode)
      expect(result).toEqual(['SWE', 'USA', 'DEU'])
    })

    it('should preserve countries not in sorted labels', () => {
      const sortedLabels = ['Sweden', 'USA']
      const currentCountries = ['USA', 'DEU', 'SWE', 'FRA']
      const nameToCode = {
        Sweden: 'SWE',
        USA: 'USA'
      }
      const result = reorderCountriesByLabels(sortedLabels, currentCountries, nameToCode)
      // SWE and USA sorted first, then DEU and FRA appended
      expect(result).toEqual(['SWE', 'USA', 'DEU', 'FRA'])
    })

    it('should handle empty labels', () => {
      const result = reorderCountriesByLabels([], ['USA', 'SWE'], {})
      expect(result).toEqual(['USA', 'SWE'])
    })

    it('should handle labels not found in nameToCode', () => {
      const sortedLabels = ['Unknown', 'Sweden']
      const currentCountries = ['SWE', 'USA']
      const nameToCode = {
        Sweden: 'SWE'
      }
      const result = reorderCountriesByLabels(sortedLabels, currentCountries, nameToCode)
      // 'Unknown' maps to undefined, filtered out; 'Sweden' -> SWE; USA appended
      expect(result).toEqual(['SWE', 'USA'])
    })
  })
})
