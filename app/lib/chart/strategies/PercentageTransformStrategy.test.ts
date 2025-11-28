/**
 * Tests for PercentageTransformStrategy
 */

import { describe, it, expect } from 'vitest'
import { PercentageTransformStrategy } from './PercentageTransformStrategy'

describe('PercentageTransformStrategy', () => {
  const strategy = new PercentageTransformStrategy()

  describe('transform with regular data (isExcessData=false)', () => {
    it('should calculate excess values correctly (data/baseline - 1)', () => {
      const data = [10, 20, 30]
      const baseline = [5, 10, 15]

      const result = strategy.transform(data, baseline, false)

      expect(result).toEqual([1, 1, 1]) // 100% excess (data/baseline - 1)
    })

    it('should handle zero baseline values', () => {
      const data = [10, 20, 30]
      const baseline = [0, 10, 15]

      const result = strategy.transform(data, baseline, false)

      // Division by zero results in Infinity - 1 = Infinity
      expect(result[0]).toBe(Infinity)
      expect(result[1]).toBe(1) // 100% excess
      expect(result[2]).toBe(1) // 100% excess
    })

    it('should handle undefined values in data', () => {
      const data = [10, undefined as unknown as number, 30]
      const baseline = [5, 10, 15]

      const result = strategy.transform(data, baseline, false)

      expect(result[0]).toBe(1) // 100% excess
      expect(result[1]).toBe(-1) // 0/baseline - 1 = -1 (100% deficit)
      expect(result[2]).toBe(1) // 100% excess
    })

    it('should handle undefined values in baseline', () => {
      const data = [10, 20, 30]
      const baseline = [5, undefined as unknown as number, 15]

      const result = strategy.transform(data, baseline, false)

      expect(result[0]).toBe(1) // 100% excess
      expect(result[1]).toBe(19) // data/1 - 1 = 19 (1900% excess)
      expect(result[2]).toBe(1) // 100% excess
    })

    it('should handle different array lengths', () => {
      const data = [10, 20, 30, 40]
      const baseline = [5, 10]

      const result = strategy.transform(data, baseline, false)

      expect(result).toHaveLength(4)
      expect(result[0]).toBe(1) // 100% excess
      expect(result[1]).toBe(1) // 100% excess
      expect(result[2]).toBe(29) // data/1 - 1 = 29 (2900% excess)
      expect(result[3]).toBe(39) // data/1 - 1 = 39 (3900% excess)
    })
  })

  describe('transform with excess data (isExcessData=true)', () => {
    it('should calculate ratio correctly without subtracting 1 (excess/baseline)', () => {
      // Excess data is already (current - baseline), so we just divide by baseline
      // If deaths=1000, baseline=900, excess=100
      // excess/baseline = 100/900 = 0.111 (11.1% excess)
      const excessData = [100, 200, 300] // Already subtracted: current - baseline
      const baseline = [900, 800, 700]

      const result = strategy.transform(excessData, baseline, true)

      // excess/baseline (no -1)
      expect(result[0]).toBeCloseTo(100 / 900, 5) // ~0.111
      expect(result[1]).toBeCloseTo(200 / 800, 5) // 0.25
      expect(result[2]).toBeCloseTo(300 / 700, 5) // ~0.429
    })

    it('should handle negative excess (deficit)', () => {
      // If deaths=800, baseline=900, excess=-100 (deficit)
      const excessData = [-100, -50, 50]
      const baseline = [900, 800, 700]

      const result = strategy.transform(excessData, baseline, true)

      expect(result[0]).toBeCloseTo(-100 / 900, 5) // ~-0.111 (11.1% deficit)
      expect(result[1]).toBeCloseTo(-50 / 800, 5) // ~-0.0625
      expect(result[2]).toBeCloseTo(50 / 700, 5) // ~0.071
    })

    it('should handle zero excess', () => {
      const excessData = [0, 100, 0]
      const baseline = [900, 800, 700]

      const result = strategy.transform(excessData, baseline, true)

      expect(result[0]).toBe(0)
      expect(result[1]).toBeCloseTo(100 / 800, 5)
      expect(result[2]).toBe(0)
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
