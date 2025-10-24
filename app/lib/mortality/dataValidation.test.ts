import { describe, it, expect } from 'vitest'
import {
  MIN_BASELINE_THRESHOLD,
  SENTINEL_VALUE_THRESHOLD,
  isValidDataPoint,
  calculateRelativeExcess,
  sanitizeArray,
  filterValidNumbers
} from './dataValidation'

describe('dataValidation', () => {
  describe('constants', () => {
    it('should have correct threshold values', () => {
      expect(MIN_BASELINE_THRESHOLD).toBe(0.1)
      expect(SENTINEL_VALUE_THRESHOLD).toBe(0.01)
    })
  })

  describe('isValidDataPoint', () => {
    it('should return true for valid number pairs', () => {
      expect(isValidDataPoint(100, 50)).toBe(true)
      expect(isValidDataPoint(0, 1)).toBe(true)
      expect(isValidDataPoint(-100, 10)).toBe(true)
    })

    it('should return false when value is null or undefined', () => {
      expect(isValidDataPoint(null, 50)).toBe(false)
      expect(isValidDataPoint(undefined, 50)).toBe(false)
    })

    it('should return false when baseline is null or undefined', () => {
      expect(isValidDataPoint(100, null)).toBe(false)
      expect(isValidDataPoint(100, undefined)).toBe(false)
    })

    it('should return false when value is NaN', () => {
      expect(isValidDataPoint(NaN, 50)).toBe(false)
    })

    it('should return false when baseline is NaN', () => {
      expect(isValidDataPoint(100, NaN)).toBe(false)
    })

    it('should return false when baseline is below MIN_BASELINE_THRESHOLD', () => {
      expect(isValidDataPoint(100, 0.05)).toBe(false)
      expect(isValidDataPoint(100, 0.09)).toBe(false)
      expect(isValidDataPoint(100, -0.05)).toBe(false)
    })

    it('should return true when baseline is at or above MIN_BASELINE_THRESHOLD', () => {
      expect(isValidDataPoint(100, 0.1)).toBe(true)
      expect(isValidDataPoint(100, 0.11)).toBe(true)
      expect(isValidDataPoint(100, -0.1)).toBe(true)
    })

    it('should handle edge case of zero baseline', () => {
      expect(isValidDataPoint(100, 0)).toBe(false)
    })
  })

  describe('calculateRelativeExcess', () => {
    it('should calculate relative excess correctly', () => {
      expect(calculateRelativeExcess(50, 100)).toBe(0.5)
      expect(calculateRelativeExcess(100, 50)).toBe(2)
      expect(calculateRelativeExcess(75, 150)).toBe(0.5)
    })

    it('should return NaN for invalid data points', () => {
      expect(calculateRelativeExcess(null, 100)).toBeNaN()
      expect(calculateRelativeExcess(100, null)).toBeNaN()
      expect(calculateRelativeExcess(100, 0.05)).toBeNaN()
      expect(calculateRelativeExcess(NaN, 100)).toBeNaN()
    })

    it('should filter out -100% sentinel values (-1)', () => {
      // Exactly -1
      expect(calculateRelativeExcess(-100, 100)).toBeNaN()

      // Very close to -1 (within threshold)
      expect(calculateRelativeExcess(-99.5, 100)).toBeNaN()
      expect(calculateRelativeExcess(-100.5, 100)).toBeNaN()
    })

    it('should not filter legitimate values near -1', () => {
      // Just outside the threshold should be valid
      expect(calculateRelativeExcess(-98, 100)).toBe(-0.98)
      expect(calculateRelativeExcess(-102, 100)).toBe(-1.02)
    })

    it('should handle positive values correctly', () => {
      expect(calculateRelativeExcess(150, 100)).toBe(1.5)
      expect(calculateRelativeExcess(10, 20)).toBe(0.5)
    })

    it('should handle negative excess values', () => {
      expect(calculateRelativeExcess(-50, 100)).toBe(-0.5)
      expect(calculateRelativeExcess(-25, 50)).toBe(-0.5)
    })

    it('should handle zero metric value', () => {
      expect(calculateRelativeExcess(0, 100)).toBe(0)
    })

    it('should handle negative baseline', () => {
      expect(calculateRelativeExcess(50, -100)).toBe(-0.5)
    })

    it('should respect decimals parameter (currently unused)', () => {
      // The function doesn't use decimals yet, but test the interface
      const result = calculateRelativeExcess(1, 3, 5)
      expect(typeof result).toBe('number')
    })
  })

  describe('sanitizeArray', () => {
    it('should convert undefined to NaN', () => {
      const result = sanitizeArray([1, undefined, 3])
      expect(result[0]).toBe(1)
      expect(result[1]).toBeNaN()
      expect(result[2]).toBe(3)
    })

    it('should convert null to NaN', () => {
      const result = sanitizeArray([1, null, 3])
      expect(result[0]).toBe(1)
      expect(result[1]).toBeNaN()
      expect(result[2]).toBe(3)
    })

    it('should preserve valid numbers', () => {
      const result = sanitizeArray([1, 2, 3])
      expect(result).toEqual([1, 2, 3])
    })

    it('should preserve NaN values', () => {
      const result = sanitizeArray([1, NaN, 3])
      expect(result[0]).toBe(1)
      expect(result[1]).toBeNaN()
      expect(result[2]).toBe(3)
    })

    it('should preserve zero', () => {
      const result = sanitizeArray([0, 1, 2])
      expect(result).toEqual([0, 1, 2])
    })

    it('should handle negative numbers', () => {
      const result = sanitizeArray([-1, -2, -3])
      expect(result).toEqual([-1, -2, -3])
    })

    it('should handle empty array', () => {
      const result = sanitizeArray([])
      expect(result).toEqual([])
    })

    it('should handle array with only undefined/null', () => {
      const result = sanitizeArray([undefined, null, undefined])
      expect(result.every(v => isNaN(v))).toBe(true)
      expect(result.length).toBe(3)
    })
  })

  describe('filterValidNumbers', () => {
    it('should filter out undefined values', () => {
      const result = filterValidNumbers([1, undefined, 3])
      expect(result).toEqual([1, 3])
    })

    it('should filter out null values', () => {
      const result = filterValidNumbers([1, null, 3])
      expect(result).toEqual([1, 3])
    })

    it('should filter out NaN values', () => {
      const result = filterValidNumbers([1, NaN, 3])
      expect(result).toEqual([1, 3])
    })

    it('should preserve valid numbers including zero', () => {
      const result = filterValidNumbers([0, 1, 2])
      expect(result).toEqual([0, 1, 2])
    })

    it('should preserve negative numbers', () => {
      const result = filterValidNumbers([-1, -2, -3])
      expect(result).toEqual([-1, -2, -3])
    })

    it('should handle empty array', () => {
      const result = filterValidNumbers([])
      expect(result).toEqual([])
    })

    it('should return empty array when all values are invalid', () => {
      const result = filterValidNumbers([undefined, null, NaN])
      expect(result).toEqual([])
    })

    it('should handle mixed valid and invalid values', () => {
      const result = filterValidNumbers([1, undefined, 2, null, 3, NaN, 4])
      expect(result).toEqual([1, 2, 3, 4])
    })

    it('should return type-safe array (no undefined)', () => {
      const result = filterValidNumbers([1, undefined, 2])
      // TypeScript should infer this as number[]
      const typed: number[] = result
      expect(typed).toEqual([1, 2])
    })
  })

  describe('integration scenarios', () => {
    it('should handle typical mortality data workflow', () => {
      // Simulate raw data with missing values
      const rawMetric = [100, undefined, 150, null, 200]
      const rawBaseline = [80, 90, undefined, 100, 110]

      // Sanitize for cumulative calculations
      const sanitizedMetric = sanitizeArray(rawMetric)
      const sanitizedBaseline = sanitizeArray(rawBaseline)

      expect(sanitizedMetric.length).toBe(5)
      expect(sanitizedBaseline.length).toBe(5)

      // Calculate relative excess for each valid pair
      const relativeExcess = sanitizedMetric.map((m, i) =>
        calculateRelativeExcess(m, sanitizedBaseline[i])
      )

      expect(relativeExcess[0]).toBe(1.25) // 100/80
      expect(relativeExcess[1]).toBeNaN() // undefined/90
      expect(relativeExcess[2]).toBeNaN() // 150/undefined
      expect(relativeExcess[3]).toBeNaN() // null/100
      expect(relativeExcess[4]).toBeCloseTo(1.818, 2) // 200/110

      // Filter out invalid results
      const validResults = filterValidNumbers(relativeExcess)
      expect(validResults.length).toBe(2)
    })

    it('should handle sentinel value filtering in real data', () => {
      // Simulate data with -100% sentinel values
      const metric = [-100, 50, -99.9, 100]
      const baseline = [100, 100, 100, 100]

      const results = metric.map((m, i) =>
        calculateRelativeExcess(m, baseline[i])
      )

      expect(results[0]).toBeNaN() // -100/100 = -1 (sentinel)
      expect(results[1]).toBe(0.5) // 50/100
      expect(results[2]).toBeNaN() // -99.9/100 ≈ -1 (within threshold)
      expect(results[3]).toBe(1) // 100/100
    })

    it('should handle very small baseline values', () => {
      const metric = [10, 10, 10]
      const baseline = [0.05, 0.1, 0.15]

      const results = metric.map((m, i) =>
        calculateRelativeExcess(m, baseline[i])
      )

      expect(results[0]).toBeNaN() // baseline too small
      expect(results[1]).toBe(100) // 10/0.1
      expect(results[2]).toBeCloseTo(66.667, 2) // 10/0.15
    })
  })
})
