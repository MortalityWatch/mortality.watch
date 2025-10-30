/**
 * Tests for TotalTransformStrategy
 */

import { describe, it, expect } from 'vitest'
import { TotalTransformStrategy } from './TotalTransformStrategy'

describe('TotalTransformStrategy', () => {
  const strategy = new TotalTransformStrategy()

  describe('transform', () => {
    it('should calculate total sum correctly', () => {
      const data = [10, 20, 30]

      const result = strategy.transform(data)

      expect(result).toEqual([60])
    })

    it('should handle empty array', () => {
      const data: number[] = []

      const result = strategy.transform(data)

      expect(result).toEqual([0])
    })

    it('should handle single element', () => {
      const data = [42]

      const result = strategy.transform(data)

      expect(result).toEqual([42])
    })

    it('should handle negative values', () => {
      const data = [10, -5, 20, -10]

      const result = strategy.transform(data)

      expect(result).toEqual([15])
    })

    it('should handle zero values', () => {
      const data = [10, 0, 20, 0, 30]

      const result = strategy.transform(data)

      expect(result).toEqual([60])
    })

    it('should maintain precision with decimal values', () => {
      const data = [1.5, 2.5, 3.5]

      const result = strategy.transform(data)

      expect(result[0]).toBeCloseTo(7.5)
    })

    it('should handle large numbers', () => {
      const data = [1000000, 2000000, 3000000]

      const result = strategy.transform(data)

      expect(result).toEqual([6000000])
    })
  })
})
