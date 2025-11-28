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

    it('should convert undefined values in data to 0', () => {
      const data: (number | undefined)[] = [10, undefined, 30]
      const baseline = [5, 10, 15]

      const result = strategy.transform(data, baseline)

      expect(result[0]).toBe(2)
      expect(result[1]).toBe(0) // undefined converted to 0 for main data
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

  describe('transformPreservingUndefined', () => {
    it('should preserve undefined values in data for error bar bounds', () => {
      const data: (number | undefined)[] = [10, undefined, 30]
      const baseline = [5, 10, 15]

      const result = strategy.transformPreservingUndefined(data, baseline)

      expect(result[0]).toBe(2)
      expect(result[1]).toBe(undefined) // undefined preserved for PI hiding
      expect(result[2]).toBe(2)
    })

    it('should calculate percentages normally for defined values', () => {
      const data = [100, 200, 300]
      const baseline = [50, 100, 150]

      const result = strategy.transformPreservingUndefined(data, baseline)

      expect(result).toEqual([2, 2, 2])
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
  })
})
