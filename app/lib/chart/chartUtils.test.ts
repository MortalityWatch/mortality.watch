import { describe, it, expect } from 'vitest'
import { round, asPercentage, numberWithCommas } from './chartUtils'

describe('chartUtils', () => {
  describe('round', () => {
    it('should round to integer by default', () => {
      expect(round(3.7)).toBe(4)
      expect(round(3.2)).toBe(3)
      expect(round(3.5)).toBe(4)
    })

    it('should round to specified decimals', () => {
      expect(round(3.14159, 2)).toBe(3.14)
      expect(round(3.14159, 3)).toBe(3.142)
      expect(round(3.14159, 4)).toBe(3.1416)
    })

    it('should handle negative numbers', () => {
      expect(round(-3.7)).toBe(-4)
      expect(round(-3.2)).toBe(-3)
      expect(round(-3.14159, 2)).toBe(-3.14)
    })

    it('should handle zero', () => {
      expect(round(0)).toBe(0)
      expect(round(0, 2)).toBe(0)
    })
  })

  describe('asPercentage', () => {
    it('should format positive percentages with + prefix by default', () => {
      expect(asPercentage(0.5)).toBe('+50%')
      expect(asPercentage(0.25)).toBe('+25%')
    })

    it('should format negative percentages without prefix by default', () => {
      expect(asPercentage(-0.5)).toBe('-50%')
      expect(asPercentage(-0.25)).toBe('-25%')
    })

    it('should respect custom prefixes', () => {
      expect(asPercentage(0.5, 0, '↑', '↓')).toBe('↑50%')
      expect(asPercentage(-0.5, 0, '↑', '↓')).toBe('↓-50%')
    })

    it('should handle decimals', () => {
      expect(asPercentage(0.12345, 2)).toBe('+12.35%')
      expect(asPercentage(0.12345, 1)).toBe('+12.3%')
    })

    it('should handle zero', () => {
      expect(asPercentage(0)).toBe('0%')
    })
  })

  describe('numberWithCommas', () => {
    it('should format large numbers with commas', () => {
      expect(numberWithCommas(1000)).toBe('1,000.0')
      expect(numberWithCommas(1000000)).toBe('1,000,000.0')
    })

    it('should add plus sign when requested', () => {
      expect(numberWithCommas(1000, true)).toBe('+1,000.0')
      expect(numberWithCommas(500, true)).toBe('+500.0')
    })

    it('should not add plus sign to negative numbers', () => {
      expect(numberWithCommas(-1000, true)).toBe('-1,000.0')
    })

    it('should handle decimals', () => {
      expect(numberWithCommas(1234.5678, false, 2)).toBe('1,234.57')
      expect(numberWithCommas(1234.5678, false, 0)).toBe('1,235')
    })

    it('should parse string numbers', () => {
      expect(numberWithCommas('1234.56')).toBe('1,234.6')
    })

    it('should handle zero', () => {
      expect(numberWithCommas(0)).toBe('0.0')
    })

    it('should handle small numbers', () => {
      expect(numberWithCommas(5)).toBe('5.0')
      expect(numberWithCommas(99)).toBe('99.0')
    })
  })
})
