/**
 * Tests for ZScoreTransformStrategy
 */

import { describe, it, expect } from 'vitest'
import { ZScoreTransformStrategy } from './ZScoreTransformStrategy'

describe('ZScoreTransformStrategy', () => {
  const strategy = new ZScoreTransformStrategy()

  describe('getZScoreKey', () => {
    it('should return z-score key for deaths (non-ASMR)', () => {
      const result = strategy.getZScoreKey(false, 'deaths')
      expect(result).toBe('deaths_zscore')
    })

    it('should return z-score key for deaths_total (non-ASMR)', () => {
      const result = strategy.getZScoreKey(false, 'deaths_total')
      expect(result).toBe('deaths_zscore')
    })

    it('should return z-score key for cmr (non-ASMR)', () => {
      const result = strategy.getZScoreKey(false, 'cmr')
      expect(result).toBe('cmr_zscore')
    })

    it('should return z-score key for le (non-ASMR)', () => {
      const result = strategy.getZScoreKey(false, 'le')
      expect(result).toBe('le_zscore')
    })

    it('should return z-score key for le_adj (seasonally adjusted LE)', () => {
      const result = strategy.getZScoreKey(false, 'le_adj')
      expect(result).toBe('le_adj_zscore')
    })

    it('should return z-score key for asmr_who (ASMR)', () => {
      const result = strategy.getZScoreKey(true, 'asmr_who')
      expect(result).toBe('asmr_who_zscore')
    })

    it('should return z-score key for asmr_esp (ASMR)', () => {
      const result = strategy.getZScoreKey(true, 'asmr_esp')
      expect(result).toBe('asmr_esp_zscore')
    })

    it('should return z-score key for asmr_esp2013 (ASMR)', () => {
      const result = strategy.getZScoreKey(true, 'asmr_esp2013')
      expect(result).toBe('asmr_esp2013_zscore')
    })

    it('should handle single-part keys for non-ASMR', () => {
      const result = strategy.getZScoreKey(false, 'metric')
      expect(result).toBe('metric_zscore')
    })

    it('should handle multi-part keys for ASMR correctly', () => {
      const result = strategy.getZScoreKey(true, 'asmr_custom_standard')
      expect(result).toBe('asmr_custom_zscore')
    })
  })

  describe('getBaselineKey', () => {
    it('should return baseline key for deaths (non-ASMR)', () => {
      expect(strategy.getBaselineKey(false, 'deaths')).toBe('deaths_baseline')
    })

    it('should return baseline key for le_adj', () => {
      expect(strategy.getBaselineKey(false, 'le_adj')).toBe('le_adj_baseline')
    })

    it('should return baseline key for asmr_who (ASMR)', () => {
      expect(strategy.getBaselineKey(true, 'asmr_who')).toBe('asmr_who_baseline')
    })
  })

  describe('getZScoreData', () => {
    it('should return pre-calculated z-scores for standard method', () => {
      const data = {
        deaths: [100, 200, 300],
        deaths_zscore: [0.5, 1.2, -0.3],
        deaths_baseline: [150, 150, 150]
      }
      const result = strategy.getZScoreData('standard', data, false, 'deaths', 4)
      expect(result).toEqual([0.5, 1.2, -0.3])
    })

    it('should return pre-calculated z-scores for ASMR standard method', () => {
      const data = {
        asmr_who: [50, 60, 70],
        asmr_who_zscore: [1.0, 2.0, 3.0],
        asmr_who_baseline: [55, 55, 55]
      }
      const result = strategy.getZScoreData('standard', data, true, 'asmr_who', 4)
      expect(result).toEqual([1.0, 2.0, 3.0])
    })

    it('should fall back to standard z-scores when observed data is empty', () => {
      const data = {
        deaths: [] as number[],
        deaths_zscore: [0.5, 1.2],
        deaths_baseline: [150, 150]
      }
      const result = strategy.getZScoreData('variance_stabilized', data, false, 'deaths', 4)
      expect(result).toEqual([0.5, 1.2])
    })

    it('should fall back to standard z-scores when baseline is empty', () => {
      const data = {
        deaths: [100, 200],
        deaths_zscore: [0.5, 1.2],
        deaths_baseline: [] as number[]
      }
      const result = strategy.getZScoreData('variance_stabilized', data, false, 'deaths', 4)
      expect(result).toEqual([0.5, 1.2])
    })

    it('should fall back to standard z-scores for insufficient data', () => {
      const data = {
        deaths: [100, 200, 300],
        deaths_zscore: [0.5, 1.2, -0.3],
        deaths_baseline: [150, 150, 150]
      }
      // period=4, only 3 data points → falls back
      const result = strategy.getZScoreData('variance_stabilized', data, false, 'deaths', 4)
      expect(result).toEqual([0.5, 1.2, -0.3])
    })

    it('should compute variance-stabilized z-scores for sufficient positive data', () => {
      // 5y weekly series with a 50% spike at index 250.
      // Spike z-score must be on the order of standard residual z (~5+),
      // not the order-of-magnitude smaller value the original buggy
      // implementation produced (~2).
      const N = 260
      const observed: number[] = []
      const baseline: number[] = []
      let s = 42
      const rand = () => {
        s = (s * 1664525 + 1013904223) % 4294967296
        return s / 4294967296
      }
      for (let i = 0; i < N; i++) {
        const seasonal = 1000 + 200 * Math.sin((2 * Math.PI * i) / 52)
        baseline.push(seasonal)
        observed.push(seasonal + (rand() - 0.5) * 200)
      }
      observed[250] = baseline[250]! * 1.5

      const data: Record<string, number[]> = {
        deaths: observed,
        deaths_zscore: new Array(N).fill(0),
        deaths_baseline: baseline
      }
      const result = strategy.getZScoreData('variance_stabilized', data, false, 'deaths', 52)
      expect(result.length).toBe(N)
      expect(Math.abs(result[250]!)).toBeGreaterThan(4)
    })

    it('should fall back to standard for null period (yearly data)', () => {
      const data = {
        deaths: [100, 200, 300, 400],
        deaths_zscore: [0.5, 1.2, -0.3, 0.1],
        deaths_baseline: [150, 150, 150, 150]
      }
      const result = strategy.getZScoreData('variance_stabilized', data, false, 'deaths', null)
      expect(result).toEqual([0.5, 1.2, -0.3, 0.1])
    })

    it('should return empty array when no z-score data exists for standard method', () => {
      const data = {
        deaths: [100, 200],
        deaths_baseline: [150, 150]
      }
      const result = strategy.getZScoreData('standard', data, false, 'deaths', 4)
      expect(result).toEqual([])
    })
  })
})
