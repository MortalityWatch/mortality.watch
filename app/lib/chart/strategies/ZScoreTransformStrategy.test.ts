import { describe, it, expect } from 'vitest'
import { ZScoreTransformStrategy } from './ZScoreTransformStrategy'

describe('ZScoreTransformStrategy', () => {
  const strategy = new ZScoreTransformStrategy()

  describe('transform', () => {
    it('transforms data to z-scores', () => {
      const dataRow = [10, 12, 14, 8]
      const baselineRow = [8, 9, 10, 11, 12] // mean=10, stddev~1.58

      const result = strategy.transform(dataRow, baselineRow)

      // Should return z-scores
      expect(result.length).toBe(4)
      expect(result[0]).toBeCloseTo(0, 0) // (10-10)/1.58 = 0
      expect(result[1]).toBeCloseTo(1.26, 0) // (12-10)/1.58 = 1.26
    })

    it('handles zero standard deviation', () => {
      const dataRow = [10, 12, 8]
      const baselineRow = [10, 10, 10]

      const result = strategy.transform(dataRow, baselineRow)

      expect(result[0]).toBe(0) // Equal to mean
      expect(result[1]).toBe(999) // Above mean
      expect(result[2]).toBe(-999) // Below mean
    })

    it('handles empty baseline', () => {
      const dataRow = [10, 12, 14]
      const baselineRow: number[] = []

      const result = strategy.transform(dataRow, baselineRow)

      expect(result).toEqual([0, 0, 0])
    })
  })

  describe('getBaselineKey', () => {
    it('returns baseline key for non-ASMR data', () => {
      const key = 'deaths'
      const result = strategy.getBaselineKey(false, key)
      expect(result).toBe('deaths_baseline')
    })

    it('returns baseline key for ASMR data', () => {
      const key = 'asmr_who_2025'
      const result = strategy.getBaselineKey(true, key)
      expect(result).toBe('asmr_who_baseline')
    })

    it('handles keys with underscores', () => {
      const key = 'deaths_total'
      const result = strategy.getBaselineKey(false, key)
      expect(result).toBe('deaths_baseline')
    })
  })
})
