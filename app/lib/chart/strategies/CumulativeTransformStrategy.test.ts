/**
 * Tests for CumulativeTransformStrategy
 */

import { describe, it, expect } from 'vitest'
import { CumulativeTransformStrategy } from './CumulativeTransformStrategy'

describe('CumulativeTransformStrategy', () => {
  const strategy = new CumulativeTransformStrategy()

  describe('transform', () => {
    it('should calculate cumulative sum correctly', () => {
      const data = [10, 20, 30]

      const result = strategy.transform(data)

      expect(result).toEqual([10, 30, 60])
    })

    it('should handle empty array', () => {
      const data: number[] = []

      const result = strategy.transform(data)

      expect(result).toEqual([])
    })

    it('should handle single element', () => {
      const data = [42]

      const result = strategy.transform(data)

      expect(result).toEqual([42])
    })

    it('should handle negative values', () => {
      const data = [10, -5, 20, -10]

      const result = strategy.transform(data)

      expect(result).toEqual([10, 5, 25, 15])
    })

    it('should handle zero values', () => {
      const data = [10, 0, 20, 0, 30]

      const result = strategy.transform(data)

      expect(result).toEqual([10, 10, 30, 30, 60])
    })

    it('should maintain precision with decimal values', () => {
      const data = [1.5, 2.5, 3.5]

      const result = strategy.transform(data)

      expect(result[0]).toBeCloseTo(1.5)
      expect(result[1]).toBeCloseTo(4.0)
      expect(result[2]).toBeCloseTo(7.5)
    })
  })
})
