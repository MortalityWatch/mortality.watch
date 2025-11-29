import { describe, expect, it } from 'vitest'
import { computeChartPrecision, getLabelText } from './chartLabels'

describe('chartLabels', () => {
  describe('computeChartPrecision - chart-wide precision', () => {
    it('should return 0 decimals when max value >= 100', () => {
      expect(computeChartPrecision([0.5, 10, 150])).toBe(0)
      expect(computeChartPrecision([100])).toBe(0)
      expect(computeChartPrecision([-200, 50])).toBe(0)
    })

    it('should return 1 decimal when max value >= 1 but < 100', () => {
      expect(computeChartPrecision([0.5, 10, 50])).toBe(1)
      expect(computeChartPrecision([1, 2, 3])).toBe(1)
      expect(computeChartPrecision([-50, 20])).toBe(1)
    })

    it('should return 2 decimals when max value < 1', () => {
      expect(computeChartPrecision([0.1, 0.5, 0.9])).toBe(2)
      expect(computeChartPrecision([0.01])).toBe(2)
      expect(computeChartPrecision([-0.5, 0.3])).toBe(2)
    })

    it('should return 2 decimals for empty array', () => {
      expect(computeChartPrecision([])).toBe(2)
    })

    it('should use absolute values for negative numbers', () => {
      // Max absolute value is 150, so 0 decimals
      expect(computeChartPrecision([-150, -10, -1])).toBe(0)
    })
  })

  describe('getLabelText with chart-wide precision (number)', () => {
    describe('labels use pre-computed precision for consistency', () => {
      it('should use 0 decimals when precision is 0', () => {
        const result = getLabelText('Test', 150, undefined, true, false, false, false, 0)
        expect(result).toBe('Test: 150')

        // Even small values use 0 decimals when chart max requires it
        const result2 = getLabelText('Test', 0.16, undefined, true, false, false, false, 0)
        expect(result2).toBe('Test: 0')
      })

      it('should use 1 decimal when precision is 1', () => {
        const result = getLabelText('Test', 90.12, undefined, true, false, false, false, 1)
        expect(result).toBe('Test: 90.1')

        const result2 = getLabelText('Test', 5.67, undefined, true, false, false, false, 1)
        expect(result2).toBe('Test: 5.7')
      })

      it('should use 2 decimals when precision is 2', () => {
        const result = getLabelText('Test', 0.91, undefined, true, false, false, false, 2)
        expect(result).toBe('Test: 0.91')

        const result2 = getLabelText('Test', 150.12, undefined, true, false, false, false, 2)
        expect(result2).toBe('Test: 150.12')
      })
    })

    describe('prediction intervals use same precision', () => {
      it('should apply same precision to PI values', () => {
        const pi = { min: 140, max: 160 }
        const result = getLabelText('Test', 150, pi, true, false, false, false, 0)
        expect(result).toBe('Test: 150 (140, 160)')
      })

      it('should use 1 decimal for PI when precision is 1', () => {
        const pi = { min: 88.5, max: 92.3 }
        const result = getLabelText('Test', 90.1, pi, true, false, false, false, 1)
        expect(result).toBe('Test: 90.1 (88.5, 92.3)')
      })
    })
  })

  describe('getLabelText with auto precision (tooltips)', () => {
    it('should always use 2 decimals for accurate display', () => {
      // Large numbers still get 2 decimals in auto mode
      const result1 = getLabelText('Test', 150, undefined, false, false, false, false, 'auto')
      expect(result1).toBe('Test: 150.00')

      const result2 = getLabelText('Test', 19.98, undefined, false, false, false, false, 'auto')
      expect(result2).toBe('Test: 19.98')

      const result3 = getLabelText('Test', 0.5, undefined, false, false, false, false, 'auto')
      expect(result3).toBe('Test: 0.50')
    })

    it('should handle negative numbers', () => {
      const result = getLabelText('Test', -150.12, undefined, false, false, false, false, 'auto')
      expect(result).toBe('Test: -150.12')
    })
  })

  describe('explicit string decimal values', () => {
    it('should use explicit decimal value when provided as string', () => {
      const result = getLabelText('Test', 150, undefined, true, false, false, false, '2')
      expect(result).toBe('Test: 150.00')

      const result2 = getLabelText('Test', 9.1, undefined, true, false, false, false, '0')
      expect(result2).toBe('Test: 9')

      const result3 = getLabelText('Test', 0.91, undefined, true, false, false, false, '3')
      expect(result3).toBe('Test: 0.910')
    })
  })

  describe('percentage values', () => {
    it('should handle percentage formatting with chart-wide precision', () => {
      // Raw value 0.1998 = 19.98%
      // With precision 1 (chart max ~20%), shows 20.0%
      const result = getLabelText('Test', 0.1998, undefined, true, false, true, false, 1)
      expect(result).toContain('20.0%')
    })

    it('should handle percentage formatting with auto precision (tooltips)', () => {
      // Raw value 0.1998 = 19.98%
      // With auto mode (2 decimals), shows 19.98%
      const result = getLabelText('Test', 0.1998, undefined, false, false, true, false, 'auto')
      expect(result).toContain('19.98%')
    })
  })

  describe('excess values with plus sign', () => {
    it('should add plus sign for positive excess values in non-short mode', () => {
      const result = getLabelText('Test', 150, undefined, false, true, false, false, 0)
      expect(result).toBe('Test: +150')
    })

    it('should handle negative excess values', () => {
      const result = getLabelText('Test', -150, undefined, false, true, false, false, 0)
      expect(result).toBe('Test: -150')
    })
  })

  describe('edge cases', () => {
    it('should handle zero correctly', () => {
      const result = getLabelText('Test', 0, undefined, true, false, false, false, 2)
      expect(result).toBe('Test: 0.00')
    })

    it('should handle empty label', () => {
      const result = getLabelText('', 150, undefined, true, false, false, false, 0)
      expect(result).toBe('150')
    })

    it('should handle very large numbers', () => {
      const result = getLabelText('Test', 1000000, undefined, true, false, false, false, 0)
      expect(result).toBe('Test: 1,000,000')
    })

    it('should handle very small numbers', () => {
      const result = getLabelText('Test', 0.0001, undefined, true, false, false, false, 2)
      expect(result).toBe('Test: 0.00')
    })
  })
})
