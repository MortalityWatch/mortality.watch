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
})
