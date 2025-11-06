/**
 * Tests for PercentageTransformStrategy
 */

import { describe, it, expect } from 'vitest'
import { PercentageTransformStrategy } from './PercentageTransformStrategy'

describe('PercentageTransformStrategy', () => {
  const strategy = new PercentageTransformStrategy()

  describe('transform', () => {
    it('should calculate percentage values correctly', () => {
      const data = [10, 20, 30]
      const baseline = [5, 10, 15]

      const result = strategy.transform(data, baseline)

      expect(result).toEqual([2, 2, 2])
    })

    it('should handle zero baseline values', () => {
      const data = [10, 20, 30]
      const baseline = [0, 10, 15]

      const result = strategy.transform(data, baseline)

      // Division by zero results in Infinity
      expect(result[0]).toBe(Infinity)
      expect(result[1]).toBe(2)
      expect(result[2]).toBe(2)
    })

    it('should handle undefined values in data', () => {
      const data = [10, undefined as unknown as number, 30]
      const baseline = [5, 10, 15]

      const result = strategy.transform(data, baseline)

      expect(result[0]).toBe(2)
      expect(result[1]).toBe(0) // undefined treated as 0
      expect(result[2]).toBe(2)
    })

    it('should handle undefined values in baseline', () => {
      const data = [10, 20, 30]
      const baseline = [5, undefined as unknown as number, 15]

      const result = strategy.transform(data, baseline)

      expect(result[0]).toBe(2)
      expect(result[1]).toBe(20) // undefined baseline treated as 1
      expect(result[2]).toBe(2)
    })

    it('should handle different array lengths', () => {
      const data = [10, 20, 30, 40]
      const baseline = [5, 10]

      const result = strategy.transform(data, baseline)

      expect(result).toHaveLength(4)
      expect(result[0]).toBe(2)
      expect(result[1]).toBe(2)
      expect(result[2]).toBe(30) // undefined baseline
      expect(result[3]).toBe(40) // undefined baseline
    })
  })

  describe('getBaselineKey', () => {
    it('should generate baseline key for non-ASMR data', () => {
      const key = 'deaths_excess'

      const result = strategy.getBaselineKey(false, key)

      expect(result).toBe('deaths_baseline')
    })

    it('should generate baseline key for ASMR data', () => {
      const key = 'asmr_who_excess'

      const result = strategy.getBaselineKey(true, key)

      expect(result).toBe('asmr_who_baseline')
    })

    it('should handle simple keys', () => {
      const key = 'deaths'

      const result = strategy.getBaselineKey(false, key)

      expect(result).toBe('deaths_baseline')
    })

    it('should handle ASMR simple keys', () => {
      const key = 'asmr_esp'

      const result = strategy.getBaselineKey(true, key)

      expect(result).toBe('asmr_esp_baseline')
    })

    it('should handle excess with lower confidence interval', () => {
      const key = 'deaths_excess_lower'

      const result = strategy.getBaselineKey(false, key)

      expect(result).toBe('deaths_baseline_lower')
    })

    it('should handle excess with upper confidence interval', () => {
      const key = 'deaths_excess_upper'

      const result = strategy.getBaselineKey(false, key)

      expect(result).toBe('deaths_baseline_upper')
    })

    it('should handle ASMR excess with lower confidence interval', () => {
      const key = 'asmr_who_excess_lower'

      const result = strategy.getBaselineKey(true, key)

      expect(result).toBe('asmr_who_baseline_lower')
    })

    it('should handle ASMR excess with upper confidence interval', () => {
      const key = 'asmr_who_excess_upper'

      const result = strategy.getBaselineKey(true, key)

      expect(result).toBe('asmr_who_baseline_upper')
    })
  })
})
