import { describe, expect, it } from 'vitest'
import {
  detectSteepDrop,
  findAdjustedEndLabel,
  findCommonAdjustedEndLabel,
  STEEP_DROP_CONFIGS
} from './steepDropDetection'

describe('steepDropDetection', () => {
  describe('STEEP_DROP_CONFIGS', () => {
    it('should have configurations for all chart types', () => {
      expect(STEEP_DROP_CONFIGS.weekly).toBeDefined()
      expect(STEEP_DROP_CONFIGS.monthly).toBeDefined()
      expect(STEEP_DROP_CONFIGS.quarterly).toBeDefined()
      expect(STEEP_DROP_CONFIGS.yearly).toBeDefined()
      expect(STEEP_DROP_CONFIGS.fluseason).toBeDefined()
      expect(STEEP_DROP_CONFIGS.midyear).toBeDefined()
    })

    it('should have appropriate lookback periods', () => {
      expect(STEEP_DROP_CONFIGS.weekly!.lookbackPeriods).toBe(26) // 6 months
      expect(STEEP_DROP_CONFIGS.monthly!.lookbackPeriods).toBe(12) // 1 year
      expect(STEEP_DROP_CONFIGS.quarterly!.lookbackPeriods).toBe(8) // 2 years
      expect(STEEP_DROP_CONFIGS.yearly!.lookbackPeriods).toBe(5) // 5 years
    })
  })

  describe('detectSteepDrop', () => {
    it('should return not detected for empty data', () => {
      const result = detectSteepDrop([], 'weekly')
      expect(result.detected).toBe(false)
      expect(result.dropStartIndex).toBeNull()
      expect(result.adjustedEndIndex).toBeNull()
    })

    it('should return not detected for insufficient data', () => {
      // Weekly needs 26 lookback + 4 check = 30 minimum
      const data = Array(20).fill(1000)
      const result = detectSteepDrop(data, 'weekly')
      expect(result.detected).toBe(false)
    })

    it('should detect steep drop at end of data', () => {
      // Create data with a steep drop in last few periods
      const data = [
        ...Array(30).fill(1000), // Stable baseline
        200, // Steep drop (20% of 1000)
        150, // More drop
        100, // More drop
        50 // More drop
      ]
      const result = detectSteepDrop(data, 'weekly')
      expect(result.detected).toBe(true)
      expect(result.dropStartIndex).toBeGreaterThan(29)
    })

    it('should not detect drop when values are above threshold', () => {
      // All values are above 80% of median
      const data = Array(40).fill(1000)
      data[data.length - 1] = 850 // Still above 80% threshold
      data[data.length - 2] = 900
      const result = detectSteepDrop(data, 'weekly')
      expect(result.detected).toBe(false)
    })

    it('should handle null values as drops', () => {
      const data: (number | null)[] = [
        ...Array(30).fill(1000),
        null, // Null treated as drop
        null,
        null,
        null
      ]
      const result = detectSteepDrop(data, 'weekly')
      expect(result.detected).toBe(true)
    })

    it('should use custom config when provided', () => {
      const data = [
        ...Array(10).fill(1000),
        500, // Below 50% threshold
        400
      ]
      const result = detectSteepDrop(data, 'weekly', {
        lookbackPeriods: 5,
        checkPeriods: 2,
        dropThreshold: 0.5 // 50% threshold
      })
      expect(result.detected).toBe(true)
    })

    it('should identify the correct drop start index', () => {
      // Data with clear drop point
      const data = [
        ...Array(30).fill(1000),
        900, // Still OK (90%)
        850, // Still OK (85%)
        600, // Drop starts here (60% < 80%)
        400
      ]
      const result = detectSteepDrop(data, 'weekly')
      expect(result.detected).toBe(true)
      // The drop should start at index 32 (where 600 is)
      expect(result.dropStartIndex).toBe(32)
    })
  })

  describe('findAdjustedEndLabel', () => {
    it('should return null for empty data', () => {
      const result = findAdjustedEndLabel([], [], 'weekly')
      expect(result).toBeNull()
    })

    it('should return null for mismatched lengths', () => {
      const data = [1000, 1000, 1000]
      const labels = ['W01', 'W02']
      const result = findAdjustedEndLabel(data, labels, 'weekly')
      expect(result).toBeNull()
    })

    it('should return adjusted end label when drop detected', () => {
      const labels = [
        ...Array(30).fill(0).map((_, i) => `W${String(i + 1).padStart(2, '0')}`),
        'W31', 'W32', 'W33', 'W34'
      ]
      const data: (number | null)[] = [
        ...Array(30).fill(1000),
        200, 150, 100, 50 // Steep drop
      ]
      const result = findAdjustedEndLabel(data, labels, 'weekly')
      expect(result).toBe('W30') // Label just before the drop
    })

    it('should return null when no drop detected', () => {
      const labels = Array(35).fill(0).map((_, i) => `W${String(i + 1).padStart(2, '0')}`)
      const data = Array(35).fill(1000) // Stable data
      const result = findAdjustedEndLabel(data, labels, 'weekly')
      expect(result).toBeNull()
    })
  })

  describe('findCommonAdjustedEndLabel', () => {
    it('should return null for empty arrays', () => {
      const result = findCommonAdjustedEndLabel([], [], 'weekly')
      expect(result).toBeNull()
    })

    it('should find earliest drop across multiple series', () => {
      const labels = Array(35).fill(0).map((_, i) => `W${String(i + 1).padStart(2, '0')}`)

      // First series drops at W32
      const series1: (number | null)[] = [
        ...Array(31).fill(1000),
        200, 150, 100, 50
      ]

      // Second series drops at W33 (later)
      const series2: (number | null)[] = [
        ...Array(32).fill(1000),
        200, 150, 100
      ]

      const result = findCommonAdjustedEndLabel([series1, series2], labels, 'weekly')
      // Should return the earlier drop point
      expect(result).toBe('W31') // Label just before series1's drop
    })

    it('should return null when no series has drops', () => {
      const labels = Array(35).fill(0).map((_, i) => `W${String(i + 1).padStart(2, '0')}`)
      const series1 = Array(35).fill(1000)
      const series2 = Array(35).fill(1200)
      const result = findCommonAdjustedEndLabel([series1, series2], labels, 'weekly')
      expect(result).toBeNull()
    })

    it('should skip series with mismatched lengths', () => {
      const labels = Array(35).fill(0).map((_, i) => `W${String(i + 1).padStart(2, '0')}`)

      // Valid series with drop
      const validSeries: (number | null)[] = [
        ...Array(31).fill(1000),
        200, 150, 100, 50
      ]

      // Invalid series (wrong length)
      const invalidSeries = Array(30).fill(1000)

      const result = findCommonAdjustedEndLabel([validSeries, invalidSeries], labels, 'weekly')
      expect(result).toBe('W31')
    })
  })

  describe('real-world scenarios', () => {
    it('should handle typical USA weekly reporting delay', () => {
      // Simulate typical USA pattern: last 2-3 weeks show steep drop due to reporting delay
      const weeks = 52 // One year of weekly data
      const labels = Array(weeks).fill(0).map((_, i) => `2024-W${String(i + 1).padStart(2, '0')}`)

      // Normal deaths around 60,000 per week, last 3 weeks show steep drop
      const data: (number | null)[] = [
        ...Array(weeks - 3).fill(60000),
        20000, // Week 50 - steep drop (delayed reporting)
        5000, // Week 51
        1000 // Week 52 - most recent, least complete
      ]

      const result = findAdjustedEndLabel(data, labels, 'weekly')
      expect(result).not.toBeNull()
      // Should cut off before the drop
      const cutoffIndex = labels.indexOf(result!)
      expect(cutoffIndex).toBeLessThan(weeks - 3)
    })

    it('should handle monthly data with 1-month delay', () => {
      const months = 24 // 2 years
      const labels = Array(months).fill(0).map((_, i) => {
        const year = 2023 + Math.floor(i / 12)
        const month = (i % 12) + 1
        return `${year}-${String(month).padStart(2, '0')}`
      })

      // Normal pattern with last month showing steep drop
      const data: (number | null)[] = [
        ...Array(months - 2).fill(250000),
        100000, // Second-to-last month (partial)
        50000 // Last month (very incomplete)
      ]

      const result = findAdjustedEndLabel(data, labels, 'monthly')
      expect(result).not.toBeNull()
    })
  })
})
