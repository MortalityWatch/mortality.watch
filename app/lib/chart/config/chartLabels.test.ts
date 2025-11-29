import { describe, expect, it } from 'vitest'
import { getLabelText } from './chartLabels'

describe('chartLabels', () => {
  describe('getLabelText - auto precision', () => {
    describe('magnitude-aware decimals (short mode)', () => {
      it('should show 0 decimals for numbers >= 100', () => {
        const result = getLabelText('Test', 150, undefined, true, false, false, false, 'auto')
        expect(result).toBe('Test: 150')

        const result2 = getLabelText('Test', 1000, undefined, true, false, false, false, 'auto')
        expect(result2).toBe('Test: 1,000')

        const result3 = getLabelText('Test', 100, undefined, true, false, false, false, 'auto')
        expect(result3).toBe('Test: 100')
      })

      it('should show 1 decimal for numbers 10-99', () => {
        const result = getLabelText('Test', 90.1, undefined, true, false, false, false, 'auto')
        expect(result).toBe('Test: 90.1')

        const result2 = getLabelText('Test', 10, undefined, true, false, false, false, 'auto')
        expect(result2).toBe('Test: 10.0')

        const result3 = getLabelText('Test', 50.5, undefined, true, false, false, false, 'auto')
        expect(result3).toBe('Test: 50.5')
      })

      it('should show 1 decimal for numbers 1-9', () => {
        const result = getLabelText('Test', 9.1, undefined, true, false, false, false, 'auto')
        expect(result).toBe('Test: 9.1')

        const result2 = getLabelText('Test', 5, undefined, true, false, false, false, 'auto')
        expect(result2).toBe('Test: 5.0')

        const result3 = getLabelText('Test', 1, undefined, true, false, false, false, 'auto')
        expect(result3).toBe('Test: 1.0')
      })

      it('should show 2 decimals for numbers < 1', () => {
        const result = getLabelText('Test', 0.91, undefined, true, false, false, false, 'auto')
        expect(result).toBe('Test: 0.91')

        const result2 = getLabelText('Test', 0.5, undefined, true, false, false, false, 'auto')
        expect(result2).toBe('Test: 0.50')

        const result3 = getLabelText('Test', 0.01, undefined, true, false, false, false, 'auto')
        expect(result3).toBe('Test: 0.01')
      })

      it('should handle negative numbers correctly', () => {
        const result = getLabelText('Test', -150, undefined, true, false, false, false, 'auto')
        expect(result).toBe('Test: -150')

        const result2 = getLabelText('Test', -90.1, undefined, true, false, false, false, 'auto')
        expect(result2).toBe('Test: -90.1')

        const result3 = getLabelText('Test', -9.1, undefined, true, false, false, false, 'auto')
        expect(result3).toBe('Test: -9.1')

        const result4 = getLabelText('Test', -0.91, undefined, true, false, false, false, 'auto')
        expect(result4).toBe('Test: -0.91')
      })
    })

    describe('explicit decimal values', () => {
      it('should use explicit decimal value when provided', () => {
        const result = getLabelText('Test', 150, undefined, true, false, false, false, '2')
        expect(result).toBe('Test: 150.00')

        const result2 = getLabelText('Test', 9.1, undefined, true, false, false, false, '0')
        expect(result2).toBe('Test: 9')

        const result3 = getLabelText('Test', 0.91, undefined, true, false, false, false, '3')
        expect(result3).toBe('Test: 0.910')
      })
    })

    describe('non-short mode behavior', () => {
      it('should use showDecimals flag in non-short mode', () => {
        const result1 = getLabelText('Test', 150, undefined, false, false, false, true, 'auto')
        expect(result1).toBe('Test: 150.0')

        const result2 = getLabelText('Test', 150, undefined, false, false, false, false, 'auto')
        expect(result2).toBe('Test: 150')
      })
    })

    describe('percentage values', () => {
      it('should handle percentage formatting with auto decimals', () => {
        // For percentages, the value is multiplied by 100 internally
        const result = getLabelText('Test', 0.5, undefined, true, false, true, false, 'auto')
        expect(result).toContain('50')

        const result2 = getLabelText('Test', 0.001, undefined, true, false, true, false, 'auto')
        expect(result2).toContain('0.1')
      })
    })

    describe('excess values with plus sign', () => {
      it('should add plus sign for positive excess values in non-short mode', () => {
        const result = getLabelText('Test', 150, undefined, false, true, false, false, 'auto')
        expect(result).toBe('Test: +150')
      })

      it('should handle negative excess values', () => {
        const result = getLabelText('Test', -150, undefined, false, true, false, false, 'auto')
        expect(result).toBe('Test: -150')
      })
    })

    describe('prediction intervals', () => {
      it('should include prediction interval in short mode', () => {
        const pi = { min: 140, max: 160 }
        const result = getLabelText('Test', 150, pi, true, false, false, false, 'auto')
        expect(result).toBe('Test: 150 (140, 160)')
      })

      it('should include prediction interval in non-short mode', () => {
        const pi = { min: 140, max: 160 }
        const result = getLabelText('Test', 150, pi, false, false, false, false, 'auto')
        expect(result).toBe('Test: 150 [95% PI: 140, 160]')
      })

      it('should apply same precision to PI values', () => {
        const pi = { min: 88.5, max: 92.3 }
        const result = getLabelText('Test', 90.1, pi, true, false, false, false, 'auto')
        expect(result).toBe('Test: 90.1 (88.5, 92.3)')
      })
    })

    describe('edge cases', () => {
      it('should handle zero correctly', () => {
        const result = getLabelText('Test', 0, undefined, true, false, false, false, 'auto')
        expect(result).toBe('Test: 0.00')
      })

      it('should handle empty label', () => {
        const result = getLabelText('', 150, undefined, true, false, false, false, 'auto')
        expect(result).toBe('150')
      })

      it('should handle very large numbers', () => {
        const result = getLabelText('Test', 1000000, undefined, true, false, false, false, 'auto')
        expect(result).toBe('Test: 1,000,000')
      })

      it('should handle very small numbers', () => {
        const result = getLabelText('Test', 0.0001, undefined, true, false, false, false, 'auto')
        expect(result).toBe('Test: 0.00')
      })
    })
  })
})
